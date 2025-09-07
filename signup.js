import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Elements
const signupForm = document.getElementById("signup-form");
const googleBtn = document.getElementById("googleSignupBtn");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const termsCheckbox = document.getElementById("terms");
const signupBtn = document.getElementById("signupBtn");

// Toast function
const showToast = (message, type = "success") => {
  const toastContainer = document.getElementById("toastContainer");
  if (toastContainer) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  } else alert(message);
};

// Loading state
const setLoading = (loading) => {
  signupBtn.disabled = loading;
  googleBtn.disabled = loading;
  loading ? signupBtn.classList.add("loading") : signupBtn.classList.remove("loading");
  loading ? googleBtn.classList.add("loading") : googleBtn.classList.remove("loading");
};

// Form validation
const validateForm = (name, email, password, confirmPassword, termsAgreed) => {
  if (!name || !email || !password || !confirmPassword) { showToast("Please fill in all fields", "error"); return false; }
  if (!termsAgreed) { showToast("Please agree to Terms & Conditions", "error"); return false; }
  if (password !== confirmPassword) { showToast("Passwords do not match", "error"); return false; }
  if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return false; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { showToast("Invalid email address", "error"); return false; }
  return true;
};

// Create user in database
const createUserInDB = async (user, additionalData = {}) => {
  const userRef = ref(db, "users/" + user.uid);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    await set(userRef, {
      uid: user.uid,
      fullName: additionalData.fullName || user.displayName || "Student",
      email: user.email,
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      ...additionalData
    });
  }
};

// Redirect after signup
const redirectUser = async (user) => {
  const snapshot = await get(ref(db, "users/" + user.uid));
  if (snapshot.exists() && snapshot.val().college) {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "college.html";
  }
};

// Email signup
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const termsAgreed = termsCheckbox.checked;

  if (!validateForm(name, email, password, confirmPassword, termsAgreed)) return;

  setLoading(true);

  try {
    const emailExists = (await fetchSignInMethodsForEmail(auth, email)).length > 0;
    if (emailExists) { showToast("Email already registered", "error"); setLoading(false); return; }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserInDB(userCredential.user, { fullName: name });
    showToast("Signup successful! Redirecting...", "success");
    await redirectUser(userCredential.user);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Signup failed", "error");
    setLoading(false);
  }
});

// Google signup
googleBtn?.addEventListener("click", async () => {
  setLoading(true);
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await createUserInDB(cred.user);
    showToast("Google signup successful! Redirecting...", "success");
    await redirectUser(cred.user);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Google signup failed", "error");
    setLoading(false);
  }
});

// Toggle password visibility
document.querySelector(".toggle-password")?.addEventListener("click", function() {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  this.classList.toggle("fa-eye-slash");
});
