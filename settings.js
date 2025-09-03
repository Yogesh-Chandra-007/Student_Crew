// settings.js
import { auth, db } from "./firebase-config.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged, updateEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const storage = getStorage();
const avatarUpload = document.getElementById("avatar-upload");
const profilePreview = document.getElementById("profile-preview");
const settingsForm = document.querySelector(".settings-form");
let newProfilePicFile = null;

// Preview profile picture
avatarUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    newProfilePicFile = file;
    const reader = new FileReader();
    reader.onload = (event) => (profilePreview.src = event.target.result);
    reader.readAsDataURL(file);
  }
});

// Load data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const snapshot = await get(ref(db, "users/" + user.uid));
    if (snapshot.exists()) {
      const data = snapshot.val();
      document.getElementById("full-name").value = data.fullName || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("phone").value = data.phone || "";
      document.getElementById("college").value = data.college || "";
      document.getElementById("course").value = data.course || "";
      document.getElementById("year").value = data.year || "1";
      document.getElementById("block").value = data.hostel?.block || "";
      document.getElementById("room").value = data.hostel?.room || "";
      if (data.profilePic) profilePreview.src = data.profilePic;
    }
  }
});

// Save changes
settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("No user logged in.");

  const fullName = document.getElementById("full-name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const college = document.getElementById("college").value;
  const course = document.getElementById("course").value;
  const year = document.getElementById("year").value;
  const block = document.getElementById("block").value;
  const room = document.getElementById("room").value;

  try {
    let profilePicUrl = null;

    // Upload new pic
    if (newProfilePicFile) {
      const fileRef = storageRef(storage, `profilePics/${user.uid}`);
      await uploadBytes(fileRef, newProfilePicFile);
      profilePicUrl = await getDownloadURL(fileRef);
    }

    // Update auth email
    if (email !== user.email) {
      await updateEmail(user, email);
    }

    // Update DB
    await update(ref(db, "users/" + user.uid), {
      fullName,
      phone,
      college,
      course,
      year,
      hostel: { block, room },
      ...(profilePicUrl && { profilePic: profilePicUrl })
    });

    alert("Profile updated successfully!");
    window.location.href = "profile.html";
  } catch (err) {
    console.error("Error:", err);
    alert("Update failed: " + err.message);
  }
});

