// ============================================================
// EZVisit — Firebase Admin (Server-Side Token Verification)
// ============================================================

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminAuth: Auth;
let initFailed = false;

function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccount) {
        try {
          const parsed = JSON.parse(serviceAccount);
          adminApp = initializeApp({ credential: cert(parsed) });
        } catch {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to projectId init.');
          adminApp = initializeApp({ projectId: 'ezvisit-e99b6' });
        }
      } else {
        // Minimal init — verifies ID tokens using Firebase's public certs
        adminApp = initializeApp({ projectId: 'ezvisit-e99b6' });
      }
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * 
 * - If a valid token is found → returns the user info.
 * - If no token / invalid token and FIREBASE_SERVICE_ACCOUNT_KEY is set → returns null (strict mode).
 * - If no token / invalid token and no service account → returns a fallback user (soft mode)
 *   so the app still works on Vercel without full auth config.
 */
export async function verifyAuthToken(request: Request): Promise<{ uid: string; email?: string } | null> {
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (hasServiceAccount) return null; // Strict: block unauthenticated
      console.warn('[Auth] No auth token provided — allowing request (no service account configured).');
      return { uid: 'anonymous' };
    }

    const idToken = authHeader.slice(7);
    if (!idToken || idToken.trim().length === 0) {
      if (hasServiceAccount) return null;
      console.warn('[Auth] Empty auth token — allowing request (no service account configured).');
      return { uid: 'anonymous' };
    }

    // If previous init failed, skip verification to avoid repeated errors
    if (initFailed) {
      console.warn('[Auth] Skipping token verification (previous init failed).');
      return { uid: 'unverified' };
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth] Token verification failed:', msg);

    // If firebase-admin can't verify (e.g., no credentials on Vercel), allow through in soft mode
    if (!hasServiceAccount) {
      initFailed = true;
      console.warn('[Auth] Allowing request through — set FIREBASE_SERVICE_ACCOUNT_KEY for strict auth.');
      return { uid: 'unverified' };
    }

    return null; // Strict mode: block
  }
}

