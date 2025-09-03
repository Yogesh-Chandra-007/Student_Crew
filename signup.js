// signup.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const signupForm = document.getElementById("signup-form");
const googleBtn = document.getElementById("google-signup");

// 📌 Normal email/password signup
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("name").value;
  const emailInput = document.getElementById("email").value;
  const passwordInput = document.getElementById("password").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);

    // ✅ Store user data in Realtime Database
    await set(ref(db, "users/" + cred.user.uid), {
      uid: cred.user.uid,
      fullName: nameInput,   // ✅ fixed
      email: emailInput,
      createdAt: serverTimestamp()
    });

    alert("Signup successful!");
    window.location.href = "college.html"; // 🔹 go to college selection
  } catch (err) {
    console.error("Signup error:", err);
    alert("Error: " + err.message);
  }
});

// 📌 Google signup
googleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);

    // Check if user already exists in DB
    const snapshot = await get(ref(db, "users/" + cred.user.uid));
    if (!snapshot.exists()) {
      // ✅ Store new user data
      await set(ref(db, "users/" + cred.user.uid), {
        uid: cred.user.uid,
        fullName: cred.user.displayName || "Student",  // ✅ fixed
        email: cred.user.email,
        photoURL: cred.user.photoURL || "default-avatar.png",
        createdAt: serverTimestamp()
      });
    }

    alert("Google Signup successful!");
    window.location.href = "college.html"; // 🔹 go to college selection
  } catch (err) {
    console.error("Google signup error:", err);
    alert("Error: " + err.message);
  }
});
