// login.js
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.querySelector(".auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const googleBtn = document.querySelector(".social-btn.google");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    window.location.href = "college.html";
  } catch (err) {
    alert("Invalid email or password");
  }
});

googleBtn?.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    window.location.href = "college.html";
  } catch (err) {
    alert(err.message);
  }
});
