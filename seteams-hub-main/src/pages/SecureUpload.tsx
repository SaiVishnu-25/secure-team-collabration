/**
 * Secure File Upload Example
 * 
 * Demonstrates the complete flow:
 * 1. File selection
 * 2. Security scanning (malware/virus detection)
 * 3. EXIF stripping (for images)
 * 4. Encryption
 * 5. Upload to Firebase Storage
 * 6. Firestore metadata storage
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Shield, Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { uploadSecureFile, UploadOptions, UploadResult } from '@/lib/upload';
import { generateKeyPair, keyToBase64, base64ToKey } from '@/lib/crypto';
import { toast } from 'sonner';
import { firebaseAuth } from '@/lib/firebase-config';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

type UploadStatus = 'idle' | 'scanning' | 'encrypting' | 'uploading' | 'success' | 'error';

export default function SecureUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate keypair and ensure auth on component mount
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(firebaseAuth);
        } catch (e) {
          toast.error('Authentication required for secure upload');
        }
      }
    });
    generateKeyPair().then(({ publicKey, privateKey }) => {
      setPublicKey(publicKey);
      setPrivateKey(privateKey);
      
      // Store private key in IndexedDB (you should implement proper key storage)
      // For demo, we'll store in localStorage (NOT recommended for production)
      const privateKeyBase64 = keyToBase64(privateKey);
      localStorage.setItem('user_private_key', privateKeyBase64);
      
      toast.success('Encryption keys generated');
    });
    return () => unsub();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setProgress(0);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !publicKey) {
      toast.error('Please select a file and ensure keys are generated');
      return;
    }

    setUploadStatus('scanning');
    setProgress(0);
    setError(null);

    try {
      // Configure upload options
      const options: UploadOptions = {
        // Scanning options
        safeBrowsingProxyUrl: import.meta.env.VITE_SAFE_BROWSING_PROXY_URL || undefined,
        urlScanApiKey: import.meta.env.VITE_URLSCAN_API_KEY || undefined,
        useClamAV: false,
        
        // File processing
        stripExif: true,
        reencodeImages: false,
        imageMaxSizeMB: 4,
        concurrency: 4,
        
        // Encryption
        recipientPublicKey: publicKey,
        
        // Metadata
        uploadedBy: firebaseAuth.currentUser?.uid || 'anonymous',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        
        // Progress callback
        onProgress: (p) => {
          setProgress(p);
          if (p < 30) {
            setUploadStatus('scanning');
          } else if (p < 40) {
            setUploadStatus('encrypting');
          } else {
            setUploadStatus('uploading');
          }
        },
      };

      const result = await uploadSecureFile(selectedFile, options);
      
      setUploadResult(result);
      setUploadStatus('success');
      toast.success('File uploaded securely!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadStatus('error');
      toast.error(errorMessage);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Secure File Upload
          </CardTitle>
          <CardDescription>
            Upload files with malware scanning, encryption, and secure storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </span>
                {selectedFile && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </span>
                )}
              </label>
            </div>

            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={uploadStatus === 'scanning' || uploadStatus === 'encrypting' || uploadStatus === 'uploading'}
                className="w-full"
              >
                {uploadStatus === 'idle' && (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Upload & Encrypt
                  </>
                )}
                {(uploadStatus === 'scanning' || uploadStatus === 'encrypting' || uploadStatus === 'uploading') && (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                )}
                {uploadStatus === 'success' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Upload Complete
                  </>
                )}
                {uploadStatus === 'error' && (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Retry Upload
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progress */}
          {(uploadStatus === 'scanning' || uploadStatus === 'encrypting' || uploadStatus === 'uploading') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {uploadStatus === 'scanning' && 'Scanning for malware...'}
                  {uploadStatus === 'encrypting' && 'Encrypting file...'}
                  {uploadStatus === 'uploading' && 'Uploading to storage...'}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uploadResult && uploadStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">File uploaded successfully!</p>
                  <div className="text-sm space-y-1">
                    <p><strong>File ID:</strong> {uploadResult.fileId}</p>
                    <p><strong>Scan Result:</strong> {uploadResult.scanResult.clean ? 'Clean' : 'Threats detected'}</p>
                    <p><strong>Scan Method:</strong> {uploadResult.scanResult.scanMethod}</p>
                    {uploadResult.expiresAt && (
                      <p><strong>Expires:</strong> {uploadResult.expiresAt.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Files are scanned for malware before encryption</p>
            <p>• Images are stripped of EXIF metadata</p>
            <p>• Files are encrypted using libsodium secretstream</p>
            <p>• Encryption keys are sealed with your public key</p>
            <p>• Files are stored in Firebase Storage with metadata in Firestore</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

