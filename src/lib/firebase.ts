import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCEYDnDIKDcnKptTNgGlK1CTrhin_WJTy4",
  authDomain: "localmediaplayer-aaba3.firebaseapp.com",
  projectId: "localmediaplayer-aaba3",
  storageBucket: "localmediaplayer-aaba3.appspot.com", // Corrigido: .app para .appspot.com
  messagingSenderId: "103286038551",
  appId: "1:103286038551:web:c3c208f30961d13deefc52",
  measurementId: "G-L9GF9TSCSP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);