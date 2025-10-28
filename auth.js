/**
 * NSG Health Authentication System
 * Handles user registration, login, session management, and role-based access
 */

class NSGAuth {
    constructor() {
        this.users = this.loadUsers();
        this.session = this.loadSession();
        this.initDemo();
    }

    // Initialize demo accounts
    initDemo() {
        const demoAccounts = [
            {
                id: 'demo_patient',
                email: 'patient@demo.com',
                password: 'demo123',
                firstName: 'Patient',
                lastName: 'Demo',
                role: 'patient',
                phone: '+254700000001',
                location: 'Nairobi, Kenya',
                isDemo: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo_practitioner',
                email: 'doctor@demo.com',
                password: 'demo123',
                firstName: 'Dr. Sarah',
                lastName: 'Demo',
                role: 'practitioner',
                phone: '+254700000002',
                location: 'Nairobi, Kenya',
                licenseNumber: 'MD12345',
                specialization: 'general',
                isDemo: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo_medrep',
                email: 'medrep@demo.com',
                password: 'demo123',
                firstName: 'Medical',
                lastName: 'Rep Demo',
                role: 'medrep',
                phone: '+254700000003',
                location: 'Nairobi, Kenya',
                companyName: 'MediSupply Kenya',
                businessLicense: 'BL12345',
                isDemo: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo_pharmacist',
                email: 'pharmacist@demo.com',
                password: 'demo123',
                firstName: 'Pharmacist',
                lastName: 'Demo',
                role: 'pharmacist',
                phone: '+254700000004',
                location: 'Nairobi, Kenya',
                pharmacyLicense: 'PH12345',
                pharmacyName: 'HealthCare Pharmacy',
                isDemo: true,
                createdAt: new Date().toISOString()
            }
        ];

        // Add demo accounts to storage if they don't exist
        demoAccounts.forEach(demo => {
            if (!this.users.find(user => user.email === demo.email)) {
                this.users.push(demo);
            }
        });

        this.saveUsers();
    }

    // Load users from localStorage
    loadUsers() {
        try {
            return JSON.parse(localStorage.getItem('nsg_users') || '[]');
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    // Save users to localStorage
    saveUsers() {
        try {
            localStorage.setItem('nsg_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    // Load session from localStorage
    loadSession() {
        try {
            const session = localStorage.getItem('nsg_session');
            if (session) {
                const parsed = JSON.parse(session);
                // Check if session is still valid (24 hours for remembered, 2 hours for not remembered)
                const loginTime = new Date(parsed.loginTime);
                const now = new Date();
                const maxAge = parsed.rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 24h or 2h in milliseconds
                
                if (now - loginTime < maxAge) {
                    return parsed;
                } else {
                    this.clearSession();
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('Error loading session:', error);
            return null;
        }
    }

    // Save session to localStorage
    saveSession(user, rememberMe = false) {
        try {
            const session = {
                user: user,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            localStorage.setItem('nsg_session', JSON.stringify(session));
            this.session = session;
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // Clear session
    clearSession() {
        localStorage.removeItem('nsg_session');
        this.session = null;
    }

    // Register a new user
    register(userData) {
        return new Promise((resolve, reject) => {
            // Validate required fields
            const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone', 'location', 'role'];
            const missing = requiredFields.filter(field => !userData[field]);
            
            if (missing.length > 0) {
                reject(new Error(`Missing required fields: ${missing.join(', ')}`));
                return;
            }

            // Check if email already exists
            if (this.users.find(user => user.email === userData.email)) {
                reject(new Error('An account with this email already exists'));
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                reject(new Error('Invalid email format'));
                return;
            }

            // Validate password strength
            if (userData.password.length < 6) {
                reject(new Error('Password must be at least 6 characters long'));
                return;
            }

            // Validate role-specific fields
            if (userData.role === 'practitioner') {
                if (!userData.licenseNumber) {
                    reject(new Error('Medical license number is required for practitioners'));
                    return;
                }
            } else if (userData.role === 'pharmacist') {
                if (!userData.pharmacyLicense) {
                    reject(new Error('Pharmacy license number is required for pharmacists'));
                    return;
                }
            } else if (userData.role === 'medrep') {
                if (!userData.companyName || !userData.businessLicense) {
                    reject(new Error('Company name and business license are required for medical representatives'));
                    return;
                }
            }

            // Create user object
            const newUser = {
                id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                ...userData,
                createdAt: new Date().toISOString(),
                isDemo: false,
                isActive: true,
                lastLogin: null
            };

            // Add user to storage
            this.users.push(newUser);
            this.saveUsers();

            resolve(newUser);
        });
    }

    // Login user
    login(email, password, rememberMe = false) {
        return new Promise((resolve, reject) => {
            // Find user
            const user = this.users.find(u => u.email === email);
            
            if (!user) {
                reject(new Error('User not found'));
                return;
            }

            if (!user.isActive) {
                reject(new Error('Account is deactivated'));
                return;
            }

            if (user.password !== password) {
                reject(new Error('Invalid password'));
                return;
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers();

            // Create session
            this.saveSession(user, rememberMe);

            resolve(user);
        });
    }

    // Logout user
    logout() {
        this.clearSession();
        // Redirect to signin page
        window.location.href = '../signin.html';
    }

    // Get current user
    getCurrentUser() {
        return this.session ? this.session.user : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.session;
    }

    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    // Update user profile
    updateProfile(userId, updates) {
        return new Promise((resolve, reject) => {
            const userIndex = this.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                reject(new Error('User not found'));
                return;
            }

            // Update user data (don't allow changing email, role, or password through this method)
            const allowedUpdates = ['firstName', 'lastName', 'phone', 'location', 'licenseNumber', 'specialization', 'pharmacyLicense', 'pharmacyName', 'companyName', 'businessLicense'];
            
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    this.users[userIndex][field] = updates[field];
                }
            });

            this.users[userIndex].updatedAt = new Date().toISOString();
            this.saveUsers();

            // Update session if it's the current user
            if (this.session && this.session.user.id === userId) {
                this.session.user = { ...this.users[userIndex] };
                this.saveSession(this.session.user, this.session.rememberMe);
            }

            resolve(this.users[userIndex]);
        });
    }

    // Change password
    changePassword(userId, currentPassword, newPassword) {
        return new Promise((resolve, reject) => {
            const user = this.users.find(u => u.id === userId);
            
            if (!user) {
                reject(new Error('User not found'));
                return;
            }

            if (user.password !== currentPassword) {
                reject(new Error('Current password is incorrect'));
                return;
            }

            if (newPassword.length < 6) {
                reject(new Error('New password must be at least 6 characters long'));
                return;
            }

            user.password = newPassword;
            user.updatedAt = new Date().toISOString();
            this.saveUsers();

            resolve(true);
        });
    }

    // Get users by role (admin function)
    getUsersByRole(role) {
        return this.users.filter(user => user.role === role && !user.isDemo);
    }

    // Protect pages that require authentication
    requireAuth(allowedRoles = null) {
        if (!this.isLoggedIn()) {
            window.location.href = '../signin.html';
            return false;
        }

        if (allowedRoles && !allowedRoles.includes(this.getCurrentUser().role)) {
            window.location.href = '../signin.html?error=unauthorized';
            return false;
        }

        return true;
    }

    // Initialize page protection
    initPageProtection() {
        // Get current page and determine required roles
        const path = window.location.pathname;
        const page = path.split('/').pop();

        const pageRoles = {
            'patient.html': ['patient'],
            'practitioner.html': ['practitioner'],
            'medrep.html': ['medrep'],
            'pharmacist.html': ['pharmacist']
        };

        if (pageRoles[page]) {
            this.requireAuth(pageRoles[page]);
        }
    }

    // Get dashboard URL for user role
    getDashboardUrl(role) {
        const dashboards = {
            'patient': 'dashboards/patient.html',
            'practitioner': 'dashboards/practitioner.html',
            'medrep': 'dashboards/medrep.html',
            'pharmacist': 'dashboards/pharmacist.html'
        };
        return dashboards[role] || 'dashboards/patient.html';
    }

    // Generate user avatar (initials)
    getUserAvatar(user) {
        if (!user) return '';
        const initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-gray-500'
        ];
        const colorIndex = user.id.charCodeAt(0) % colors.length;
        
        return `<div class="w-10 h-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold">${initials}</div>`;
    }

    // Format user display name
    getDisplayName(user) {
        if (!user) return 'Unknown User';
        
        const title = user.role === 'practitioner' ? 'Dr. ' : '';
        return `${title}${user.firstName} ${user.lastName}`;
    }

    // Get role display name
    getRoleDisplayName(role) {
        const roleNames = {
            'patient': 'Patient',
            'practitioner': 'Practitioner',
            'medrep': 'Medical Representative',
            'pharmacist': 'Pharmacist'
        };
        return roleNames[role] || role;
    }

    // Activity logging
    logActivity(action, details = {}) {
        const user = this.getCurrentUser();
        if (!user) return;

        const activity = {
            id: 'activity_' + Date.now(),
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action: action,
            details: details,
            timestamp: new Date().toISOString(),
            ip: 'demo', // In production, this would be the actual IP
            userAgent: navigator.userAgent
        };

        // Store in localStorage (in production, this would be sent to server)
        const activities = JSON.parse(localStorage.getItem('nsg_activities') || '[]');
        activities.unshift(activity); // Add to beginning
        
        // Keep only last 100 activities per user
        const userActivities = activities.filter(a => a.userId === user.id);
        if (userActivities.length > 100) {
            const toRemove = userActivities.slice(100);
            toRemove.forEach(remove => {
                const index = activities.findIndex(a => a.id === remove.id);
                if (index > -1) activities.splice(index, 1);
            });
        }

        localStorage.setItem('nsg_activities', JSON.stringify(activities));
    }

    // Get user activities
    getUserActivities(userId = null, limit = 50) {
        const targetUserId = userId || (this.getCurrentUser() ? this.getCurrentUser().id : null);
        if (!targetUserId) return [];

        const activities = JSON.parse(localStorage.getItem('nsg_activities') || '[]');
        return activities
            .filter(a => a.userId === targetUserId)
            .slice(0, limit);
    }
}

// Create global instance
window.nsgAuth = new NSGAuth();

// Auto-initialize page protection when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.nsgAuth) {
        window.nsgAuth.initPageProtection();
    }
});

// Helper functions for forms
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NSGAuth;
}