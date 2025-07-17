// Mobile UI Showcase - Interactive JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initMobileMenu();
    initSmoothScrolling();
    initPlatformTabs();
    initFlowTabs();
    initDesignSystemTabs();
    initMobilePrototypes();
    initGestureSimulations();
    initInteractiveElements();
    
    // Initialize mobile detection
    detectMobileFeatures();
    
    // Initialize intersection observers for animations
    initScrollAnimations();
    
    // Initialize touch event handlers
    initTouchHandlers();
});

// Mobile Menu Functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Toggle hamburger icon
            const icon = mobileMenuBtn.querySelector('i');
            if (mobileMenu.classList.contains('hidden')) {
                icon.className = 'fas fa-bars text-xl';
            } else {
                icon.className = 'fas fa-times text-xl';
            }
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
                const icon = mobileMenuBtn.querySelector('i');
                icon.className = 'fas fa-bars text-xl';
            });
        });
    }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Platform Toggle Functionality (iOS/Android)
function initPlatformTabs() {
    const iosTab = document.getElementById('ios-tab');
    const androidTab = document.getElementById('android-tab');
    
    if (iosTab && androidTab) {
        iosTab.addEventListener('click', function() {
            switchPlatform('ios');
        });
        
        androidTab.addEventListener('click', function() {
            switchPlatform('android');
        });
    }
}

function switchPlatform(platform) {
    const iosTab = document.getElementById('ios-tab');
    const androidTab = document.getElementById('android-tab');
    
    if (platform === 'ios') {
        iosTab.className = 'px-8 py-3 rounded-md font-semibold transition-colors bg-primary-600 text-white';
        androidTab.className = 'px-8 py-3 rounded-md font-semibold transition-colors text-gray-600 hover:text-gray-900';
        
        // Update screen designs to show iOS versions
        updateScreenDesigns('ios');
    } else {
        androidTab.className = 'px-8 py-3 rounded-md font-semibold transition-colors bg-green-600 text-white';
        iosTab.className = 'px-8 py-3 rounded-md font-semibold transition-colors text-gray-600 hover:text-gray-900';
        
        // Update screen designs to show Android versions
        updateScreenDesigns('android');
    }
}

function updateScreenDesigns(platform) {
    // This would update the screen mockups to show platform-specific designs
    const screens = document.querySelectorAll('.mobile-screen');
    screens.forEach(screen => {
        if (platform === 'ios') {
            screen.classList.add('ios-screen');
            screen.classList.remove('android-screen');
        } else {
            screen.classList.add('android-screen');
            screen.classList.remove('ios-screen');
        }
    });
}

// User Flow Tabs Functionality
function initFlowTabs() {
    const flowTabs = {
        'first-time-flow': 'first-time-content',
        'daily-flow': 'daily-content',
        'upgrade-flow': 'upgrade-content',
        'persona-flow': 'persona-content'
    };
    
    Object.keys(flowTabs).forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.addEventListener('click', function() {
                switchFlowContent(tabId, flowTabs[tabId]);
            });
        }
    });
}

function switchFlowContent(activeTabId, activeContentId) {
    // Update tab states
    const allTabs = document.querySelectorAll('[id$="-flow"]');
    allTabs.forEach(tab => {
        if (tab.id === activeTabId) {
            tab.className = 'px-6 py-3 rounded-md font-semibold transition-colors bg-white shadow text-primary-600';
        } else {
            tab.className = 'px-6 py-3 rounded-md font-semibold transition-colors text-gray-600 hover:text-gray-900';
        }
    });
    
    // Update content visibility
    const allContent = document.querySelectorAll('.flow-content');
    allContent.forEach(content => {
        if (content.id === activeContentId) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

// Design System Tabs Functionality
function initDesignSystemTabs() {
    const designTabs = {
        'colors-tab': 'colors-content',
        'components-tab': 'components-content',
        'interactions-tab': 'interactions-content',
        'guidelines-tab': 'guidelines-content'
    };
    
    Object.keys(designTabs).forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.addEventListener('click', function() {
                switchDesignSystemContent(tabId, designTabs[tabId]);
            });
        }
    });
}

function switchDesignSystemContent(activeTabId, activeContentId) {
    // Update tab states
    const allTabs = document.querySelectorAll('[id$="-tab"]');
    allTabs.forEach(tab => {
        if (tab.id === activeTabId) {
            tab.className = 'px-6 py-3 rounded-md font-semibold transition-colors bg-white shadow text-primary-600';
        } else {
            tab.className = 'px-6 py-3 rounded-md font-semibold transition-colors text-gray-600 hover:text-gray-900';
        }
    });
    
    // Update content visibility
    const allContent = document.querySelectorAll('.design-system-section');
    allContent.forEach(content => {
        if (content.id === activeContentId) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

// Mobile Prototype Interactions
function initMobilePrototypes() {
    // Initialize iOS prototype
    initIOSPrototype();
    
    // Initialize Android prototype
    initAndroidPrototype();
}

function initIOSPrototype() {
    // Set initial state
    const homeScreen = document.getElementById('ios-home');
    if (homeScreen) {
        homeScreen.classList.add('active');
    }
}

function initAndroidPrototype() {
    // Set initial state
    const homeScreen = document.getElementById('android-home');
    if (homeScreen) {
        homeScreen.classList.add('active');
    }
}

// iOS Screen Navigation
function switchIOSScreen(screenId) {
    const allScreens = document.querySelectorAll('#ios-prototype-content .prototype-screen');
    
    allScreens.forEach(screen => {
        screen.classList.remove('active', 'previous');
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(`ios-${screenId}`);
    if (targetScreen) {
        setTimeout(() => {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
        }, 100);
    }
    
    // Add haptic feedback simulation
    simulateHapticFeedback();
}

// Android Screen Navigation
function switchAndroidScreen(screenId) {
    const allScreens = document.querySelectorAll('#android-prototype-content .prototype-screen');
    
    allScreens.forEach(screen => {
        screen.classList.remove('active', 'previous');
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(`android-${screenId}`);
    if (targetScreen) {
        setTimeout(() => {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
        }, 100);
    }
    
    // Add ripple effect simulation
    simulateRippleEffect();
}

// Gesture Simulations
function initGestureSimulations() {
    // Tap gesture simulation
    const tapElements = document.querySelectorAll('.mobile-screen');
    tapElements.forEach(element => {
        element.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                simulateTapGesture(e.target);
            }
        });
    });
    
    // Long press simulation
    initLongPressGestures();
    
    // Swipe gesture simulation
    initSwipeGestures();
}

function simulateTapGesture(element) {
    const target = element.closest('button') || element;
    target.classList.add('tap-animation');
    
    setTimeout(() => {
        target.classList.remove('tap-animation');
    }, 300);
}

function simulateHapticFeedback() {
    // Simulate iOS haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(10); // Very short vibration
    }
    
    // Visual feedback
    showFeedbackMessage('Haptic feedback', 'ios');
}

function simulateRippleEffect() {
    // Simulate Android ripple effect
    if (navigator.vibrate) {
        navigator.vibrate(20); // Slightly longer vibration
    }
    
    // Visual feedback
    showFeedbackMessage('Material ripple', 'android');
}

function initLongPressGestures() {
    const longPressElements = document.querySelectorAll('.mobile-screen button');
    
    longPressElements.forEach(element => {
        let pressTimer;
        
        element.addEventListener('mousedown', function() {
            pressTimer = setTimeout(() => {
                simulateLongPress(this);
            }, 500);
        });
        
        element.addEventListener('mouseup', function() {
            clearTimeout(pressTimer);
        });
        
        element.addEventListener('mouseleave', function() {
            clearTimeout(pressTimer);
        });
        
        // Touch events
        element.addEventListener('touchstart', function() {
            pressTimer = setTimeout(() => {
                simulateLongPress(this);
            }, 500);
        });
        
        element.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
    });
}

function simulateLongPress(element) {
    element.classList.add('long-press-feedback');
    
    setTimeout(() => {
        element.classList.remove('long-press-feedback');
    }, 600);
    
    showFeedbackMessage('Long press detected', 'info');
}

function initSwipeGestures() {
    const swipeElements = document.querySelectorAll('.mobile-screen');
    
    swipeElements.forEach(element => {
        let startX, startY, endX, endY;
        
        element.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        element.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    simulateSwipe('right');
                } else if (deltaX < -50) {
                    simulateSwipe('left');
                }
            } else {
                if (deltaY > 50) {
                    simulateSwipe('down');
                } else if (deltaY < -50) {
                    simulateSwipe('up');
                }
            }
        });
    });
}

function simulateSwipe(direction) {
    switch (direction) {
        case 'right':
            showFeedbackMessage('Swipe right - Back navigation', 'ios');
            break;
        case 'left':
            showFeedbackMessage('Swipe left - Forward navigation', 'info');
            break;
        case 'up':
            showFeedbackMessage('Swipe up - Bottom sheet', 'android');
            break;
        case 'down':
            showFeedbackMessage('Pull to refresh', 'success');
            break;
    }
}

// Interactive Elements
function initInteractiveElements() {
    // Button interactions
    const interactiveButtons = document.querySelectorAll('.interactive-demo button');
    interactiveButtons.forEach(button => {
        button.addEventListener('click', function() {
            simulateButtonInteraction(this);
        });
    });
    
    // Progress bar animations
    initProgressBarAnimations();
    
    // Modal demonstrations
    initModalDemonstrations();
}

function simulateButtonInteraction(button) {
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Processing...';
    button.disabled = true;
    
    setTimeout(() => {
        // Show success state
        button.innerHTML = '<i class="fas fa-check mr-2"></i>Complete!';
        button.classList.add('success-state');
        
        setTimeout(() => {
            // Reset to original state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('success-state');
        }, 1500);
    }, 1000);
}

function initProgressBarAnimations() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateProgressBar(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
}

function animateProgressBar(progressBar) {
    const fill = progressBar.querySelector('.progress-fill');
    if (fill) {
        const targetWidth = fill.style.width || '0%';
        fill.style.width = '0%';
        
        setTimeout(() => {
            fill.style.width = targetWidth;
        }, 100);
    }
}

function initModalDemonstrations() {
    // Add modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalType = this.getAttribute('data-modal');
            showDemoModal(modalType);
        });
    });
}

function showDemoModal(type) {
    let modalContent = '';
    
    switch (type) {
        case 'ios':
            modalContent = createIOSModal();
            break;
        case 'android':
            modalContent = createAndroidModal();
            break;
        default:
            modalContent = createGenericModal();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = modalContent;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close modal functionality
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
}

function createIOSModal() {
    return `
        <div class="modal-content animate-scale-in">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-ios-blue rounded-full mx-auto mb-4 flex items-center justify-center">
                    <i class="fab fa-apple text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">iOS Modal Example</h3>
                <p class="text-gray-600">This demonstrates iOS-style modal presentation</p>
            </div>
            
            <div class="space-y-4 mb-6">
                <button class="ios-button w-full">Primary Action</button>
                <button class="border-2 border-ios-blue text-ios-blue px-6 py-3 rounded-lg font-semibold w-full">
                    Secondary Action
                </button>
            </div>
            
            <button class="close-modal text-gray-500 hover:text-gray-700 text-center w-full">
                Cancel
            </button>
        </div>
    `;
}

function createAndroidModal() {
    return `
        <div class="modal-content animate-slide-in-bottom">
            <div class="bottom-sheet-handle"></div>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-android-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <i class="fab fa-android text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Material Bottom Sheet</h3>
                <p class="text-gray-600">This demonstrates Material Design bottom sheet</p>
            </div>
            
            <div class="space-y-4 mb-6">
                <button class="material-button w-full">Confirm Action</button>
                <button class="border-2 border-android-primary text-android-primary px-6 py-3 rounded-2xl font-medium w-full">
                    Alternative Action
                </button>
            </div>
            
            <button class="close-modal text-gray-500 hover:text-gray-700 text-center w-full">
                Dismiss
            </button>
        </div>
    `;
}

function closeModal(modal) {
    modal.classList.remove('active');
    
    setTimeout(() => {
        modal.remove();
    }, 300);
}

// Feedback Messages
function showFeedbackMessage(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${getIconForType(type)} mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        case 'ios': return 'mobile-alt';
        case 'android': return 'robot';
        default: return 'info-circle';
    }
}

// Mobile Feature Detection
function detectMobileFeatures() {
    const body = document.body;
    
    // Touch device detection
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        body.classList.add('touch');
    } else {
        body.classList.add('no-touch');
    }
    
    // Platform detection
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        body.classList.add('ios-platform');
    } else if (userAgent.includes('android')) {
        body.classList.add('android-platform');
    }
    
    // Feature support detection
    if ('vibrate' in navigator) {
        body.classList.add('haptic-support');
    }
    
    if ('serviceWorker' in navigator) {
        body.classList.add('pwa-support');
    }
}

// Scroll Animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.mobile-screen-container, .flow-content, .design-system-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => observer.observe(element));
}

// Touch Event Handlers
function initTouchHandlers() {
    // Prevent default touch behaviors on prototype elements
    const prototypes = document.querySelectorAll('.mobile-screen');
    prototypes.forEach(prototype => {
        prototype.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    });
    
    // Add touch feedback
    const touchElements = document.querySelectorAll('button, .ios-button, .material-button');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        
        element.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
    });
}

// Utility Functions
function debounce(func, wait) {
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Performance Monitoring
function initPerformanceMonitoring() {
    // Monitor interaction latency
    const interactions = ['click', 'touchstart', 'keydown'];
    
    interactions.forEach(eventType => {
        document.addEventListener(eventType, function() {
            const start = performance.now();
            
            requestAnimationFrame(() => {
                const end = performance.now();
                const latency = end - start;
                
                if (latency > 16) { // More than one frame
                    console.warn(`Interaction latency: ${latency.toFixed(2)}ms`);
                }
            });
        });
    });
}

// Accessibility Enhancements
function initAccessibility() {
    // Add keyboard navigation for mobile prototypes
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            simulateSwipe('left');
        } else if (e.key === 'ArrowLeft') {
            simulateSwipe('right');
        } else if (e.key === 'ArrowUp') {
            simulateSwipe('down');
        } else if (e.key === 'ArrowDown') {
            simulateSwipe('up');
        }
    });
    
    // Add focus management for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) {
                closeModal(activeModal);
            }
        }
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Mobile UI Showcase Error:', e.error);
    showFeedbackMessage('An error occurred. Please refresh the page.', 'error');
});

// Initialize additional features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initPerformanceMonitoring();
    initAccessibility();
});

// Export functions for global access
window.switchIOSScreen = switchIOSScreen;
window.switchAndroidScreen = switchAndroidScreen;
window.simulateTapGesture = simulateTapGesture;
window.showDemoModal = showDemoModal;

console.log('Mobile UI Showcase - JavaScript loaded successfully! 📱');
