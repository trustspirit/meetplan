import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (_db) return _db;
  if (getApps().length === 0) {
    // Firebase Functions runtime automatically injects ADC,
    // and the emulator's FIRESTORE_EMULATOR_HOST is auto-detected.
    // If GOOGLE_APPLICATION_CREDENTIALS is set, initializeApp() uses it automatically.
    initializeApp();
  }
  _db = getFirestore();
  return _db;
}
