// sell.js
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
                images: await uploadImages() // This would handle image uploads
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

// Handle image uploads (simplified version - would need proper storage implementation)
async function uploadImages() {
    const imageUpload = document.getElementById('image-upload');
    const files = imageUpload.files;
    const imageUrls = [];
    
    // In a real implementation, you would upload to Firebase Storage
    // For now, we'll just use placeholder URLs
    for (let i = 0; i < files.length; i++) {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create a blob URL for preview (in real app, upload to Firebase Storage)
        const blobUrl = URL.createObjectURL(files[i]);
        imageUrls.push(blobUrl);
    }
    
    return imageUrls;
}

// Make functions globally accessible
window.toggleProfileMenu = function() {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.classList.toggle("active");
};