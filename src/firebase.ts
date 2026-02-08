// File: src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE CONFIG DARI FIREBASE CONSOLE DI SINI
// (Ganti bagian ini dengan kode yang kamu dapat di Tahap 1 Langkah 6)
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjOuJTtDyRPCzLPtgNMxnPPqD3rOPh63M",
    authDomain: "kpknl-knowledge-base.firebaseapp.com",
    projectId: "kpknl-knowledge-base",
    storageBucket: "kpknl-knowledge-base.firebasestorage.app",
    messagingSenderId: "713077520113",
    appId: "1:713077520113:web:037fa9e3d04e385f1c1b50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Kita export dua "alat" ini biar bisa dipakai di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);