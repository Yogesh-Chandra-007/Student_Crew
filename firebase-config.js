// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkMF2TLoWN-slOPx9uerJMY8D08yP9WK4",  // ✅ your key
  authDomain: "sc-database-167c0.firebaseapp.com",   // 👈 usually projectId + ".firebaseapp.com"
  databaseURL: "https://sc-database-167c0-default-rtdb.firebaseio.com", // 👈 DB URL from console
  projectId: "sc-database-167c0",                   // ✅ your projectId
  storageBucket: "sc-database-167c0.appspot.com",   // 👈 usually projectId + ".appspot.com"
  messagingSenderId: "233077157231",              // 🔴 copy from console
  appId: "1:233077157231:web:027988df72c8c20a288c9a"                              // 🔴 copy from console
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

