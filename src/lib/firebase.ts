// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgGOBNWqAgJk7P5goOuM-Q8LbQO-qnJvk",
  authDomain: "bizibase.firebaseapp.com",
  projectId: "bizibase",
  storageBucket: "bizibase.firebasestorage.app",
  messagingSenderId: "846283526881",
  appId: "1:846283526881:web:e5e5075f46050985a55da0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
