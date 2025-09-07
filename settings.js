import { auth, db } from "./firebase-config.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged, updateEmail, updateProfile, updatePassword, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const storage = getStorage();
const toast = document.getElementById("toast");
let currentUser = null;
let newProfilePicFile = null;

// Toast
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = "show";
  setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// Tabs
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// Profile picture preview
document.getElementById("avatar-upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    newProfilePicFile = file;
    const reader = new FileReader();
    reader.onload = ev => document.getElementById("profile-preview").src = ev.target.result;
    reader.readAsDataURL(file);
  }
});

// Load user data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  const snapshot = await get(ref(db, "users/" + user.uid));
  if (snapshot.exists()) {
    const data = snapshot.val();
    document.getElementById("full-name").value = data.name || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("college").value = data.college || "";
    document.getElementById("course").value = data.course || "";
    document.getElementById("year").value = data.year || "1";
    document.getElementById("block").value = data.hostel?.block || "";
    document.getElementById("room").value = data.hostel?.room || "";
    if (data.photolRL) document.getElementById("profile-preview").src = data.photolRL;
    // notifications
    document.getElementById("email-notifications").checked = data.settings?.emailNotifications || false;
    document.getElementById("sms-notifications").checked = data.settings?.smsNotifications || false;
    // privacy
    document.getElementById("show-email").checked = data.settings?.showEmail || false;
    document.getElementById("show-phone").checked = data.settings?.showPhone || false;
  }
});

// Save profile
document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const name = document.getElementById("full-name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const college = document.getElementById("college").value;
  const course = document.getElementById("course").value;
  const year = document.getElementById("year").value;
  const block = document.getElementById("block").value;
  const room = document.getElementById("room").value;

  let photoURL = currentUser.photoURL;
  if (newProfilePicFile) {
    const fileRef = storageRef(storage, `profilePics/${currentUser.uid}`);
    await uploadBytes(fileRef, newProfilePicFile);
    photoURL = await getDownloadURL(fileRef);
  }

  await updateProfile(currentUser, { displayName: name, photoURL: photoURL });
  if (email !== currentUser.email) await updateEmail(currentUser, email);

  await set(ref(db, "users/" + currentUser.uid), {
    uid: currentUser.uid,
    name, email, phone, college, course, year,
    hostel: { block, room },
    photolRL: photoURL,
    settings: {
      emailNotifications: document.getElementById("email-notifications").checked,
      smsNotifications: document.getElementById("sms-notifications").checked,
      showEmail: document.getElementById("show-email").checked,
      showPhone: document.getElementById("show-phone").checked
    },
    updatedAt: Date.now()
  });

  showToast("Profile updated successfully!");
});

// Password change
document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newPass = document.getElementById("new-password").value;
  try {
    await updatePassword(currentUser, newPass);
    showToast("Password updated!");
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
});

// Notifications
document.getElementById("notifications-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await update(ref(db, "users/" + currentUser.uid + "/settings"), {
    emailNotifications: document.getElementById("email-notifications").checked,
    smsNotifications: document.getElementById("sms-notifications").checked
  });
  showToast("Notifications updated!");
});

// Privacy
document.getElementById("privacy-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await update(ref(db, "users/" + currentUser.uid + "/settings"), {
    showEmail: document.getElementById("show-email").checked,
    showPhone: document.getElementById("show-phone").checked
  });
  showToast("Privacy updated!");
});

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// Delete Account
document.getElementById("delete-btn").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
  await remove(ref(db, "users/" + currentUser.uid));
  await deleteUser(currentUser);
  window.location.href = "signup.html";
});
