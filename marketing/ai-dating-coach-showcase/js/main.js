// AI Dating Coach Showcase - Interactive JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initMobileMenu();
    initSmoothScrolling();
    initDemoFunctionality();
    initAnimations();
    initFormHandlers();
    initProgressBars();
    initTabSwitching();
    
    // Add loading states
    addLoadingStates();
    
    // Initialize intersection observer for animations
    initScrollAnimations();
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

// Demo Functionality
function initDemoFunctionality() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const suggestBtn = document.getElementById('suggest-btn');
    const analysisContent = document.getElementById('analysis-content');
    const demoMessage = document.getElementById('demo-message');
    const demoCursor = document.getElementById('demo-cursor');
    
    if (analyzeBtn && suggestBtn && analysisContent) {
        // Analyze button functionality
        analyzeBtn.addEventListener('click', function() {
            // Add loading state
            this.classList.add('loading');
            this.disabled = true;
            
            // Simulate AI analysis
            setTimeout(() => {
                // Remove loading state
                this.classList.remove('loading');
                this.disabled = false;
                
                // Update analysis content with animation
                analysisContent.innerHTML = `
                    <div class="flex items-start mb-2 chat-message">
                        <i class="fas fa-brain text-purple-500 mr-2 mt-1"></i>
                        <span>Advanced sentiment analysis complete: Positive engagement detected!</span>
                    </div>
                    <div class="flex items-start mb-2 chat-message">
                        <i class="fas fa-chart-line text-green-500 mr-2 mt-1"></i>
                        <span>Engagement Score: 9.2/10 - Excellent conversation flow!</span>
                    </div>
                    <div class="flex items-start chat-message">
                        <i class="fas fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
                        <span>They're showing high interest - perfect time to suggest meeting!</span>
                    </div>
                `;
                
                // Add success indicator
                this.classList.add('success-indicator', 'completed');
            }, 1500);
        });
        
        // Suggest button functionality
        suggestBtn.addEventListener('click', function() {
            this.classList.add('loading');
            this.disabled = true;
            
            // Simulate AI suggestion generation
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
                
                // Typing effect for new message
                if (demoMessage && demoCursor) {
                    const suggestions = [
                        "That sounds amazing! I'd love to explore it with someone who knows the best spots. Would you be up for showing me around this weekend?",
                        "I've been wanting to try hiking there! Would you be interested in being my hiking guide? I promise I'll bring the snacks 😊",
                        "Perfect! I've been looking for a hiking buddy. How about we make it a proper adventure this Saturday?"
                    ];
                    
                    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                    typewriterEffect(demoMessage, randomSuggestion, demoCursor);
                }
                
                this.classList.add('success-indicator', 'completed');
            }, 1200);
        });
    }
}

// Typewriter effect for demo
function typewriterEffect(element, text, cursor) {
    element.textContent = '';
    cursor.style.display = 'inline';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            cursor.style.display = 'none';
        }
    }, 50);
}

// Initialize animations
function initAnimations() {
    // Add floating animation to hero image
    const heroImage = document.querySelector('.hero-dating-couple');
    if (heroImage) {
        heroImage.classList.add('float-animation');
    }
    
    // Add pulse glow to CTA buttons
    const ctaButtons = document.querySelectorAll('.bg-primary-600, .bg-accent-600');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('pulse-glow');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('pulse-glow');
        });
    });
    
    // Feature card hover effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Form handlers for CTAs
function initFormHandlers() {
    // Handle all CTA buttons
    const ctaButtons = document.querySelectorAll('button');
    
    ctaButtons.forEach(button => {
        if (button.textContent.includes('Start') || button.textContent.includes('Get Started')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showSignupModal();
            });
        }
        
        if (button.textContent.includes('Demo') || button.textContent.includes('Watch')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showDemoModal();
            });
        }
    });
}

// Progress bar animations
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar .bg-success-500, .bg-primary-500, .bg-accent-500');
    
    const animateProgressBar = (bar, targetWidth) => {
        let currentWidth = 0;
        const increment = targetWidth / 50; // 50 steps for smooth animation
        
        const animation = setInterval(() => {
            if (currentWidth >= targetWidth) {
                clearInterval(animation);
                return;
            }
            
            currentWidth += increment;
            bar.style.width = `${Math.min(currentWidth, targetWidth)}%`;
        }, 20);
    };
    
    // Trigger animations when bars come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const targetWidth = parseInt(bar.style.width) || 85; // Default width
                animateProgressBar(bar, targetWidth);
                observer.unobserve(bar);
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// Tab switching functionality
function initTabSwitching() {
    const tabs = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('[data-tab-content]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active classes from all tabs and contents
            tabs.forEach(t => t.classList.remove('active', 'bg-primary-600', 'text-white'));
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Add active classes to current tab and show content
            this.classList.add('active', 'bg-primary-600', 'text-white');
            
            const targetContent = document.querySelector(`[data-tab-content="${targetTab}"]`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}

// Loading states for buttons
function addLoadingStates() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('loading')) {
                // Add ripple effect
                const ripple = document.createElement('div');
                ripple.className = 'absolute inset-0 bg-white bg-opacity-20 rounded-lg transform scale-0';
                this.appendChild(ripple);
                
                // Animate ripple
                setTimeout(() => {
                    ripple.style.transform = 'scale(1)';
                    ripple.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (this.contains(ripple)) {
                            this.removeChild(ripple);
                        }
                    }, 300);
                }, 10);
            }
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Modal functionality
function showSignupModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    // Create modal content
    modalOverlay.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full relative animate-scale-in">
            <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Start Your Free Trial</h3>
                <p class="text-gray-600">Join thousands of successful daters today</p>
            </div>
            
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="your@email.com" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Choose Your Plan</label>
                    <select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="free">Spark - Free Forever</option>
                        <option value="premium">Premium - $19.99/month</option>
                        <option value="elite">Elite - $39.99/month</option>
                    </select>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="terms" class="mr-2" required>
                    <label for="terms" class="text-sm text-gray-600">I agree to the <a href="#" class="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" class="text-primary-600 hover:underline">Privacy Policy</a></label>
                </div>
                
                <button type="submit" class="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                    Start Free Trial
                </button>
            </form>
            
            <div class="text-center mt-4 text-sm text-gray-500">
                <i class="fas fa-lock mr-1"></i>
                Your data is secure and protected
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Handle form submission
    const form = modalOverlay.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show success message
        const formContainer = modalOverlay.querySelector('.bg-white');
        formContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-green-600 text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Dating Coach!</h3>
                <p class="text-gray-600 mb-6">Check your email for setup instructions and your private AI coach number.</p>
                <button onclick="this.closest('.fixed').remove()" class="bg-primary-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                    Get Started
                </button>
            </div>
        `;
    });
}

function showDemoModal() {
    // Create demo modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    
    modalOverlay.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
            <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10" onclick="this.closest('.fixed').remove()">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">AI Dating Coach Demo</h3>
                <p class="text-gray-600">See how our AI analyzes and improves your dating conversations</p>
            </div>
            
            <div class="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <div class="text-center">
                    <i class="fas fa-play-circle text-6xl text-primary-600 mb-4"></i>
                    <p class="text-gray-600">Interactive Demo Video</p>
                    <p class="text-sm text-gray-500">Click to start the demo experience</p>
                </div>
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 text-center">
                <div class="p-4">
                    <i class="fas fa-camera text-primary-600 text-2xl mb-2"></i>
                    <h4 class="font-semibold">Photo Analysis</h4>
                    <p class="text-sm text-gray-600">AI scoring of profile photos</p>
                </div>
                <div class="p-4">
                    <i class="fas fa-comments text-accent-600 text-2xl mb-2"></i>
                    <h4 class="font-semibold">Chat Analysis</h4>
                    <p class="text-sm text-gray-600">Real-time conversation feedback</p>
                </div>
                <div class="p-4">
                    <i class="fas fa-chart-line text-success-600 text-2xl mb-2"></i>
                    <h4 class="font-semibold">Progress Tracking</h4>
                    <p class="text-sm text-gray-600">Monitor your dating success</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
}

// Utility functions
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

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes scale-in {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .animate-scale-in {
        animation: scale-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Performance optimization - lazy load images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading if there are lazy images
document.addEventListener('DOMContentLoaded', initLazyLoading);

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => modal.remove());
    }
});

// Add touch support for mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - could trigger some action
            console.log('Swiped up');
        } else {
            // Swipe down - could trigger some action
            console.log('Swiped down');
        }
    }
}

console.log('AI Dating Coach Showcase - JavaScript loaded successfully! 🚀');
