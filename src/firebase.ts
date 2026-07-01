import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We log the detailed error but do not throw a fatal uncaught exception, 
  // allowing the application to gracefully fall back to localStorage/in-memory mode.
}

// Connection Validation on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test complete (it is normal if 'test/connection' document doesn't exist, as long as it doesn't fail with network errors).");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.warn("Firebase connection checked. Received warning (likely security rules or missing doc, which is expected):", error);
    }
  }
}

testConnection();
