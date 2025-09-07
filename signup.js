import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const signupForm = document.getElementById('signupForm');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const termsCheckbox = document.getElementById('terms');
const signupBtn = document.getElementById('signupBtn');
const togglePassword = document.querySelector('.toggle-password');
const googleBtn = document.querySelector(".social-btn.google");

// ✅ Toast function (safe)
const toastContainer = document.getElementById("toastContainer") || (() => {
  const div = document.createElement("div");
  div.id = "toastContainer";
  document.body.appendChild(div);
  return div;
})();

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ✅ Toggle password visibility (safe)
if (togglePassword) {
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
  });
}

// ✅ Check if email already exists in Firebase Auth
async function checkEmailExists(email) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

// ✅ Signup handler
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!termsCheckbox.checked) {
    showToast("Please agree to the Terms & Conditions.", "error");
    return;
  }
  if (passwordInput.value !== confirmPasswordInput.value) {
    showToast("Passwords do not match!", "error");
    return;
  }

  signupBtn.classList.add("loading");
  signupBtn.disabled = true;

  try {
    const emailExists = await checkEmailExists(emailInput.value);
    if (emailExists) {
      showToast("This email is already registered. Please login instead.", "error");
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    await updateProfile(cred.user, { displayName: fullnameInput.value });

    const userRef = ref(db, "users/" + cred.user.uid);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: cred.user.uid,
        name: fullnameInput.value,
        email: emailInput.value,
        createdAt: serverTimestamp()
      });
    }

    showToast("Account created successfully! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "college.html";
    }, 2000);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      showToast("This email is already registered. Please login instead.", "error");
    } else {
      showToast("Signup failed: " + error.message, "error");
    }
  } finally {
    signupBtn.classList.remove("loading");
    signupBtn.disabled = false;
  }
});

// ✅ Google signup
googleBtn.addEventListener("click", async () => {
  signupBtn.classList.add("loading");
  signupBtn.disabled = true;
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    const userRef = ref(db, "users/" + cred.user.uid);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: cred.user.uid,
        name: cred.user.displayName,
        email: cred.user.email,
        photoURL: cred.user.photoURL,
        createdAt: serverTimestamp()
      });
    }

    showToast("Google signup successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "college.html";
    }, 2000);
  } catch (err) {
    showToast("Google signup failed: " + err.message, "error");
  } finally {
    signupBtn.classList.remove("loading");
    signupBtn.disabled = false;
  }
});
