// signup.js - Upgraded Version
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
const googleBtn = document.getElementById("google-signup");
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

// Utility Functions
const showToast = (message, type = "success") => {
  if (typeof window.showToast === "function") {
    window.showToast(message, type);
  } else {
    alert(message); // fallback
  }
};

const setLoadingState = (isLoading) => {
  if (signupBtn) {
    signupBtn.disabled = isLoading;
    signupBtn.classList.toggle("loading", isLoading);
  }
};

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

const checkEmailExists = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

const createUserInDatabase = async (user, additionalData = {}) => {
  try {
    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: user.uid,
        fullName: additionalData.fullName || user.displayName || "Student",
        email: user.email,
        photoURL: user.photoURL || "default-avatar.png",
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

const handleSignupSuccess = (user) => {
  showToast("Account created successfully! Redirecting...", "success");
  setTimeout(() => {
    window.location.href = "college.html";
  }, 2000);
};

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
    default:
      showToast(ERROR_MESSAGES.DEFAULT, "error");
  }
};

// Event Handlers
const handleEmailSignup = async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const termsAgreed = termsCheckbox.checked;

  if (!validateForm(name, email, password, confirmPassword, termsAgreed)) {
    return;
  }

  setLoadingState(true);

  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      showToast(ERROR_MESSAGES.EMAIL_EXISTS, "error");
      setLoadingState(false);
      return;
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user record in database
    await createUserInDatabase(userCredential.user, { fullName: name });
    
    handleSignupSuccess(userCredential.user);
  } catch (error) {
    handleSignupError(error);
    setLoadingState(false);
  }
};

const handleGoogleSignup = async () => {
  setLoadingState(true);

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Create user record in database
    await createUserInDatabase(userCredential.user);
    
    handleSignupSuccess(userCredential.user);
  } catch (error) {
    handleSignupError(error);
    setLoadingState(false);
  }
};

// Initialize Event Listeners
const initializeSignup = () => {
  if (signupForm) {
    signupForm.addEventListener("submit", handleEmailSignup);
  }
  
  if (googleBtn) {
    googleBtn.addEventListener("click", handleGoogleSignup);
  }
  
  // Add password visibility toggle if not already present
  const passwordToggle = document.querySelector('.toggle-password');
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('fa-eye-slash');
    });
  }
};

// Initialize the signup functionality when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSignup);
} else {
  initializeSignup();
}

// Export functions for testing purposes (optional)
export {
  validateForm,
  checkEmailExists,
  createUserInDatabase,
  handleSignupError
};
