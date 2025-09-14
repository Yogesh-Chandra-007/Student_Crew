// inbox.js
import { auth, db } from "./firebase-config.js";
import { ref, get, set, onValue, push, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;
let currentChatId = null;
let chats = [];

// Initialize inbox
export function initializeInbox() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadUserChats();
        } else {
            window.location.href = "login.html";
        }
    });
}

// Load user's chats
function loadUserChats() {
    const chatsRef = ref(db, `chats/${currentUser.uid}`);
    
    onValue(chatsRef, (snapshot) => {
        chats = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(chatId => {
                const chat = data[chatId];
                chat.id = chatId;
                chats.push(chat);
            });
            
            renderChatList();
            
            // If a chat is already open, load its messages
            if (currentChatId) {
                loadChatMessages(currentChatId);
            }
        } else {
            document.querySelector('.chat-list').innerHTML = '<p class="no-chats">No conversations yet</p>';
        }
    });
}

// Render chat list
function renderChatList() {
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = '';
    
    if (chats.length === 0) {
        chatList.innerHTML = '<p class="no-chats">No conversations yet</p>';
        return;
    }
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.chatId = chat.id;
        
        const lastMessage = chat.lastMessage || 'No messages yet';
        const timestamp = chat.timestamp ? formatTime(chat.timestamp) : '';
        const unreadCount = chat.unreadCount && chat.unreadCount[currentUser.uid] > 0 ? 
            `<span class="unread-count">${chat.unreadCount[currentUser.uid]}</span>` : '';
        
        chatItem.innerHTML = `
            <div class="chat-avatar">
                <img src="${chat.otherUserPhotoURL || 'https://randomuser.me/api/portraits/lego/1.jpg'}" alt="${chat.otherUserName}">
                ${chat.isOnline ? '<span class="online"></span>' : ''}
            </div>
            <div class="chat-info">
                <div class="chat-header">
                    <h4>${chat.otherUserName}</h4>
                    <span class="time">${timestamp}</span>
                </div>
                <p class="last-message">${lastMessage}</p>
                ${unreadCount}
            </div>
        `;
        
        chatItem.addEventListener('click', () => openChat(chat.id));
        chatList.appendChild(chatItem);
    });
}

// Open a chat
function openChat(chatId) {
    currentChatId = chatId;
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.chat-item[data-chat-id="${chatId}"]`).classList.add('active');
    
    loadChatMessages(chatId);
    markAsRead(chatId);
}

// Load messages for a chat
function loadChatMessages(chatId) {
    const messagesRef = ref(db, `messages/${chatId}`);
    const messagesContainer = document.querySelector('.chat-messages');
    messagesContainer.innerHTML = '';
    
    onValue(messagesRef, (snapshot) => {
        messagesContainer.innerHTML = '';
        const data = snapshot.val();
        
        if (data) {
            // Group messages by day
            const messagesByDay = {};
            
            Object.keys(data).forEach(key => {
                const message = data[key];
                const date = new Date(message.timestamp);
                const dayKey = date.toDateString();
                
                if (!messagesByDay[dayKey]) {
                    messagesByDay[dayKey] = [];
                }
                
                messagesByDay[dayKey].push({
                    id: key,
                    ...message
                });
            });
            
            // Render messages grouped by day
            Object.keys(messagesByDay).forEach(dayKey => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'message-day';
                dayHeader.innerHTML = `<span>${formatDayHeader(dayKey)}</span>`;
                messagesContainer.appendChild(dayHeader);
                
                messagesByDay[dayKey].forEach(message => {
                    const messageEl = createMessageElement(message);
                    messagesContainer.appendChild(messageEl);
                });
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });
}

// Create message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message.text}</p>
            <span class="message-time">${formatTime(message.timestamp)}</span>
        </div>
    `;
    
    return messageDiv;
}

// Send a message
export function sendMessage(chatId, messageText) {
    if (!messageText.trim()) return;
    
    const message = {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: Date.now()
    };
    
    // Add message to database
    const messagesRef = ref(db, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);
    set(newMessageRef, message);
    
    // Update chat last message and timestamp
    const chatRef = ref(db, `chats/${currentUser.uid}/${chatId}`);
    update(chatRef, {
        lastMessage: messageText,
        timestamp: Date.now()
    });
    
    // Also update for the other user
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        const otherUserChatRef = ref(db, `chats/${chat.otherUserId}/${chatId}`);
        update(otherUserChatRef, {
            lastMessage: messageText,
            timestamp: Date.now(),
            unreadCount: {
                ...chat.unreadCount,
                [chat.otherUserId]: (chat.unreadCount && chat.unreadCount[chat.otherUserId] || 0) + 1
            }
        });
    }
    
    // Clear input
    document.querySelector('.message-input input').value = '';
}

// Mark messages as read
function markAsRead(chatId) {
    const chatRef = ref(db, `chats/${currentUser.uid}/${chatId}/unreadCount/${currentUser.uid}`);
    set(chatRef, 0);
}

// Create a new chat
export async function createChat(productId, sellerId, productName) {
    // Check if chat already exists
    const existingChat = chats.find(chat => 
        chat.productId === productId && chat.otherUserId === sellerId
    );
    
    if (existingChat) {
        window.location.href = `inbox.html?chat=${existingChat.id}`;
        return existingChat.id;
    }
    
    // Get seller info
    const sellerRef = ref(db, `users/${sellerId}`);
    const sellerSnapshot = await get(sellerRef);
    
    if (!sellerSnapshot.exists()) {
        alert("Seller information not found");
        return null;
    }
    
    const sellerData = sellerSnapshot.val();
    
    // Create new chat
    const chatId = `${currentUser.uid}_${sellerId}_${productId}`;
    
    // Chat for current user
    const userChatRef = ref(db, `chats/${currentUser.uid}/${chatId}`);
    set(userChatRef, {
        otherUserId: sellerId,
        otherUserName: sellerData.name || 'Seller',
        otherUserPhotoURL: sellerData.photoURL,
        productId: productId,
        productName: productName,
        timestamp: Date.now(),
        unreadCount: {
            [currentUser.uid]: 0
        }
    });
    
    // Chat for seller
    const sellerChatRef = ref(db, `chats/${sellerId}/${chatId}`);
    set(sellerChatRef, {
        otherUserId: currentUser.uid,
        otherUserName: currentUser.displayName || 'Buyer',
        otherUserPhotoURL: currentUser.photoURL,
        productId: productId,
        productName: productName,
        timestamp: Date.now(),
        unreadCount: {
            [sellerId]: 1 // Seller has 1 unread message (the chat creation itself)
        }
    });
    
    // Send initial message
    const initialMessage = {
        text: `Hi! I'm interested in your ${productName}`,
        senderId: currentUser.uid,
        timestamp: Date.now()
    };
    
    const messagesRef = ref(db, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);
    set(newMessageRef, initialMessage);
    
    return chatId;
}

// Helper functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDayHeader(dayKey) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dayKey === today) return 'Today';
    if (dayKey === yesterday) return 'Yesterday';
    return new Date(dayKey).toLocaleDateString();
}

// Make functions globally accessible
window.sendChatMessage = function() {
    const input = document.querySelector('.message-input input');
    const message = input.value.trim();
    
    if (message && currentChatId) {
        sendMessage(currentChatId, message);
    }
};