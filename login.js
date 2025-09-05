// login.js
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.getElementById('loginBtn');
const togglePassword = document.querySelector('.toggle-password');
const googleBtn = document.querySelector(".social-btn.google");
const loggedInMessage = document.getElementById("loggedInMessage");
const continueToDashboard = document.getElementById("continueToDashboard");

// ✅ Toast function
const toastContainer = document.getElementById("toastContainer");
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Show message that user is already logged in
    loggedInMessage.style.display = 'block';
    loginForm.style.display = 'none';
    
    // Add event listener for continue button
    continueToDashboard.addEventListener('click', () => {
      redirectUser(user);
    });
  }
});

// Toggle password visibility
togglePassword.addEventListener('click', function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  this.classList.toggle('fa-eye-slash');
});

// Function to redirect user based on college selection status
async function redirectUser(user) {
  try {
    const snapshot = await get(ref(db, "users/" + user.uid));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      // If user has already selected a college, go to dashboard
      if (userData.college) {
        window.location.href = "dashboard.html";
      } else {
        // If no college selected, go to college selection
        window.location.href = "college.html";
      }
    } else {
      // If user doesn't exist in database, go to college selection
      window.location.href = "college.html";
    }
  } catch (error) {
    console.error("Error checking user data:", error);
    window.location.href = "college.html";
  }
}

// Email/Password login with provider check
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberCheckbox.checked;

  if (!email || !password) {
    showToast("Please enter both email and password.", "error");
    return;
  }

  loginBtn.classList.add('loading');
  loginBtn.disabled = true;

  try {
    // 🔎 Check providers first
    const methods = await fetchSignInMethodsForEmail(auth, email);
    console.log("Providers for this email:", methods);

    if (methods.length === 0) {
      showToast("No account found with this email.", "error");
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      return;
    }

    if (methods.includes("google.com") && !methods.includes("password")) {
      showToast("This account uses Google Sign-In. Please log in with Google.", "error");
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      return;
    }

    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showToast("Login successful! Redirecting...", "success");

    // Redirect based on college selection status
    await redirectUser(userCredential.user);

  } catch (error) {
    showToast("Login failed: " + error.message, "error");
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
  }
});

// ✅ Google login - FIXED to prevent duplicate users
googleBtn.addEventListener("click", async () => {
  loginBtn.classList.add("loading");
  loginBtn.disabled = true;
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    // Check if user already exists before creating new record
    const userRef = ref(db, "users/" + cred.user.uid);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      // Only create user if they don't exist
      await set(userRef, {
        uid: cred.user.uid,
        name: cred.user.displayName,
        email: cred.user.email,
        photoURL: cred.user.photoURL,
        createdAt: serverTimestamp()
      });
    }

    showToast("Google login successful! Redirecting...", "success");
    
    // Redirect based on college selection status
    await redirectUser(cred.user);
    
  } catch (err) {
    showToast("Google Sign-In failed: " + err.message, "error");
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});
