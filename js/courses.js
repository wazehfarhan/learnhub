// Course Manager
class CourseManager {
    constructor() {
        this.categories = [
            { name: 'Programming', icon: 'fas fa-code', color: '#4361ee' },
            { name: 'Web Development', icon: 'fas fa-laptop-code', color: '#3a0ca3' },
            { name: 'Design', icon: 'fas fa-paint-brush', color: '#f72585' },
            { name: 'Business', icon: 'fas fa-chart-line', color: '#4cc9f0' },
            { name: 'Language', icon: 'fas fa-language', color: '#7209b7' },
            { name: 'Music', icon: 'fas fa-music', color: '#560bad' },
            { name: 'Health', icon: 'fas fa-heart', color: '#4895ef' },
            { name: 'Other', icon: 'fas fa-ellipsis-h', color: '#3f37c9' }
        ];
        
        this.difficulties = [
            { level: 'beginner', label: 'Beginner', color: '#4ade80' },
            { level: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
            { level: 'advanced', label: 'Advanced', color: '#ef4444' }
        ];
    }

    // Get all user courses
    getUserCourses() {
        return storage.getUserCourses();
    }

    // Get course by ID
    getCourseById(courseId) {
        return storage.getCourseById(courseId);
    }

    // Render course card
    renderCourseCard(course, progress = null) {
        if (progress === null) {
            progress = storage.getCourseProgress(course.id);
        }
        
        const card = document.createElement('div');
        card.className = 'course-card glass scale-hover fade-in';
        card.onclick = () => viewCourse(course.id);
        
        // Get lesson count
        const lessonCount = course.lessons ? course.lessons.length : 0;
        
        // Format created date
        const createdDate = course.createdAt ? new Date(course.createdAt) : new Date();
        const formattedDate = createdDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        card.innerHTML = `
            <div class="course-image" style="background: linear-gradient(135deg, ${course.color || '#4361ee'}, ${this.lightenColor(course.color || '#4361ee', 30)})">
                <i class="${course.icon || 'fas fa-book'}"></i>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description || 'No description provided'}</p>
                
                <div class="course-meta">
                    <span class="course-difficulty difficulty-${course.difficulty || 'beginner'}">
                        ${this.getDifficultyLabel(course.difficulty)}
                    </span>
                    <span class="course-stats">
                        <i class="fas fa-list-check"></i> ${lessonCount} lessons
                    </span>
                </div>
                
                ${course.tags && course.tags.length > 0 ? `
                    <div class="course-tags">
                        ${course.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        ${course.tags.length > 3 ? '<span class="tag">+' + (course.tags.length - 3) + '</span>' : ''}
                    </div>
                ` : ''}
                
                <div class="course-footer">
                    <div class="course-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" data-progress="${progress}" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress}% Complete • Created ${formattedDate}</div>
                    </div>
                    <button class="course-btn" onclick="event.stopPropagation(); viewCourse(${course.id})">
                        ${progress > 0 ? 'Continue' : 'Start'} <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Get difficulty label
    getDifficultyLabel(difficulty) {
        const diff = this.difficulties.find(d => d.level === difficulty);
        return diff ? diff.label : 'Beginner';
    }

    // Lighten color
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return "#" + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    // Darken color
    darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }

    // Search courses
    searchCourses(query, filters = {}) {
        const courses = this.getUserCourses();
        
        if (!query && Object.keys(filters).length === 0) {
            return courses;
        }
        
        const searchTerm = query ? query.toLowerCase() : '';
        
        return courses.filter(course => {
            // Search by title and description
            if (searchTerm && !course.title.toLowerCase().includes(searchTerm) && 
                !course.description?.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Filter by category
            if (filters.category && course.category !== filters.category) {
                return false;
            }
            
            // Filter by difficulty
            if (filters.difficulty && course.difficulty !== filters.difficulty) {
                return false;
            }
            
            // Filter by tags
            if (filters.tag && (!course.tags || !course.tags.includes(filters.tag))) {
                return false;
            }
            
            return true;
        });
    }

    // Get course statistics
    getCourseStatistics(courseId) {
        const course = this.getCourseById(courseId);
        if (!course) return null;
        
        const progress = storage.getCourseProgress(courseId);
        const lessons = course.lessons || [];
        const completedLessons = storage.getUserData().progress[courseId]?.completedLessons || [];
        
        return {
            totalLessons: lessons.length,
            completedLessons: completedLessons.length,
            progress: progress,
            totalDuration: lessons.reduce((total, lesson) => total + (parseInt(lesson.duration) || 0), 0),
            lastAccessed: storage.getUserData().progress[courseId]?.lastAccessed
        };
    }

    // Get all tags from courses
    getAllTags() {
        const courses = this.getUserCourses();
        const tags = new Set();
        
        courses.forEach(course => {
            if (course.tags) {
                course.tags.forEach(tag => tags.add(tag));
            }
        });
        
        return Array.from(tags);
    }

    // Get categories
    getCategories() {
        return this.categories;
    }

    // Get difficulties
    getDifficulties() {
        return this.difficulties;
    }

    // Sort courses
    sortCourses(courses, sortBy) {
        const sorted = [...courses];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'progress':
                return sorted.sort((a, b) => {
                    const progressA = storage.getCourseProgress(a.id);
                    const progressB = storage.getCourseProgress(b.id);
                    return progressB - progressA;
                });
            default:
                return sorted;
        }
    }
}

// Initialize course manager
const courseManager = new CourseManager();

// Global functions
function viewCourse(courseId) {
    window.location.href = `course.html?id=${courseId}`;
}

function editCourse(courseId) {
    window.location.href = `create-course.html?id=${courseId}`;
}

function deleteCourse(courseId, courseTitle) {
    if (confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
        const success = storage.deleteUserCourse(courseId);
        if (success) {
            storage.showNotification('Course deleted successfully', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            storage.showNotification('Failed to delete course', 'error');
        }
    }
}