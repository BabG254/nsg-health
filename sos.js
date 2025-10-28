// SOS Emergency System for NSG Health
// Provides Uber-style emergency request flow with geolocation and real-time tracking

class SOSEmergencySystem {
    constructor() {
        this.isActive = false;
        this.currentEmergency = null;
        this.userLocation = null;
        this.emergencyTypes = {
            medical: {
                name: 'Medical Emergency',
                icon: 'fas fa-heart-broken',
                color: 'red',
                priority: 'critical',
                estimatedResponse: '3-8 minutes'
            },
            ambulance: {
                name: 'Ambulance Request',
                icon: 'fas fa-ambulance',
                color: 'blue',
                priority: 'high',
                estimatedResponse: '5-12 minutes'
            },
            pharmacy: {
                name: 'Urgent Medication',
                icon: 'fas fa-pills',
                color: 'green',
                priority: 'medium',
                estimatedResponse: '10-20 minutes'
            },
            consultation: {
                name: 'Emergency Consultation',
                icon: 'fas fa-video',
                color: 'purple',
                priority: 'medium',
                estimatedResponse: '2-5 minutes'
            }
        };
        this.nearbyProviders = [];
        this.emergencyHistory = this.loadEmergencyHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNearbyProviders();
        this.startLocationTracking();
    }

    setupEventListeners() {
        // Listen for emergency requests
        document.addEventListener('emergency-request', (event) => {
            this.handleEmergencyRequest(event.detail);
        });

        // Listen for provider updates
        document.addEventListener('provider-update', (event) => {
            this.updateProviderStatus(event.detail);
        });
    }

    // Main SOS function - called when emergency button is pressed
    async startEmergencyRequest(emergencyType = 'medical', options = {}) {
        try {
            // Check if this is a quick SOS request for critical emergencies
            if (options.quickSOS) {
                return await this.startQuickSOS();
            }
            
            this.showSOSModal();
            
            // Get user location
            showToast('Getting your location...', 'info');
            const location = await this.getCurrentLocation();
            
            if (!location) {
                showToast('Location access is required for emergency services', 'error');
                return false;
            }

            this.userLocation = location;
            
            // Show emergency type selection
            this.showEmergencyTypeSelection(emergencyType, options);
            
            return true;
        } catch (error) {
            console.error('Emergency request failed:', error);
            showToast('Emergency request failed. Please try again or call emergency services directly.', 'error');
            return false;
        }
    }

    // Quick SOS for critical life-threatening emergencies - minimal questions
    async startQuickSOS() {
        try {
            this.showQuickSOSModal();
            
            // Get location immediately
            showToast('🚨 EMERGENCY MODE: Getting your location...', 'error');
            const location = await this.getCurrentLocation();
            
            if (!location) {
                // For critical emergencies, proceed even without precise location
                location = {
                    latitude: -1.2921,
                    longitude: 36.8219,
                    accuracy: 5000,
                    timestamp: new Date().toISOString(),
                    fallback: true
                };
            }

            this.userLocation = location;
            
            // Show quick emergency form (minimal information)
            this.showQuickEmergencyForm();
            
            return true;
        } catch (error) {
            console.error('Quick SOS failed:', error);
            showToast('🚨 EMERGENCY: If this is life-threatening, call 999 immediately!', 'error');
            return false;
        }
    }

    // Show simplified Quick SOS modal for critical emergencies
    showQuickSOSModal() {
        const modalHtml = `
            <div id="quickSOSModal" class="fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg w-full max-w-sm mx-4 border-4 border-red-500">
                    <div class="bg-red-600 text-white p-4 rounded-t-lg text-center">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <h2 class="text-lg font-bold">🚨 EMERGENCY MODE</h2>
                        <p class="text-sm">Quick assistance for critical situations</p>
                    </div>
                    <div id="quickSOSContent" class="p-4">
                        <!-- Content will be dynamically loaded -->
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals
        const existingModal = document.getElementById('sosModal') || document.getElementById('quickSOSModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Show minimal emergency form for quick SOS
    showQuickEmergencyForm() {
        const user = JSON.parse(localStorage.getItem('nsgCurrentUser') || '{}');
        const content = `
            <div class="space-y-4">
                <div class="text-center mb-4">
                    <div class="text-red-600 mb-2">
                        <i class="fas fa-heartbeat text-3xl"></i>
                    </div>
                    <p class="text-sm text-gray-700">Emergency help is on the way</p>
                </div>

                <form id="quickEmergencyForm" class="space-y-3">
                    <!-- Emergency Type - Critical Only -->
                    <div>
                        <label class="block text-sm font-medium text-red-700 mb-1">What type of emergency? *</label>
                        <select name="emergencyType" required class="w-full border-2 border-red-300 rounded-lg p-2 focus:border-red-500">
                            <option value="">Select emergency type</option>
                            <option value="cardiac">Heart Attack / Cardiac</option>
                            <option value="breathing">Can't Breathe / Choking</option>
                            <option value="bleeding">Severe Bleeding</option>
                            <option value="unconscious">Unconscious / Unresponsive</option>
                            <option value="accident">Serious Accident</option>
                            <option value="other">Other Life-Threatening</option>
                        </select>
                    </div>

                    <!-- Contact Number -->
                    <div>
                        <label class="block text-sm font-medium text-red-700 mb-1">Phone Number *</label>
                        <input type="tel" name="phone" value="${user.phone || ''}" required 
                               class="w-full border-2 border-red-300 rounded-lg p-2 focus:border-red-500"
                               placeholder="Your phone number">
                    </div>

                    <!-- Location Details (optional but helpful) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Location Details (if known)</label>
                        <input type="text" name="locationDetails" 
                               class="w-full border border-gray-300 rounded-lg p-2"
                               placeholder="Building/street name, floor, etc.">
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex space-x-2 pt-2">
                        <button type="button" onclick="sosSystem.closeModal()" 
                                class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-bold">
                            🚨 GET HELP NOW
                        </button>
                    </div>
                </form>

                <!-- Emergency Numbers -->
                <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-xs text-yellow-800 text-center">
                        <strong>If life-threatening:</strong><br>
                        Call <a href="tel:999" class="text-red-600 font-bold">999</a> (Emergency) or 
                        <a href="tel:112" class="text-red-600 font-bold">112</a> immediately
                    </p>
                </div>
            </div>
        `;

        document.getElementById('quickSOSContent').innerHTML = content;

        // Handle form submission
        document.getElementById('quickEmergencyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processQuickEmergency(new FormData(e.target));
        });
    }

    // Process quick emergency request with minimal data
    async processQuickEmergency(formData) {
        const emergencyData = {
            id: 'emergency_' + Date.now(),
            type: formData.get('emergencyType'),
            phone: formData.get('phone'),
            locationDetails: formData.get('locationDetails'),
            location: this.userLocation,
            timestamp: new Date().toISOString(),
            priority: 'critical',
            status: 'active',
            quickSOS: true
        };

        // Validate required fields
        if (!emergencyData.type || !emergencyData.phone) {
            showToast('Please fill in the required fields', 'error');
            return;
        }

        // Store emergency
        this.currentEmergency = emergencyData;
        this.saveEmergencyToHistory(emergencyData);

        // Show immediate response
        this.showQuickEmergencyResponse(emergencyData);

        // Simulate finding nearby help
        setTimeout(() => {
            this.findQuickEmergencyHelp(emergencyData);
        }, 2000);
    }

    // Show immediate response for quick emergency
    showQuickEmergencyResponse(emergency) {
        const content = `
            <div class="text-center space-y-4">
                <div class="text-red-600 mb-4">
                    <i class="fas fa-ambulance text-4xl animate-pulse"></i>
                </div>
                
                <h3 class="text-lg font-bold text-red-800">🚨 EMERGENCY ACTIVATED</h3>
                <p class="text-sm text-gray-700">Help is being dispatched to your location</p>

                <div class="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div class="text-sm space-y-1">
                        <div><strong>Emergency:</strong> ${this.getEmergencyTypeLabel(emergency.type)}</div>
                        <div><strong>Phone:</strong> ${emergency.phone}</div>
                        <div><strong>Location:</strong> ${emergency.location.fallback ? 'Approximate location' : 'GPS location'}</div>
                        <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
                    </div>
                </div>

                <div class="text-center">
                    <div class="inline-flex items-center space-x-2 text-orange-600">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span class="text-sm">Finding nearest help...</span>
                    </div>
                </div>

                <div class="text-xs text-gray-600">
                    <p>Stay on the line. Keep your phone close.</p>
                    <p>Emergency ID: ${emergency.id}</p>
                </div>
            </div>
        `;

        document.getElementById('quickSOSContent').innerHTML = content;
    }

    // Find and dispatch quick emergency help
    findQuickEmergencyHelp(emergency) {
        // Simulate finding help
        const availableHelp = [
            { name: 'Dr. Sarah Mwangi', type: 'Emergency Doctor', eta: '4 minutes', phone: '+254 700 123 456' },
            { name: 'Nairobi Emergency Response', type: 'Ambulance', eta: '6 minutes', phone: '+254 700 789 123' },
            { name: 'Central Medical Center', type: 'Hospital', eta: '8 minutes', phone: '+254 700 456 789' }
        ];

        const selectedHelp = availableHelp[0]; // Closest help

        const content = `
            <div class="text-center space-y-4">
                <div class="text-green-600 mb-4">
                    <i class="fas fa-check-circle text-4xl"></i>
                </div>
                
                <h3 class="text-lg font-bold text-green-800">✅ HELP DISPATCHED</h3>
                <p class="text-sm text-gray-700">Emergency responder is on the way</p>

                <!-- Selected Help Provider -->
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div class="text-left space-y-2">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-bold text-green-800">${selectedHelp.name}</div>
                                <div class="text-sm text-green-600">${selectedHelp.type}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-green-800">${selectedHelp.eta}</div>
                                <div class="text-xs text-green-600">ETA</div>
                            </div>
                        </div>
                        <div class="pt-2 border-t border-green-200">
                            <a href="tel:${selectedHelp.phone}" 
                               class="flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-phone"></i>
                                <span>Call ${selectedHelp.name}</span>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Emergency Instructions -->
                <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-left">
                    <h4 class="font-bold text-yellow-800 mb-2">While you wait:</h4>
                    <ul class="text-sm text-yellow-700 space-y-1">
                        <li>• Stay calm and keep breathing</li>
                        <li>• Keep your phone with you</li>
                        <li>• If possible, unlock your door</li>
                        <li>• Gather any medications you take</li>
                    </ul>
                </div>

                <div class="flex space-x-2">
                    <button onclick="sosSystem.trackEmergencyStatus('${emergency.id}')"
                            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-map-marker-alt mr-2"></i>Track Help
                    </button>
                    <button onclick="sosSystem.closeModal()" 
                            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Close
                    </button>
                </div>

                <div class="text-xs text-gray-600">
                    Emergency ID: ${emergency.id}
                </div>
            </div>
        `;

        document.getElementById('quickSOSContent').innerHTML = content;

        // Show success toast
        showToast('🚨 Emergency help dispatched - ETA: ' + selectedHelp.eta, 'success');
    }

    // Helper function to get emergency type label
    getEmergencyTypeLabel(type) {
        const labels = {
            'cardiac': 'Heart Attack / Cardiac Emergency',
            'breathing': 'Breathing Difficulty / Choking',
            'bleeding': 'Severe Bleeding',
            'unconscious': 'Unconscious / Unresponsive',
            'accident': 'Serious Accident',
            'other': 'Life-Threatening Emergency'
        };
        return labels[type] || type;
    }

    // Get user's current location
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Fallback to default Nairobi location for demo
                    resolve({
                        latitude: -1.2921,
                        longitude: 36.8219,
                        accuracy: 1000,
                        timestamp: new Date().toISOString(),
                        fallback: true
                    });
                },
                options
            );
        });
    }

    // Show SOS modal interface
    showSOSModal() {
        const modalHtml = `
            <div id="sosModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg w-full max-w-md mx-4 max-h-90vh overflow-y-auto">
                    <div id="sosModalContent">
                        <!-- Content will be dynamically loaded -->
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('sosModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Show emergency type selection screen
    showEmergencyTypeSelection(defaultType = 'medical', options = {}) {
        const content = document.getElementById('sosModalContent');
        
        content.innerHTML = `
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Emergency Request</h2>
                    <p class="text-gray-600">What type of emergency assistance do you need?</p>
                </div>

                <div class="space-y-3 mb-6">
                    ${Object.entries(this.emergencyTypes).map(([key, type]) => `
                        <button onclick="sosSystem.selectEmergencyType('${key}')" 
                                class="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-${type.color}-500 hover:bg-${type.color}-50 transition-all text-left ${key === defaultType ? `border-${type.color}-500 bg-${type.color}-50` : ''}">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-${type.color}-100 rounded-lg flex items-center justify-center mr-4">
                                    <i class="${type.icon} text-${type.color}-600"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold text-gray-900">${type.name}</div>
                                    <div class="text-sm text-gray-600">Est. ${type.estimatedResponse}</div>
                                </div>
                                <div class="text-right">
                                    <span class="px-2 py-1 bg-${type.color}-100 text-${type.color}-800 rounded-full text-xs font-medium">
                                        ${type.priority.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <div class="border-t pt-4">
                    <button onclick="sosSystem.closeSOSModal()" 
                            class="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    // Handle emergency type selection
    async selectEmergencyType(emergencyType) {
        const selectedType = this.emergencyTypes[emergencyType];
        
        showToast(`Requesting ${selectedType.name}...`, 'info');
        
        // Show emergency details form
        this.showEmergencyDetailsForm(emergencyType);
    }

    // Show emergency details form
    showEmergencyDetailsForm(emergencyType) {
        const selectedType = this.emergencyTypes[emergencyType];
        const content = document.getElementById('sosModalContent');
        
        content.innerHTML = `
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-${selectedType.color}-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="${selectedType.icon} text-${selectedType.color}-600 text-2xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">${selectedType.name}</h2>
                    <p class="text-gray-600">Please provide additional details</p>
                </div>

                <form id="emergencyDetailsForm" class="space-y-4">
                    <input type="hidden" name="emergencyType" value="${emergencyType}">
                    
                    <div>
                        <label class="block text-gray-700 font-medium mb-2">Description of Emergency</label>
                        <textarea name="description" rows="3" required 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${selectedType.color}-500" 
                                  placeholder="Describe the situation and what help you need..."></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-medium mb-2">Your Name</label>
                            <input type="text" name="patientName" required 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${selectedType.color}-500" 
                                   placeholder="Full name">
                        </div>
                        <div>
                            <label class="block text-gray-700 font-medium mb-2">Phone Number</label>
                            <input type="tel" name="phoneNumber" required 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${selectedType.color}-500" 
                                   placeholder="+254 xxx xxx xxx">
                        </div>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-medium mb-2">Current Location</label>
                        <input type="text" name="locationDescription" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${selectedType.color}-500" 
                               placeholder="Landmarks, building name, etc. (optional)">
                        <div class="text-xs text-gray-500 mt-1">
                            GPS: ${this.userLocation ? `${this.userLocation.latitude.toFixed(4)}, ${this.userLocation.longitude.toFixed(4)}` : 'Getting location...'}
                        </div>
                    </div>

                    ${emergencyType === 'medical' ? `
                        <div>
                            <label class="block text-gray-700 font-medium mb-2">Medical History (if relevant)</label>
                            <textarea name="medicalHistory" rows="2" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${selectedType.color}-500" 
                                      placeholder="Allergies, medications, conditions..."></textarea>
                        </div>
                    ` : ''}

                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="sosSystem.showEmergencyTypeSelection()" 
                                class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors">
                            Back
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-${selectedType.color}-600 text-white py-3 rounded-lg hover:bg-${selectedType.color}-700 transition-colors">
                            Request Help Now
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Setup form submission
        document.getElementById('emergencyDetailsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitEmergencyRequest(e.target);
        });
    }

    // Submit emergency request
    async submitEmergencyRequest(form) {
        const formData = new FormData(form);
        const emergencyData = {
            id: 'emergency_' + Date.now(),
            type: formData.get('emergencyType'),
            description: formData.get('description'),
            patientName: formData.get('patientName'),
            phoneNumber: formData.get('phoneNumber'),
            locationDescription: formData.get('locationDescription'),
            medicalHistory: formData.get('medicalHistory'),
            location: this.userLocation,
            status: 'active',
            priority: this.emergencyTypes[formData.get('emergencyType')].priority,
            createdAt: new Date().toISOString(),
            estimatedResponse: this.emergencyTypes[formData.get('emergencyType')].estimatedResponse
        };

        // Save emergency request
        this.saveEmergencyRequest(emergencyData);
        this.currentEmergency = emergencyData;

        // Show finding providers screen
        this.showFindingProvidersScreen(emergencyData);

        // Find nearby providers
        await this.findNearbyProviders(emergencyData);
    }

    // Show finding providers screen with Uber-style animation
    showFindingProvidersScreen(emergencyData) {
        const selectedType = this.emergencyTypes[emergencyData.type];
        const content = document.getElementById('sosModalContent');
        
        content.innerHTML = `
            <div class="p-6 text-center">
                <div class="mb-6">
                    <div class="w-20 h-20 bg-${selectedType.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <i class="${selectedType.icon} text-${selectedType.color}-600 text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Finding Help</h2>
                    <p class="text-gray-600">Connecting you with nearby providers...</p>
                </div>

                <div class="mb-6">
                    <div class="relative">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-${selectedType.color}-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
                        </div>
                        <div class="text-sm text-gray-500 mt-2">Searching for available providers</div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="font-medium text-gray-700">Emergency Type</div>
                            <div class="text-gray-600">${selectedType.name}</div>
                        </div>
                        <div>
                            <div class="font-medium text-gray-700">Priority</div>
                            <div class="text-gray-600">${emergencyData.priority.toUpperCase()}</div>
                        </div>
                        <div>
                            <div class="font-medium text-gray-700">Est. Response</div>
                            <div class="text-gray-600">${selectedType.estimatedResponse}</div>
                        </div>
                        <div>
                            <div class="font-medium text-gray-700">Request ID</div>
                            <div class="text-gray-600">#${emergencyData.id.slice(-6)}</div>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <button onclick="sosSystem.callEmergencyServices()" 
                            class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors">
                        <i class="fas fa-phone mr-2"></i>Call Emergency Services (999)
                    </button>
                    <button onclick="sosSystem.cancelEmergencyRequest()" 
                            class="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel Request
                    </button>
                </div>
            </div>
        `;
    }

    // Find nearby providers
    async findNearbyProviders(emergencyData) {
        // Simulate finding providers
        setTimeout(() => {
            this.showProviderResults(emergencyData);
        }, 3000);
    }

    // Show available providers
    showProviderResults(emergencyData) {
        const selectedType = this.emergencyTypes[emergencyData.type];
        const mockProviders = this.generateMockProviders(emergencyData.type);
        const content = document.getElementById('sosModalContent');
        
        content.innerHTML = `
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-green-600 text-2xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Providers Found</h2>
                    <p class="text-gray-600">Choose a provider to confirm your request</p>
                </div>

                <div class="space-y-3 mb-6">
                    ${mockProviders.map(provider => `
                        <div class="border border-gray-200 rounded-lg p-4 hover:border-${selectedType.color}-500 hover:bg-${selectedType.color}-50 transition-all cursor-pointer"
                             onclick="sosSystem.selectProvider('${provider.id}')">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-${selectedType.color}-100 rounded-full flex items-center justify-center mr-4">
                                        <i class="fas fa-user-md text-${selectedType.color}-600"></i>
                                    </div>
                                    <div>
                                        <div class="font-semibold text-gray-900">${provider.name}</div>
                                        <div class="text-sm text-gray-600">${provider.specialization}</div>
                                        <div class="text-xs text-gray-500">${provider.distance} away • ${provider.rating} ⭐</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold text-${selectedType.color}-600">${provider.eta}</div>
                                    <div class="text-xs text-gray-500">ETA</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="border-t pt-4">
                    <button onclick="sosSystem.cancelEmergencyRequest()" 
                            class="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel Request
                    </button>
                </div>
            </div>
        `;
    }

    // Generate mock providers based on emergency type
    generateMockProviders(emergencyType) {
        const providers = {
            medical: [
                { id: 'dr001', name: 'Dr. Sarah Mbugua', specialization: 'Emergency Medicine', distance: '0.8 km', eta: '4 min', rating: '4.9' },
                { id: 'dr002', name: 'Dr. James Mwangi', specialization: 'General Practice', distance: '1.2 km', eta: '6 min', rating: '4.7' },
                { id: 'dr003', name: 'Dr. Grace Wanjiku', specialization: 'Internal Medicine', distance: '1.5 km', eta: '8 min', rating: '4.8' }
            ],
            ambulance: [
                { id: 'amb001', name: 'Nairobi Rescue', specialization: 'Emergency Ambulance', distance: '2.1 km', eta: '7 min', rating: '4.8' },
                { id: 'amb002', name: 'St. John Ambulance', specialization: 'Medical Transport', distance: '3.2 km', eta: '10 min', rating: '4.6' },
                { id: 'amb003', name: 'Red Cross Emergency', specialization: 'Emergency Response', distance: '2.8 km', eta: '9 min', rating: '4.7' }
            ],
            pharmacy: [
                { id: 'phm001', name: 'Goodlife Pharmacy', specialization: 'Emergency Medications', distance: '0.5 km', eta: '12 min', rating: '4.6' },
                { id: 'phm002', name: 'Kenyatta Pharmacy', specialization: '24/7 Pharmacy', distance: '1.1 km', eta: '15 min', rating: '4.5' },
                { id: 'phm003', name: 'Medplus Pharmacy', specialization: 'Prescription Delivery', distance: '0.9 km', eta: '18 min', rating: '4.7' }
            ],
            consultation: [
                { id: 'con001', name: 'Dr. Peter Kariuki', specialization: 'Telemedicine', distance: 'Online', eta: '2 min', rating: '4.9' },
                { id: 'con002', name: 'Dr. Mary Njeri', specialization: 'Remote Consultation', distance: 'Online', eta: '3 min', rating: '4.8' },
                { id: 'con003', name: 'Dr. David Ochieng', specialization: 'Emergency Consult', distance: 'Online', eta: '5 min', rating: '4.6' }
            ]
        };

        return providers[emergencyType] || providers.medical;
    }

    // Select provider and confirm request
    selectProvider(providerId) {
        const provider = this.nearbyProviders.find(p => p.id === providerId) || 
                        this.generateMockProviders(this.currentEmergency.type).find(p => p.id === providerId);
        
        if (!provider) return;

        // Update emergency request with selected provider
        this.currentEmergency.providerId = providerId;
        this.currentEmergency.providerName = provider.name;
        this.currentEmergency.estimatedArrival = provider.eta;
        this.currentEmergency.status = 'confirmed';
        
        this.saveEmergencyRequest(this.currentEmergency);
        
        // Show confirmation screen
        this.showConfirmationScreen(provider);
    }

    // Show confirmation screen
    showConfirmationScreen(provider) {
        const selectedType = this.emergencyTypes[this.currentEmergency.type];
        const content = document.getElementById('sosModalContent');
        
        content.innerHTML = `
            <div class="p-6 text-center">
                <div class="mb-6">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check-circle text-green-600 text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Help is On the Way!</h2>
                    <p class="text-gray-600">Your emergency request has been confirmed</p>
                </div>

                <div class="bg-blue-50 rounded-lg p-4 mb-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-user-md text-blue-600"></i>
                            </div>
                            <div class="text-left">
                                <div class="font-semibold text-gray-900">${provider.name}</div>
                                <div class="text-sm text-gray-600">${provider.specialization}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-blue-600 text-lg">${provider.eta}</div>
                            <div class="text-xs text-blue-500">ETA</div>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 text-left">
                        <div><strong>Distance:</strong> ${provider.distance}</div>
                        <div><strong>Rating:</strong> ${provider.rating} ⭐</div>
                        <div><strong>Request ID:</strong> #${this.currentEmergency.id.slice(-6)}</div>
                    </div>
                </div>

                <div class="space-y-3 mb-6">
                    <button onclick="sosSystem.callProvider()" 
                            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors">
                        <i class="fas fa-phone mr-2"></i>Call ${provider.name}
                    </button>
                    <button onclick="sosSystem.trackProvider()" 
                            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-map-marker-alt mr-2"></i>Track Location
                    </button>
                    <button onclick="sosSystem.shareLocation()" 
                            class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors">
                        <i class="fas fa-share mr-2"></i>Share My Location
                    </button>
                </div>

                <div class="text-xs text-gray-500 mb-4">
                    Emergency services have been notified. Keep your phone nearby.
                </div>

                <div class="flex gap-3">
                    <button onclick="sosSystem.closeSOSModal()" 
                            class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                        Close
                    </button>
                    <button onclick="sosSystem.cancelEmergencyRequest()" 
                            class="flex-1 bg-red-300 text-red-700 py-2 rounded-lg hover:bg-red-400 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        // Auto-close after 30 seconds
        setTimeout(() => {
            if (document.getElementById('sosModal')) {
                this.closeSOSModal();
                showToast('Emergency request active. Check notifications for updates.', 'success');
            }
        }, 30000);
    }

    // Save emergency request
    saveEmergencyRequest(emergencyData) {
        const emergencyRequests = JSON.parse(localStorage.getItem('nsg_emergency_requests') || '[]');
        
        // Update existing or add new
        const existingIndex = emergencyRequests.findIndex(req => req.id === emergencyData.id);
        if (existingIndex !== -1) {
            emergencyRequests[existingIndex] = emergencyData;
        } else {
            emergencyRequests.unshift(emergencyData);
        }
        
        localStorage.setItem('nsg_emergency_requests', JSON.stringify(emergencyRequests));
        
        // Notify all dashboards
        this.notifyDashboards(emergencyData);
    }

    // Notify all relevant dashboards
    notifyDashboards(emergencyData) {
        // Broadcast to practitioner dashboards
        const event = new CustomEvent('emergency-alert', {
            detail: emergencyData
        });
        document.dispatchEvent(event);
        
        // Update emergency requests for all users
        localStorage.setItem('nsg_last_emergency_update', Date.now().toString());
    }

    // Load emergency history
    loadEmergencyHistory() {
        return JSON.parse(localStorage.getItem('nsg_emergency_requests') || '[]');
    }

    // Load nearby providers (mock data for demo)
    loadNearbyProviders() {
        this.nearbyProviders = [
            // This would typically come from a real API
        ];
    }

    // Start location tracking
    startLocationTracking() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                },
                (error) => {
                    console.warn('Location tracking error:', error);
                },
                { enableHighAccuracy: true, timeout: 60000, maximumAge: 300000 }
            );
        }
    }

    // Action methods
    callEmergencyServices() {
        showToast('Calling emergency services...', 'info');
        window.open('tel:999', '_self');
    }

    callProvider() {
        showToast('Calling provider...', 'info');
        // Would call the actual provider's number
        window.open('tel:+254712345678', '_self');
    }

    trackProvider() {
        showToast('Opening provider tracking...', 'info');
        // Would open a real-time tracking interface
    }

    shareLocation() {
        if (this.userLocation) {
            const locationUrl = `https://maps.google.com/?q=${this.userLocation.latitude},${this.userLocation.longitude}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'My Emergency Location',
                    text: 'I need help at this location',
                    url: locationUrl
                });
            } else {
                navigator.clipboard.writeText(locationUrl);
                showToast('Location copied to clipboard', 'success');
            }
        }
    }

    cancelEmergencyRequest() {
        if (this.currentEmergency) {
            this.currentEmergency.status = 'cancelled';
            this.saveEmergencyRequest(this.currentEmergency);
            showToast('Emergency request cancelled', 'info');
        }
        this.closeSOSModal();
    }

    closeSOSModal() {
        const modal = document.getElementById('sosModal');
        const quickModal = document.getElementById('quickSOSModal');
        if (modal) {
            modal.remove();
        }
        if (quickModal) {
            quickModal.remove();
        }
        this.isActive = false;
    }

    // Alias for closeSOSModal to handle both modal types
    closeModal() {
        this.closeSOSModal();
    }

    // Get emergency status for user
    getEmergencyStatus(userId = null) {
        const emergencyRequests = this.loadEmergencyHistory();
        const userRequests = userId ? 
            emergencyRequests.filter(req => req.userId === userId) : 
            emergencyRequests;
        
        return userRequests.filter(req => req.status === 'active' || req.status === 'confirmed');
    }

    // Get all active emergencies (for providers)
    getAllActiveEmergencies() {
        const emergencyRequests = this.loadEmergencyHistory();
        return emergencyRequests.filter(req => req.status === 'active' || req.status === 'confirmed');
    }
}

// Global SOS System instance
const sosSystem = new SOSEmergencySystem();

// Global SOS function for easy access
function triggerSOS(type = 'medical', options = {}) {
    return sosSystem.startEmergencyRequest(type, options);
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SOSEmergencySystem, sosSystem, triggerSOS };
}