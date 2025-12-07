import { firebaseFirestore } from './firebase-config';
import { base64ToKey, keyToBase64, seal, unseal, generateKeyPair, generateSecretKey, encryptTextWithSecretKey, decryptTextWithSecretKey } from './crypto';
import { collection, doc, getDoc, setDoc, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Attachment } from '@/types/teams';

export interface UserIdentity {
  id: string;
  publicKeyBase64: string;
}

export interface MessageRecord {
  id?: string;
  roomId: string;
  senderId: string;
  ciphertextBase64: string;
  nonceBase64: string;
  timestamp?: Timestamp;
  attachments?: Attachment[];
}

type StoredMessage = {
  roomId: string;
  senderId: string;
  ciphertextBase64: string;
  nonceBase64: string;
  timestamp: Timestamp;
  attachments?: Attachment[];
};

export async function setUserPublicKey(userId: string, publicKey: Uint8Array): Promise<void> {
  const ref = doc(firebaseFirestore, 'users', userId);
  await setDoc(ref, { publicKey: keyToBase64(publicKey) }, { merge: true });
}

export async function getUserPublicKey(userId: string): Promise<Uint8Array | null> {
  const ref = doc(firebaseFirestore, 'users', userId);
  const snap = await getDoc(ref);
  const base64 = snap.exists() ? (snap.data().publicKey as string | undefined) : undefined;
  return base64 ? base64ToKey(base64) : null;
}

export async function ensureRoom(roomId: string, memberIds: string[]): Promise<void> {
  const roomRef = doc(firebaseFirestore, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    await setDoc(roomRef, { members: memberIds, createdAt: serverTimestamp() });
    const secretKey = await generateSecretKey();
    for (const memberId of memberIds) {
      const pk = await getUserPublicKey(memberId);
      if (pk) {
        const sealed = await seal(secretKey, pk);
        const sealedBase64 = keyToBase64(sealed);
        const keyRef = doc(firebaseFirestore, 'rooms', roomId, 'keys', memberId);
        await setDoc(keyRef, { sealedKey: sealedBase64 });
      }
    }
    const metaRef = doc(firebaseFirestore, 'rooms', roomId, 'meta', 'secret');
    await setDoc(metaRef, { createdAt: serverTimestamp(), version: 1 }, { merge: true });
    return;
  }

  const existing = roomSnap.data();
  const currentMembers = Array.isArray(existing?.members) ? existing.members as string[] : [];
  const mergedMembers = Array.from(new Set([...currentMembers, ...memberIds]));
  if (mergedMembers.length !== currentMembers.length) {
    await setDoc(roomRef, { members: mergedMembers }, { merge: true });
  }

  const missing: string[] = [];
  for (const memberId of memberIds) {
    const keyRef = doc(firebaseFirestore, 'rooms', roomId, 'keys', memberId);
    const keySnap = await getDoc(keyRef);
    if (!keySnap.exists()) missing.push(memberId);
  }
  if (missing.length > 0) {
    const secretKey = await generateSecretKey();
    for (const memberId of memberIds) {
      const pk = await getUserPublicKey(memberId);
      if (pk) {
        const sealed = await seal(secretKey, pk);
        const sealedBase64 = keyToBase64(sealed);
        const keyRef = doc(firebaseFirestore, 'rooms', roomId, 'keys', memberId);
        await setDoc(keyRef, { sealedKey: sealedBase64 });
      }
    }
    const metaRef = doc(firebaseFirestore, 'rooms', roomId, 'meta', 'secret');
    await setDoc(metaRef, { rotatedAt: serverTimestamp() }, { merge: true });
  }
}

export async function getRoomSecretKeyForUser(roomId: string, userId: string, userPublicKey: Uint8Array, userPrivateKey: Uint8Array): Promise<Uint8Array> {
  const keyRef = doc(firebaseFirestore, 'rooms', roomId, 'keys', userId);
  const keySnap = await getDoc(keyRef);
  if (!keySnap.exists()) throw new Error('No room key for user');
  const sealedBase64 = keySnap.data().sealedKey as string;
  const sealed = base64ToKey(sealedBase64);
  const unsealed = await unseal(sealed, userPrivateKey, userPublicKey);
  return unsealed;
}

export async function sendEncryptedMessage(roomId: string, senderId: string, plaintext: string, userPublicKey: Uint8Array, userPrivateKey: Uint8Array, attachments?: Attachment[]): Promise<void> {
  const secretKey = await getRoomSecretKeyForUser(roomId, senderId, userPublicKey, userPrivateKey);
  const { nonce, ciphertext } = await encryptTextWithSecretKey(plaintext, secretKey);
  const msg: Omit<MessageRecord, 'id'> = {
    roomId,
    senderId,
    ciphertextBase64: keyToBase64(ciphertext),
    nonceBase64: keyToBase64(nonce),
    timestamp: serverTimestamp(),
    attachments: attachments || [],
  };
  await addDoc(collection(firebaseFirestore, 'rooms', roomId, 'messages'), msg);
}

export function subscribeDecryptedMessages(roomId: string, userId: string, userPublicKey: Uint8Array, userPrivateKey: Uint8Array, onMessages: (messages: { id: string; senderId: string; content: string; timestamp: Date; attachments?: Attachment[] }[]) => void) {
  let secretPromise: Promise<Uint8Array> | null = null;
  const q = query(collection(firebaseFirestore, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, async (snapshot) => {
    if (!secretPromise) {
      secretPromise = getRoomSecretKeyForUser(roomId, userId, userPublicKey, userPrivateKey);
    }
    const secretKey = await secretPromise;
    const items: { id: string; senderId: string; content: string; timestamp: Date; attachments?: Attachment[] }[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as StoredMessage;
      const ciphertext = base64ToKey(data.ciphertextBase64);
      const nonce = base64ToKey(data.nonceBase64);
      const content = await decryptTextWithSecretKey(ciphertext, nonce, secretKey);
      const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
      items.push({ id: docSnap.id, senderId: data.senderId, content, timestamp: ts, attachments: data.attachments });
    }
    onMessages(items);
  });
}
