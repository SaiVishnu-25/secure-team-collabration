/**
 * File Scanning Utilities
 * 
 * Provides malware/virus scanning capabilities:
 * 1. ClamAV WASM (client-side, best-effort)
 * 2. Google Safe Browsing (via Cloud Function proxy)
 * 3. urlscan.io integration (optional, for URL/file hash checks)
 */

export interface ScanResult {
  clean: boolean;
  threats: Threat[];
  scanMethod: 'clamav' | 'safe-browsing' | 'urlscan' | 'combined';
  timestamp: number;
}

export interface Threat {
  type: 'malware' | 'virus' | 'trojan' | 'phishing' | 'suspicious' | 'unknown';
  name: string;
  description?: string;
}

/**
 * Scan file using ClamAV WASM (client-side)
 * Note: This requires ClamAV WASM to be loaded separately
 * See: https://github.com/Cisco-Talos/clamav.js
 * 
 * For MVP, this is a placeholder that can be integrated with ClamAV WASM
 */
export async function scanWithClamAV(file: File): Promise<ScanResult> {
  // TODO: Integrate ClamAV WASM when available
  // Example integration:
  // const ClamAV = await import('clamav.js');
  // const scanner = new ClamAV.Scanner();
  // const result = await scanner.scan(file);
  
  // Placeholder: For now, return clean
  // In production, this should actually scan the file
  return {
    clean: true,
    threats: [],
    scanMethod: 'clamav',
    timestamp: Date.now(),
  };
}

/**
 * Check URL/file hash with Google Safe Browsing via Cloud Function proxy
 * 
 * @param file - File to check (uses hash)
 * @param proxyUrl - URL of your Cloud Function proxy (e.g., https://your-project.cloudfunctions.net/safe-browsing-proxy)
 */
export async function scanWithSafeBrowsing(
  file: File,
  proxyUrl: string
): Promise<ScanResult> {
  try {
    // Calculate file hash (SHA-256)
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Call Cloud Function proxy
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hash: hashHex,
        url: file.name, // Optional: file name as identifier
      }),
    });

    if (!response.ok) {
      throw new Error(`Safe Browsing check failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Google Safe Browsing API returns matches array if threats found
    interface SafeBrowsingMatch { threatType?: string; platformType?: string }
    const threats: Threat[] = (data.matches || []).map((match: SafeBrowsingMatch) => ({
      type: mapThreatType(match.threatType || ''),
      name: match.threatType || 'Unknown threat',
      description: match.platformType || '',
    }));

    return {
      clean: threats.length === 0,
      threats,
      scanMethod: 'safe-browsing',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Safe Browsing scan error:', error);
    // On error, fail safe - don't allow upload
    return {
      clean: false,
      threats: [{
        type: 'unknown',
        name: 'Scan Error',
        description: 'Unable to verify file safety',
      }],
      scanMethod: 'safe-browsing',
      timestamp: Date.now(),
    };
  }
}

/**
 * Scan file hash with urlscan.io (optional, for additional verification)
 * Requires urlscan.io API key
 */
export async function scanWithUrlScan(
  file: File,
  apiKey?: string
): Promise<ScanResult> {
  if (!apiKey) {
    return {
      clean: true,
      threats: [],
      scanMethod: 'urlscan',
      timestamp: Date.now(),
    };
  }

  try {
    // Calculate file hash
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check hash with urlscan.io
    const response = await fetch(`https://urlscan.io/api/v1/search/?q=hash:${hashHex}`, {
      headers: {
        'API-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`urlscan.io check failed: ${response.statusText}`);
    }

    const data = await response.json();
    const threats: Threat[] = [];

    // If results found, file may be suspicious
    if (data.results && data.results.length > 0) {
      threats.push({
        type: 'suspicious',
        name: 'File hash found in threat database',
        description: 'File hash matches known suspicious content',
      });
    }

    return {
      clean: threats.length === 0,
      threats,
      scanMethod: 'urlscan',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('urlscan.io scan error:', error);
    // On error, return clean (optional scan)
    return {
      clean: true,
      threats: [],
      scanMethod: 'urlscan',
      timestamp: Date.now(),
    };
  }
}

/**
 * Comprehensive scan combining all available methods
 */
export async function scanFile(
  file: File,
  options: {
    safeBrowsingProxyUrl?: string;
    urlScanApiKey?: string;
    useClamAV?: boolean;
  } = {}
): Promise<ScanResult> {
  const results: ScanResult[] = [];

  // 1. ClamAV scan (if enabled)
  if (options.useClamAV) {
    try {
      const clamResult = await scanWithClamAV(file);
      results.push(clamResult);
    } catch (error) {
      console.error('ClamAV scan failed:', error);
    }
  }

  // 2. Safe Browsing check (if proxy URL provided)
  if (options.safeBrowsingProxyUrl) {
    try {
      const sbResult = await scanWithSafeBrowsing(file, options.safeBrowsingProxyUrl);
      results.push(sbResult);
    } catch (error) {
      console.error('Safe Browsing scan failed:', error);
    }
  }

  // 3. urlscan.io check (if API key provided)
  if (options.urlScanApiKey) {
    try {
      const urlScanResult = await scanWithUrlScan(file, options.urlScanApiKey);
      results.push(urlScanResult);
    } catch (error) {
      console.error('urlscan.io scan failed:', error);
    }
  }

  // Combine results: file is clean only if ALL scans pass
  const allClean = results.every(r => r.clean);
  const allThreats = results.flatMap(r => r.threats);

  return {
    clean: allClean,
    threats: allThreats,
    scanMethod: results.length > 1 ? 'combined' : (results[0]?.scanMethod || 'clamav'),
    timestamp: Date.now(),
  };
}

/**
 * Map Google Safe Browsing threat types to our Threat type
 */
function mapThreatType(safeBrowsingType: string): Threat['type'] {
  const typeMap: Record<string, Threat['type']> = {
    'MALWARE': 'malware',
    'SOCIAL_ENGINEERING': 'phishing',
    'UNWANTED_SOFTWARE': 'malware',
    'POTENTIALLY_HARMFUL_APPLICATION': 'suspicious',
  };
  return typeMap[safeBrowsingType] || 'unknown';
}

