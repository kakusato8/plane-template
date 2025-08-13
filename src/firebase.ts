// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBoKTTokTdO-0iJ0lIQUNSyY0FLiVO3kyM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "curio-city-d4e43.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "curio-city-d4e43",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "curio-city-d4e43.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "171168369962",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:171168369962:web:f13b51453151b167ed2253",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9YFR7SELGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };