// profile.js
import { auth, db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elements
const profileName = document.querySelector(".profile-info h1");
const profileCollege = document.querySelector(".profile-info .college");
const profileAvatar = document.querySelector(".profile-avatar img");

// Get all profile info elements
const emailField = document.querySelector(".info-item:nth-child(1) .value");
const phoneField = document.querySelector(".info-item:nth-child(2) .value");
const collegeField = document.querySelector(".info-item:nth-child(3) .value");
const courseField = document.querySelector(".info-item:nth-child(4) .value");
const yearField = document.querySelector(".info-item:nth-child(5) .value");
const hostelField = document.querySelector(".info-item:nth-child(6) .value");

// Load user data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const snapshot = await get(ref(db, "users/" + user.uid));
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Profile data:", data);
        
        // Update profile header
        profileName.textContent = data.name || user.displayName || "Student";
        profileCollege.textContent = data.college || "No college selected";
        
        // Set profile picture
        if (data.photolRL) {
          profileAvatar.src = data.photolRL;
        } else if (user.photoURL) {
          profileAvatar.src = user.photoURL;
        } else {
          profileAvatar.src = "https://randomuser.me/api/portraits/men/32.jpg";
        }
        
        // Update profile details
        emailField.textContent = data.email || user.email || "Not provided";
        phoneField.textContent = data.phone || "Not provided";
        collegeField.textContent = data.college || "Not selected";
        courseField.textContent = data.course || "Not provided";
        yearField.textContent = data.year ? `${data.year} Year` : "Not provided";
        
        // Format hostel information
        if (data.hostel) {
          const hostelText = `${data.hostel.block || ""}${data.hostel.block && data.hostel.room ? ", " : ""}Room ${data.hostel.room || ""}`.trim();
          hostelField.textContent = hostelText || "Not provided";
        } else {
          hostelField.textContent = "Not provided";
        }
      } else {
        // If no user data exists in database, show auth data
        profileName.textContent = user.displayName || "Student";
        emailField.textContent = user.email || "Not provided";
        
        // Set default values for other fields
        phoneField.textContent = "Not provided";
        collegeField.textContent = "Not selected";
        courseField.textContent = "Not provided";
        yearField.textContent = "Not provided";
        hostelField.textContent = "Not provided";
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  } else {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
  }
});
