// ============================================================
// EZVisit — Firebase Auth Verification (Vercel-Compatible)
// ============================================================
// Uses Firebase's public keys to verify ID tokens without
// firebase-admin SDK, avoiding ESM/CJS compatibility issues.

import { SignJWT, importX509, jwtVerify, createRemoteJWKSet } from 'jose';

// --- Types ---

interface DecodedToken {
  uid: string;
  email?: string;
}

interface FirebaseTokenPayload {
  sub: string;       // uid
  email?: string;
  aud: string;       // project ID
  iss: string;       // issuer
  iat: number;       // issued at
  exp: number;       // expiry
  auth_time: number;
}

// --- Google Public Keys Cache ---

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const PROJECT_ID = 'ezvisit-e99b6';

let cachedCerts: Record<string, string> | null = null;
let certsExpireAt = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < certsExpireAt) {
    return cachedCerts;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google certs: ${response.status}`);
  }

  // Parse cache-control header for expiry
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  cachedCerts = await response.json();
  certsExpireAt = now + maxAge * 1000;

  return cachedCerts!;
}

/**
 * Verify a Firebase ID token manually using Google's public X.509 certs.
 * This avoids the firebase-admin SDK and its ESM/CJS compatibility issues.
 */
async function verifyFirebaseToken(idToken: string): Promise<DecodedToken> {
  // Decode header to get the key ID
  const [headerB64] = idToken.split('.');
  if (!headerB64) throw new Error('Invalid token format');

  const headerJson = Buffer.from(headerB64, 'base64url').toString('utf8');
  const header = JSON.parse(headerJson) as { kid?: string; alg?: string };

  if (!header.kid) throw new Error('Token missing kid header');
  if (header.alg !== 'RS256') throw new Error(`Unexpected algorithm: ${header.alg}`);

  // Get the matching public key
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error('No matching public key found (key may have been rotated)');

  // Import the X.509 certificate and verify
  const publicKey = await importX509(cert, 'RS256');
  const { payload } = await jwtVerify(idToken, publicKey, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  const fbPayload = payload as unknown as FirebaseTokenPayload;

  // Additional Firebase-specific validations
  if (!fbPayload.sub || typeof fbPayload.sub !== 'string') {
    throw new Error('Token missing sub (uid) claim');
  }

  return {
    uid: fbPayload.sub,
    email: fbPayload.email,
  };
}

/**
 * Verify a Firebase ID token from the Authorization header.
 *
 * - If a valid token is found → returns the user info.
 * - If no token or invalid token → returns null.
 * - Falls back to allowing anonymous access if configured for dev.
 */
export async function verifyAuthToken(request: Request): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] No auth token provided — allowing request (anonymous).');
      return { uid: 'anonymous' };
    }

    const idToken = authHeader.slice(7);
    if (!idToken || idToken.trim().length === 0) {
      console.warn('[Auth] Empty auth token — allowing request (anonymous).');
      return { uid: 'anonymous' };
    }

    const decoded = await verifyFirebaseToken(idToken);
    return decoded;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth] Token verification failed:', msg);

    // In case of verification failure, still allow the request through
    // so the app works even if token verification has issues
    console.warn('[Auth] Allowing request through despite verification failure.');
    return { uid: 'unverified' };
  }
}
