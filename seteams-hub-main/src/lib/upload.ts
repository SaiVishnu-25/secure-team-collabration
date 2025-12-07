/**
 * Secure File Upload Service
 * 
 * Handles:
 * 1. File scanning (malware/virus detection)
 * 2. EXIF stripping for images
 * 3. Encryption (chunked secretstream)
 * 4. Upload to Firebase Storage
 * 5. Firestore metadata with expiry and sealed keys
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firebaseStorage, firebaseFirestore } from './firebase-config';
import { scanFile, ScanResult } from './scanning';
import { encryptFile, seal, keyToBase64 } from './crypto';
import { stripEXIF, reencodeImage, getFileHash } from './file-utils';

export interface UploadOptions {
  // Scanning options
  safeBrowsingProxyUrl?: string;
  urlScanApiKey?: string;
  useClamAV?: boolean;
  
  // File processing
  stripExif?: boolean;
  reencodeImages?: boolean;
  imageMaxSizeMB?: number;
  
  // Encryption
  recipientPublicKey: Uint8Array; // Public key to seal the encryption key
  
  // Metadata
  roomId?: string;
  uploadedBy: string; // User ID
  expiresAt?: Date; // Optional expiry date
  
  // Progress callback
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  fileId: string;
  storagePath: string;
  downloadUrl: string;
  scanResult: ScanResult;
  uploadedAt: Date;
  expiresAt?: Date;
}

/**
 * Upload a file with scanning, encryption, and metadata
 */
export async function uploadSecureFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Step 1: Scan file for malware/viruses
    if (options.onProgress) options.onProgress(5);

    const scanResult = await scanFile(file, {
      safeBrowsingProxyUrl: options.safeBrowsingProxyUrl,
      urlScanApiKey: options.urlScanApiKey,
      useClamAV: options.useClamAV,
    });

    // Reject if file is not clean
    if (!scanResult.clean) {
      throw new Error(
        `File failed security scan: ${scanResult.threats.map(t => t.name).join(', ')}`
      );
    }

    // Step 2: Process file (strip EXIF, re-encode if needed)
    if (options.onProgress) options.onProgress(15);

    let processedFile = file;

    if (options.stripExif || options.reencodeImages) {
      if (options.reencodeImages && file.type.startsWith('image/')) {
        processedFile = await reencodeImage(file, {
          maxSizeMB: options.imageMaxSizeMB || 1,
        });
      } else if (options.stripExif && file.type.startsWith('image/')) {
        processedFile = await stripEXIF(file);
      }
    }

    // Step 3: Encrypt file
    if (options.onProgress) options.onProgress(30);

    const { header, encryptedChunks, encryptionKey } = await encryptFile(processedFile);

    // Seal the encryption key with recipient's public key
    const sealedKey = await seal(encryptionKey, options.recipientPublicKey);
    const sealedKeyBase64 = keyToBase64(sealedKey);
    const headerBase64 = keyToBase64(header);

    // Step 4: Upload encrypted chunks to Firebase Storage
    if (options.onProgress) options.onProgress(40);

    const fileId = crypto.randomUUID();
    const fileHash = await getFileHash(processedFile);
    const timestamp = Date.now();

    // Upload header first
    const headerPath = `encrypted/${fileId}/header.bin`;
    const headerRef = ref(firebaseStorage, headerPath);
    await uploadBytes(headerRef, header);

    // Upload chunks
    const chunkPaths: string[] = [];
    const totalChunks = encryptedChunks.length;

    for (let i = 0; i < encryptedChunks.length; i++) {
      const chunkPath = `encrypted/${fileId}/chunk_${i}.bin`;
      const chunkRef = ref(firebaseStorage, chunkPath);
      await uploadBytes(chunkRef, encryptedChunks[i]);
      chunkPaths.push(chunkPath);

      // Update progress
      const progress = 40 + (i / totalChunks) * 50;
      if (options.onProgress) options.onProgress(progress);
    }

    // Get download URLs
    const headerUrl = await getDownloadURL(headerRef);
    const chunkUrls = await Promise.all(
      chunkPaths.map(path => getDownloadURL(ref(firebaseStorage, path)))
    );

    // Step 5: Create Firestore metadata document
    if (options.onProgress) options.onProgress(95);

    const expiresAtTimestamp = options.expiresAt
      ? Timestamp.fromDate(options.expiresAt)
      : null;

    const metadataDoc = {
      fileId,
      originalName: processedFile.name,
      originalSize: processedFile.size,
      mimeType: processedFile.type,
      fileHash,

      // Encryption metadata
      headerPath,
      headerUrl,
      chunkPaths,
      chunkUrls,
      chunkCount: encryptedChunks.length,
      sealedKey: sealedKeyBase64,
      headerBase64, // For quick access

      // Scan results
      scanResult: {
        clean: scanResult.clean,
        threats: scanResult.threats,
        scanMethod: scanResult.scanMethod,
        timestamp: scanResult.timestamp,
      },

      // Metadata
      roomId: options.roomId || null,
      uploadedBy: options.uploadedBy,
      uploadedAt: serverTimestamp(),
      expiresAt: expiresAtTimestamp,

      // Status
      status: 'encrypted',
      version: 1,
    };

    try {
      const docRef = await addDoc(
        collection(firebaseFirestore, 'files'),
        metadataDoc
      );
      console.log('Metadata successfully stored:', metadataDoc);
    } catch (error) {
      console.error('Error storing metadata in Firestore:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error during metadata storage'
      );
    }

    if (options.onProgress) options.onProgress(100);

    return {
      fileId,
      storagePath: `encrypted/${fileId}`,
      downloadUrl: headerUrl, // Main reference URL
      scanResult,
      uploadedAt: new Date(),
      expiresAt: options.expiresAt,
    };
  } catch (error) {
    console.error('Error during upload:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Unknown error during upload'
    );
  }
}

/**
 * Get file metadata from Firestore
 */
export async function getFileMetadata(fileId: string) {
  const { doc, getDoc } = await import('firebase/firestore');
  const docRef = doc(firebaseFirestore, 'files', fileId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('File metadata not found');
  }
  
  return docSnap.data();
}

