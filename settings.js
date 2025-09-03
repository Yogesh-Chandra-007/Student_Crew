// settings.js
import { auth, db } from "./firebase-config.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged, updateEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const storage = getStorage();
const avatarUpload = document.getElementById("avatar-upload");
const profilePreview = document.getElementById("profile-preview");
const settingsForm = document.querySelector(".settings-form");
const spinner = document.getElementById("spinner");
const toast = document.getElementById("toast");

let newProfilePicFile = null;

// Show toast
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = "toast " + type + " show";
  setTimeout(() => {
    toast.className = "toast " + type;
  }, 3000);
}

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

// Load user data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const snapshot = await get(ref(db, "users/" + user.uid));
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Loaded user data:", data);
        
        // Populate form fields with user data (using correct field names)
        document.getElementById("full-name").value = data.name || ""; // Changed from fullName to name
        document.getElementById("email").value = data.email || user.email || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("college").value = data.college || "";
        document.getElementById("course").value = data.course || "";
        document.getElementById("year").value = data.year || "1";
        document.getElementById("block").value = data.hostel?.block || "";
        document.getElementById("room").value = data.hostel?.room || "";
        
        // Set profile picture if available
        if (data.photolRL) { // Changed from profilePic to photolRL
          profilePreview.src = data.photolRL;
        } else if (data.photoURL) {
          profilePreview.src = data.photoURL;
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showToast("Error loading profile data", "error");
    }
  } else {
    window.location.href = "login.html";
  }
});

// Save profile changes
settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  
  if (!user) {
    showToast("No user logged in!", "error");
    return;
  }

  // Get form values
  const name = document.getElementById("full-name").value; // Changed from fullName to name
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const college = document.getElementById("college").value;
  const course = document.getElementById("course").value;
  const year = document.getElementById("year").value;
  const block = document.getElementById("block").value;
  const room = document.getElementById("room").value;

  try {
    spinner.style.display = "block";
    let photoURL = null;

    // Upload new profile picture if selected
    if (newProfilePicFile) {
      try {
        const fileRef = storageRef(storage, `profilePics/${user.uid}`);
        await uploadBytes(fileRef, newProfilePicFile);
        photoURL = await getDownloadURL(fileRef);
      } catch (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
        showToast("Error uploading profile picture", "error");
      }
    }

    // Update Firebase Auth profile
    await updateProfile(user, { 
      displayName: name,
      ...(photoURL && { photoURL: photoURL })
    });
    
    // Update email if changed
    if (email !== user.email) {
      await updateEmail(user, email);
    }

    // Prepare update data for database (using correct field names)
    const updateData = {
      name: name, // Changed from fullName to name
      email: email,
      phone: phone,
      college: college,
      course: course,
      year: year,
      hostel: { block, room },
      updatedAt: Date.now()
    };
    
    // Add profile picture URL if available
    if (photoURL) {
      updateData.photolRL = photoURL; // Changed from profilePic to photolRL
    }

    console.log("Updating database with:", updateData);
    
    // Update database
    await update(ref(db, "users/" + user.uid), updateData);

    spinner.style.display = "none";
    showToast("Profile updated successfully!", "success");

    // Redirect to profile page after a short delay
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1500);
  } catch (err) {
    spinner.style.display = "none";
    console.error("Error updating profile:", err);
    
    // Handle specific error cases
    if (err.code === 'auth/requires-recent-login') {
      showToast("Please log in again to update your email", "error");
    } else {
      showToast("Update failed: " + err.message, "error");
    }
  }
});
