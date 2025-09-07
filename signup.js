// signup.js - Updated Version
import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  fetchSignInMethodsForEmail,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
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

// Toast function (same as login)
const showToast = (message, type = "success") => {
  const toastContainer = document.getElementById("toastContainer");
  if (toastContainer) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  } else {
    alert(message);
  }
};

// Loading state
const setLoadingState = (isLoading) => {
  [signupBtn, googleBtn].forEach(btn => {
    if (btn) {
      btn.disabled = isLoading;
      isLoading ? btn.classList.add("loading") : btn.classList.remove("loading");
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
    showToast("Please agree to the Terms & Conditions.", "error");
    return false;
  }
  if (password !== confirmPassword) {
    showToast("Passwords do not match.", "error");
    return false;
  }
  if (password.length < 6) {
    showToast("Password should be at least 6 characters.", "error");
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address.", "error");
    return false;
  }
  return true;
};

// Check email
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
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw error;
  }
};

// Redirect logic (same as login)
const redirectUser = async (user) => {
  try {
    const snapshot = await get(ref(db, "users/" + user.uid));
    if (snapshot.exists() && snapshot.val().college?.trim()) {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "college.html";
    }
  } catch (error) {
    console.error(error);
    window.location.href = "college.html";
  }
};

// Email signup
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
      showToast("This email is already registered. Please login instead.", "error");
      setLoadingState(false);
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserInDatabase(userCredential.user, { fullName: name });
    showToast("Account created successfully! Redirecting...", "success");
    await redirectUser(userCredential.user);
  } catch (err) {
    console.error(err);
    showToast("Signup failed: " + err.message, "error");
  } finally {
    setLoadingState(false);
  }
};

// Google signup
const handleGoogleSignup = async () => {
  setLoadingState(true);

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const cred = await signInWithPopup(auth, provider);

    // Check if user exists, if not create record
    const userRef = ref(db, "users/" + cred.user.uid);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: cred.user.uid,
        fullName: cred.user.displayName,
        email: cred.user.email,
        photoURL: cred.user.photoURL,
        createdAt: serverTimestamp(),
      });
    }

    showToast("Google signup successful! Redirecting...", "success");
    await redirectUser(cred.user);
  } catch (err) {
    console.error(err);
    showToast("Google signup failed: " + err.message, "error");
  } finally {
    setLoadingState(false);
  }
};

// Initialize
const initializeSignup = () => {
  signupForm?.addEventListener("submit", handleEmailSignup);
  googleBtn?.addEventListener("click", handleGoogleSignup);

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSignup);
} else {
  initializeSignup();
}
