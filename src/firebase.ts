import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXEnS_eNEup8xqGNdt_s3Go0TZC6B0Nos",
  authDomain: "quanlymm-a12e5.firebaseapp.com",
  projectId: "quanlymm-a12e5",
  storageBucket: "quanlymm-a12e5.firebasestorage.app",
  messagingSenderId: "836959630885",
  appId: "1:836959630885:web:6b008bf02dfbe1d2e7f1cc",
  measurementId: "G-LFF5DHBX3H"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Ensure the user is authenticated in Firebase (using Anonymous Auth as baseline if not signed in)
 */
export async function ensureAuth(): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const userCred = await signInAnonymously(auth);
    console.log("Firebase Anonymous Auth successful, UID:", userCred.user.uid);
    return userCred.user;
  } catch (err) {
    console.warn("Anonymous Auth failed (may be disabled in Firebase Console or network issue):", err);
    return null;
  }
}

// Error Handling Infrastructure as mandated by system instructions
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
  code?: string;
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): string {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const codeMatch = rawMsg.match(/\[?([a-zA-Z\-]+\/[a-zA-Z\-]+)\]?/);
  const code = codeMatch ? codeMatch[1] : (rawMsg.includes('permission-denied') ? 'permission-denied' : 'unknown');

  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    code,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(p => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Detailed Error:', errInfo);
  return `[${operationType.toUpperCase()} ${path || ''}] ${rawMsg}`;
}

// Connection Validation on Boot
async function testConnection() {
  try {
    await ensureAuth();
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test complete successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.warn("Firebase connection checked. Warning/Note:", error);
    }
  }
}

testConnection();

