// settings.js - Complete Firebase Integration
import { auth, db } from "./firebase-config.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { 
  onAuthStateChanged, 
  updateEmail, 
  updateProfile, 
  updatePassword, 
  signOut, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, get, set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const storage = getStorage();
const toast = document.getElementById("toast");
let currentUser = null;
let newProfilePicFile = null;
let userData = null;

// Toast notification system
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = type === "error" ? "show error" : "show";
  setTimeout(() => { 
    toast.className = toast.className.replace("show", ""); 
  }, 3000);
}

// Initialize settings page
function initSettings() {
  // Tab switching functionality
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // Profile picture preview
  document.getElementById("avatar-upload").addEventListener("change", handleProfilePictureChange);

  // Form submissions
  document.getElementById("profile-form").addEventListener("submit", handleProfileUpdate);
  document.getElementById("password-form").addEventListener("submit", handlePasswordUpdate);
  document.getElementById("notifications-form").addEventListener("submit", handleNotificationsUpdate);
  document.getElementById("privacy-form").addEventListener("submit", handlePrivacyUpdate);
  
  // Account actions
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
  document.getElementById("delete-btn").addEventListener("click", handleAccountDeletion);
  document.getElementById("export-data-btn").addEventListener("click", handleDataExport);
  document.getElementById("reset-password-btn").addEventListener("click", handlePasswordReset);

  // Load user data
  loadUserData();
}

// Handle profile picture change
function handleProfilePictureChange(e) {
  const file = e.target.files[0];
  if (file) {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showToast("Please select an image file", "error");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast("Image must be less than 5MB", "error");
      return;
    }
    
    newProfilePicFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById("profile-preview").src = ev.target.result;
      document.getElementById("profile-preview").style.display = "block";
    };
    reader.readAsDataURL(file);
  }
}

// Load user data from Firebase
function loadUserData() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    
    currentUser = user;
    
    try {
      // Set up real-time listener for user data
      const userRef = ref(db, "users/" + user.uid);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          userData = snapshot.val();
          populateUserData(user, userData);
        } else {
          // Initialize user data if it doesn't exist
          initializeUserData(user);
        }
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      showToast("Error loading profile data", "error");
    }
  });
}

// Populate form fields with user data
function populateUserData(user, data) {
  // Update profile image in navigation
  if (user.photoURL) {
    document.getElementById("nav-profile-img").src = user.photoURL;
    document.getElementById("profile-preview").src = user.photoURL;
    document.getElementById("profile-preview").style.display = "block";
  }
  
  // Fill form fields
  document.getElementById("full-name").value = data.name || user.displayName || "";
  document.getElementById("email").value = data.email || user.email || "";
  document.getElementById("phone").value = data.phone || "";
  document.getElementById("college").value = data.college || "";
  document.getElementById("course").value = data.course || "";
  document.getElementById("year").value = data.year || "1";
  document.getElementById("block").value = data.hostel?.block || "";
  document.getElementById("room").value = data.hostel?.room || "";
  
  // Notifications settings
  document.getElementById("email-notifications").checked = data.settings?.emailNotifications !== false;
  document.getElementById("sms-notifications").checked = data.settings?.smsNotifications || false;
  document.getElementById("push-notifications").checked = data.settings?.pushNotifications !== false;
  
  // Privacy settings
  document.getElementById("show-email").checked = data.settings?.showEmail || false;
  document.getElementById("show-phone").checked = data.settings?.showPhone || false;
  document.getElementById("show-profile").checked = data.settings?.showProfile !== false;
  
  // Account info
  document.getElementById("user-id").textContent = user.uid;
  if (data.createdAt) {
    document.getElementById("account-created").textContent = new Date(data.createdAt).toLocaleDateString();
  }
  if (data.lastLogin) {
    document.getElementById("last-login").textContent = new Date(data.lastLogin).toLocaleString();
  }
}

// Initialize user data if it doesn't exist
async function initializeUserData(user) {
  try {
    await set(ref(db, "users/" + user.uid), {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      createdAt: Date.now(),
      lastLogin: Date.now(),
      settings: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        showEmail: false,
        showPhone: false,
        showProfile: true
      }
    });
  } catch (error) {
    console.error("Error initializing user data:", error);
    showToast("Error initializing profile data", "error");
  }
}

// Handle profile update
async function handleProfileUpdate(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const saveBtn = document.getElementById("profile-save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  
  try {
    const name = document.getElementById("full-name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const college = document.getElementById("college").value;
    const course = document.getElementById("course").value;
    const year = document.getElementById("year").value;
    const block = document.getElementById("block").value;
    const room = document.getElementById("room").value;

    let photoURL = currentUser.photoURL;
    
    // Upload new profile picture if selected
    if (newProfilePicFile) {
      const fileRef = storageRef(storage, `profilePics/${currentUser.uid}`);
      await uploadBytes(fileRef, newProfilePicFile);
      photoURL = await getDownloadURL(fileRef);
      newProfilePicFile = null;
    }

    // Update profile in Firebase Auth
    await updateProfile(currentUser, { displayName: name, photoURL: photoURL });
    
    // Update email if changed (with verification)
    if (email !== currentUser.email) {
      await verifyBeforeUpdateEmail(currentUser, email);
      showToast("Verification email sent. Please verify your new email address.");
    }

    // Update user data in database
    await update(ref(db, "users/" + currentUser.uid), {
      name,
      email,
      phone,
      college,
      course,
      year,
      hostel: { block, room },
      photoURL: photoURL,
      settings: {
        emailNotifications: document.getElementById("email-notifications").checked,
        smsNotifications: document.getElementById("sms-notifications").checked,
        pushNotifications: document.getElementById("push-notifications").checked,
        showEmail: document.getElementById("show-email").checked,
        showPhone: document.getElementById("show-phone").checked,
        showProfile: document.getElementById("show-profile").checked
      },
      updatedAt: Date.now()
    });

    // Update profile image in navigation
    document.getElementById("nav-profile-img").src = photoURL;
    
    showToast("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    showToast("Error updating profile: " + error.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Handle password update
async function handlePasswordUpdate(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const saveBtn = document.getElementById("password-save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Updating...";
  
  try {
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast("New passwords don't match", "error");
      return;
    }
    
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    
    // Reauthenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update password
    await updatePassword(currentUser, newPassword);
    
    // Clear form
    document.getElementById("current-password").value = "";
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    
    showToast("Password updated successfully!");
  } catch (error) {
    console.error("Error updating password:", error);
    
    if (error.code === 'auth/wrong-password') {
      showToast("Current password is incorrect", "error");
    } else if (error.code === 'auth/requires-recent-login') {
      showToast("Please reauthenticate to update your password", "error");
    } else {
      showToast("Error updating password: " + error.message, "error");
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Handle password reset
async function handlePasswordReset() {
  if (!currentUser || !currentUser.email) {
    showToast("No email associated with this account", "error");
    return;
  }
  
  try {
    await sendPasswordResetEmail(auth, currentUser.email);
    showToast("Password reset email sent. Check your inbox.");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    showToast("Error sending reset email: " + error.message, "error");
  }
}

// Handle notifications update
async function handleNotificationsUpdate(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const saveBtn = document.getElementById("notifications-save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  
  try {
    await update(ref(db, "users/" + currentUser.uid + "/settings"), {
      emailNotifications: document.getElementById("email-notifications").checked,
      smsNotifications: document.getElementById("sms-notifications").checked,
      pushNotifications: document.getElementById("push-notifications").checked
    });
    
    showToast("Notification settings updated!");
  } catch (error) {
    console.error("Error updating notifications:", error);
    showToast("Error updating notifications: " + error.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Handle privacy update
async function handlePrivacyUpdate(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const saveBtn = document.getElementById("privacy-save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  
  try {
    await update(ref(db, "users/" + currentUser.uid + "/settings"), {
      showEmail: document.getElementById("show-email").checked,
      showPhone: document.getElementById("show-phone").checked,
      showProfile: document.getElementById("show-profile").checked
    });
    
    showToast("Privacy settings updated!");
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    showToast("Error updating privacy settings: " + error.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Handle data export
async function handleDataExport() {
  if (!currentUser) return;
  
  try {
    const snapshot = await get(ref(db, "users/" + currentUser.uid));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      
      // Remove sensitive data that shouldn't be exported
      const exportData = { ...userData };
      delete exportData.settings;
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `studentcrew-data-${currentUser.uid}-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showToast("Data exported successfully!");
    } else {
      showToast("No data available to export", "error");
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    showToast("Error exporting data: " + error.message, "error");
  }
}

// Handle logout
async function handleLogout() {
  try {
    // Update last login time before signing out
    if (currentUser) {
      await update(ref(db, "users/" + currentUser.uid + "/lastLogin"), Date.now());
    }
    
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error signing out:", error);
    showToast("Error signing out: " + error.message, "error");
  }
}

// Handle account deletion
async function handleAccountDeletion() {
  if (!confirm("Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.")) {
    return;
  }
  
  const password = prompt("Please enter your password to confirm account deletion:");
  if (!password) return;
  
  try {
    // Reauthenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Delete user's profile picture from storage if it exists
    if (currentUser.photoURL && currentUser.photoURL.includes('profilePics')) {
      try {
        const fileRef = storageRef(storage, `profilePics/${currentUser.uid}`);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.warn("Could not delete profile picture:", storageError);
      }
    }
    
    // Delete user's listings and other data (you would need to implement this based on your database structure)
    // await deleteUserListings(currentUser.uid);
    
    // Delete user data from database
    await remove(ref(db, "users/" + currentUser.uid));
    
    // Delete user from authentication
    await deleteUser(currentUser);
    
    showToast("Account deleted successfully");
    setTimeout(() => {
      window.location.href = "signup.html";
    }, 2000);
  } catch (error) {
    console.error("Error deleting account:", error);
    
    if (error.code === 'auth/wrong-password') {
      showToast("Incorrect password. Account deletion canceled.", "error");
    } else {
      showToast("Error deleting account: " + error.message, "error");
    }
  }
}

// Initialize the settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);

// Profile menu functionality
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
