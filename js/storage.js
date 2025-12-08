// LocalStorage Manager - FIXED VERSION
class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'learnhub_data_v2';
        this.initializeUserData();
    }

    // Initialize user data with proper structure
    initializeUserData() {
        let data = this.getUserData();
        
        if (!data || !data.user) {
            const initialData = {
                user: {
                    name: "Learner",
                    level: 1,
                    xp: 0,
                    maxXP: 100,
                    streak: 0,
                    lastLogin: null,
                    badges: [],
                    totalStudyTime: 0
                },
                progress: {},
                completedLessons: {},
                courseNotes: {},
                recentCourses: [],
                achievements: [],
                theme: 'light',
                userCourses: [],
                studyHistory: [],
                comments: {},
                resources: {},
                dailyGoals: {},
                lastUpdated: new Date().toISOString()
            };
            
            this.saveUserData(initialData);
            console.log('Initialized new user data');
        }
    }

    // Get all user data
    getUserData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading user data:', error);
            return null;
        }
    }

    // Save user data
    saveUserData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    // Update data with partial changes
    updateUserData(updates) {
        const data = this.getUserData();
        const updatedData = { ...data, ...updates };
        return this.saveUserData(updatedData);
    }

    // Update user XP and level
    updateXP(points) {
        const data = this.getUserData();
        if (!data || !data.user) return;
        
        data.user.xp += points;
        
        // Level up logic
        while (data.user.xp >= data.user.maxXP) {
            data.user.xp -= data.user.maxXP;
            data.user.level += 1;
            data.user.maxXP = Math.floor(data.user.maxXP * 1.5);
            
            // Add level up achievement
            this.addAchievement(`Level ${data.user.level} Reached!`, 'level-up', 50);
            this.showNotification(`🎉 Level Up! You're now Level ${data.user.level}`, 'success');
        }
        
        this.saveUserData(data);
        this.updateUI();
        return data.user;
    }

    // Update streak
    updateStreak() {
        const data = this.getUserData();
        if (!data || !data.user) return 0;
        
        const today = new Date().toDateString();
        const lastLogin = data.user.lastLogin ? new Date(data.user.lastLogin).toDateString() : null;
        
        if (lastLogin === today) {
            return data.user.streak;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin === yesterday.toDateString()) {
            // Consecutive day
            data.user.streak += 1;
            
            // Streak achievements
            if (data.user.streak === 3) {
                this.addAchievement('3-Day Streak!', 'streak', 25);
            } else if (data.user.streak === 7) {
                this.addAchievement('Weekly Warrior!', 'streak', 50);
            } else if (data.user.streak === 30) {
                this.addAchievement('Monthly Master!', 'streak', 100);
            }
        } else if (lastLogin && lastLogin !== yesterday.toDateString()) {
            // Broken streak
            data.user.streak = 1;
        } else {
            // First day
            data.user.streak = 1;
        }
        
        data.user.lastLogin = new Date().toISOString();
        this.saveUserData(data);
        
        if (data.user.streak > 1) {
            this.showNotification(`🔥 ${data.user.streak} Day Streak! Keep it up!`, 'success');
        }
        
        return data.user.streak;
    }

    // Add study session
    addStudySession(courseId, lessonId, duration) {
        const data = this.getUserData();
        if (!data) return null;
        
        if (!data.studyHistory) {
            data.studyHistory = [];
        }
        
        const session = {
            id: Date.now(),
            courseId: courseId,
            lessonId: lessonId,
            duration: duration,
            date: new Date().toISOString()
        };
        
        data.studyHistory.push(session);
        data.user.totalStudyTime = (data.user.totalStudyTime || 0) + duration;
        
        // Award XP for studying
        this.updateXP(Math.floor(duration / 5)); // 1 XP per 5 minutes
        
        this.saveUserData(data);
        return session;
    }

    // Mark lesson as completed
    markLessonCompleted(courseId, lessonId) {
        const data = this.getUserData();
        if (!data) return false;
        
        // Initialize course progress if not exists
        if (!data.progress[courseId]) {
            data.progress[courseId] = {
                completedLessons: [],
                lastAccessed: new Date().toISOString(),
                totalLessons: 0,
                lastLessonIndex: 0
            };
        }
        
        // Add lesson to completed if not already
        if (!data.progress[courseId].completedLessons.includes(lessonId)) {
            data.progress[courseId].completedLessons.push(lessonId);
            
            // Add to recent courses
            this.addRecentCourse(courseId);
            
            // Award XP
            this.updateXP(10);
            
            // Check for completion achievements
            const courseProgress = this.getCourseProgress(courseId);
            if (courseProgress === 100) {
                this.addAchievement(`Course Completed!`, 'course-complete', 100);
                this.showNotification('🎓 Course Completed! Great job!', 'success');
            }
            
            this.saveUserData(data);
            this.showNotification('✅ Lesson marked as completed! +10 XP', 'success');
            return true;
        }
        return false;
    }

    // Get course progress percentage
    getCourseProgress(courseId) {
        const data = this.getUserData();
        if (!data || !data.progress[courseId]) return 0;
        
        const course = this.getCourseById(courseId);
        if (!course || !course.lessons) return 0;
        
        const completedCount = data.progress[courseId].completedLessons.length;
        const totalCount = course.lessons.length;
        
        return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    }

    // Add recent course
    addRecentCourse(courseId) {
        const data = this.getUserData();
        if (!data) return;
        
        if (!data.recentCourses) {
            data.recentCourses = [];
        }
        
        // Remove if already exists
        data.recentCourses = data.recentCourses.filter(id => id !== courseId);
        
        // Add to beginning
        data.recentCourses.unshift(courseId);
        
        // Keep only last 5
        data.recentCourses = data.recentCourses.slice(0, 5);
        
        this.saveUserData(data);
    }

    // Get recent progress
    getRecentProgress() {
        const data = this.getUserData();
        if (!data || !data.progress) return [];
        
        const recentProgress = [];
        
        Object.keys(data.progress).forEach(courseId => {
            const progress = data.progress[courseId];
            if (progress && progress.lastAccessed) {
                recentProgress.push({
                    courseId: courseId,
                    progress: this.getCourseProgress(courseId),
                    lastAccessed: progress.lastAccessed,
                    lastLessonIndex: progress.lastLessonIndex || 0
                });
            }
        });
        
        // Sort by last accessed
        return recentProgress.sort((a, b) => 
            new Date(b.lastAccessed) - new Date(a.lastAccessed)
        ).slice(0, 3);
    }

    // Save course notes
    saveCourseNotes(courseId, lessonId, notes) {
        const data = this.getUserData();
        if (!data) return;
        
        if (!data.courseNotes) {
            data.courseNotes = {};
        }
        
        if (!data.courseNotes[courseId]) {
            data.courseNotes[courseId] = {};
        }
        
        data.courseNotes[courseId][lessonId] = notes;
        this.saveUserData(data);
    }

    // Get course notes
    getCourseNotes(courseId, lessonId) {
        const data = this.getUserData();
        return data?.courseNotes?.[courseId]?.[lessonId] || '';
    }

    // Add achievement/badge
    addAchievement(title, type, xpReward) {
        const data = this.getUserData();
        if (!data) return null;
        
        if (!data.achievements) {
            data.achievements = [];
        }
        
        // Check if already achieved
        const alreadyHas = data.achievements.some(ach => ach.title === title);
        if (alreadyHas) return null;
        
        const achievement = {
            id: Date.now(),
            title: title,
            type: type,
            xpReward: xpReward,
            date: new Date().toISOString(),
            icon: this.getAchievementIcon(type)
        };
        
        data.achievements.push(achievement);
        
        if (!data.user.badges) {
            data.user.badges = [];
        }
        
        data.user.badges.push(type);
        
        // Award XP
        this.updateXP(xpReward);
        
        this.saveUserData(data);
        this.showNotification(`🏆 Achievement Unlocked: ${title}! +${xpReward} XP`, 'success');
        
        return achievement;
    }

    // Get achievement icon
    getAchievementIcon(type) {
        const icons = {
            'level-up': 'fas fa-trophy',
            'streak': 'fas fa-fire',
            'course-complete': 'fas fa-graduation-cap',
            'first-lesson': 'fas fa-star',
            'note-taker': 'fas fa-sticky-note',
            'quick-learner': 'fas fa-bolt',
            'study-marathon': 'fas fa-brain',
            'first-course': 'fas fa-book',
            'social': 'fas fa-comments'
        };
        return icons[type] || 'fas fa-award';
    }

    // Toggle theme
    toggleTheme() {
        const data = this.getUserData();
        if (!data) return 'light';
        
        data.theme = data.theme === 'light' ? 'dark' : 'light';
        this.saveUserData(data);
        this.applyTheme(data.theme);
        return data.theme;
    }

    // Apply theme
    applyTheme(theme) {
        document.body.className = `${theme}-theme`;
        document.body.setAttribute('data-theme', theme);
        
        // Update theme switch if exists
        const themeSwitch = document.getElementById('theme-switch');
        if (themeSwitch) {
            themeSwitch.checked = theme === 'dark';
        }
    }

    // Get current theme
    getCurrentTheme() {
        const data = this.getUserData();
        return data?.theme || 'light';
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('slide-out');
            setTimeout(() => {
                if (notification.parentNode === container) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('slide-out');
            setTimeout(() => {
                if (notification.parentNode === container) {
                    container.removeChild(notification);
                }
            }, 300);
        });
        
        return notification;
    }

    // Get course by ID
    getCourseById(courseId) {
        const data = this.getUserData();
        if (!data || !data.userCourses) return null;
        
        // First check user courses
        const userCourse = data.userCourses.find(c => c.id == courseId);
        if (userCourse) return userCourse;
        
        // Check default courses
        if (window.defaultCourses) {
            return window.defaultCourses.defaultCourses?.find(c => c.id == courseId);
        }
        
        return null;
    }

    // Update UI elements
    updateUI() {
        const data = this.getUserData();
        if (!data || !data.user) return;
        
        // Update XP and level display
        const levelEl = document.getElementById('userLevel');
        const currentXpEl = document.getElementById('currentXP');
        const maxXpEl = document.getElementById('maxXP');
        
        if (levelEl) levelEl.textContent = `Level ${data.user.level}`;
        if (currentXpEl) currentXpEl.textContent = data.user.xp;
        if (maxXpEl) maxXpEl.textContent = data.user.maxXP;
        
        // Update progress bars
        document.querySelectorAll('.progress-fill').forEach(progressFill => {
            const progress = progressFill.getAttribute('data-progress');
            if (progress) {
                progressFill.style.width = `${progress}%`;
            }
        });
    }

    // Get all achievements
    getAchievements() {
        const data = this.getUserData();
        return data?.achievements || [];
    }

    // Get user stats
    getUserStats() {
        const data = this.getUserData();
        if (!data) return {
            level: 1,
            xp: 0,
            maxXP: 100,
            streak: 0,
            totalCourses: 0,
            totalLessons: 0,
            completedLessons: 0,
            completionRate: 0,
            badges: 0,
            totalStudyTime: 0
        };
        
        const userCourses = data.userCourses || [];
        let totalLessons = 0;
        let completedLessons = 0;
        
        userCourses.forEach(course => {
            if (course.lessons) {
                totalLessons += course.lessons.length;
                const progress = this.getCourseProgress(course.id);
                completedLessons += Math.floor((progress / 100) * course.lessons.length);
            }
        });
        
        return {
            level: data.user.level || 1,
            xp: data.user.xp || 0,
            maxXP: data.user.maxXP || 100,
            streak: data.user.streak || 0,
            totalCourses: userCourses.length,
            totalLessons: totalLessons,
            completedLessons: completedLessons,
            completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            badges: data.user.badges?.length || 0,
            totalStudyTime: data.user.totalStudyTime || 0
        };
    }

    // USER COURSES MANAGEMENT

    // Get user courses
    getUserCourses() {
        const data = this.getUserData();
        return data?.userCourses || [];
    }

    // Save user courses
    saveUserCourses(courses) {
        const data = this.getUserData();
        if (!data) return false;
        
        data.userCourses = courses;
        data.lastUpdated = new Date().toISOString();
        return this.saveUserData(data);
    }

    // Add a new course
    addUserCourse(course) {
        const courses = this.getUserCourses();
        
        // Generate unique ID
        course.id = Date.now();
        course.createdAt = new Date().toISOString();
        course.updatedAt = new Date().toISOString();
        course.lessons = course.lessons || [];
        course.icon = course.icon || 'fas fa-book';
        course.color = course.color || '#4361ee';
        course.tags = course.tags || [];
        course.resources = course.resources || [];
        
        courses.push(course);
        const success = this.saveUserCourses(courses);
        
        if (success) {
            // Add achievement for first course
            if (courses.length === 1) {
                this.addAchievement('First Course Created!', 'first-course', 25);
            }
            
            this.showNotification('Course created successfully!', 'success');
            return course;
        }
        
        return null;
    }

    // Update a course
    updateUserCourse(courseId, updates) {
        const courses = this.getUserCourses();
        const index = courses.findIndex(c => c.id == courseId);
        
        if (index === -1) return false;
        
        updates.updatedAt = new Date().toISOString();
        courses[index] = { ...courses[index], ...updates };
        
        const success = this.saveUserCourses(courses);
        
        if (success) {
            this.showNotification('Course updated successfully!', 'success');
            return true;
        }
        
        return false;
    }

    // Delete a course
    deleteUserCourse(courseId) {
        const courses = this.getUserCourses();
        const filteredCourses = courses.filter(c => c.id != courseId);
        const success = this.saveUserCourses(filteredCourses);
        
        if (success) {
            // Also remove progress for this course
            const data = this.getUserData();
            if (data.progress && data.progress[courseId]) {
                delete data.progress[courseId];
                this.saveUserData(data);
            }
            
            this.showNotification('Course deleted successfully', 'success');
            return true;
        }
        
        return false;
    }

    // Add lesson to course
    addLessonToCourse(courseId, lesson) {
        const courses = this.getUserCourses();
        const courseIndex = courses.findIndex(c => c.id == courseId);
        
        if (courseIndex === -1) return null;
        
        // Generate lesson ID
        lesson.id = Date.now();
        lesson.createdAt = new Date().toISOString();
        lesson.completed = false;
        lesson.notes = "";
        
        if (!courses[courseIndex].lessons) {
            courses[courseIndex].lessons = [];
        }
        
        courses[courseIndex].lessons.push(lesson);
        courses[courseIndex].updatedAt = new Date().toISOString();
        
        const success = this.saveUserCourses(courses);
        
        if (success) {
            this.showNotification('Lesson added successfully!', 'success');
            return lesson;
        }
        
        return null;
    }

    // Update lesson
    updateLesson(courseId, lessonId, updates) {
        const courses = this.getUserCourses();
        const courseIndex = courses.findIndex(c => c.id == courseId);
        
        if (courseIndex === -1) return false;
        
        const lessonIndex = courses[courseIndex].lessons.findIndex(l => l.id == lessonId);
        if (lessonIndex === -1) return false;
        
        courses[courseIndex].lessons[lessonIndex] = {
            ...courses[courseIndex].lessons[lessonIndex],
            ...updates
        };
        
        courses[courseIndex].updatedAt = new Date().toISOString();
        const success = this.saveUserCourses(courses);
        
        return success;
    }

    // Delete lesson
    deleteLesson(courseId, lessonId) {
        const courses = this.getUserCourses();
        const courseIndex = courses.findIndex(c => c.id == courseId);
        
        if (courseIndex === -1) return false;
        
        courses[courseIndex].lessons = courses[courseIndex].lessons.filter(l => l.id != lessonId);
        courses[courseIndex].updatedAt = new Date().toISOString();
        const success = this.saveUserCourses(courses);
        
        return success;
    }

    // Get course with lessons
    getCourseWithLessons(courseId) {
        return this.getCourseById(courseId);
    }

    // Get recent study sessions
    getRecentStudySessions(limit = 10) {
        const data = this.getUserData();
        const sessions = data?.studyHistory || [];
        return sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    }

    // Get daily study time
    getDailyStudyTime(date = new Date()) {
        const data = this.getUserData();
        const sessions = data?.studyHistory || [];
        const dateStr = date.toDateString();
        
        return sessions
            .filter(s => new Date(s.date).toDateString() === dateStr)
            .reduce((total, s) => total + s.duration, 0);
    }

    // Export all data
    exportData() {
        const data = this.getUserData();
        if (!data) {
            this.showNotification('No data to export', 'error');
            return;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learnhub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!', 'success');
    }

    // Import data
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data structure
                    if (!importedData.user || !importedData.userCourses) {
                        throw new Error('Invalid data format');
                    }
                    
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(importedData));
                    this.showNotification('Data imported successfully!', 'success');
                    resolve(true);
                } catch (error) {
                    console.error('Import error:', error);
                    this.showNotification('Invalid file format or corrupted data', 'error');
                    reject(error);
                }
            };
            reader.onerror = () => {
                this.showNotification('Error reading file', 'error');
                reject(new Error('File read error'));
            };
            reader.readAsText(file);
        });
    }

    // Clear all data
    clearAllData() {
        if (confirm('⚠️ WARNING: This will delete ALL your data including courses, progress, and achievements. This cannot be undone. Are you sure?')) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.initializeUserData();
            this.showNotification('All data cleared successfully!', 'success');
            setTimeout(() => window.location.reload(), 1500);
            return true;
        }
        return false;
    }

    // Check data integrity
    checkDataIntegrity() {
        const data = this.getUserData();
        if (!data) return false;
        
        // Check required fields
        const requiredFields = ['user', 'userCourses', 'progress', 'achievements'];
        for (const field of requiredFields) {
            if (!data[field]) {
                console.warn(`Missing required field: ${field}`);
                return false;
            }
        }
        
        return true;
    }

    // Migrate old data if exists
    migrateOldData() {
        const oldData = localStorage.getItem('learnhub_user');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                // Convert to new format
                const newData = {
                    user: parsed.user || {
                        name: "Learner",
                        level: 1,
                        xp: 0,
                        maxXP: 100,
                        streak: 0,
                        lastLogin: null,
                        badges: [],
                        totalStudyTime: 0
                    },
                    progress: parsed.progress || {},
                    completedLessons: parsed.completedLessons || {},
                    courseNotes: parsed.courseNotes || {},
                    recentCourses: parsed.recentCourses || [],
                    achievements: parsed.achievements || [],
                    theme: parsed.theme || 'light',
                    userCourses: parsed.userCourses || [],
                    studyHistory: parsed.studyHistory || [],
                    comments: parsed.comments || {},
                    resources: parsed.resources || {},
                    dailyGoals: parsed.dailyGoals || {},
                    lastUpdated: new Date().toISOString()
                };
                
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
                localStorage.removeItem('learnhub_user');
                console.log('Migrated old data to new format');
                return true;
            } catch (error) {
                console.error('Migration failed:', error);
                return false;
            }
        }
        return false;
    }
}

// Initialize storage manager
const storage = new StorageManager();

// Load default courses
function loadDefaultCourses() {
    // Only load if no user courses exist
    if (storage.getUserCourses().length === 0) {
        try {
            // Create default courses programmatically
            const defaultCourses = [
                {
                    id: 1001,
                    title: "JavaScript Basics",
                    description: "Learn the fundamentals of JavaScript programming",
                    category: "Programming",
                    difficulty: "beginner",
                    icon: "fab fa-js",
                    color: "#f0db4f",
                    tags: ["javascript", "programming", "web", "beginner"],
                    createdAt: "2024-01-01T00:00:00.000Z",
                    updatedAt: "2024-01-01T00:00:00.000Z",
                    lessons: [
                        {
                            id: 101,
                            title: "Introduction to JavaScript",
                            type: "video",
                            content: "PkZNo7MFNFg",
                            duration: 15,
                            order: 1,
                            description: "What is JavaScript and why it's important",
                            createdAt: "2024-01-01T00:00:00.000Z"
                        },
                        {
                            id: 102,
                            title: "Variables and Data Types",
                            type: "article",
                            content: "Learn about variables, strings, numbers, booleans, and other data types in JavaScript.",
                            duration: 20,
                            order: 2,
                            description: "Understanding JavaScript data types",
                            createdAt: "2024-01-01T00:00:00.000Z"
                        }
                    ],
                    resources: []
                }
            ];
            
            // Add default courses
            defaultCourses.forEach(course => {
                storage.addUserCourse(course);
            });
            
            console.log('Loaded default courses');
        } catch (error) {
            console.error('Error loading default courses:', error);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check and migrate old data
    storage.migrateOldData();
    
    // Load default courses if needed
    setTimeout(loadDefaultCourses, 1000);
    
    // Initialize theme
    const savedTheme = storage.getCurrentTheme();
    storage.applyTheme(savedTheme);
    
    // Update streak
    storage.updateStreak();
});