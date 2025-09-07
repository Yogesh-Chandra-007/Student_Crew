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
const infoHostel = document.getElementById("infoHostel");
const editProfileBtn = document.getElementById("editProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");

// Input elements
const inputEmail = document.getElementById("inputEmail");
const inputPhone = document.getElementById("inputPhone");
const inputCollege = document.getElementById("inputCollege");
const inputCourse = document.getElementById("inputCourse");
const inputYear = document.getElementById("inputYear");
const inputBlock = document.getElementById("inputBlock");
const inputRoom = document.getElementById("inputRoom");
const hostelInputs = document.querySelector(".hostel-inputs");

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

// Close profile menu when clicking outside
document.addEventListener('click', function(event) {
  const profileMenu = document.getElementById('profileMenu');
  const profileBtn = document.querySelector('.nav-profile');
  if (!profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
    profileMenu.classList.remove('active');
  }
});

// Logout function
function logout() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Logout error:", error);
    showToast("Error signing out", "error");
  });
}

// Toggle edit mode
function toggleEditMode() {
  isEditMode = !isEditMode;
  
  const infoItems = document.querySelectorAll('.info-item');
  if (isEditMode) {
    // Switch to edit mode
    infoItems.forEach(item => {
      item.classList.add('edit-mode');
    });
    
    // Show hostel inputs
    hostelInputs.style.display = 'block';
    
    editProfileBtn.style.display = 'none';
    saveProfileBtn.style.display = 'flex';
  } else {
    // Switch to view mode
    infoItems.forEach(item => {
      item.classList.remove('edit-mode');
    });
    
    // Hide hostel inputs
    hostelInputs.style.display = 'none';
    
    editProfileBtn.style.display = 'flex';
    saveProfileBtn.style.display = 'none';
    
    // Reset values from inputs
    updateViewFromInputs();
  }
}

// Update view from input values
function updateViewFromInputs() {
  infoEmail.textContent = inputEmail.value;
  infoPhone.textContent = inputPhone.value;
  infoCollege.textContent = inputCollege.options[inputCollege.selectedIndex].text;
  infoCourse.textContent = inputCourse.value;
  
  // Format year text
  const yearText = inputYear.value === "1" ? "1st Year" : 
                  inputYear.value === "2" ? "2nd Year" :
                  inputYear.value === "3" ? "3rd Year" : "4th Year";
  infoYear.textContent = yearText;
  
  // Format hostel information
  const blockText = inputBlock.value ? inputBlock.value : "";
  const roomText = inputRoom.value ? `Room ${inputRoom.value}` : "";
  const separator = (blockText && roomText) ? ", " : "";
  infoHostel.textContent = blockText + separator + roomText || "Not provided";
}

// Save profile to Firebase
function saveProfile() {
  spinner.style.display = "block";
  
  const user = auth.currentUser;
  if (!user) {
    showToast("You must be logged in to save changes", "error");
    spinner.style.display = "none";
    return;
  }

  const updates = {
    name: profileName.textContent,
    email: inputEmail.value,
    phone: inputPhone.value,
    college: inputCollege.value,
    course: inputCourse.value,
    year: inputYear.value,
    hostel: {
      block: inputBlock.value,
      room: inputRoom.value
    },
    updatedAt: Date.now()
  };

  // Update Firebase database
  update(ref(db, 'users/' + user.uid), updates)
    .then(() => {
      spinner.style.display = "none";
      showToast("Profile updated successfully!");
      
      // Update view values
      updateViewFromInputs();
      
      // Update college in profile header
      profileCollege.textContent = inputCollege.options[inputCollege.selectedIndex].text;
      
      // Exit edit mode
      isEditMode = false;
      toggleEditMode();
    })
    .catch((error) => {
      spinner.style.display = "none";
      console.error("Error updating profile:", error);
      showToast("Error updating profile: " + error.message, "error");
    });
}

// Load user data from Firebase
function loadUserData() {
  spinner.style.display = "block";
  
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Reference to user data in database
  const userRef = ref(db, "users/" + user.uid);
  
  get(userRef)
    .then((snapshot) => {
      spinner.style.display = "none";
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // Update profile information
        profileName.textContent = userData.name || user.displayName || "Student";
        profileCollege.textContent = userData.college || "No college selected";
        
        // Update stats
        coinsCount.textContent = userData.coins || 0;
        friendsCount.textContent = userData.friends ? Object.keys(userData.friends).length : 0;
        listingsCount.textContent = userData.listings ? Object.keys(userData.listings).length : 0;
        
        // Update personal information
        infoEmail.textContent = userData.email || user.email || "Not provided";
        infoPhone.textContent = userData.phone || "Not provided";
        infoCollege.textContent = userData.college || "Not selected";
        infoCourse.textContent = userData.course || "Not provided";
        
        // Format year text
        if (userData.year) {
          const yearText = userData.year === "1" ? "1st Year" : 
                          userData.year === "2" ? "2nd Year" :
                          userData.year === "3" ? "3rd Year" : "4th Year";
          infoYear.textContent = yearText;
        } else {
          infoYear.textContent = "Not provided";
        }
        
        // Format hostel information
        if (userData.hostel) {
          const blockText = userData.hostel.block || "";
          const roomText = userData.hostel.room ? `Room ${userData.hostel.room}` : "";
          const separator = (blockText && roomText) ? ", " : "";
          infoHostel.textContent = blockText + separator + roomText || "Not provided";
        } else {
          infoHostel.textContent = "Not provided";
        }
        
        // Set input values
        inputEmail.value = userData.email || user.email || "";
        inputPhone.value = userData.phone || "";
        inputCourse.value = userData.course || "";
        inputYear.value = userData.year || "1";
        inputBlock.value = userData.hostel?.block || "";
        inputRoom.value = userData.hostel?.room || "";
        
        // Select the correct college
        if (userData.college) {
          for (let i = 0; i < inputCollege.options.length; i++) {
            if (inputCollege.options[i].value === userData.college) {
              inputCollege.selectedIndex = i;
              break;
            }
          }
        }
        
        // Update profile picture if available
        if (userData.photoURL) {
          profileAvatar.src = userData.photoURL;
          navProfileImg.src = userData.photoURL;
        } else if (user.photoURL) {
          profileAvatar.src = user.photoURL;
          navProfileImg.src = user.photoURL;
        }
      } else {
        // If no user data exists, use auth data
        profileName.textContent = user.displayName || "Student";
        infoEmail.textContent = user.email || "Not provided";
        inputEmail.value = user.email || "";
        
        // Set default values for other fields
        infoPhone.textContent = "Not provided";
        infoCollege.textContent = "Not selected";
        infoCourse.textContent = "Not provided";
        infoYear.textContent = "Not provided";
        infoHostel.textContent = "Not provided";
        
        showToast("No user data found. Please update your profile.", "error");
      }
    })
    .catch((error) => {
      spinner.style.display = "none";
      console.error("Error loading user data:", error);
      showToast("Error loading profile data", "error");
    });
}

// Avatar upload preview
const avatarUpload = document.getElementById('avatar-upload');

avatarUpload.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      profileAvatar.src = event.target.result;
      navProfileImg.src = event.target.result;
      
      // Here you would typically upload to Firebase Storage
      // and update the user's profile picture URL in the database
      showToast("Profile picture updated", "success");
    }
    reader.readAsDataURL(file);
  }
});

// Check auth state and load data
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadUserData();
  } else {
    window.location.href = "login.html";
  }
});

// Make functions available globally for HTML onclick attributes
window.toggleProfileMenu = toggleProfileMenu;
window.logout = logout;
window.toggleEditMode = toggleEditMode;
window.saveProfile = saveProfile;
