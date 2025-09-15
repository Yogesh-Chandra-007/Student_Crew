// listings.js
import { auth, db } from "./firebase-config.js";
import { ref, get, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
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

// Render product card
function renderProductCard(productId, productData, listingInfo) {
    const listingsGrid = document.querySelector('.listings-grid');
    
    const listingCard = document.createElement('div');
    listingCard.className = 'listing-card';
    listingCard.innerHTML = `
        <div class="listing-badge ${productData.status || 'available'}">${productData.status || 'Available'}</div>
        <div class="listing-image">
            <img src="${productData.images && productData.images.length > 0 ? productData.images[0] : 'https://images.unsplash.com/photo-1588514912908-8f5891714f8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}" alt="${productData.name}">
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

// Setup event listeners
function setupEventListeners() {
    // Status filter functionality
    const statusFilter = document.querySelector('.status-filter');
    statusFilter.addEventListener('change', function() {
        const status = this.value;
        const listingCards = document.querySelectorAll('.listing-card');
        
        listingCards.forEach(card => {
            if (status === 'all') {
                card.style.display = 'flex';
            } else {
                const cardStatus = card.querySelector('.listing-badge').textContent.toLowerCase();
                card.style.display = cardStatus === status ? 'flex' : 'none';
            }
        });
    });
    
    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const listingCards = document.querySelectorAll('.listing-card');
        
        listingCards.forEach(card => {
            const productName = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.description').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Delete listing
export async function deleteListing(productId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
        // Remove from user's listings
        const userListingRef = ref(db, `users/${currentUser.uid}/listings/${productId}`);
        await remove(userListingRef);
        
        // Also remove the product itself (optional - you might want to keep it for records)
        const productRef = ref(db, `products/${productId}`);
        await remove(productRef);
        
        alert('Listing deleted successfully!');
    } catch (error) {
        console.error("Error deleting listing:", error);
        alert('Error deleting listing: ' + error.message);
    }
}

// Mark as sold
export async function markAsSold(productId) {
    try {
        const productRef = ref(db, `products/${productId}`);
        await set(productRef, {
            status: 'sold',
            soldAt: Date.now()
        }, { merge: true });
        
        alert('Product marked as sold!');
    } catch (error) {
        console.error("Error marking as sold:", error);
        alert('Error marking as sold: ' + error.message);
    }
}

// Relist product
export async function relistProduct(productId) {
    try {
        const productRef = ref(db, `products/${productId}`);
        await set(productRef, {
            status: 'available',
            soldAt: null
        }, { merge: true });
        
        alert('Product relisted!');
    } catch (error) {
        console.error("Error relisting product:", error);
        alert('Error relisting product: ' + error.message);
    }
}

// Make functions globally accessible
window.deleteListing = function(productId) {
    deleteListing(productId);
};

window.markAsSold = function(productId) {
    markAsSold(productId);
};

window.relistProduct = function(productId) {
    relistProduct(productId);
};