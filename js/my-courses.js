// My Courses Page
class MyCoursesPage {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.currentSort = 'newest';
        this.currentView = 'grid';
        this.filters = {
            search: '',
            category: '',
            difficulty: ''
        };
        
        this.initialize();
    }

    initialize() {
        this.loadCourses();
        this.setupEventListeners();
        this.renderCourses();
        this.updateStats();
        
        // Apply saved view preference
        const savedView = localStorage.getItem('coursesView');
        if (savedView) {
            this.setView(savedView);
        }
    }

    loadCourses() {
        this.courses = courseManager.getUserCourses();
        this.applyFilters();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchCourses');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.filters.search = searchInput.value.trim();
                this.applyFilters();
            }, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                this.applyFilters();
            });
        }

        // Difficulty filter
        const difficultyFilter = document.getElementById('difficultyFilter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => {
                this.filters.difficulty = difficultyFilter.value;
                this.applyFilters();
            });
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.setView(view);
            });
        });

        // Dropdown
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = toggle.nextElementSibling;
                menu.classList.toggle('show');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        });
    }

    applyFilters() {
        this.filteredCourses = courseManager.searchCourses(this.filters.search, {
            category: this.filters.category,
            difficulty: this.filters.difficulty
        });
        
        this.sortCourses();
        this.renderCourses();
        this.updateStats();
    }

    sortCourses() {
        this.filteredCourses = courseManager.sortCourses(this.filteredCourses, this.currentSort);
    }

    renderCourses() {
        const container = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        const coursesCount = document.getElementById('coursesCount');
        
        if (!container) return;
        
        // Update count
        if (coursesCount) {
            coursesCount.textContent = `(${this.filteredCourses.length})`;
        }
        
        // Show empty state if no courses
        if (this.filteredCourses.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // Hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Render courses based on view
        if (this.currentView === 'grid') {
            container.className = 'courses-grid';
            this.filteredCourses.forEach(course => {
                const card = courseManager.renderCourseCard(course);
                container.appendChild(card);
            });
        } else {
            container.className = 'courses-list';
            this.filteredCourses.forEach(course => {
                const listItem = this.createCourseListItem(course);
                container.appendChild(listItem);
            });
        }
        
        // Animate progress bars
        animateProgressBars();
    }

    createCourseListItem(course) {
        const progress = storage.getCourseProgress(course.id);
        const lessonCount = course.lessons ? course.lessons.length : 0;
        const completedLessons = storage.getUserData().progress[course.id]?.completedLessons?.length || 0;
        
        const listItem = document.createElement('div');
        listItem.className = 'course-list-item glass scale-hover';
        listItem.innerHTML = `
            <div class="list-item-icon" style="background: ${course.color || '#4361ee'}">
                <i class="${course.icon || 'fas fa-book'}"></i>
            </div>
            <div class="list-item-content">
                <div class="list-item-header">
                    <h4>${course.title}</h4>
                    <div class="list-item-meta">
                        <span class="difficulty-badge difficulty-${course.difficulty || 'beginner'}">
                            ${courseManager.getDifficultyLabel(course.difficulty)}
                        </span>
                        <span class="lesson-count">
                            <i class="fas fa-list-check"></i> ${completedLessons}/${lessonCount} lessons
                        </span>
                        <span class="category-badge">
                            <i class="fas fa-folder"></i> ${course.category || 'Uncategorized'}
                        </span>
                    </div>
                </div>
                <div class="list-item-description">
                    ${course.description || 'No description provided'}
                </div>
                <div class="list-item-footer">
                    <div class="progress-section">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}% complete</span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn-outline btn-sm" onclick="event.stopPropagation(); editCourse(${course.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm" onclick="event.stopPropagation(); viewCourse(${course.id})">
                            ${progress > 0 ? 'Continue' : 'Start'} <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="btn-outline btn-sm btn-danger" onclick="event.stopPropagation(); deleteCourse(${course.id}, '${course.title}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        listItem.onclick = () => viewCourse(course.id);
        
        return listItem;
    }

    setView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Save preference
        localStorage.setItem('coursesView', view);
        
        // Re-render courses
        this.renderCourses();
    }

    clearFilters() {
        this.filters = {
            search: '',
            category: '',
            difficulty: ''
        };
        
        // Reset input fields
        document.getElementById('searchCourses').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        
        this.applyFilters();
    }

    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('totalMyCourses').textContent = stats.totalCourses;
        document.getElementById('totalMyLessons').textContent = stats.totalLessons;
        document.getElementById('averageProgress').textContent = `${stats.averageProgress}%`;
        document.getElementById('totalStudyTime').textContent = `${Math.floor(stats.totalStudyTime / 60)}h`;
    }

    calculateStats() {
        const courses = this.courses;
        let totalLessons = 0;
        let totalProgress = 0;
        
        courses.forEach(course => {
            if (course.lessons) {
                totalLessons += course.lessons.length;
            }
            totalProgress += storage.getCourseProgress(course.id);
        });
        
        const userData = storage.getUserData();
        
        return {
            totalCourses: courses.length,
            totalLessons: totalLessons,
            averageProgress: courses.length > 0 ? Math.round(totalProgress / courses.length) : 0,
            totalStudyTime: userData.user.totalStudyTime || 0
        };
    }
}

// Global function for sorting
function sortCourses(sortBy) {
    if (window.myCoursesPage) {
        window.myCoursesPage.currentSort = sortBy;
        window.myCoursesPage.applyFilters();
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
    
    // Initialize my courses page
    window.myCoursesPage = new MyCoursesPage();
});

// Add CSS for list view
const listViewCSS = `
.courses-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.course-list-item {
    display: flex;
    padding: var(--spacing-md);
    gap: var(--spacing-md);
    cursor: pointer;
    transition: transform var(--transition-speed);
}

.course-list-item:hover {
    transform: translateX(5px);
}

.list-item-icon {
    width: 60px;
    height: 60px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-xl);
    flex-shrink: 0;
}

.list-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.list-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.list-item-header h4 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
}

.list-item-meta {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    flex-wrap: wrap;
}

.difficulty-badge, .category-badge, .lesson-count {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: 500;
}

.difficulty-badge {
    background: rgba(67, 97, 238, 0.1);
    color: var(--primary-color);
}

.category-badge {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
}

.lesson-count {
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.list-item-description {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
}

.list-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-top: var(--spacing-sm);
}

.progress-section {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
}

.progress-text {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: 0.25rem;
}

.action-buttons {
    display: flex;
    gap: var(--spacing-sm);
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
}

.btn-danger {
    background: var(--danger-color);
    color: white;
    border: none;
}

.btn-danger:hover {
    background: #dc2626;
}

.courses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
}

.view-toggle {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-tertiary);
    padding: 0.25rem;
    border-radius: var(--border-radius);
}

.view-btn {
    background: none;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all var(--transition-speed);
}

.view-btn.active {
    background: white;
    color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    padding: 0.5rem 0;
    min-width: 150px;
    display: none;
    z-index: 1000;
}

.dropdown-menu.show {
    display: block;
}

.dropdown-menu a {
    display: block;
    padding: 0.5rem 1rem;
    color: var(--text-primary);
    text-decoration: none;
    transition: background var(--transition-speed);
}

.dropdown-menu a:hover {
    background: var(--bg-tertiary);
}

.filters-section {
    padding: var(--spacing-md);
    margin: var(--spacing-lg) 0;
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    align-items: center;
}

.filter-group {
    flex: 1;
    min-width: 200px;
    position: relative;
}

.search-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    color: var(--text-primary);
    background: white;
}

.filter-group .fa-search {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
}

.filter-group select {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    color: var(--text-primary);
    background: white;
}

.course-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    margin: var(--spacing-lg) 0;
}

.page-header {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
}

.header-content h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.header-content p {
    color: var(--text-secondary);
}

.header-actions {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
    }
    
    .header-actions {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .list-item-footer {
        flex-direction: column;
        align-items: stretch;
    }
    
    .progress-section {
        max-width: none;
    }
    
    .action-buttons {
        justify-content: center;
    }
}
`;

// Add styles for list view
const style = document.createElement('style');
style.textContent = listViewCSS;
document.head.appendChild(style);