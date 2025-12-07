# Secure File Upload Setup Guide

This guide explains how to set up the secure file upload system with malware scanning, encryption, and Firebase storage.

## Overview

The secure upload system implements:
1. **Malware Scanning** - Files are scanned before encryption
2. **EXIF Stripping** - Image metadata is removed
3. **End-to-End Encryption** - Files encrypted with libsodium secretstream
4. **Firebase Storage** - Encrypted files stored in chunks
5. **Firestore Metadata** - File metadata with expiry dates

## Prerequisites

- Node.js 18+ installed
- Firebase project created
- Google Cloud account (for Safe Browsing API)

## Step 1: Install Dependencies

```bash
cd seteams-hub-main
npm install
```

This will install:
- `libsodium-wrappers` - Encryption library
- `firebase` - Firebase SDK
- `exif-js` - EXIF metadata handling
- `browser-image-compression` - Image processing

## Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Firestore Database** and **Storage**
4. Get your Firebase config from Project Settings > General
5. Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

6. Fill in your Firebase config values in `.env`

## Step 3: Deploy Safe Browsing Proxy (Cloud Function)

The Safe Browsing proxy prevents exposing your API key client-side.

### 3.1 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3.2 Initialize Firebase Functions

```bash
cd functions
npm install
```

### 3.3 Get Google Safe Browsing API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Safe Browsing API"
3. Create credentials (API Key)
4. Restrict the key to Safe Browsing API only

### 3.4 Set API Key in Firebase Functions

```bash
firebase functions:config:set safebrowsing.apikey="YOUR_API_KEY_HERE"
```

### 3.5 Deploy Cloud Function

```bash
firebase deploy --only functions:safeBrowsingProxy
```

### 3.6 Update Environment Variable

After deployment, copy the function URL and add it to `.env`:

```
VITE_SAFE_BROWSING_PROXY_URL=https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/safeBrowsingProxy
```

## Step 4: Optional - ClamAV WASM Integration

For client-side malware scanning, you can integrate ClamAV WASM:

1. Visit [clamav.js](https://github.com/Cisco-Talos/clamav.js)
2. Follow their setup instructions
3. Update `src/lib/scanning.ts` to use the ClamAV scanner

**Note:** ClamAV WASM is CPU-intensive and requires downloading large signature databases. It's best-effort for MVP.

## Step 5: Optional - urlscan.io Integration

For additional threat detection:

1. Sign up at [urlscan.io](https://urlscan.io/user/signup)
2. Get your API key
3. Add to `.env`:

```
VITE_URLSCAN_API_KEY=your-api-key
```

## Step 6: Run the Application

```bash
npm run dev
```

Navigate to `http://localhost:8080/upload` to test the secure upload.

## Usage

### Basic Upload Flow

1. User selects a file
2. File is scanned for malware/viruses
3. If clean, EXIF data is stripped (for images)
4. File is encrypted using secretstream
5. Encrypted chunks are uploaded to Firebase Storage
6. Metadata is stored in Firestore with:
   - File ID
   - Encryption key (sealed with user's public key)
   - Scan results
   - Expiry date
   - Upload metadata

### Key Management

- **Public Key**: Used to seal encryption keys (can be shared)
- **Private Key**: Used to decrypt files (MUST be kept secure)
- Private keys are stored in localStorage (demo) - **implement proper key storage for production**

### File Structure in Firebase

```
Storage:
  encrypted/
    {fileId}/
      header.bin          # Secretstream header
      chunk_0.bin         # Encrypted chunk 0
      chunk_1.bin         # Encrypted chunk 1
      ...

Firestore:
  files/
    {fileId}/
      - fileId
      - originalName
      - sealedKey (base64)
      - headerBase64
      - chunkUrls
      - scanResult
      - expiresAt
      - uploadedBy
      - ...
```

## Security Considerations

1. **API Keys**: Never expose Safe Browsing API key client-side (use Cloud Function proxy)
2. **Private Keys**: Store securely (IndexedDB with encryption, or user export)
3. **Expiry**: Files automatically expire based on Firestore TTL (set up Firestore TTL policies)
4. **Scanning**: Files are scanned BEFORE encryption - if scan fails, file is rejected
5. **EXIF**: All images have EXIF metadata stripped to prevent location/data leakage

## Troubleshooting

### "Safe Browsing API key not configured"
- Ensure you've set the config: `firebase functions:config:set safebrowsing.apikey="..."`
- Redeploy the function after setting config

### "File failed security scan"
- File contains known malware/virus signatures
- Check scan results in the upload response

### Encryption errors
- Ensure libsodium is properly initialized
- Check browser console for errors

### Firebase errors
- Verify Firebase config in `.env`
- Check Firebase project permissions
- Ensure Storage and Firestore are enabled

## Next Steps

1. Implement proper key storage (IndexedDB with encryption)
2. Add user authentication
3. Set up Firestore TTL policies for automatic expiry
4. Integrate ClamAV WASM for client-side scanning
5. Add file download/decryption UI
6. Implement room/team sharing with sealed keys

## API Reference

### `uploadSecureFile(file, options)`

Uploads a file with scanning and encryption.

**Options:**
- `safeBrowsingProxyUrl` - Cloud Function URL for Safe Browsing
- `urlScanApiKey` - Optional urlscan.io API key
- `useClamAV` - Enable ClamAV WASM scanning
- `stripExif` - Strip EXIF from images
- `reencodeImages` - Re-encode images with compression
- `recipientPublicKey` - Public key to seal encryption key
- `uploadedBy` - User ID
- `expiresAt` - Optional expiry date
- `onProgress` - Progress callback

### `scanFile(file, options)`

Scans a file for malware/viruses.

**Returns:** `ScanResult` with `clean` boolean and `threats` array

### `encryptFile(file, chunkSize)`

Encrypts a file using secretstream.

**Returns:** `{ header, encryptedChunks, encryptionKey }`

