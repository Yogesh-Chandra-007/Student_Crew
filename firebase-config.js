// firebase-config.js (PERFECT AS IS!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkMF2TLoWN-slOPx9uerJMY8D08yP9WK4",
  authDomain: "sc-database-167c0.firebaseapp.com",
  databaseURL: "https://sc-database-167c0-default-rtdb.firebaseio.com",
  projectId: "sc-database-167c0",
  storageBucket: "sc-database-167c0.appspot.com", // This can stay, it won't cost anything
  messagingSenderId: "233077157231",
  appId: "1:233077157231:web:027988df72c8c20a288c9a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
// No storage export needed - we're using Base64
