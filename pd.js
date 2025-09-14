// pd.js
import { auth, db } from "./firebase-config.js";
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { createChat } from "./inbox.js";

let currentUser = null;
let currentProduct = null;

// Initialize product details
export function initializeProductDetails() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadProductData();
            setupEventListeners();
        } else {
            window.location.href = "login.html";
        }
    });
}

// Load product data from URL parameters or Firebase
function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        const productRef = ref(db, `products/${productId}`);
        
        get(productRef).then((snapshot) => {
            if (snapshot.exists()) {
                currentProduct = {
                    id: productId,
                    ...snapshot.val()
                };
                displayProductDetails();
            } else {
                alert("Product not found");
                window.history.back();
            }
        }).catch((error) => {
            console.error("Error loading product:", error);
            alert("Error loading product details");
        });
    } else {
        alert("No product specified");
        window.history.back();
    }
}

// Display product details on the page
function displayProductDetails() {
    if (!currentProduct) return;
    
    // Check if user is from the same college
    get(ref(db, `users/${currentUser.uid}`)).then((userSnapshot) => {
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            
            if (userData.college !== currentProduct.college) {
                alert("This product is only available to students from " + currentProduct.college);
                window.history.back();
                return;
            }
            
            // Update page content with product details
            document.querySelector('.main-image img').src = currentProduct.images?.[0] || 'https://images.unsplash.com/photo-1588514912908-8f5891714f8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            document.querySelector('h1').textContent = currentProduct.name;
            document.querySelector('.category').textContent = currentProduct.category;
            document.querySelector('.price').textContent = `₹${currentProduct.price}`;
            document.querySelector('.product-description p').textContent = currentProduct.description;
            
            // Update thumbnails if available
            if (currentProduct.images && currentProduct.images.length > 0) {
                const thumbnailGrid = document.querySelector('.thumbnail-grid');
                thumbnailGrid.innerHTML = '';
                
                currentProduct.images.forEach((image, index) => {
                    const thumbnail = document.createElement('div');
                    thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}">`;
                    thumbnail.addEventListener('click', () => updateMainImage(image));
                    thumbnailGrid.appendChild(thumbnail);
                });
            }
            
            // Load seller information
            loadSellerInfo(currentProduct.sellerId);
            
        }
    }).catch((error) => {
        console.error("Error verifying user college:", error);
    });
}

// Load seller information
function loadSellerInfo(sellerId) {
    const sellerRef = ref(db, `users/${sellerId}`);
    
    get(sellerRef).then((snapshot) => {
        if (snapshot.exists()) {
            const sellerData = snapshot.val();
            
            document.querySelector('.seller-avatar img').src = sellerData.photoURL || 'https://randomuser.me/api/portraits/men/32.jpg';
            document.querySelector('.seller-details h4').textContent = sellerData.name || 'Seller';
            document.querySelector('.college').textContent = sellerData.college || 'Unknown College';
            
            // Update contact info
            const contactInfo = document.querySelector('.seller-contact');
            contactInfo.innerHTML = `
                <p><i class="fas fa-map-marker-alt"></i> ${currentProduct.location || 'Not specified'}</p>
                <p><i class="fas fa-envelope"></i> ${sellerData.email || 'Email not available'}</p>
                ${sellerData.phone ? `<p><i class="fas fa-phone"></i> ${sellerData.phone}</p>` : ''}
            `;
            
        } else {
            console.error("Seller not found");
        }
    }).catch((error) => {
        console.error("Error loading seller info:", error);
    });
}

// Update main image when thumbnail is clicked
function updateMainImage(imageUrl) {
    document.querySelector('.main-image img').src = imageUrl;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
    // Chat with seller button
    document.querySelector('.btn-primary').addEventListener('click', async function() {
        if (!currentProduct) return;
        
        try {
            const chatId = await createChat(
                currentProduct.id, 
                currentProduct.sellerId, 
                currentProduct.name
            );
            
            if (chatId) {
                window.location.href = `inbox.html?chat=${chatId}`;
            }
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Error starting chat with seller");
        }
    });
    
    // Back button
    document.querySelector('.btn-secondary').addEventListener('click', function() {
        window.history.back();
    });
    
    // Thumbnail click handlers
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.addEventListener('click', function() {
            const thumbImg = this.querySelector('img');
            document.querySelector('.main-image img').src = thumbImg.src.replace('200', '800');
            
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeProductDetails();
});