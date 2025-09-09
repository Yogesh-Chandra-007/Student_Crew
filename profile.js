// profile.js
import { auth, db } from "./firebase-config.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elements
const spinner = document.getElementById("spinner");
const toast = document.getElementById("toast");
const profileAvatar = document.getElementById("profileAvatar");
const navProfileImg = document.getElementById("navProfileImg");
const profileName = document.getElementById("profileName");
const profileCollege = document.getElementById("profileCollege");
const coinsCount = document.getElementById("coinsCount");
const friendsCount = document.getElementById("friendsCount");
const listingsCount = document.getElementById("listingsCount");
const editProfileBtn = document.getElementById("editProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");

// Input elements
const inputEmail = document.getElementById("inputEmail");
const inputPhone = document.getElementById("inputPhone");
const inputCollege = document.getElementById("inputCollege"); // read-only
const inputCourse = document.getElementById("inputCourse");
const inputYear = document.getElementById("inputYear");

let isEditMode = false;
let currentUser = null;

// Show toast
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = "toast " + type + " show";
  setTimeout(() => {
    toast.className = "toast " + type;
  }, 3000);
}

// Toggle profile menu
function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  menu.classList.toggle("active");
}

// Logout
function logout() {
  signOut(auth).then(() => window.location.href = "login.html")
  .catch((error) => showToast("Error signing out", "error"));
}

// Toggle edit mode
function toggleEditMode() {
  isEditMode = !isEditMode;

  editProfileBtn.style.display = isEditMode ? "none" : "flex";
  saveProfileBtn.style.display = isEditMode ? "flex" : "none";

  inputEmail.readOnly = !isEditMode;
  inputPhone.readOnly = !isEditMode;
  inputCourse.readOnly = !isEditMode;
  inputYear.disabled = !isEditMode;

  // College always locked
  inputCollege.readOnly = true;
}

// Save profile
function saveProfile() {
  spinner.style.display = "block";
  const user = auth.currentUser;
  if (!user) { showToast("You must be logged in", "error"); spinner.style.display = "none"; return; }

  const updates = {
    fullName: profileName.textContent,
    email: inputEmail.value,
    phone: inputPhone.value,
    // college not editable
    course: inputCourse.value,
    year: inputYear.value,
    updatedAt: Date.now()
  };

  update(ref(db, "users/" + user.uid), updates)
    .then(() => {
      spinner.style.display = "none";
      showToast("Profile updated successfully!");
      profileCollege.textContent = inputCollege.value; // show locked college
      isEditMode = false;
      toggleEditMode();
    })
    .catch(error => {
      spinner.style.display = "none";
      showToast("Error updating profile: " + error.message, "error");
    });
}

// Load user data
function loadUserData() {
  spinner.style.display = "block";
  const user = auth.currentUser;
  if (!user) { window.location.href = "login.html"; return; }

  get(ref(db, "users/" + user.uid)).then(snapshot => {
    spinner.style.display = "none";
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("Loaded user data:", data); // 👈 debug log

      profileName.textContent = data.fullName || user.displayName || "Student";
      profileCollege.textContent = data.college || "No college selected";
      coinsCount.textContent = data.coins || 0;
      friendsCount.textContent = data.friends ? Object.keys(data.friends).length : 0;
      listingsCount.textContent = data.listings ? Object.keys(data.listings).length : 0;

      inputEmail.value = data.email || user.email || "";
      inputPhone.value = data.phone || "";
      inputCollege.value = data.college || "VVIT";
      inputCourse.value = data.course?.trim() || "";
      inputYear.value = data.year || "1";

      if (data.photoURL) { profileAvatar.src = navProfileImg.src = data.photoURL; }
      else if (user.photoURL) { profileAvatar.src = navProfileImg.src = user.photoURL; }
    } else {
      showToast("No user data found. Please update your profile.", "error");
    }
  }).catch(error => {
    spinner.style.display = "none";
    showToast("Error loading profile: " + error.message, "error");
  });
}

// Avatar preview
document.getElementById("avatar-upload").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      profileAvatar.src = navProfileImg.src = event.target.result;
      showToast("Profile picture updated", "success");
    };
    reader.readAsDataURL(file);
  }
});

// Auth state
onAuthStateChanged(auth, (user) => {
  if (user) { currentUser = user; loadUserData(); }
  else { window.location.href = "login.html"; }
});

// Make functions global
window.toggleProfileMenu = toggleProfileMenu;
window.logout = logout;
window.toggleEditMode = toggleEditMode;
window.saveProfile = saveProfile;
