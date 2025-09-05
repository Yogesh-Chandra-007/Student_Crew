// login.js
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Elements
const form = document.querySelector(".auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberCheckbox = document.getElementById("remember");
const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.querySelector(".social-btn.google");

// ✅ Toast function (from login.html, exposed globally)
function showToast(message, type = "success") {
  if (typeof window.showToast === "function") {
    window.showToast(message, type);
  } else {
    alert(message); // fallback if toast not loaded
  }
}

// Redirect user based on college selection
async function redirectUser(user) {
  try {
    const snapshot = await get(ref(db, "users/" + user.uid));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.college) {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "college.html";
      }
    } else {
      window.location.href = "college.html";
    }
  } catch (error) {
    console.error("Error checking user data:", error);
    window.location.href = "college.html";
  }
}

// Email/Password login
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast("Please enter both email and password.", "error");
    return;
  }

  loginBtn.classList.add("loading");
  loginBtn.disabled = true;

  try {
    const persistence = rememberCheckbox.checked
      ? browserLocalPersistence
      : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    showToast("Login successful! Redirecting...", "success");
    await redirectUser(userCredential.user);
  } catch (err) {
    showToast("Login failed: " + err.message, "error");
    console.error(err);
  } finally {
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});

// Google login
googleBtn?.addEventListener("click", async () => {
  loginBtn.classList.add("loading");
  loginBtn.disabled = true;

  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    // Check if user exists, if not create record
    const userRef = ref(db, "users/" + cred.user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        uid: cred.user.uid,
        name: cred.user.displayName,
        email: cred.user.email,
        photoURL: cred.user.photoURL,
        createdAt: serverTimestamp(),
      });
    }

    showToast("Google login successful! Redirecting...", "success");
    await redirectUser(cred.user);
  } catch (err) {
    showToast("Google Sign-In failed: " + err.message, "error");
    console.error(err);
  } finally {
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});
