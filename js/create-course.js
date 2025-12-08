// Create Course Page
class CreateCoursePage {
    constructor() {
        this.courseId = null;
        this.course = null;
        this.lessons = [];
        this.tags = [];
        this.currentColor = '#4361ee';
        this.currentIcon = 'fas fa-book';
        this.editingLessonIndex = null;
        
        this.initialize();
    }

    initialize() {
        this.loadCourseFromURL();
        this.setupEventListeners();
        this.updatePreview();
        this.setupTagInput();
        
        // Set default color
        this.selectColor('#4361ee');
    }

    loadCourseFromURL() {
        const params = getUrlParams();
        
        if (params.id) {
            // Editing existing course
            this.courseId = params.id;
            this.course = storage.getCourseById(this.courseId);
            
            if (this.course) {
                this.loadCourseData();
                storage.showNotification('Editing course: ' + this.course.title, 'info');
            } else {
                storage.showNotification('Course not found', 'error');
                setTimeout(() => window.location.href = 'my-courses.html', 2000);
            }
        } else if (params.template) {
            // Using template
            this.loadTemplate(params.template);
        }
    }

    loadCourseData() {
        if (!this.course) return;
        
        // Populate form fields
        document.getElementById('courseTitle').value = this.course.title || '';
        document.getElementById('courseDescription').value = this.course.description || '';
        document.getElementById('courseCategory').value = this.course.category || '';
        document.getElementById('courseDifficulty').value = this.course.difficulty || 'beginner';
        document.getElementById('courseIcon').value = this.course.icon || 'fas fa-book';
        
        // Load tags
        this.tags = this.course.tags || [];
        this.renderTags();
        
        // Load color
        if (this.course.color) {
            this.selectColor(this.course.color);
        }
        
        // Load lessons
        this.lessons = this.course.lessons || [];
        this.renderLessons();
    }

    loadTemplate(templateId) {
        const templates = {
            'web-dev': {
                title: 'Web Development Course',
                description: 'Learn full-stack web development from scratch',
                category: 'Web Development',
                difficulty: 'beginner',
                icon: 'fas fa-code',
                color: '#4361ee',
                tags: ['web', 'programming', 'javascript', 'html', 'css']
            },
            'data-science': {
                title: 'Data Science Fundamentals',
                description: 'Learn Python, data analysis, and machine learning',
                category: 'Programming',
                difficulty: 'intermediate',
                icon: 'fas fa-chart-line',
                color: '#3a0ca3',
                tags: ['python', 'data', 'machine-learning', 'analysis']
            },
            'design': {
                title: 'UI/UX Design Principles',
                description: 'Master user interface and experience design',
                category: 'Design',
                difficulty: 'beginner',
                icon: 'fas fa-paint-brush',
                color: '#f72585',
                tags: ['design', 'ui', 'ux', 'figma', 'prototyping']
            }
        };
        
        const template = templates[templateId];
        if (template) {
            document.getElementById('courseTitle').value = template.title;
            document.getElementById('courseDescription').value = template.description;
            document.getElementById('courseCategory').value = template.category;
            document.getElementById('courseDifficulty').value = template.difficulty;
            document.getElementById('courseIcon').value = template.icon;
            
            this.tags = template.tags;
            this.selectColor(template.color);
            
            this.renderTags();
            this.updatePreview();
            
            storage.showNotification('Template loaded! Customize as needed.', 'success');
        }
    }

    setupEventListeners() {
        // Real-time preview updates
        const previewFields = ['courseTitle', 'courseDescription', 'courseCategory', 'courseDifficulty'];
        previewFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.updatePreview());
                field.addEventListener('change', () => this.updatePreview());
            }
        });
        
        // Icon change
        document.getElementById('courseIcon').addEventListener('change', (e) => {
            this.currentIcon = e.target.value;
            this.updatePreview();
        });
        
        // Save course button
        document.getElementById('saveCourseBtn').addEventListener('click', () => this.saveCourse());
        
        // Tag input
        const tagInput = document.getElementById('tagInput');
        if (tagInput) {
            tagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag(tagInput.value.trim());
                    tagInput.value = '';
                }
            });
        }
        
        // Prevent form submission on Enter
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    }

    setupTagInput() {
        const tagInput = document.getElementById('tagInput');
        if (tagInput) {
            tagInput.addEventListener('input', () => {
                const value = tagInput.value.trim();
                if (value.includes(',')) {
                    const tags = value.split(',').map(t => t.trim()).filter(t => t);
                    tags.forEach(tag => this.addTag(tag));
                    tagInput.value = '';
                }
            });
        }
    }

    addTag(tag) {
        if (!tag) return;
        
        // Clean and validate tag
        tag = tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        if (tag.length < 2 || tag.length > 20) {
            storage.showNotification('Tags must be 2-20 characters', 'warning');
            return;
        }
        
        if (this.tags.includes(tag)) {
            storage.showNotification('Tag already exists', 'warning');
            return;
        }
        
        if (this.tags.length >= 10) {
            storage.showNotification('Maximum 10 tags allowed', 'warning');
            return;
        }
        
        this.tags.push(tag);
        this.renderTags();
        this.updatePreview();
    }

    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.renderTags();
        this.updatePreview();
    }

    renderTags() {
        const container = document.getElementById('tagsDisplay');
        if (!container) return;
        
        container.innerHTML = this.tags.map(tag => `
            <span class="tag">
                ${tag}
                <button type="button" onclick="removeTagFromCourse('${tag}')" class="tag-remove">
                    &times;
                </button>
            </span>
        `).join('');
        
        // Update preview tags
        const previewContainer = document.getElementById('previewTags');
        if (previewContainer) {
            previewContainer.innerHTML = this.tags.slice(0, 3).map(tag => `
                <span class="tag">${tag}</span>
            `).join('');
            
            if (this.tags.length > 3) {
                previewContainer.innerHTML += `<span class="tag">+${this.tags.length - 3}</span>`;
            }
        }
    }

    selectColor(color) {
        this.currentColor = color;
        
        // Update color picker UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === color);
        });
        
        // Update preview
        const previewImage = document.getElementById('previewImage');
        if (previewImage) {
            previewImage.style.background = `linear-gradient(135deg, ${color}, ${this.lightenColor(color, 30)})`;
        }
        
        // Update custom color picker
        document.getElementById('customColor').value = color;
    }

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

    updatePreview() {
        const title = document.getElementById('courseTitle').value || 'Course Title';
        const description = document.getElementById('courseDescription').value || 'Course description will appear here';
        const category = document.getElementById('courseCategory').value || 'Category';
        const difficulty = document.getElementById('courseDifficulty').value || 'beginner';
        const difficultyLabel = courseManager.getDifficultyLabel(difficulty);
        
        document.getElementById('previewTitle').textContent = title;
        document.getElementById('previewDescription').textContent = description;
        document.getElementById('previewCategory').textContent = category;
        document.getElementById('previewDifficulty').textContent = difficultyLabel;
        document.getElementById('previewDifficulty').className = `preview-difficulty difficulty-${difficulty}`;
        
        // Update icon in preview
        const previewIcon = document.getElementById('previewImage').querySelector('i');
        if (previewIcon) {
            previewIcon.className = this.currentIcon;
        }
        
        // Update lesson count
        document.getElementById('previewLessonCount').textContent = `${this.lessons.length} lesson${this.lessons.length !== 1 ? 's' : ''}`;
    }

    addLesson() {
        this.editingLessonIndex = null;
        this.showLessonForm();
    }

    editLesson(index) {
        this.editingLessonIndex = index;
        const lesson = this.lessons[index];
        
        // Populate form
        document.getElementById('lessonTitle').value = lesson.title || '';
        document.getElementById('lessonType').value = lesson.type || 'video';
        document.getElementById('lessonDuration').value = lesson.duration || 15;
        document.getElementById('lessonOrder').value = lesson.order || (index + 1);
        document.getElementById('lessonDescription').value = lesson.description || '';
        
        // Set content based on type
        if (lesson.type === 'video') {
            document.getElementById('videoUrl').value = lesson.content || '';
        } else if (lesson.type === 'article') {
            document.getElementById('lessonContent').value = lesson.content || '';
        } else if (lesson.type === 'link') {
            document.getElementById('externalLink').value = lesson.content || '';
        } else if (lesson.type === 'exercise') {
            document.getElementById('lessonContent').value = lesson.content || '';
        }
        
        this.showLessonForm();
        this.toggleLessonFields();
    }

    showLessonForm() {
        document.getElementById('lessonForm').style.display = 'block';
        document.getElementById('lessonForm').scrollIntoView({ behavior: 'smooth' });
    }

    hideLessonForm() {
        document.getElementById('lessonForm').style.display = 'none';
        this.clearLessonForm();
    }

    clearLessonForm() {
        document.getElementById('lessonTitle').value = '';
        document.getElementById('lessonType').value = 'video';
        document.getElementById('videoUrl').value = '';
        document.getElementById('lessonContent').value = '';
        document.getElementById('externalLink').value = '';
        document.getElementById('lessonDuration').value = '15';
        document.getElementById('lessonOrder').value = '1';
        document.getElementById('lessonDescription').value = '';
        this.toggleLessonFields();
    }

    toggleLessonFields() {
        const type = document.getElementById('lessonType').value;
        
        // Hide all fields first
        document.getElementById('videoField').style.display = 'none';
        document.getElementById('contentField').style.display = 'none';
        document.getElementById('linkField').style.display = 'none';
        
        // Show relevant field
        if (type === 'video') {
            document.getElementById('videoField').style.display = 'block';
        } else if (type === 'article' || type === 'exercise') {
            document.getElementById('contentField').style.display = 'block';
        } else if (type === 'link') {
            document.getElementById('linkField').style.display = 'block';
        }
    }

    saveLesson() {
        const title = document.getElementById('lessonTitle').value.trim();
        const type = document.getElementById('lessonType').value;
        const duration = parseInt(document.getElementById('lessonDuration').value) || 15;
        const order = parseInt(document.getElementById('lessonOrder').value) || 1;
        const description = document.getElementById('lessonDescription').value.trim();
        
        if (!title) {
            storage.showNotification('Please enter a lesson title', 'error');
            return;
        }
        
        let content = '';
        if (type === 'video') {
            content = document.getElementById('videoUrl').value.trim();
            if (!content) {
                storage.showNotification('Please enter a video URL or ID', 'error');
                return;
            }
            
            // Extract video ID if full URL is provided
            if (content.includes('youtube.com') || content.includes('youtu.be')) {
                const videoId = extractYouTubeId(content);
                if (videoId) {
                    content = videoId;
                }
            }
        } else if (type === 'article' || type === 'exercise') {
            content = document.getElementById('lessonContent').value.trim();
            if (!content && type === 'exercise') {
                storage.showNotification('Please enter exercise content', 'error');
                return;
            }
        } else if (type === 'link') {
            content = document.getElementById('externalLink').value.trim();
            if (!content) {
                storage.showNotification('Please enter a link', 'error');
                return;
            }
            
            if (!content.startsWith('http')) {
                content = 'https://' + content;
            }
        }
        
        const lesson = {
            title,
            type,
            content,
            duration,
            order,
            description
        };
        
        if (this.editingLessonIndex !== null) {
            // Update existing lesson
            this.lessons[this.editingLessonIndex] = lesson;
        } else {
            // Add new lesson
            this.lessons.push(lesson);
        }
        
        // Sort lessons by order
        this.lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        this.renderLessons();
        this.hideLessonForm();
        this.updatePreview();
        
        storage.showNotification(
            this.editingLessonIndex !== null ? 'Lesson updated!' : 'Lesson added!',
            'success'
        );
    }

    deleteLesson(index) {
        if (confirm('Are you sure you want to delete this lesson?')) {
            this.lessons.splice(index, 1);
            this.renderLessons();
            this.updatePreview();
            storage.showNotification('Lesson deleted', 'success');
        }
    }

    renderLessons() {
        const container = document.getElementById('lessonsList');
        if (!container) return;
        
        if (this.lessons.length === 0) {
            container.innerHTML = `
                <div class="empty-lessons">
                    <i class="fas fa-video fa-3x"></i>
                    <p>No lessons added yet</p>
                    <p class="small">Add your first lesson to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.lessons.map((lesson, index) => `
            <div class="lesson-item">
                <div class="lesson-icon">
                    <i class="${this.getLessonIcon(lesson.type)}"></i>
                </div>
                <div class="lesson-content">
                    <div class="lesson-header">
                        <h4>${lesson.title}</h4>
                        <div class="lesson-meta">
                            <span class="lesson-type">${lesson.type}</span>
                            <span class="lesson-duration">${lesson.duration} min</span>
                            <span class="lesson-order">#${lesson.order}</span>
                        </div>
                    </div>
                    ${lesson.description ? `<p class="lesson-description">${lesson.description}</p>` : ''}
                </div>
                <div class="lesson-actions">
                    <button class="btn-icon" onclick="editLessonInCourse(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteLessonFromCourse(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon" onclick="moveLesson(${index}, 'up')" ${index === 0 ? 'disabled' : ''} title="Move up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn-icon" onclick="moveLesson(${index}, 'down')" ${index === this.lessons.length - 1 ? 'disabled' : ''} title="Move down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getLessonIcon(type) {
        const icons = {
            'video': 'fas fa-video',
            'article': 'fas fa-file-alt',
            'link': 'fas fa-external-link-alt',
            'exercise': 'fas fa-dumbbell'
        };
        return icons[type] || 'fas fa-question-circle';
    }

    moveLesson(index, direction) {
        if (direction === 'up' && index > 0) {
            [this.lessons[index], this.lessons[index - 1]] = [this.lessons[index - 1], this.lessons[index]];
        } else if (direction === 'down' && index < this.lessons.length - 1) {
            [this.lessons[index], this.lessons[index + 1]] = [this.lessons[index + 1], this.lessons[index]];
        }
        
        // Update order numbers
        this.lessons.forEach((lesson, i) => {
            lesson.order = i + 1;
        });
        
        this.renderLessons();
    }

    validateCourse() {
        const title = document.getElementById('courseTitle').value.trim();
        const category = document.getElementById('courseCategory').value;
        
        if (!title) {
            storage.showNotification('Please enter a course title', 'error');
            return false;
        }
        
        if (!category) {
            storage.showNotification('Please select a category', 'error');
            return false;
        }
        
        if (this.lessons.length === 0) {
            if (!confirm('This course has no lessons. Save anyway?')) {
                return false;
            }
        }
        
        return true;
    }

    saveCourse() {
        if (!this.validateCourse()) return;
        
        const courseData = {
            title: document.getElementById('courseTitle').value.trim(),
            description: document.getElementById('courseDescription').value.trim(),
            category: document.getElementById('courseCategory').value,
            difficulty: document.getElementById('courseDifficulty').value,
            icon: document.getElementById('courseIcon').value,
            color: this.currentColor,
            tags: this.tags,
            lessons: this.lessons
        };
        
        if (this.courseId) {
            // Update existing course
            const success = storage.updateUserCourse(this.courseId, courseData);
            if (success) {
                storage.showNotification('Course updated successfully!', 'success');
                setTimeout(() => window.location.href = `course.html?id=${this.courseId}`, 1500);
            } else {
                storage.showNotification('Failed to update course', 'error');
            }
        } else {
            // Create new course
            const course = storage.addUserCourse(courseData);
            if (course) {
                storage.showNotification('Course created successfully!', 'success');
                setTimeout(() => window.location.href = `course.html?id=${course.id}`, 1500);
            }
        }
    }
}

// Global functions for onclick events
function addTag(tag) {
    if (window.createCoursePage) {
        window.createCoursePage.addTag(tag);
    }
}

function removeTagFromCourse(tag) {
    if (window.createCoursePage) {
        window.createCoursePage.removeTag(tag);
    }
}

function selectColor(color) {
    if (window.createCoursePage) {
        window.createCoursePage.selectColor(color);
    }
}

function addLesson() {
    if (window.createCoursePage) {
        window.createCoursePage.addLesson();
    }
}

function editLessonInCourse(index) {
    if (window.createCoursePage) {
        window.createCoursePage.editLesson(index);
    }
}

function deleteLessonFromCourse(index) {
    if (window.createCoursePage) {
        window.createCoursePage.deleteLesson(index);
    }
}

function moveLesson(index, direction) {
    if (window.createCoursePage) {
        window.createCoursePage.moveLesson(index, direction);
    }
}

function saveLesson() {
    if (window.createCoursePage) {
        window.createCoursePage.saveLesson();
    }
}

function cancelLesson() {
    if (window.createCoursePage) {
        window.createCoursePage.hideLessonForm();
    }
}

function toggleLessonFields() {
    if (window.createCoursePage) {
        window.createCoursePage.toggleLessonFields();
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize main functionality
    const savedTheme = storage.getCurrentTheme();
    storage.applyTheme(savedTheme);
    
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === 'dark';
        themeSwitch.addEventListener('change', function() {
            const newTheme = storage.toggleTheme();
            this.checked = newTheme === 'dark';
        });
    }
    
    storage.updateStreak();
    updateUserInfo();
    setupMobileMenu();
    
    // Initialize create course page
    window.createCoursePage = new CreateCoursePage();
});

// Add CSS for create course page
const createCourseCSS = `
.create-course-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-lg);
}

@media (max-width: 1024px) {
    .create-course-layout {
        grid-template-columns: 1fr;
    }
}

.form-card {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.form-card h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.form-group {
    margin-bottom: var(--spacing-md);
}

.form-group label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    color: var(--text-primary);
    background: white;
    transition: border-color var(--transition-speed);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.form-help {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}

.tags-input-container {
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    padding: var(--spacing-sm);
    background: white;
}

.tags-display {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: var(--spacing-sm);
    min-height: 40px;
}

.tags-display .tag {
    background: var(--primary-color);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.tag-remove {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    font-size: var(--font-size-lg);
    line-height: 1;
    opacity: 0.8;
}

.tag-remove:hover {
    opacity: 1;
}

#tagInput {
    border: none;
    padding: 0;
    background: transparent;
}

.suggested-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: var(--spacing-sm);
}

.tag-suggestion {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed);
}

.tag-suggestion:hover {
    background: var(--primary-color);
    color: white;
}

.color-picker {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
}

.color-options {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.color-option {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform var(--transition-speed);
    border: 2px solid transparent;
}

.color-option:hover {
    transform: scale(1.1);
}

.color-option.selected {
    border-color: var(--text-primary);
    transform: scale(1.1);
}

.icon-selector {
    flex: 1;
    min-width: 150px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
}

.lessons-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.empty-lessons {
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--text-secondary);
}

.empty-lessons i {
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
}

.lesson-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    gap: var(--spacing-md);
    transition: transform var(--transition-speed);
}

.lesson-item:hover {
    transform: translateX(5px);
}

.lesson-icon {
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-lg);
    flex-shrink: 0;
}

.lesson-content {
    flex: 1;
}

.lesson-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-bottom: 0.5rem;
}

.lesson-header h4 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
}

.lesson-meta {
    display: flex;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
}

.lesson-type {
    text-transform: capitalize;
}

.lesson-description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.4;
}

.lesson-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius);
    border: none;
    background: white;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-speed);
}

.btn-icon:hover {
    background: var(--primary-color);
    color: white;
}

.btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-icon:disabled:hover {
    background: white;
    color: var(--text-secondary);
}

.preview-card,
.tips-card,
.lesson-form-card {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.course-preview {
    background: white;
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 1px solid var(--bg-tertiary);
}

.preview-image {
    height: 120px;
    background: linear-gradient(135deg, #4361ee, #4cc9f0);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-3xl);
}

.preview-content {
    padding: var(--spacing-md);
}

.preview-content h4 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.preview-content p {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-sm);
    line-height: 1.5;
}

.preview-meta {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
}

.preview-category {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: 500;
}

.preview-difficulty {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
}

.preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: var(--spacing-sm);
}

.preview-lessons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.tips-list {
    list-style: none;
}

.tips-list li {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
}

.tips-list li i {
    color: var(--success-color);
    margin-top: 0.25rem;
    flex-shrink: 0;
}

.tips-list li span {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.lesson-form-card .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
}

.small {
    font-size: var(--font-size-xs);
}

.required {
    color: var(--danger-color);
}
`;

// Add styles for create course page
const style = document.createElement('style');
style.textContent = createCourseCSS;
document.head.appendChild(style);