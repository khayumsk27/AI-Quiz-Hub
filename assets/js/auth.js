// Authentication System

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initializeEventListeners();
        this.initializeAuthStateListener().catch(error => {
            console.error('Error initializing auth state listener:', error);
        });
    }

    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    async initializeAuthStateListener() {
        // Listen for authentication state changes
        if (window.auth) {
            try {
                const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
                onAuthStateChanged(window.auth, (user) => {
                    this.currentUser = user;
                    if (user) {
                        updateUIForAuthenticatedUser(user);
                    } else {
                        updateUIForUnauthenticatedUser();
                    }
                });
            } catch (error) {
                console.error('Error setting up auth state listener:', error);
            }
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email) {
            showNotification('Please enter your email address.', 'danger');
            return;
        }

        if (!this.validateEmail(email)) {
            showNotification('Please enter a valid email address (e.g., user@gmail.com).', 'danger');
            return;
        }

        if (!password) {
            showNotification('Please enter your password.', 'danger');
            return;
        }

        if (!this.validatePassword(password)) {
            showNotification('Password must be at least 6 characters long.', 'danger');
            return;
        }

        try {
            this.showLoading('loginForm');
            
            // Use the new Firebase SDK
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
            const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
            
            // Check if user data exists in localStorage
            const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
            if (!userData.uid || userData.uid !== userCredential.user.uid) {
                // If no user data or different user, try to get from Firebase profile
                if (userCredential.user.displayName) {
                    const newUserData = {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email,
                        username: userCredential.user.displayName,
                        displayName: userCredential.user.displayName
                    };
                    localStorage.setItem('quizwise_user_data', JSON.stringify(newUserData));
                }
            }
            
            // Close modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();
            
            showNotification('Welcome back! You have successfully logged in.', 'success');
            
            // Update UI
            this.currentUser = userCredential.user;
            updateUIForAuthenticatedUser(userCredential.user);
            
            // Clear form
            document.getElementById('loginForm').reset();
            
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.hideLoading('loginForm');
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!name) {
            showNotification('Please enter your full name.', 'danger');
            return;
        }

        if (!this.validateName(name)) {
            showNotification('Please enter a valid name (2-50 characters, letters, spaces, hyphens, apostrophes, and periods only).', 'danger');
            return;
        }

        if (!username) {
            showNotification('Please enter a username.', 'danger');
            return;
        }

        if (!this.validateUsername(username)) {
            showNotification('Username must be 3-20 characters long and contain only letters, numbers, and underscores.', 'danger');
            return;
        }

        if (!email) {
            showNotification('Please enter your email address.', 'danger');
            return;
        }

        if (!this.validateEmail(email)) {
            showNotification('Please enter a valid email address (e.g., user@gmail.com).', 'danger');
            return;
        }

        if (!password) {
            showNotification('Please enter a password.', 'danger');
            return;
        }

        if (!this.validatePassword(password)) {
            showNotification('Password must be at least 6 characters long.', 'danger');
            return;
        }

        if (!confirmPassword) {
            showNotification('Please confirm your password.', 'danger');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match.', 'danger');
            return;
        }

        try {
            this.showLoading('registerForm');
            
            // Create user account using new Firebase SDK
            const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
            const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
            
            // Update user profile with username
            await updateProfile(userCredential.user, {
                displayName: username
            });
            
            // Store additional user data in localStorage for leaderboard
            const userData = {
                uid: userCredential.user.uid,
                email: email,
                fullName: name,
                username: username,
                displayName: username
            };
            localStorage.setItem('quizwise_user_data', JSON.stringify(userData));
            
            // Close modal
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) registerModal.hide();
            
            showNotification('Account created successfully! Welcome to QuizWise.', 'success');
            
            // Update UI
            this.currentUser = userCredential.user;
            updateUIForAuthenticatedUser(userCredential.user);
            
            // Clear form
            document.getElementById('registerForm').reset();
            
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.hideLoading('registerForm');
        }
    }

    async logout() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
            await signOut(window.auth);
            this.currentUser = null;
            updateUIForUnauthenticatedUser();
            showNotification('You have been logged out successfully.', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Error logging out. Please try again.', 'danger');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    validateUsername(username) {
        // Username should be 3-20 characters, alphanumeric and underscores only
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    validateName(name) {
        // Name should be 2-50 characters, letters, spaces, and common punctuation only
        const nameRegex = /^[a-zA-Z\s\-'\.]{2,50}$/;
        return nameRegex.test(name.trim());
    }

    showLoading(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        }
    }

    hideLoading(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            
            if (formId === 'loginForm') {
                submitBtn.innerHTML = 'Login';
            } else if (formId === 'registerForm') {
                submitBtn.innerHTML = 'Create Account';
            }
        }
    }

    handleAuthError(error) {
        console.error('Auth error:', error);
        
        let message = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/email-already-in-use':
                message = 'An account with this email already exists.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Please choose a stronger password.';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address format.';
                break;
            default:
                message = error.message || 'An unexpected error occurred.';
        }
        
        showNotification(message, 'danger');
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentUsername() {
        const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
        console.log('getCurrentUsername - userData:', userData);
        console.log('getCurrentUsername - currentUser:', this.currentUser);
        
        if (userData.username) {
            console.log('Returning username from userData:', userData.username);
            return userData.username;
        } else if (this.currentUser && this.currentUser.displayName) {
            console.log('Returning displayName from currentUser:', this.currentUser.displayName);
            return this.currentUser.displayName;
        } else if (this.currentUser && this.currentUser.email) {
            const emailUsername = this.currentUser.email.split('@')[0];
            console.log('Returning email username:', emailUsername);
            return emailUsername;
        }
        console.log('Returning Guest as fallback');
        return 'Guest';
    }
}

// Modal functions
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
    
    // Hide register modal if open
    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    if (registerModal) {
        registerModal.hide();
    }
}

function showRegisterModal() {
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    registerModal.show();
    
    // Hide login modal if open
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) {
        loginModal.hide();
    }
}

function logout() {
    authManager.logout();
}

// Initialize auth manager
let authManager;

// Authentication guard for protected routes
function requireAuth() {
    if (!authManager || !authManager.isAuthenticated()) {
        showNotification('Please log in to access this feature.', 'warning');
        showLoginModal();
        return false;
    }
    return true;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AuthManager...');
    authManager = new AuthManager();
    // Make authManager globally available
    window.authManager = authManager;
    console.log('AuthManager initialized and made globally available:', window.authManager);
});

console.log('Authentication system loaded successfully');