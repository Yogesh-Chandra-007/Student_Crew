// listings.js (with Base64 image support)
import { auth, db } from "./firebase-config.js";
import { ref, get, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;

// Initialize listings page
export function initializeListingsPage() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadUserListings();
            setupEventListeners();
        } else {
            window.location.href = "login.html";
        }
    });
}

// Load user's listings
function loadUserListings() {
    const listingsRef = ref(db, `users/${currentUser.uid}/listings`);
    
    onValue(listingsRef, (snapshot) => {
        const listingsGrid = document.querySelector('.listings-grid');
        listingsGrid.innerHTML = '';
        
        if (!snapshot.exists()) {
            listingsGrid.innerHTML = `
                <div class="no-listings">
                    <i class="fas fa-box-open"></i>
                    <h3>No listings yet</h3>
                    <p>You haven't listed any products for sale.</p>
                    <button class="btn-primary" onclick="window.location.href='sell.html'">
                        <i class="fas fa-plus"></i> List Your First Item
                    </button>
                </div>
            `;
            return;
        }
        
        const listingsData = snapshot.val();
        const productIds = Object.keys(listingsData);
        
        // Load each product's details
        productIds.forEach(productId => {
            loadProductDetails(productId, listingsData[productId]);
        });
    });
}

// Load details for a specific product
async function loadProductDetails(productId, listingInfo) {
    const productRef = ref(db, `products/${productId}`);
    
    try {
        const snapshot = await get(productRef);
        
        if (snapshot.exists()) {
            const productData = snapshot.val();
            renderProductCard(productId, productData, listingInfo);
        } else {
            // Product doesn't exist anymore, remove from user's listings
            const listingRef = ref(db, `users/${currentUser.uid}/listings/${productId}`);
            await remove(listingRef);
        }
    } catch (error) {
        console.error("Error loading product:", error);
    }
}

// Render product card with Base64 images
function renderProductCard(productId, productData, listingInfo) {
    const listingsGrid = document.querySelector('.listings-grid');
    
    const listingCard = document.createElement('div');
    listingCard.className = 'listing-card';
    
    // Get first image or use placeholder
    const firstImage = productData.images && productData.images.length > 0 
        ? productData.images[0] 
        : 'https://images.unsplash.com/photo-1588514912908-8f5891714f8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    
    listingCard.innerHTML = `
        <div class="listing-badge ${productData.status || 'available'}">${productData.status || 'Available'}</div>
        <div class="listing-image">
            <img src="${firstImage}" alt="${productData.name}" 
                 onerror="this.src='https://images.unsplash.com/photo-1588514912908-8f5891714f8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'">
            ${productData.images ? `<div class="image-count"><i class="fas fa-camera"></i> ${productData.images.length}</div>` : ''}
        </div>
        <div class="listing-info">
            <h3>${productData.name}</h3>
            <div class="listing-meta">
                <span class="price">₹${productData.price}</span>
                <span class="category">${productData.category}</span>
            </div>
            <p class="description">${productData.description}</p>
            <div class="listing-stats">
                <div class="stat">
                    <i class="fas fa-eye"></i> ${productData.views || 0} views
                </div>
                <div class="stat">
                    <i class="fas fa-comment"></i> ${productData.messages || 0} messages
                </div>
            </div>
            <div class="listing-actions">
                <a href="pd.html?id=${productId}" class="btn-view">
                    <i class="fas fa-eye"></i> View
                </a>
                ${productData.status === 'available' ? `
                <button class="btn-edit" data-product-id="${productId}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-mark-sold" data-product-id="${productId}">
                    <i class="fas fa-check"></i> Mark Sold
                </button>
                ` : ''}
                ${productData.status === 'sold' ? `
                <button class="btn-relist" data-product-id="${productId}">
                    <i class="fas fa-redo"></i> Relist
                </button>
                ` : ''}
                <button class="btn-delete" data-product-id="${productId}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    listingsGrid.appendChild(listingCard);
}
