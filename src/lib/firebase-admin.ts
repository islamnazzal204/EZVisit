// ============================================================
// EZVisit — Firebase Admin (Server-Side Token Verification)
// ============================================================

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminAuth: Auth;

function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      // In production, use FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string).
      // For development without the service account, we use projectId-only init
      // which still verifies tokens against Firebase's public keys.
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
        // Minimal init — still verifies ID tokens using Firebase's public certs
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
 * Returns the decoded token (with uid, email, etc.) or null if invalid.
 */
export async function verifyAuthToken(request: Request): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.slice(7); // Remove "Bearer "
    if (!idToken || idToken.trim().length === 0) {
      return null;
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    console.error('Auth token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
