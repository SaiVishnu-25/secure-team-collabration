/**
 * File Processing Utilities
 * 
 * Provides:
 * - EXIF data stripping for images
 * - Image re-encoding
 * - Chunk reading helpers
 */

import EXIF from 'exif-js';
import imageCompression from 'browser-image-compression';

/**
 * Strip EXIF data from an image file
 * Returns a new File without EXIF metadata
 */
export async function stripEXIF(file: File): Promise<File> {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return file; // Return as-is for non-images
  }

  try {
    // Read file as data URL
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    
    // Create image element
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw image to canvas (this strips EXIF)
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob (without EXIF)
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              // Create new File with same name but no EXIF
              const newFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified,
              });
              
              resolve(newFile);
            },
            file.type,
            0.95 // Quality (0.95 = 95%)
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  } catch (error) {
    console.error('EXIF stripping failed:', error);
    // Return original file if stripping fails
    return file;
  }
}

/**
 * Re-encode image with compression and EXIF stripping
 */
export async function reencodeImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  } = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker ?? true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Strip EXIF from compressed image
    return await stripEXIF(compressedFile);
  } catch (error) {
    console.error('Image re-encoding failed:', error);
    // Fallback to EXIF stripping only
    return await stripEXIF(file);
  }
}

/**
 * Read file in chunks
 */
export async function* readFileInChunks(
  file: File,
  chunkSize: number = 64 * 1024 // 64KB default
): AsyncGenerator<Uint8Array, void, unknown> {
  const reader = file.stream().getReader();
  let buffer = new Uint8Array(0);

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer.length > 0) {
          yield buffer;
        }
        break;
      }

      // Append new data
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;

      // Yield chunks
      while (buffer.length >= chunkSize) {
        yield buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get file hash (SHA-256)
 */
export async function getFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Get file extension
 */
export function getFileExtension(file: File): string {
  const name = file.name;
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : '';
}

