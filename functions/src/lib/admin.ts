import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Firebase Functions v2 SDK may register internal named apps, making getApps().length > 0
// even before we call initializeApp(). Explicitly check for the default app instead.
try {
  getApp();
} catch {
  initializeApp();
}

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore();
  }
  return _db;
}
