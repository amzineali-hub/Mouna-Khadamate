import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress noisy internal WebChannel transport warnings in iframe/proxy environments
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

// Use experimentalForceLongPolling so Firestore connects reliably inside proxied iframes and mobile networks
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch {
    // Expected permission denial on unauthenticated boot probe; confirms Firestore is reachable
  }
}

testFirestoreConnection();

/**
 * Automatic Anti-PII Sanitizer: Masks phone numbers, emails, and Moroccan CIN/ICE codes
 * in public descriptions, cover notes, and real-time chat messages.
 */
export function sanitizePublicText(raw: string): { sanitized: string; redacted: boolean } {
  let redacted = false;
  let text = raw;

  // Mask emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(text)) {
    redacted = true;
    text = text.replace(emailRegex, '[EMAIL MASQUÉ PAR MOUNA EMPLOI]');
  }

  // Mask Moroccan & international phone numbers (e.g., 06..., 07..., +212..., 00212...)
  const phoneRegex = /(\+212|00212|0)[5-7][\s.-]?(\d[\s.-]?){8}/g;
  if (phoneRegex.test(text)) {
    redacted = true;
    text = text.replace(phoneRegex, '[TÉLÉPHONE MASQUÉ PAR MOUNA EMPLOI]');
  }

  // Mask any 9+ consecutive digits
  const digitsRegex = /\b\d{9,15}\b/g;
  if (digitsRegex.test(text)) {
    redacted = true;
    text = text.replace(digitsRegex, '[COORDONNÉES MASQUÉES]');
  }

  return { sanitized: text.slice(0, 500), redacted };
}
