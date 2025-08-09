// Firebase Configuration
console.log('Firebase Config: Initializing Firebase...');

// Check if Firebase is available (loaded via CDN in HTML)
let app, auth, db, analytics;

// Check if Firebase services are already initialized
if (window.auth && window.db && window.analytics) {
    console.log('Firebase already initialized via HTML module');
    auth = window.auth;
    db = window.db;
    analytics = window.analytics;
    app = window.firebase.app;
} else if (typeof firebase !== 'undefined') {
    try {
        // Fallback for older Firebase SDK
        const firebaseConfig = {
            apiKey: "AIzaSyD6-YX7lqxOBDM2fq5hdrWbVTiaEifrqZI",
            authDomain: "quiz-app-c2875.firebaseapp.com",
            projectId: "quiz-app-c2875",
            storageBucket: "quiz-app-c2875.firebasestorage.app",
            messagingSenderId: "183949470045",
            appId: "1:183949470045:web:5fe2ca1b0202cd919960b4",
            measurementId: "G-FPXR739ZML"
        };

        // Initialize Firebase
        app = firebase.initializeApp(firebaseConfig);
        
        // Initialize Firebase services
        auth = firebase.auth();
        db = firebase.firestore();
        analytics = firebase.analytics();
        
        console.log('Firebase initialized successfully (compat mode)');
        
        // Enable Firestore persistence
        db.enablePersistence()
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code == 'unimplemented') {
                    console.log('The current browser does not support persistence.');
                }
            });
            
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        initializeDemoMode();
    }
} else {
    console.log('Firebase not available, running in demo mode');
    initializeDemoMode();
}

// Demo mode fallback
function initializeDemoMode() {
    console.log('Firebase Config: Running in demo mode');
    
    // Mock Firebase object for demo purposes
    window.firebase = {
        initializeApp: () => console.log('Firebase initialized (demo mode)'),
        auth: () => ({
            onAuthStateChanged: (callback) => {
                // Simulate no user initially
                setTimeout(() => callback(null), 100);
            },
            signInWithEmailAndPassword: (email, password) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (email && password) {
                            resolve({
                                user: {
                                    uid: 'demo-user-123',
                                    email: email,
                                    displayName: email.split('@')[0]
                                }
                            });
                        } else {
                            reject({ code: 'auth/invalid-email' });
                        }
                    }, 1000);
                });
            },
            createUserWithEmailAndPassword: (email, password) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (email && password.length >= 6) {
                            resolve({
                                user: {
                                    uid: 'demo-user-' + Date.now(),
                                    email: email,
                                    displayName: null,
                                    updateProfile: (data) => Promise.resolve()
                                }
                            });
                        } else {
                            reject({ code: 'auth/weak-password' });
                        }
                    }, 1000);
                });
            },
            signOut: () => Promise.resolve(),
            currentUser: null
        }),
        firestore: () => ({
            collection: (name) => ({
                add: (data) => Promise.resolve({ id: 'demo-doc-' + Date.now() }),
                doc: (id) => ({
                    get: () => Promise.resolve({ exists: false, data: () => null }),
                    set: (data) => Promise.resolve(),
                    update: (data) => Promise.resolve()
                }),
                where: () => ({ orderBy: () => ({ limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) }) }),
                orderBy: () => ({ limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) })
            }),
            enablePersistence: () => Promise.resolve(),
            runTransaction: (fn) => Promise.resolve(),
            FieldValue: {
                serverTimestamp: () => new Date(),
                increment: (n) => n
            }
        }),
        analytics: () => ({
            logEvent: (eventName, parameters) => console.log('Analytics event:', eventName, parameters)
        })
    };
    
    app = firebase.initializeApp({});
    auth = firebase.auth();
    db = firebase.firestore();
    analytics = firebase.analytics();
}

// Make Firebase services globally available
window.auth = auth;
window.db = db;
window.analytics = analytics;

// Demo notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.top = '100px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Simulate authentication state changes
function updateUIForAuthenticatedUser(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    if (authButtons) authButtons.classList.add('d-none');
    if (userMenu) {
        userMenu.classList.remove('d-none');
        if (userName) {
            // Get username from various sources
            let displayName = 'User';
            
            // First try to get from localStorage
            const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
            if (userData.username) {
                displayName = userData.username;
            } else if (userData.displayName) {
                displayName = userData.displayName;
            } else if (user.displayName) {
                displayName = user.displayName;
            } else if (user.email) {
                displayName = user.email.split('@')[0];
            }
            
            userName.textContent = displayName;
        }
    }
    
    // Update leaderboard to reflect new user
    if (window.quizApp) {
        window.quizApp.loadLeaderboard();
    }
}

function updateUIForUnauthenticatedUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.classList.remove('d-none');
    if (userMenu) userMenu.classList.add('d-none');
}

// Make functions globally available
window.showNotification = showNotification;
window.updateUIForAuthenticatedUser = updateUIForAuthenticatedUser;
window.updateUIForUnauthenticatedUser = updateUIForUnauthenticatedUser;