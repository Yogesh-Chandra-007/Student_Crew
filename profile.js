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
const infoEmail = document.getElementById("infoEmail");
const infoPhone = document.getElementById("infoPhone");
const infoCollege = document.getElementById("infoCollege");
const infoCourse = document.getElementById("infoCourse");
const infoYear = document.getElementById("infoYear");
const editProfileBtn = document.getElementById("editProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");

// Input elements
const inputEmail = document.getElementById("inputEmail");
const inputPhone = document.getElementById("inputPhone");
const inputCollege = document.getElementById("inputCollege");
const inputCourse = document.getElementById("inputCourse");
const inputYear = document.getElementById("inputYear");

let isEditMode = false;
let currentUser = null;

// Show toast function
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
  const infoItems = document.querySelectorAll('.info-item');
  
  infoItems.forEach(item => item.classList.toggle('edit-mode', isEditMode));
  editProfileBtn.style.display = isEditMode ? 'none' : 'flex';
  saveProfileBtn.style.display = isEditMode ? 'flex' : 'none';
  
  if (!isEditMode) updateViewFromInputs();
}

// Update view from inputs
function updateViewFromInputs() {
  infoEmail.textContent = inputEmail.value;
  infoPhone.textContent = inputPhone.value;
  infoCollege.textContent = inputCollege.options[inputCollege.selectedIndex].text;
  infoCourse.textContent = inputCourse.value;
  
  const yearText = inputYear.value === "1" ? "1st Year" :
                   inputYear.value === "2" ? "2nd Year" :
                   inputYear.value === "3" ? "3rd Year" : "4th Year";
  infoYear.textContent = yearText;
}

// Save profile
function saveProfile() {
  spinner.style.display = "block";
  const user = auth.currentUser;
  if (!user) { showToast("You must be logged in", "error"); spinner.style.display = "none"; return; }

  const updates = {
    name: profileName.textContent,
    email: inputEmail.value,
    phone: inputPhone.value,
    college: inputCollege.value,
    course: inputCourse.value,
    year: inputYear.value,
    updatedAt: Date.now()
  };

  update(ref(db, 'users/' + user.uid), updates)
    .then(() => {
      spinner.style.display = "none";
      showToast("Profile updated successfully!");
      updateViewFromInputs();
      profileCollege.textContent = inputCollege.options[inputCollege.selectedIndex].text;
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
      profileName.textContent = data.name || user.displayName || "Student";
      profileCollege.textContent = data.college || "No college selected";
      coinsCount.textContent = data.coins || 0;
      friendsCount.textContent = data.friends ? Object.keys(data.friends).length : 0;
      listingsCount.textContent = data.listings ? Object.keys(data.listings).length : 0;

      infoEmail.textContent = data.email || user.email || "Not provided";
      infoPhone.textContent = data.phone || "Not provided";
      infoCollege.textContent = data.college || "Not selected";
      infoCourse.textContent = data.course || "Not provided";

      const yearText = data.year === "1" ? "1st Year" :
                       data.year === "2" ? "2nd Year" :
                       data.year === "3" ? "3rd Year" :
                       data.year === "4" ? "4th Year" : "Not provided";
      infoYear.textContent = yearText;

      // Set input values
      inputEmail.value = data.email || user.email || "";
      inputPhone.value = data.phone || "";
      inputCollege.value = data.college || "VVIT";
      inputCourse.value = data.course || "";
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
document.getElementById('avatar-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      profileAvatar.src = navProfileImg.src = event.target.result;
      showToast("Profile picture updated", "success");
    }
    reader.readAsDataURL(file);
  }
});

// Auth state
onAuthStateChanged(auth, (user) => {
  if (user) { currentUser = user; loadUserData(); }
  else { window.location.href = "login.html"; }
});

// Make functions globally accessible
window.toggleProfileMenu = toggleProfileMenu;
window.logout = logout;
window.toggleEditMode = toggleEditMode;
window.saveProfile = saveProfile;

// In profile.js, modify the avatar upload event listener
document.getElementById('avatar-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Update both profile and navigation images
            profileAvatar.src = event.target.result;
            
            // Update navigation profile image across all pages
            const navProfileImg = document.getElementById("navProfileImg");
            if (navProfileImg) {
                navProfileImg.src = event.target.result;
            }
            
            showToast("Profile picture updated", "success");
            
            // Save to Firebase if user is logged in
            const user = auth.currentUser;
            if (user) {
                update(ref(db, 'users/' + user.uid), {
                    photoURL: event.target.result,
                    updatedAt: Date.now()
                });
            }
        }
        reader.readAsDataURL(file);
    }
});
