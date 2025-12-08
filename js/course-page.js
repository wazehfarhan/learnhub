// Course Page for User-Created Courses
class CoursePage {
    constructor() {
        this.courseId = null;
        this.course = null;
        this.lessons = [];
        this.currentLessonIndex = 0;
        this.comments = [];
        this.resources = [];
        this.timer = {
            running: false,
            startTime: null,
            elapsedTime: 0,
            interval: null
        };
        
        this.initialize();
    }

    initialize() {
        // Get course ID from URL
        const params = getUrlParams();
        this.courseId = params.id;
        
        if (!this.courseId) {
            window.location.href = 'my-courses.html';
            return;
        }
        
        this.loadCourse();
        this.setupEventListeners();
        this.updateStudyTimerStats();
        this.setupModals();
    }

    loadCourse() {
        this.course = storage.getCourseById(this.courseId);
        
        if (!this.course) {
            storage.showNotification('Course not found', 'error');
            setTimeout(() => window.location.href = 'my-courses.html', 2000);
            return;
        }
        
        this.lessons = this.course.lessons || [];
        this.resources = this.course.resources || [];
        
        // Update course header
        this.updateCourseHeader();
        
        // Render lessons list
        this.renderLessonsList();
        
        // Render resources
        this.renderResources();
        
        // Load the first lesson or last accessed lesson
        this.loadLastAccessedLesson();
        
        // Update progress
        this.updateProgress();
        
        // Update user data
        storage.addRecentCourse(this.courseId);
        
        // Load comments
        this.loadComments();
    }

    updateCourseHeader() {
        document.getElementById('courseTitle').textContent = this.course.title;
        document.getElementById('courseDescription').textContent = this.course.description || 'No description provided';
        document.getElementById('courseCategory').textContent = this.course.category || 'Uncategorized';
        
        // Update difficulty
        const difficultyLabel = courseManager.getDifficultyLabel(this.course.difficulty);
        document.getElementById('courseDifficulty').textContent = difficultyLabel;
        document.getElementById('courseDifficulty').className = `course-difficulty difficulty-${this.course.difficulty || 'beginner'}`;
        
        // Calculate total duration
        const totalDuration = this.lessons.reduce((total, lesson) => total + (parseInt(lesson.duration) || 0), 0);
        document.getElementById('courseDuration').textContent = `${totalDuration} min`;
        document.getElementById('courseLessons').textContent = `${this.lessons.length} lessons`;
        
        // Update icon and color
        const headerImage = document.getElementById('courseHeaderImage');
        const icon = document.getElementById('courseIcon');
        if (headerImage && this.course.color) {
            headerImage.style.background = `linear-gradient(135deg, ${this.course.color}, ${courseManager.lightenColor(this.course.color, 30)})`;
        }
        if (icon && this.course.icon) {
            icon.className = this.course.icon;
        }
        
        // Update tags
        const tagsContainer = document.getElementById('courseTags');
        if (tagsContainer && this.course.tags) {
            tagsContainer.innerHTML = this.course.tags.slice(0, 5).map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
            
            if (this.course.tags.length > 5) {
                tagsContainer.innerHTML += `<span class="tag">+${this.course.tags.length - 5}</span>`;
            }
        }
        
        // Update created date
        const createdDate = document.getElementById('courseCreatedDate');
        if (createdDate && this.course.createdAt) {
            const date = new Date(this.course.createdAt);
            createdDate.textContent = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }

    renderLessonsList() {
        const container = document.getElementById('lessonsContainer');
        const countElement = document.getElementById('sidebarLessonCount');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.lessons.length === 0) {
            container.innerHTML = `
                <div class="empty-lessons">
                    <i class="fas fa-video-slash"></i>
                    <p>No lessons yet</p>
                </div>
            `;
            if (countElement) countElement.textContent = '0 lessons';
            return;
        }
        
        if (countElement) {
            countElement.textContent = `${this.lessons.length} lesson${this.lessons.length !== 1 ? 's' : ''}`;
        }
        
        this.lessons.forEach((lesson, index) => {
            const lessonElement = document.createElement('div');
            lessonElement.className = `lesson-item ${this.isLessonCompleted(lesson.id) ? 'completed' : ''}`;
            lessonElement.dataset.index = index;
            
            // Check if lesson is completed
            const isCompleted = this.isLessonCompleted(lesson.id);
            
            lessonElement.innerHTML = `
                <div class="lesson-checkbox">
                    <i class="fas fa-${isCompleted ? 'check-circle' : 'circle'}"></i>
                </div>
                <div class="lesson-info">
                    <div class="lesson-title">${lesson.title}</div>
                    <div class="lesson-meta">
                        <span class="lesson-type">
                            <i class="${this.getLessonTypeIcon(lesson.type)}"></i>
                            ${lesson.type}
                        </span>
                        <span class="lesson-duration">${lesson.duration || 15} min</span>
                        ${isCompleted ? '<span class="lesson-status">Completed</span>' : ''}
                    </div>
                </div>
                <div class="lesson-play">
                    <i class="fas fa-play"></i>
                </div>
            `;
            
            lessonElement.addEventListener('click', () => {
                this.loadLesson(index);
                this.updateActiveLesson();
            });
            
            container.appendChild(lessonElement);
        });
        
        this.updateActiveLesson();
    }

    getLessonTypeIcon(type) {
        const icons = {
            'video': 'fas fa-video',
            'article': 'fas fa-file-alt',
            'link': 'fas fa-external-link-alt',
            'exercise': 'fas fa-dumbbell'
        };
        return icons[type] || 'fas fa-question-circle';
    }

    loadLastAccessedLesson() {
        const data = storage.getUserData();
        const progress = data.progress[this.courseId];
        
        if (progress && progress.lastLessonIndex !== undefined) {
            this.loadLesson(progress.lastLessonIndex);
        } else if (this.lessons.length > 0) {
            this.loadLesson(0);
        } else {
            this.showContentPlaceholder();
        }
    }

    loadLesson(index) {
        if (index < 0 || index >= this.lessons.length) {
            this.showContentPlaceholder();
            return;
        }
        
        this.currentLessonIndex = index;
        const lesson = this.lessons[index];
        
        // Hide all content sections
        this.hideAllContentSections();
        
        // Show lesson actions
        document.getElementById('lessonActions').style.display = 'block';
        
        // Update lesson info
        document.getElementById('currentLessonNumber').textContent = index + 1;
        document.getElementById('totalLessonsCount').textContent = this.lessons.length;
        
        // Update buttons state
        this.updateNavigationButtons();
        
        // Update lesson progress bar
        const progressBar = document.getElementById('lessonProgressBar');
        if (progressBar) {
            const progress = ((index + 1) / this.lessons.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        // Load lesson content based on type
        switch (lesson.type) {
            case 'video':
                this.loadVideoLesson(lesson);
                break;
            case 'article':
                this.loadArticleLesson(lesson);
                break;
            case 'link':
                this.loadLinkLesson(lesson);
                break;
            case 'exercise':
                this.loadExerciseLesson(lesson);
                break;
            default:
                this.showContentPlaceholder();
        }
        
        // Load notes for this lesson
        this.loadNotes(lesson.id);
        
        // Update active lesson in list
        this.updateActiveLesson();
        
        // Save as last accessed
        this.saveLastAccessed();
        
        // Start or resume timer if not running
        if (!this.timer.running) {
            this.startTimer();
        }
    }

    hideAllContentSections() {
        document.getElementById('contentPlaceholder').style.display = 'none';
        document.getElementById('videoPlayer').style.display = 'none';
        document.getElementById('articleContent').style.display = 'none';
        document.getElementById('externalLink').style.display = 'none';
        document.getElementById('exerciseContent').style.display = 'none';
    }

    loadVideoLesson(lesson) {
        const videoPlayer = document.getElementById('videoPlayer');
        const videoFrame = document.getElementById('courseVideo');
        
        if (videoPlayer && videoFrame) {
            // Extract video ID if it's a full URL
            let videoId = lesson.content;
            if (lesson.content.includes('youtube.com') || lesson.content.includes('youtu.be')) {
                videoId = extractYouTubeId(lesson.content) || lesson.content;
            }
            
            videoFrame.src = `https://www.youtube.com/embed/${videoId}`;
            videoPlayer.style.display = 'block';
        }
    }

    loadArticleLesson(lesson) {
        const articleContent = document.getElementById('articleContent');
        const articleTitle = document.getElementById('articleTitle');
        const articleBody = document.getElementById('articleBody');
        const articleType = document.getElementById('articleType');
        const articleDuration = document.getElementById('articleDuration');
        
        if (articleContent && articleTitle && articleBody) {
            articleTitle.textContent = lesson.title;
            articleBody.innerHTML = lesson.content.replace(/\n/g, '<br>');
            articleType.textContent = 'Article';
            articleDuration.textContent = `${lesson.duration || 15} min read`;
            articleContent.style.display = 'block';
        }
    }

    loadLinkLesson(lesson) {
        const externalLink = document.getElementById('externalLink');
        const linkDescription = document.getElementById('linkDescription');
        const linkUrl = document.getElementById('linkUrl');
        
        if (externalLink && linkDescription && linkUrl) {
            linkDescription.textContent = lesson.description || 'External resource';
            linkUrl.href = lesson.content;
            linkUrl.textContent = 'Visit Resource';
            externalLink.style.display = 'block';
        }
    }

    loadExerciseLesson(lesson) {
        const exerciseContent = document.getElementById('exerciseContent');
        const exerciseTitle = document.getElementById('exerciseTitle');
        const exerciseBody = document.getElementById('exerciseBody');
        
        if (exerciseContent && exerciseTitle && exerciseBody) {
            exerciseTitle.textContent = lesson.title;
            exerciseBody.innerHTML = lesson.content.replace(/\n/g, '<br>');
            exerciseContent.style.display = 'block';
        }
    }

    showContentPlaceholder() {
        document.getElementById('contentPlaceholder').style.display = 'block';
        document.getElementById('lessonActions').style.display = 'none';
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevLessonBtn');
        const nextBtn = document.getElementById('nextLessonBtn');
        const completeBtn = document.getElementById('completeLessonBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentLessonIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentLessonIndex === this.lessons.length - 1;
        }
        
        if (completeBtn) {
            const lesson = this.lessons[this.currentLessonIndex];
            const isCompleted = this.isLessonCompleted(lesson.id);
            completeBtn.disabled = isCompleted;
            completeBtn.innerHTML = isCompleted ? 
                '<i class="fas fa-check"></i> Completed' : 
                '<i class="fas fa-check"></i> Mark as Complete';
            completeBtn.className = isCompleted ? 'btn-success' : 'btn';
        }
    }

    updateActiveLesson() {
        const lessonItems = document.querySelectorAll('.lesson-item');
        lessonItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentLessonIndex);
        });
    }

    isLessonCompleted(lessonId) {
        const data = storage.getUserData();
        const progress = data.progress[this.courseId];
        return progress && progress.completedLessons && progress.completedLessons.includes(lessonId);
    }

    markLessonComplete() {
        const lesson = this.lessons[this.currentLessonIndex];
        
        if (!lesson) return;
        
        const success = storage.markLessonCompleted(this.courseId, lesson.id);
        
        if (success) {
            // Update lesson item
            const lessonItem = document.querySelector(`.lesson-item[data-index="${this.currentLessonIndex}"]`);
            if (lessonItem) {
                lessonItem.classList.add('completed');
                lessonItem.querySelector('.lesson-checkbox i').className = 'fas fa-check-circle';
                const meta = lessonItem.querySelector('.lesson-meta');
                if (meta && !meta.querySelector('.lesson-status')) {
                    meta.innerHTML += '<span class="lesson-status">Completed</span>';
                }
            }
            
            // Update progress
            this.updateProgress();
            
            // Update buttons
            this.updateNavigationButtons();
            
            // Stop timer and record study session
            this.stopTimer();
            if (this.timer.elapsedTime > 0) {
                storage.addStudySession(this.courseId, lesson.id, this.timer.elapsedTime);
                this.updateStudyTimerStats();
            }
            
            // Auto-advance to next lesson if available
            setTimeout(() => {
                if (this.currentLessonIndex < this.lessons.length - 1) {
                    this.loadLesson(this.currentLessonIndex + 1);
                }
            }, 1500);
        }
    }

    updateProgress() {
        const progress = storage.getCourseProgress(this.courseId);
        const data = storage.getUserData();
        const courseProgress = data.progress[this.courseId];
        
        // Update progress bar
        const progressBar = document.getElementById('courseProgressBar');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${progress}%`;
        }
        
        // Update lesson counts
        const completedLessonsEl = document.getElementById('completedLessons');
        const totalLessonsEl = document.getElementById('totalLessons');
        
        if (completedLessonsEl && totalLessonsEl) {
            const completedCount = courseProgress ? courseProgress.completedLessons.length : 0;
            completedLessonsEl.textContent = completedCount;
            totalLessonsEl.textContent = this.lessons.length;
        }
        
        // Update time spent (estimate)
        const timeSpentEl = document.getElementById('timeSpent');
        if (timeSpentEl) {
            const studyTime = data.user.totalStudyTime || 0;
            timeSpentEl.textContent = `${Math.floor(studyTime / 60)} min`;
        }
        
        // Update XP earned
        const courseXpEl = document.getElementById('courseXP');
        if (courseXpEl) {
            const completedCount = courseProgress ? courseProgress.completedLessons.length : 0;
            const xpEarned = completedCount * 10;
            courseXpEl.textContent = xpEarned;
        }
    }

    loadNotes(lessonId) {
        const notes = storage.getCourseNotes(this.courseId, lessonId);
        const notesTextarea = document.getElementById('lessonNotes');
        
        if (notesTextarea) {
            notesTextarea.value = notes;
        }
    }

    saveNotes() {
        const lesson = this.lessons[this.currentLessonIndex];
        const notesTextarea = document.getElementById('lessonNotes');
        
        if (!lesson || !notesTextarea) return;
        
        const notes = notesTextarea.value.trim();
        storage.saveCourseNotes(this.courseId, lesson.id, notes);
        
        // Award achievement for taking notes
        if (notes.length > 0) {
            storage.addAchievement('Note Taker', 'note-taker', 25);
        }
        
        storage.showNotification('Notes saved!', 'success');
    }

    clearNotes() {
        const notesTextarea = document.getElementById('lessonNotes');
        if (notesTextarea) {
            notesTextarea.value = '';
            storage.saveCourseNotes(this.courseId, this.lessons[this.currentLessonIndex].id, '');
            storage.showNotification('Notes cleared!', 'success');
        }
    }

    loadComments() {
        const data = storage.getUserData();
        this.comments = data.comments?.[this.courseId] || [];
        this.renderComments();
    }

    renderComments() {
        const container = document.getElementById('commentsList');
        if (!container) return;
        
        if (this.comments.length === 0) {
            container.innerHTML = `
                <div class="empty-comments">
                    <i class="fas fa-comment-slash"></i>
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.comments.slice().reverse().map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <div class="comment-author">
                        <i class="fas fa-user-circle"></i>
                        <span>${comment.author || 'You'}</span>
                    </div>
                    <div class="comment-date">${formatDate(comment.date)}</div>
                </div>
                <div class="comment-body">${comment.text}</div>
            </div>
        `).join('');
    }

    postComment() {
        const input = document.getElementById('commentInput');
        const text = input.value.trim();
        
        if (!text) {
            storage.showNotification('Please enter a comment', 'warning');
            return;
        }
        
        const comment = {
            id: Date.now(),
            text: text,
            author: 'You',
            date: new Date().toISOString(),
            courseId: this.courseId
        };
        
        // Save comment
        const data = storage.getUserData();
        if (!data.comments) data.comments = {};
        if (!data.comments[this.courseId]) data.comments[this.courseId] = [];
        data.comments[this.courseId].push(comment);
        storage.saveUserData(data);
        
        // Update local comments and render
        this.comments.push(comment);
        this.renderComments();
        
        // Clear input
        input.value = '';
        
        storage.showNotification('Comment posted!', 'success');
        
        // Award achievement for first comment
        if (this.comments.length === 1) {
            storage.addAchievement('First Comment', 'social', 15);
        }
    }

    renderResources() {
        const container = document.getElementById('resourcesList');
        if (!container) return;
        
        if (this.resources.length === 0) {
            container.innerHTML = `
                <div class="empty-resources">
                    <i class="fas fa-folder-open"></i>
                    <p>No resources added</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.resources.map(resource => `
            <a href="${resource.url}" target="_blank" class="resource-item">
                <div class="resource-icon">
                    <i class="${this.getResourceIcon(resource.type)}"></i>
                </div>
                <div class="resource-info">
                    <div class="resource-title">${resource.title}</div>
                    <div class="resource-type">${resource.type}</div>
                </div>
            </a>
        `).join('');
    }

    getResourceIcon(type) {
        const icons = {
            'pdf': 'fas fa-file-pdf',
            'link': 'fas fa-external-link-alt',
            'code': 'fas fa-code',
            'video': 'fas fa-video',
            'other': 'fas fa-file'
        };
        return icons[type] || 'fas fa-file';
    }

    addResource() {
        const title = document.getElementById('resourceTitle').value.trim();
        const url = document.getElementById('resourceUrl').value.trim();
        const type = document.getElementById('resourceType').value;
        
        if (!title || !url) {
            storage.showNotification('Please fill all fields', 'error');
            return;
        }
        
        const resource = {
            id: Date.now(),
            title,
            url: url.startsWith('http') ? url : `https://${url}`,
            type,
            added: new Date().toISOString()
        };
        
        this.resources.push(resource);
        
        // Save to course
        if (!this.course.resources) {
            this.course.resources = [];
        }
        this.course.resources.push(resource);
        
        // Update in storage
        storage.updateUserCourse(this.courseId, { resources: this.course.resources });
        
        // Re-render resources
        this.renderResources();
        
        // Close modal
        this.closeModal('resourceModal');
        
        storage.showNotification('Resource added!', 'success');
    }

    // Timer Functions
    startTimer() {
        if (this.timer.running) return;
        
        this.timer.running = true;
        this.timer.startTime = Date.now() - this.timer.elapsedTime;
        
        this.timer.interval = setInterval(() => {
            this.timer.elapsedTime = Date.now() - this.timer.startTime;
            this.updateTimerDisplay();
        }, 1000);
        
        this.updateTimerButtons();
    }

    pauseTimer() {
        if (!this.timer.running) return;
        
        this.timer.running = false;
        clearInterval(this.timer.interval);
        this.updateTimerButtons();
    }

    stopTimer() {
        if (this.timer.running) {
            this.pauseTimer();
        }
        
        if (this.timer.elapsedTime > 0) {
            const lesson = this.lessons[this.currentLessonIndex];
            if (lesson) {
                storage.addStudySession(this.courseId, lesson.id, Math.floor(this.timer.elapsedTime / 1000));
                this.updateStudyTimerStats();
            }
        }
        
        this.timer.elapsedTime = 0;
        this.updateTimerDisplay();
        this.updateTimerButtons();
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (!display) return;
        
        const seconds = Math.floor(this.timer.elapsedTime / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        const stopBtn = document.getElementById('stopTimerBtn');
        
        if (startBtn) startBtn.disabled = this.timer.running;
        if (pauseBtn) pauseBtn.disabled = !this.timer.running;
        if (stopBtn) stopBtn.disabled = !this.timer.running && this.timer.elapsedTime === 0;
    }

    updateStudyTimerStats() {
        const data = storage.getUserData();
        const todayStudy = storage.getDailyStudyTime();
        const totalStudy = data.user.totalStudyTime || 0;
        
        document.getElementById('todayStudyTime').textContent = `${Math.floor(todayStudy / 60)} min`;
        document.getElementById('totalStudyTime').textContent = `${Math.floor(totalStudy / 60)} min`;
    }

    saveLastAccessed() {
        const data = storage.getUserData();
        if (!data.progress[this.courseId]) {
            data.progress[this.courseId] = {};
        }
        data.progress[this.courseId].lastAccessed = new Date().toISOString();
        data.progress[this.courseId].lastLessonIndex = this.currentLessonIndex;
        storage.saveUserData(data);
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevLessonBtn')?.addEventListener('click', () => {
            if (this.currentLessonIndex > 0) {
                this.loadLesson(this.currentLessonIndex - 1);
            }
        });
        
        document.getElementById('nextLessonBtn')?.addEventListener('click', () => {
            if (this.currentLessonIndex < this.lessons.length - 1) {
                this.loadLesson(this.currentLessonIndex + 1);
            }
        });
        
        // Complete lesson button
        document.getElementById('completeLessonBtn')?.addEventListener('click', () => {
            this.markLessonComplete();
        });
        
        // Mark exercise complete
        document.getElementById('markExerciseComplete')?.addEventListener('click', () => {
            this.markLessonComplete();
        });
        
        // Notes buttons
        document.getElementById('saveNotesBtn')?.addEventListener('click', () => {
            this.saveNotes();
        });
        
        document.getElementById('clearNotesBtn')?.addEventListener('click', () => {
            this.clearNotes();
        });
        
        // Comment button
        document.getElementById('postCommentBtn')?.addEventListener('click', () => {
            this.postComment();
        });
        
        // Enter key for comments
        document.getElementById('commentInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.postComment();
            }
        });
        
        // Timer buttons
        document.getElementById('startTimerBtn')?.addEventListener('click', () => {
            this.startTimer();
        });
        
        document.getElementById('pauseTimerBtn')?.addEventListener('click', () => {
            this.pauseTimer();
        });
        
        document.getElementById('stopTimerBtn')?.addEventListener('click', () => {
            this.stopTimer();
        });
        
        // Course action buttons
        document.getElementById('editCourseBtn')?.addEventListener('click', () => {
            window.location.href = `create-course.html?id=${this.courseId}`;
        });
        
        document.getElementById('shareCourseBtn')?.addEventListener('click', () => {
            this.openModal('shareModal');
        });
        
        document.getElementById('addResourceBtn')?.addEventListener('click', () => {
            this.openModal('resourceModal');
        });
    }

    setupModals() {
        // Resource modal
        document.getElementById('saveResourceBtn')?.addEventListener('click', () => {
            this.addResource();
        });
        
        document.getElementById('cancelResourceBtn')?.addEventListener('click', () => {
            this.closeModal('resourceModal');
        });
        
        // Close modals on X click
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            
            // Initialize share link if it's the share modal
            if (modalId === 'shareModal') {
                this.generateShareLink();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    generateShareLink() {
        const courseLink = document.getElementById('courseLink');
        if (courseLink) {
            const url = `${window.location.origin}${window.location.pathname}?id=${this.courseId}`;
            courseLink.value = url;
        }
    }
}

// Global functions for course actions
function copyCourseLink() {
    const linkInput = document.getElementById('courseLink');
    if (linkInput) {
        linkInput.select();
        document.execCommand('copy');
        storage.showNotification('Link copied to clipboard!', 'success');
    }
}

function copyShareLink() {
    copyCourseLink();
}

function exportCourseData() {
    if (window.coursePage && window.coursePage.course) {
        const courseData = window.coursePage.course;
        const blob = new Blob([JSON.stringify(courseData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${courseData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_course.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        storage.showNotification('Course exported successfully!', 'success');
    }
}

function resetCourseProgress() {
    if (confirm('Are you sure you want to reset your progress for this course? This will remove all completion marks and notes.')) {
        const data = storage.getUserData();
        if (data.progress[window.coursePage.courseId]) {
            delete data.progress[window.coursePage.courseId];
        }
        storage.saveUserData(data);
        
        // Reload the page
        window.location.reload();
    }
}

function duplicateCourse() {
    if (window.coursePage && window.coursePage.course) {
        const originalCourse = window.coursePage.course;
        const newCourse = {
            ...originalCourse,
            title: `${originalCourse.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        delete newCourse.id;
        const course = storage.addUserCourse(newCourse);
        
        if (course) {
            storage.showNotification('Course duplicated successfully!', 'success');
            setTimeout(() => {
                window.location.href = `course.html?id=${course.id}`;
            }, 1500);
        }
    }
}

function deleteCurrentCourse() {
    if (window.coursePage && window.coursePage.course) {
        const courseTitle = window.coursePage.course.title;
        if (confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
            const success = storage.deleteUserCourse(window.coursePage.courseId);
            if (success) {
                storage.showNotification('Course deleted successfully', 'success');
                setTimeout(() => window.location.href = 'my-courses.html', 1500);
            } else {
                storage.showNotification('Failed to delete course', 'error');
            }
        }
    }
}

function exportCourse() {
    exportCourseData();
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
    
    // Initialize course page
    window.coursePage = new CoursePage();
});

// Add CSS for course page
const coursePageCSS = `
.course-header {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.course-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-md);
}

.course-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.course-header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
}

.course-header-image {
    width: 120px;
    height: 120px;
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-3xl);
    flex-shrink: 0;
}

.course-header-info {
    flex: 1;
    min-width: 300px;
}

.course-header-info h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
}

.course-header-info p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
    line-height: 1.6;
}

.course-header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.course-category,
.course-difficulty,
.course-duration,
.course-lessons {
    padding: 0.5rem 1rem;
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    font-weight: 500;
}

.course-difficulty {
    text-transform: uppercase;
    font-weight: 600;
}

.course-stats {
    display: flex;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
}

.course-stats .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.course-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-lg);
}

@media (max-width: 1024px) {
    .course-layout {
        grid-template-columns: 1fr;
    }
}

.content-display {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.content-placeholder {
    text-align: center;
    color: var(--text-secondary);
}

.content-placeholder i {
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
}

.video-player {
    width: 100%;
}

.video-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
    height: 0;
    overflow: hidden;
    border-radius: var(--border-radius);
}

.video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
}

.article-content,
.exercise-content {
    padding: var(--spacing-lg);
}

.article-header,
.exercise-header {
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--bg-tertiary);
}

.article-header h2,
.exercise-header h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
}

.article-meta,
.exercise-meta {
    display: flex;
    gap: var(--spacing-md);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.article-body,
.exercise-body {
    line-height: 1.8;
    color: var(--text-primary);
}

.article-body p,
.exercise-body p {
    margin-bottom: var(--spacing-md);
}

.external-link {
    padding: var(--spacing-xl);
    text-align: center;
}

.link-card {
    padding: var(--spacing-xl);
    max-width: 400px;
    margin: 0 auto;
}

.link-card i {
    color: var(--primary-color);
    margin-bottom: var(--spacing-md);
}

.link-card h3 {
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
}

.link-card p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.6;
}

.lesson-actions {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.action-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.lesson-progress {
    margin-top: var(--spacing-md);
}

.lesson-progress .progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.lesson-progress .progress-bar {
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
}

.lesson-progress .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    transition: width var(--transition-speed);
}

.progress-section {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
}

.progress-header h3 {
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.progress-header span {
    font-weight: 700;
    font-size: var(--font-size-xl);
    color: var(--primary-color);
}

.progress-bar.large {
    height: 10px;
    background: var(--bg-tertiary);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: var(--spacing-md);
}

.progress-bar.large .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    transition: width var(--transition-speed);
}

.progress-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    text-align: center;
}

@media (max-width: 768px) {
    .progress-stats {
        grid-template-columns: 1fr;
    }
}

.progress-stats .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
}

.progress-stats .stat i {
    font-size: var(--font-size-xl);
    color: var(--primary-color);
}

.progress-stats .stat span {
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
}

.notes-section,
.comments-section {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.notes-section h3,
.comments-section h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.notes-section textarea,
.comment-form textarea {
    width: 100%;
    min-height: 120px;
    padding: var(--spacing-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-family: inherit;
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-md);
    resize: vertical;
    color: var(--text-primary);
    background: white;
}

.notes-section textarea:focus,
.comment-form textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.notes-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
}

.comment-form {
    margin-bottom: var(--spacing-lg);
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    max-height: 400px;
    overflow-y: auto;
}

.comment {
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
}

.comment-author {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: 600;
    color: var(--text-primary);
}

.comment-author i {
    color: var(--text-secondary);
}

.comment-date {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.comment-body {
    color: var(--text-primary);
    line-height: 1.6;
}

.empty-comments,
.empty-lessons,
.empty-resources {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary);
}

.empty-comments i,
.empty-lessons i,
.empty-resources i {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
}

.lessons-list {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
}

.list-header h3 {
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.list-header span {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.lessons-container {
    max-height: 400px;
    overflow-y: auto;
}

.lesson-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-xs);
    cursor: pointer;
    transition: background var(--transition-speed);
    gap: var(--spacing-sm);
}

.lesson-item:hover {
    background: var(--bg-tertiary);
}

.lesson-item.active {
    background: rgba(67, 97, 238, 0.1);
    border-left: 3px solid var(--primary-color);
}

.lesson-item.completed .lesson-checkbox i {
    color: var(--success-color);
}

.lesson-checkbox {
    flex-shrink: 0;
}

.lesson-checkbox i {
    color: var(--text-secondary);
    font-size: var(--font-size-lg);
}

.lesson-info {
    flex: 1;
    min-width: 0;
}

.lesson-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.lesson-meta {
    display: flex;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    flex-wrap: wrap;
}

.lesson-type {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.lesson-status {
    color: var(--success-color);
    font-weight: 500;
}

.lesson-play {
    color: var(--primary-color);
    flex-shrink: 0;
}

.resources-section {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.resources-section h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.resources-list {
    margin-bottom: var(--spacing-md);
}

.resource-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    text-decoration: none;
    color: var(--text-primary);
    transition: background var(--transition-speed);
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
}

.resource-item:hover {
    background: var(--bg-tertiary);
}

.resource-icon {
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

.resource-info {
    flex: 1;
    min-width: 0;
}

.resource-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.resource-type {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-transform: uppercase;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
}

.course-actions {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.course-actions h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
}

.action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border: none;
    border-radius: var(--border-radius);
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--transition-speed);
    gap: 0.5rem;
}

.action-btn:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-2px);
}

.action-btn.danger:hover {
    background: var(--danger-color);
}

.action-btn i {
    font-size: var(--font-size-lg);
}

.action-btn span {
    font-size: var(--font-size-xs);
    font-weight: 500;
}

.timer-section {
    padding: var(--spacing-lg);
}

.timer-section h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.timer-display {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    text-align: center;
    margin-bottom: var(--spacing-md);
    color: var(--primary-color);
    font-family: monospace;
}

.timer-controls {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.timer-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
    text-align: center;
}

.timer-stats .stat {
    background: var(--bg-tertiary);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
}

.timer-stats small {
    display: block;
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    margin-bottom: 0.25rem;
}

.timer-stats span {
    font-weight: 600;
    color: var(--text-primary);
}

/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
}

.modal-content {
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--bg-tertiary);
}

.modal-header h3 {
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.modal-close {
    background: none;
    border: none;
    font-size: var(--font-size-xl);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.modal-body {
    margin-bottom: var(--spacing-lg);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
}

.share-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.share-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
}

.share-option i {
    font-size: var(--font-size-2xl);
    color: var(--primary-color);
}

.share-option div {
    flex: 1;
}

.share-option h4 {
    font-size: var(--font-size-base);
    margin-bottom: 0.25rem;
    color: var(--text-primary);
}

.share-option p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.share-link {
    display: flex;
    gap: var(--spacing-sm);
}

.share-link input {
    flex: 1;
    padding: var(--spacing-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    background: white;
}

.share-link input:read-only {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
}

@media (max-width: 768px) {
    .course-header-content {
        flex-direction: column;
        text-align: center;
    }
    
    .course-header-meta {
        justify-content: center;
    }
    
    .course-stats {
        justify-content: center;
    }
    
    .action-buttons {
        flex-direction: column;
        align-items: stretch;
    }
    
    .actions-grid {
        grid-template-columns: 1fr;
    }
    
    .share-option {
        flex-direction: column;
        text-align: center;
    }
}
`;

// Add styles for course page
const style = document.createElement('style');
style.textContent = coursePageCSS;
document.head.appendChild(style);