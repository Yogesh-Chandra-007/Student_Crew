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
        
        // Update profile header
        profileName.textContent = data.fullName || "Student";
        profileCollege.textContent = data.college || "No college selected";
        
        // Set profile picture
        if (data.profilePic) {
          profileAvatar.src = data.profilePic;
        }
        
        // Update profile details
        emailField.textContent = user.email || data.email || "Not provided";
        phoneField.textContent = data.phone || "Not provided";
        collegeField.textContent = data.college || "Not selected";
        courseField.textContent = data.course || "Not provided";
        yearField.textContent = data.year ? `${data.year} Year` : "Not provided";
        
        // Format hostel information
        if (data.hostel) {
          hostelField.textContent = `${data.hostel.block || ""}, Room ${data.hostel.room || ""}`.trim();
          if (hostelField.textContent === ", Room ") {
            hostelField.textContent = "Not provided";
          }
        } else {
          hostelField.textContent = "Not provided";
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  } else {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
  }
});
