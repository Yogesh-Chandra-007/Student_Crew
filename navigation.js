// navigation.js
import { auth, db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Function to load navigation with user data
export function initializeNavigation() {
    const navProfileImg = document.getElementById("navProfileImg");
    if (!navProfileImg) return;
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Get user data from Realtime Database
            get(ref(db, 'users/' + user.uid)).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    
                    // Update profile image if available
                    if (userData.photoURL) {
                        navProfileImg.src = userData.photoURL;
                    } else if (user.photoURL) {
                        navProfileImg.src = user.photoURL;
                    }
                }
            }).catch((error) => {
                console.error("Error getting user data:", error);
            });
        }
    });
}

// Make functions globally accessible
window.toggleProfileMenu = function() {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.classList.toggle("active");
};

// Close profile menu when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.getElementById('profileMenu');
    const profileBtn = document.querySelector('.nav-profile');
    if (profileBtn && profileMenu && !profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
        profileMenu.classList.remove('active');
    }
});