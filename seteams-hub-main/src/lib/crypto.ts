/**
 * Cryptography Utilities using libsodium
 * 
 * Provides:
 * - Keypair generation (public/private keys)
 * - Sealed box encryption (public key encryption)
 * - Secretstream encryption (chunked file encryption)
 * - Key management helpers
 */

import _sodium from 'libsodium-wrappers';

// Initialize sodium
let sodiumReady = false;
const initSodium = async () => {
  if (!sodiumReady) {
    await _sodium.ready;
    sodiumReady = true;
  }
  return _sodium;
};

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedChunk {
  data: Uint8Array;
  isFinal: boolean;
}

/**
 * Generate a new keypair for E2EE
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const sodium = await initSodium();
  const keypair = sodium.crypto_box_keypair();
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
  };
}

/**
 * Convert key to base64 string for storage
 */
export function keyToBase64(key: Uint8Array): string {
  return btoa(String.fromCharCode(...key));
}

/**
 * Convert base64 string back to Uint8Array key
 */
export function base64ToKey(base64: string): Uint8Array {
  const binary = atob(base64);
  return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)));
}

/**
 * Seal a message with recipient's public key (anonymous encryption)
 * Returns: encrypted message + ephemeral public key
 */
export async function seal(
  message: Uint8Array,
  recipientPublicKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await initSodium();
  return sodium.crypto_box_seal(message, recipientPublicKey);
}

/**
 * Unseal a sealed message with private key
 */
export async function unseal(
  sealedMessage: Uint8Array,
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await initSodium();
  return sodium.crypto_box_seal_open(sealedMessage, publicKey, privateKey);
}

/**
 * Initialize secretstream for chunked encryption
 * Returns: header and state for encryption
 */
export async function secretstreamInitPush(): Promise<{
  header: Uint8Array;
  state: object;
}> {
  const sodium = await initSodium();
  const key = sodium.crypto_secretstream_xchacha20poly1305_keygen();
  const res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
  return {
    header: res.header,
    state: res.state,
  };
}

/**
 * Encrypt a chunk using secretstream
 */
export async function secretstreamPush(
  state: object,
  chunk: Uint8Array,
  isFinal: boolean = false
): Promise<Uint8Array> {
  const sodium = await initSodium();
  const tag = isFinal
    ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
    : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;
  return sodium.crypto_secretstream_xchacha20poly1305_push(
    state,
    chunk,
    null, // ad (additional data)
    tag
  );
}

/**
 * Initialize secretstream for decryption
 */
export async function secretstreamInitPull(
  header: Uint8Array,
  key: Uint8Array
): Promise<object> {
  const sodium = await initSodium();
  return sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, key);
}

/**
 * Decrypt a chunk using secretstream
 */
export async function secretstreamPull(
  state: object,
  encryptedChunk: Uint8Array
): Promise<{
  message: Uint8Array;
  isFinal: boolean;
}> {
  const sodium = await initSodium();
  const res = sodium.crypto_secretstream_xchacha20poly1305_pull(
    state,
    encryptedChunk,
    null // ad
  );
  const isFinal =
    res.tag === sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL;
  return {
    message: res.message,
    isFinal,
  };
}

/**
 * Encrypt a file in chunks using secretstream
 * Returns: header, encrypted chunks, and the encryption key (to be sealed with recipient's public key)
 */
export async function encryptFile(
  file: File,
  chunkSize: number = 64 * 1024 // 64KB chunks
): Promise<{
  header: Uint8Array;
  encryptedChunks: Uint8Array[];
  encryptionKey: Uint8Array;
}> {
  const sodium = await initSodium();
  
  // Generate encryption key
  const encryptionKey = sodium.crypto_secretstream_xchacha20poly1305_keygen();
  
  // Initialize secretstream
  const { header, state } = sodium.crypto_secretstream_xchacha20poly1305_init_push(
    encryptionKey
  );

  const encryptedChunks: Uint8Array[] = [];
  const reader = file.stream().getReader();
  let buffer = new Uint8Array(0);

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Encrypt final chunk
        if (buffer.length > 0) {
          const encrypted = sodium.crypto_secretstream_xchacha20poly1305_push(
            state,
            buffer,
            null,
            sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
          );
          encryptedChunks.push(encrypted);
        } else {
          // Empty final chunk
          const encrypted = sodium.crypto_secretstream_xchacha20poly1305_push(
            state,
            new Uint8Array(0),
            null,
            sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
          );
          encryptedChunks.push(encrypted);
        }
        break;
      }

      // Append new data to buffer
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;

      // Process chunks
      while (buffer.length >= chunkSize) {
        const chunk = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);

        const encrypted = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          chunk,
          null,
          sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
        );
        encryptedChunks.push(encrypted);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    header,
    encryptedChunks,
    encryptionKey,
  };
}

/**
 * Decrypt a file from encrypted chunks
 */
export async function decryptFile(
  header: Uint8Array,
  encryptedChunks: Uint8Array[],
  encryptionKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await initSodium();
  
  // Initialize decryption
  const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
    header,
    encryptionKey
  );

  const decryptedChunks: Uint8Array[] = [];

  for (const encryptedChunk of encryptedChunks) {
    const { message, isFinal } = sodium.crypto_secretstream_xchacha20poly1305_pull(
      state,
      encryptedChunk,
      null
    );
    decryptedChunks.push(message);
    if (isFinal) break;
  }

  // Concatenate all decrypted chunks
  const totalLength = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of decryptedChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export async function generateSecretKey(): Promise<Uint8Array> {
  const sodium = await initSodium();
  return sodium.crypto_secretbox_keygen();
}

export async function encryptTextWithSecretKey(
  text: string,
  key: Uint8Array
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array }> {
  const sodium = await initSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = new TextEncoder().encode(text);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);
  return { nonce, ciphertext };
}

export async function decryptTextWithSecretKey(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<string> {
  const sodium = await initSodium();
  const message = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return new TextDecoder().decode(message);
}

