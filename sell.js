// sell.js (No Firebase Storage needed)
import { auth, db } from "./firebase-config.js";
import { ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;

// Initialize sell page
export function initializeSellPage() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            setupFormSubmission();
        } else {
            window.location.href = "login.html";
        }
    });
}

// Setup form submission
function setupFormSubmission() {
    const sellForm = document.querySelector('.sell-form');
    sellForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = sellForm.querySelector('.btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Listing...';
        submitBtn.disabled = true;
        
        try {
            // Get user data to determine college
            const userRef = ref(db, `users/${currentUser.uid}`);
            const userSnapshot = await get(userRef);
            
            if (!userSnapshot.exists()) {
                throw new Error("User data not found. Please complete your profile first.");
            }
            
            const userData = userSnapshot.val();
            
            // Convert images to Base64 (no storage needed)
            const imageBase64Strings = await convertImagesToBase64();
            
            // Prepare product data
            const productData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('category').value,
                price: parseInt(document.getElementById('price').value),
                description: document.getElementById('description').value,
                location: `${document.getElementById('block').value}, ${document.getElementById('room').value}`,
                sellerId: currentUser.uid,
                sellerName: userData.name || 'Unknown Seller',
                college: userData.college || 'Unknown College',
                status: 'available',
                createdAt: Date.now(),
                views: 0,
                messages: 0,
                images: imageBase64Strings // Store as Base64 instead of URLs
            };
            
            // Save product to Firebase
            const productsRef = ref(db, 'products');
            const newProductRef = push(productsRef);
            await set(newProductRef, productData);
            
            // Also add to user's listings
            const userListingsRef = ref(db, `users/${currentUser.uid}/listings/${newProductRef.key}`);
            await set(userListingsRef, {
                productId: newProductRef.key,
                listedAt: Date.now()
            });
            
            alert('Product listed successfully!');
            window.location.href = 'listings.html';
            
        } catch (error) {
            console.error("Error listing product:", error);
            alert('Error listing product: ' + error.message);
            
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Convert images to Base64 strings
function convertImagesToBase64() {
    return new Promise((resolve, reject) => {
        const imageUpload = document.getElementById('image-upload');
        const files = imageUpload.files;
        const base64Promises = [];
        
        if (files.length === 0) {
            resolve([]);
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Only process image files and limit size to 1MB to avoid large database entries
            if (!file.type.startsWith('image/')) {
                alert('Please upload only image files');
                reject(new Error('Invalid file type'));
                return;
            }
            
            if (file.size > 1024 * 1024) { // 1MB limit
                alert('Please upload images smaller than 1MB');
                reject(new Error('File too large'));
                return;
            }
            
            const promise = new Promise((resolveFile, rejectFile) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolveFile(e.target.result); // This is the Base64 string
                };
                reader.onerror = (error) => rejectFile(error);
                reader.readAsDataURL(file);
            });
            
            base64Promises.push(promise);
        }
        
        Promise.all(base64Promises)
            .then(resolve)
            .catch(reject);
    });
}

// Make functions globally accessible
window.toggleProfileMenu = function() {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.classList.toggle("active");
};
