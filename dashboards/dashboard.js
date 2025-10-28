// Dashboard utilities and common functionality for NSG Health
// Provides shared functions, toast notifications, and dashboard helpers

// Toast notification system
function showToast(message, type = 'info', duration = 4000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set colors based on type
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    toast.className += ` ${colors[type] || colors.info}`;
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${icons[type] || icons.info} mr-3"></i>
            <div class="flex-1">
                <p class="font-medium">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// Dashboard data management utilities
class DashboardUtils {
    // Format currency
    static formatCurrency(amount, currency = 'KES') {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount).replace('KES', 'KSh');
    }

    // Format date/time
    static formatDate(dateString, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    // Format relative time (e.g., "2 hours ago")
    static formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return this.formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Generate random ID
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check if date is today
    static isToday(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    // Check if date is this month
    static isThisMonth(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }

    // Validate phone number
    static validatePhone(phone) {
        const phoneRegex = /^\+?254[0-9]{9}$|^0[0-9]{9}$/;
        return phoneRegex.test(phone);
    }

    // Validate email
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get status color class
    static getStatusColor(status) {
        const colors = {
            'active': 'green',
            'pending': 'yellow',
            'completed': 'blue',
            'cancelled': 'red',
            'confirmed': 'purple',
            'in-progress': 'blue',
            'delivered': 'green',
            'shipped': 'purple'
        };
        return colors[status] || 'gray';
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Local storage helpers
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    // Generate mock data helpers
    static generateMockPatients(count = 10) {
        const firstNames = ['John', 'Mary', 'Peter', 'Grace', 'James', 'Sarah', 'David', 'Faith', 'Michael', 'Joyce'];
        const lastNames = ['Mwangi', 'Wanjiku', 'Kariuki', 'Njeri', 'Ochieng', 'Akinyi', 'Mbugua', 'Wambui', 'Kamau', 'Chebet'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: this.generateId('patient'),
            firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
            lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
            age: Math.floor(Math.random() * 60) + 20,
            phone: `+254${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
            lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: ['active', 'pending', 'completed'][Math.floor(Math.random() * 3)]
        }));
    }

    static generateMockAppointments(count = 8) {
        const patients = this.generateMockPatients(count);
        const types = ['Consultation', 'Check-up', 'Follow-up', 'Emergency', 'Vaccination', 'Lab Test'];
        
        return patients.map((patient, i) => ({
            id: this.generateId('appointment'),
            patientId: patient.id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            phone: patient.phone,
            type: types[Math.floor(Math.random() * types.length)],
            date: new Date(Date.now() + (Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString(),
            duration: [30, 45, 60][Math.floor(Math.random() * 3)],
            status: ['scheduled', 'confirmed', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
            notes: 'Regular appointment booking',
            createdAt: new Date().toISOString()
        }));
    }

    static generateMockPrescriptions(count = 6) {
        const medications = [
            'Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg', 
            'Omeprazole 20mg', 'Metformin 500mg', 'Amlodipine 5mg'
        ];
        const patients = this.generateMockPatients(count);
        
        return patients.map((patient, i) => ({
            id: this.generateId('prescription'),
            patientId: patient.id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            medication: medications[i % medications.length],
            dosage: '1 tablet twice daily',
            prescribedBy: 'Dr. Smith',
            status: ['pending', 'dispensed', 'completed'][Math.floor(Math.random() * 3)],
            urgent: Math.random() > 0.7,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
    }
}

// Chart utilities (using Chart.js when available)
class ChartUtils {
    static createLineChart(elementId, data, options = {}) {
        const ctx = document.getElementById(elementId);
        if (!ctx || typeof Chart === 'undefined') return null;

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        return new Chart(ctx, {
            type: 'line',
            data: data,
            options: { ...defaultOptions, ...options }
        });
    }

    static createBarChart(elementId, data, options = {}) {
        const ctx = document.getElementById(elementId);
        if (!ctx || typeof Chart === 'undefined') return null;

        return new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }

    static createDoughnutChart(elementId, data, options = {}) {
        const ctx = document.getElementById(elementId);
        if (!ctx || typeof Chart === 'undefined') return null;

        return new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }
}

// Modal utilities
class ModalUtils {
    static show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    static hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    static create(id, title, content, actions = []) {
        const modalHtml = `
            <div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg w-full max-w-md mx-4 max-h-90vh overflow-y-auto">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-semibold">${title}</h3>
                            <button onclick="ModalUtils.hide('${id}')" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div class="mb-4">${content}</div>
                        ${actions.length > 0 ? `
                            <div class="flex gap-3 pt-4">
                                ${actions.map(action => `
                                    <button onclick="${action.onClick}" class="${action.class || 'bg-blue-600 text-white'} px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                                        ${action.text}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return id;
    }
}

// Data synchronization utilities
class DataSync {
    static syncAppointments() {
        // Sync appointments across all dashboards
        const appointments = DashboardUtils.loadFromStorage('nsg_appointments', []);
        localStorage.setItem('nsg_last_appointment_sync', Date.now().toString());
        return appointments;
    }

    static syncEmergencyRequests() {
        // Sync emergency requests for real-time updates
        const emergencies = DashboardUtils.loadFromStorage('nsg_emergency_requests', []);
        localStorage.setItem('nsg_last_emergency_sync', Date.now().toString());
        return emergencies;
    }

    static syncUserActivities() {
        // Sync user activities across sessions
        const activities = DashboardUtils.loadFromStorage('nsg_user_activities', []);
        return activities;
    }

    static initRealtimeSync() {
        // Check for updates every 30 seconds
        setInterval(() => {
            const lastSync = localStorage.getItem('nsg_last_sync') || '0';
            const currentTime = Date.now().toString();
            
            if (parseInt(currentTime) - parseInt(lastSync) > 30000) {
                // Trigger sync events
                document.dispatchEvent(new CustomEvent('data-sync', {
                    detail: { type: 'appointments' }
                }));
                
                localStorage.setItem('nsg_last_sync', currentTime);
            }
        }, 30000);
    }
}

// Dashboard-specific event handlers
class DashboardEvents {
    static setupCommonEvents() {
        // Setup escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.fixed.inset-0');
                modals.forEach(modal => {
                    if (!modal.classList.contains('hidden')) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });

        // Setup click outside to close dropdowns
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('[id$="Menu"]');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target) && !dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                }
            });
        });

        // Setup auto-refresh for dashboards
        setInterval(() => {
            if (typeof refreshDashboardData === 'function') {
                refreshDashboardData();
            }
        }, 60000); // Refresh every minute
    }

    static setupFormValidation() {
        // Add real-time form validation
        document.addEventListener('input', (e) => {
            if (e.target.type === 'email') {
                const isValid = DashboardUtils.validateEmail(e.target.value);
                e.target.classList.toggle('border-red-500', !isValid && e.target.value.length > 0);
                e.target.classList.toggle('border-green-500', isValid);
            }
            
            if (e.target.type === 'tel') {
                const isValid = DashboardUtils.validatePhone(e.target.value);
                e.target.classList.toggle('border-red-500', !isValid && e.target.value.length > 0);
                e.target.classList.toggle('border-green-500', isValid);
            }
        });
    }
}

// Initialize dashboard common functionality
document.addEventListener('DOMContentLoaded', () => {
    // Setup common events
    DashboardEvents.setupCommonEvents();
    DashboardEvents.setupFormValidation();
    
    // Initialize real-time sync
    DataSync.initRealtimeSync();
    
    // Setup SOS quick access (Ctrl+Shift+S)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            if (typeof triggerSOS === 'function') {
                triggerSOS();
            }
        }
    });
});

// Export utilities for global use
window.DashboardUtils = DashboardUtils;
window.ChartUtils = ChartUtils;
window.ModalUtils = ModalUtils;
window.DataSync = DataSync;
window.DashboardEvents = DashboardEvents;
window.showToast = showToast;