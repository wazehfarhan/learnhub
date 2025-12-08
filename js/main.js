// Main JavaScript - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('LearnHub initialized');
    
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
    
    // Log initialization
    console.log('Main functionality initialized');
});

// Update user info in navigation
function updateUserInfo() {
    const data = storage.getUserData();
    if (!data || !data.user) return;
    
    // Update level and XP
    const levelEl = document.getElementById('userLevel');
    const currentXpEl = document.getElementById('currentXP');
    const maxXpEl = document.getElementById('maxXP');
    
    if (levelEl) levelEl.textContent = `Level ${data.user.level}`;
    if (currentXpEl) currentXpEl.textContent = data.user.xp;
    if (maxXpEl) maxXpEl.textContent = data.user.maxXP;
}

// Setup mobile menu - FIXED with event delegation
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        // Use event delegation for better reliability
        document.addEventListener('click', function(e) {
            if (e.target.closest('.mobile-menu-btn')) {
                navLinks.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.className = navLinks.classList.contains('active') ? 
                        'fas fa-times' : 'fas fa-bars';
                }
            } else if (!e.target.closest('.nav-links') && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
            }
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
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return 'Unknown date';
    }
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
        const originalContent = element.innerHTML;
        element.setAttribute('data-original-content', originalContent);
        element.innerHTML = '<div class="spinner"></div>';
        element.classList.add('loading');
    }
}

// Hide loading spinner
function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }
    }
}

// Get URL parameters
function getUrlParams() {
    try {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    } catch (error) {
        console.error('Error getting URL params:', error);
        return {};
    }
}

// Set URL parameter
function setUrlParam(key, value) {
    try {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    } catch (error) {
        console.error('Error setting URL param:', error);
    }
}

// Remove URL parameter
function removeUrlParam(key) {
    try {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    } catch (error) {
        console.error('Error removing URL param:', error);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            storage.showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            storage.showNotification('Failed to copy', 'error');
        }
        document.body.removeChild(textArea);
        return;
    }
    
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
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// Truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
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
    if (!hexcolor) return '#000000';
    
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length !== 6) return '#000000';
    
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

// Calculate reading time
function calculateReadingTime(text) {
    if (!text) return 0;
    
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
    if (!file) {
        storage.showNotification('Please select a file', 'error');
        return;
    }
    
    storage.importData(file)
        .then(() => {
            setTimeout(() => window.location.reload(), 1000);
        })
        .catch(error => {
            console.error('Import failed:', error);
        });
}

// Clear all data
function clearAllData() {
    storage.clearAllData();
}

// Check if first time user
function checkFirstTimeUser() {
    const userCourses = storage.getUserCourses();
    
    if (userCourses.length === 0) {
        // Show welcome tip after a delay
        setTimeout(() => {
            storage.showNotification('🎉 Welcome to LearnHub! Click "Create Course" to start.', 'info');
        }, 2000);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
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
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/service-worker.js').then(() => {
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

// Global view course function
function viewCourse(courseId) {
    if (!courseId) {
        storage.showNotification('Invalid course ID', 'error');
        return;
    }
    
    window.location.href = `course.html?id=${courseId}`;
}

// Global edit course function
function editCourse(courseId) {
    if (!courseId) {
        storage.showNotification('Invalid course ID', 'error');
        return;
    }
    
    window.location.href = `create-course.html?id=${courseId}`;
}

// Global delete course function
function deleteCourse(courseId, courseTitle) {
    if (!courseId) {
        storage.showNotification('Invalid course ID', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${courseTitle || 'this course'}"? This action cannot be undone.`)) {
        const success = storage.deleteUserCourse(courseId);
        if (success) {
            storage.showNotification('Course deleted successfully', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            storage.showNotification('Failed to delete course', 'error');
        }
    }
}

// Add global event listener for dynamic content
document.addEventListener('click', function(e) {
    // Handle all button clicks with data attributes
    if (e.target.closest('[data-action]')) {
        const element = e.target.closest('[data-action]');
        const action = element.getAttribute('data-action');
        const courseId = element.getAttribute('data-course-id');
        const courseTitle = element.getAttribute('data-course-title');
        
        switch(action) {
            case 'view-course':
                viewCourse(courseId);
                break;
            case 'edit-course':
                editCourse(courseId);
                break;
            case 'delete-course':
                deleteCourse(courseId, courseTitle);
                break;
        }
    }
});

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    storage.showNotification('An error occurred. Please try again.', 'error');
});

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('Uncaught error:', event.error);
});