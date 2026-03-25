import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDWy2bY6bvy-tDd2hT7sUfxcxmwp9Ix2TQ",
  authDomain: "ibungkii.firebaseapp.com",
  databaseURL: "https://ibungkii-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ibungkii",
  storageBucket: "ibungkii.firebasestorage.app",
  messagingSenderId: "889064896841",
  appId: "1:889064896841:web:76f83d8189fca711788298"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);