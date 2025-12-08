// Main JavaScript for shared functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    const savedTheme = storage.getCurrentTheme();
    storage.applyTheme(savedTheme);
    
    // Setup theme toggle
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === 'dark';
        themeSwitch.addEventListener('change', function() {
            const newTheme = storage.toggleTheme();
            this.checked = newTheme === 'dark';
        });
    }
    
    // Update streak on page load
    storage.updateStreak();
    
    // Update user info in navigation
    updateUserInfo();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Add animations to progress bars
    animateProgressBars();
    
    // Check for notifications
    checkFirstTimeUser();
});

// Update user info in navigation
function updateUserInfo() {
    const data = storage.getUserData();
    
    // Update level and XP
    const levelEl = document.getElementById('userLevel');
    const currentXpEl = document.getElementById('currentXP');
    const maxXpEl = document.getElementById('maxXP');
    
    if (levelEl) levelEl.textContent = `Level ${data.user.level}`;
    if (currentXpEl) currentXpEl.textContent = data.user.xp;
    if (maxXpEl) maxXpEl.textContent = data.user.maxXP;
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.innerHTML = navLinks.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// Animate progress bars
function animateProgressBars() {
    const progressFills = document.querySelectorAll('.progress-fill');
    
    progressFills.forEach(progressFill => {
        const progress = progressFill.getAttribute('data-progress') || 
                        progressFill.style.width.replace('%', '');
        
        if (progress && progress > 0) {
            progressFill.style.width = '0%';
            
            // Animate after a short delay
            setTimeout(() => {
                progressFill.style.width = `${progress}%`;
                progressFill.classList.add('animated');
            }, 100);
        }
    });
}

// Load user data
function loadUserData() {
    updateUserInfo();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format time
function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
}

// Format duration
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m`;
    } else {
        return `${Math.floor(seconds / 3600)}h`;
    }
}

// Debounce function
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

// Throttle function
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
    };
}

// Show loading spinner
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="spinner"></div>';
        element.classList.add('loading');
    }
}

// Hide loading spinner
function hideLoading(element, content) {
    if (element) {
        element.classList.remove('loading');
        if (content) {
            element.innerHTML = content;
        }
    }
}

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params) {
        result[key] = value;
    }
    
    return result;
}

// Set URL parameter
function setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

// Remove URL parameter
function removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        storage.showNotification('Copied to clipboard!', 'success');
    }).catch(err => {
        storage.showNotification('Failed to copy', 'error');
    });
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate YouTube URL
function validateYouTubeUrl(url) {
    const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return regExp.test(url);
}

// Extract YouTube video ID
function extractYouTubeId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Get random color
function getRandomColor() {
    const colors = [
        '#4361ee', '#3a0ca3', '#4cc9f0',
        '#7209b7', '#f72585', '#560bad',
        '#4895ef', '#3f37c9', '#4cc9f0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Get contrast color
function getContrastColor(hexcolor) {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

// Calculate reading time
function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    return time;
}

// Export data
function exportData() {
    storage.exportData();
}

// Import data
function importData(file) {
    storage.importData(file);
}

// Clear all data
function clearAllData() {
    storage.clearAllData();
}

// Check if first time user
function checkFirstTimeUser() {
    const data = storage.getUserData();
    const userCourses = data.userCourses || [];
    
    if (userCourses.length === 0 && window.location.pathname.includes('index.html')) {
        // Show welcome tip after a delay
        setTimeout(() => {
            storage.showNotification('💡 Tip: Start by creating your first course! Click "Create Course" above.', 'info');
        }, 2000);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Detect device type
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTablet() {
    return /iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(navigator.userAgent);
}

// PWA Installation
function installPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('Service Worker registered');
        }).catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
}

// Initialize PWA
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', installPWA);
}