// signup.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const form = document.querySelector(".auth-form");
const nameInput = document.getElementById("fullname");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm-password");
const termsCheckbox = document.getElementById("terms");
const googleBtn = document.querySelector(".social-btn.google");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!termsCheckbox.checked) {
    alert("Please agree to the Terms & Conditions.");
    return;
  }
  if (passwordInput.value !== confirmInput.value) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);

    await updateProfile(cred.user, { displayName: nameInput.value });

    await set(ref(db, "users/" + cred.user.uid), {
      uid: cred.user.uid,
      name: nameInput.value,
      email: emailInput.value,
      createdAt: serverTimestamp()
    });

    window.location.href = "college.html";
  } catch (err) {
    alert(err.message);
  }
});

// Google sign up
googleBtn?.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    await set(ref(db, "users/" + cred.user.uid), {
      uid: cred.user.uid,
      name: cred.user.displayName,
      email: cred.user.email,
      photoURL: cred.user.photoURL,
      createdAt: serverTimestamp()
    });

    window.location.href = "college.html";
  } catch (err) {
    alert(err.message);
  }
});
