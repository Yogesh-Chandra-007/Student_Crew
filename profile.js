// profile.js
import { auth, db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elements
const profileName = document.querySelector(".profile-info h1");
const profileCollege = document.querySelector(".profile-info .college");
const profileAvatar = document.querySelector(".profile-avatar img");

const emailField = document.querySelector(".info-item .value.email");
const phoneField = document.querySelector(".info-item .value.phone");
const collegeField = document.querySelector(".info-item .value.college");
const courseField = document.querySelector(".info-item .value.course");
const yearField = document.querySelector(".info-item .value.year");
const hostelField = document.querySelector(".info-item .value.hostel");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const snapshot = await get(ref(db, "users/" + user.uid));
    if (snapshot.exists()) {
      const data = snapshot.val();

      profileName.textContent = data.fullName || "Student";
      profileCollege.textContent = data.college || "";
      profileAvatar.src = data.profilePic || "default-avatar.png";

      emailField.textContent = user.email || "";
      phoneField.textContent = data.phone || "";
      collegeField.textContent = data.college || "";
      courseField.textContent = data.course || "";
      yearField.textContent = data.year ? `${data.year} Year` : "";
      hostelField.textContent = data.hostel ? `${data.hostel.block}, Room ${data.hostel.room}` : "";
    }
  }
});
