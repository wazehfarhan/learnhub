// LocalStorage Manager for Learning Platform
class StorageManager {
    constructor() {
        this.initializeUserData();
    }

    // Initialize user data if not exists
    initializeUserData() {
        if (!localStorage.getItem('learnhub_user')) {
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
                studyHistory: []
            };
            localStorage.setItem('learnhub_user', JSON.stringify(initialData));
            this.showNotification('Welcome to LearnHub! Start creating your courses.', 'success');
        }
    }

    // Get all user data
    getUserData() {
        return JSON.parse(localStorage.getItem('learnhub_user')) || {};
    }

    // Save user data
    saveUserData(data) {
        localStorage.setItem('learnhub_user', JSON.stringify(data));
    }

    // Update user XP and level
    updateXP(points) {
        const data = this.getUserData();
        data.user.xp += points;
        
        // Level up logic
        while (data.user.xp >= data.user.maxXP) {
            data.user.xp -= data.user.maxXP;
            data.user.level += 1;
            data.user.maxXP = Math.floor(data.user.maxXP * 1.5);
            
            // Add level up achievement
            this.addAchievement(`Reached Level ${data.user.level}`, 'level-up', 50);
            this.showNotification(`🎉 Level Up! You're now Level ${data.user.level}`, 'success');
        }
        
        this.saveUserData(data);
        this.updateUI();
        return data.user;
    }

    // Update streak
    updateStreak() {
        const data = this.getUserData();
        const today = new Date().toDateString();
        const lastLogin = data.user.lastLogin ? new Date(data.user.lastLogin).toDateString() : null;
        
        if (lastLogin === today) {
            return data.user.streak;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin === yesterday.toDateString()) {
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
            data.user.streak = 1;
        } else {
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
        const session = {
            id: Date.now(),
            courseId,
            lessonId,
            duration,
            date: new Date().toISOString()
        };
        
        if (!data.studyHistory) {
            data.studyHistory = [];
        }
        
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
                this.addAchievement(`Completed Course`, 'course-complete', 100);
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
        const course = this.getCourseById(courseId);
        
        if (!course || !data.progress[courseId] || !course.lessons) {
            return 0;
        }
        
        const completedCount = data.progress[courseId].completedLessons.length;
        const totalCount = course.lessons.length;
        
        return Math.round((completedCount / totalCount) * 100);
    }

    // Add recent course
    addRecentCourse(courseId) {
        const data = this.getUserData();
        
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
        const recentProgress = [];
        
        // Get all courses with progress
        Object.keys(data.progress || {}).forEach(courseId => {
            const progress = data.progress[courseId];
            if (progress && progress.lastAccessed) {
                recentProgress.push({
                    courseId,
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
        
        if (!data.courseNotes[courseId]) {
            data.courseNotes[courseId] = {};
        }
        
        data.courseNotes[courseId][lessonId] = notes;
        this.saveUserData(data);
    }

    // Get course notes
    getCourseNotes(courseId, lessonId) {
        const data = this.getUserData();
        return data.courseNotes[courseId]?.[lessonId] || '';
    }

    // Add achievement/badge
    addAchievement(title, type, xpReward) {
        const data = this.getUserData();
        
        // Check if already achieved
        const alreadyHas = data.achievements?.some(ach => ach.title === title);
        if (alreadyHas) return;
        
        const achievement = {
            id: Date.now(),
            title,
            type,
            xpReward,
            date: new Date().toISOString(),
            icon: this.getAchievementIcon(type)
        };
        
        if (!data.achievements) {
            data.achievements = [];
        }
        
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
            'study-marathon': 'fas fa-brain'
        };
        return icons[type] || 'fas fa-award';
    }

    // Toggle theme
    toggleTheme() {
        const data = this.getUserData();
        data.theme = data.theme === 'light' ? 'dark' : 'light';
        this.saveUserData(data);
        this.applyTheme(data.theme);
        return data.theme;
    }

    // Apply theme
    applyTheme(theme) {
        document.body.className = `${theme}-theme`;
        document.body.setAttribute('data-theme', theme);
    }

    // Get current theme
    getCurrentTheme() {
        const data = this.getUserData();
        return data.theme || 'light';
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notificationContainer') || 
                                   (() => {
                                       const container = document.createElement('div');
                                       container.id = 'notificationContainer';
                                       container.className = 'notification-container';
                                       document.body.appendChild(container);
                                       return container;
                                   })();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('slide-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('slide-out');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Get course by ID
    getCourseById(courseId) {
        const data = this.getUserData();
        const userCourses = data.userCourses || [];
        const course = userCourses.find(c => c.id == courseId);
        
        if (course) return course;
        
        // Check default courses
        if (window.defaultCourses) {
            return window.defaultCourses.courses?.find(c => c.id == courseId);
        }
        
        return null;
    }

    // Update UI elements
    updateUI() {
        const data = this.getUserData();
        
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
        return data.achievements || [];
    }

    // Get user stats
    getUserStats() {
        const data = this.getUserData();
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
            level: data.user.level,
            xp: data.user.xp,
            maxXP: data.user.maxXP,
            streak: data.user.streak,
            totalCourses: userCourses.length,
            totalLessons,
            completedLessons,
            completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            badges: data.user.badges?.length || 0,
            totalStudyTime: data.user.totalStudyTime || 0
        };
    }

    // USER COURSES MANAGEMENT

    // Get user courses
    getUserCourses() {
        const data = this.getUserData();
        return data.userCourses || [];
    }

    // Save user courses
    saveUserCourses(courses) {
        const data = this.getUserData();
        data.userCourses = courses;
        this.saveUserData(data);
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
        
        courses.push(course);
        this.saveUserCourses(courses);
        
        // Add achievement for first course
        if (courses.length === 1) {
            this.addAchievement('First Course Created!', 'course-creation', 25);
        }
        
        this.showNotification('Course created successfully!', 'success');
        return course;
    }

    // Update a course
    updateUserCourse(courseId, updates) {
        const courses = this.getUserCourses();
        const index = courses.findIndex(c => c.id == courseId);
        
        if (index !== -1) {
            updates.updatedAt = new Date().toISOString();
            courses[index] = { ...courses[index], ...updates };
            this.saveUserCourses(courses);
            return true;
        }
        
        return false;
    }

    // Delete a course
    deleteUserCourse(courseId) {
        const courses = this.getUserCourses();
        const filteredCourses = courses.filter(c => c.id != courseId);
        this.saveUserCourses(filteredCourses);
        
        // Also remove progress for this course
        const data = this.getUserData();
        if (data.progress[courseId]) {
            delete data.progress[courseId];
            this.saveUserData(data);
        }
        
        return filteredCourses.length !== courses.length;
    }

    // Add lesson to course
    addLessonToCourse(courseId, lesson) {
        const courses = this.getUserCourses();
        const courseIndex = courses.findIndex(c => c.id == courseId);
        
        if (courseIndex === -1) return false;
        
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
        this.saveUserCourses(courses);
        
        this.showNotification('Lesson added successfully!', 'success');
        return lesson;
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
        this.saveUserCourses(courses);
        return true;
    }

    // Delete lesson
    deleteLesson(courseId, lessonId) {
        const courses = this.getUserCourses();
        const courseIndex = courses.findIndex(c => c.id == courseId);
        
        if (courseIndex === -1) return false;
        
        courses[courseIndex].lessons = courses[courseIndex].lessons.filter(l => l.id != lessonId);
        courses[courseIndex].updatedAt = new Date().toISOString();
        this.saveUserCourses(courses);
        return true;
    }

    // Get course with lessons
    getCourseWithLessons(courseId) {
        return this.getCourseById(courseId);
    }

    // Get recent study sessions
    getRecentStudySessions(limit = 10) {
        const data = this.getUserData();
        const sessions = data.studyHistory || [];
        return sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    }

    // Get daily study time
    getDailyStudyTime(date = new Date()) {
        const data = this.getUserData();
        const sessions = data.studyHistory || [];
        const dateStr = date.toDateString();
        
        return sessions
            .filter(s => new Date(s.date).toDateString() === dateStr)
            .reduce((total, s) => total + s.duration, 0);
    }

    // Export all data
    exportData() {
        const data = this.getUserData();
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
                    localStorage.setItem('learnhub_user', JSON.stringify(importedData));
                    this.showNotification('Data imported successfully!', 'success');
                    resolve(true);
                } catch (error) {
                    this.showNotification('Invalid file format', 'error');
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
        if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
            localStorage.removeItem('learnhub_user');
            this.initializeUserData();
            this.showNotification('All data cleared successfully!', 'success');
            setTimeout(() => window.location.reload(), 1000);
            return true;
        }
        return false;
    }
}

// Initialize storage manager
const storage = new StorageManager();