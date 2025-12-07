/**
 * Google Safe Browsing API Proxy
 * 
 * Cloud Function to proxy Google Safe Browsing API requests
 * This prevents exposing the API key client-side.
 * 
 * Deploy with:
 *   firebase deploy --only functions:safeBrowsingProxy
 * 
 * Set API key in Firebase Functions config:
 *   firebase functions:config:set safebrowsing.apikey="YOUR_API_KEY"
 * 
 * Get API key from: https://console.cloud.google.com/apis/credentials
 */

const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const axios = require('axios');

// Google Safe Browsing API v4 endpoint
const SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

/**
 * Cloud Function to proxy Safe Browsing API
 */
exports.safeBrowsingProxy = onRequest(
  {
    cors: true, // Enable CORS for client-side requests
    maxInstances: 10,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Get API key from environment config
      const apiKey = functions.config().safebrowsing?.apikey;
      
      if (!apiKey) {
        console.error('Safe Browsing API key not configured');
        return res.status(500).json({
          error: 'Safe Browsing API key not configured',
        });
      }

      const { hash, url } = req.body;

      if (!hash && !url) {
        return res.status(400).json({
          error: 'Either hash or url must be provided',
        });
      }

      // Prepare threat entries
      const threatEntries = [];
      if (hash) {
        // For file hash, we'll check as a URL pattern
        // Note: Safe Browsing primarily checks URLs, not file hashes directly
        // For file hash checking, you might want to use a different service
        threatEntries.push({
          hash: hash,
        });
      }
      if (url) {
        threatEntries.push({
          url: url,
        });
      }

      // Prepare request body for Safe Browsing API
      const requestBody = {
        client: {
          clientId: 'seteams-app',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: hash ? ['EXECUTABLE'] : ['URL'],
          threatEntries: threatEntries,
        },
      };

      // Call Google Safe Browsing API
      const response = await axios.post(
        `${SAFE_BROWSING_API_URL}?key=${apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Return the response
      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Safe Browsing proxy error:', error);
      
      // If it's an axios error, return the API response
      if (error.response) {
        return res.status(error.response.status).json({
          error: 'Safe Browsing API error',
          details: error.response.data,
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

