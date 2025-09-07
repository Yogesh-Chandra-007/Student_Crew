// signup.js - Fully Fixed Version with Safe Google Signup
import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  fetchSignInMethodsForEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// DOM Elements
const signupForm = document.getElementById("signup-form");
const googleBtn = document.getElementById("googleSignupBtn");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const termsCheckbox = document.getElementById("terms");
const signupBtn = document.getElementById("signupBtn");

// Constants
const ERROR_MESSAGES = {
  EMAIL_EXISTS: "This email is already registered. Please login instead.",
  WEAK_PASSWORD: "Password should be at least 6 characters.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORDS_MISMATCH: "Passwords do not match.",
  TERMS_NOT_AGREED: "Please agree to the Terms & Conditions.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  DEFAULT: "An error occurred. Please try again."
};

// Toast function
const showToast = (message, type = "success") => {
  const toastContainer = document.getElementById("toastContainer");
  if (toastContainer) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  } else {
    alert(message); // fallback
  }
};

// Loading state for buttons
const setLoadingState = (isLoading) => {
  [signupBtn, googleBtn].forEach(btn => {
    if (btn) {
      btn.disabled = isLoading;
      btn.classList.toggle("loading", isLoading);
    }
  });
};

// Form validation
const validateForm = (name, email, password, confirmPassword, termsAgreed) => {
  if (!name || !email || !password || !confirmPassword) {
    showToast("Please fill in all fields.", "error");
    return false;
  }
  if (!termsAgreed) {
    showToast(ERROR_MESSAGES.TERMS_NOT_AGREED, "error");
    return false;
  }
  if (password !== confirmPassword) {
    showToast(ERROR_MESSAGES.PASSWORDS_MISMATCH, "error");
    return false;
  }
  if (password.length < 6) {
    showToast(ERROR_MESSAGES.WEAK_PASSWORD, "error");
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast(ERROR_MESSAGES.INVALID_EMAIL, "error");
    return false;
  }
  return true;
};

// Check if email exists
const checkEmailExists = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

// Create user in database
const createUserInDatabase = async (user, additionalData = {}) => {
  try {
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
    return true;
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw error;
  }
};

// Signup success
const handleSignupSuccess = () => {
  showToast("Account created successfully! Redirecting...", "success");
  setTimeout(() => window.location.href = "college.html", 2000);
};

// Signup error
const handleSignupError = (error) => {
  console.error("Signup error:", error);
  switch (error.code) {
    case 'auth/email-already-in-use':
      showToast(ERROR_MESSAGES.EMAIL_EXISTS, "error");
      break;
    case 'auth/weak-password':
      showToast(ERROR_MESSAGES.WEAK_PASSWORD, "error");
      break;
    case 'auth/invalid-email':
      showToast(ERROR_MESSAGES.INVALID_EMAIL, "error");
      break;
    case 'auth/network-request-failed':
      showToast(ERROR_MESSAGES.NETWORK_ERROR, "error");
      break;
    case 'auth/popup-closed-by-user':
      break; // ignore
    default:
      showToast(ERROR_MESSAGES.DEFAULT, "error");
  }
};

// Email signup handler
const handleEmailSignup = async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const termsAgreed = termsCheckbox.checked;

  if (!validateForm(name, email, password, confirmPassword, termsAgreed)) return;

  setLoadingState(true);
  try {
    if (await checkEmailExists(email)) {
      showToast(ERROR_MESSAGES.EMAIL_EXISTS, "error");
      setLoadingState(false);
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserInDatabase(userCredential.user, { fullName: name });
    handleSignupSuccess();
  } catch (error) {
    handleSignupError(error);
    setLoadingState(false);
  }
};

// Google signup handler - safe version
const handleGoogleSignup = async () => {
  setLoadingState(true);
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await createUserInDatabase(user, { fullName: user.displayName || "Student" });
      console.log("New Google user created in DB");
    } else {
      console.log("Google user already exists in DB");
    }

    handleSignupSuccess();
  } catch (error) {
    console.error("Google signup error:", error);
    handleSignupError(error);
    setLoadingState(false);
  }
};

// Initialize event listeners
const initializeSignup = () => {
  signupForm?.addEventListener("submit", handleEmailSignup);
  if (googleBtn) googleBtn.addEventListener("click", handleGoogleSignup);

  // Password toggle
  const passwordToggle = document.querySelector('.toggle-password');
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      passwordToggle.classList.toggle('fa-eye-slash');
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSignup);
} else {
  initializeSignup();
};
