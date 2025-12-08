// Search Page
class SearchPage {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.searchQuery = '';
        this.filters = {
            category: '',
            difficulty: '',
            progress: '',
            sort: 'relevance'
        };
        this.viewMode = 'grid';
        this.searchStartTime = null;
        
        this.initialize();
    }

    initialize() {
        this.loadCourses();
        this.setupEventListeners();
        this.performSearch();
        this.loadPopularTags();
        
        // Check for URL parameters
        const params = getUrlParams();
        if (params.q) {
            document.getElementById('searchInput').value = params.q;
            this.searchQuery = params.q;
        }
        if (params.category) {
            document.getElementById('categoryFilter').value = params.category;
            this.filters.category = params.category;
        }
        if (params.difficulty) {
            document.getElementById('difficultyFilter').value = params.difficulty;
            this.filters.difficulty = params.difficulty;
        }
        
        // Load saved view mode
        const savedView = localStorage.getItem('searchViewMode');
        if (savedView) {
            this.setViewMode(savedView);
        }
    }

    loadCourses() {
        this.courses = courseManager.getUserCourses();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        searchInput.addEventListener('input', debounce(() => {
            this.searchQuery = searchInput.value.trim();
            this.performSearch();
        }, 300));
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchQuery = searchInput.value.trim();
                this.performSearch();
            }
        });
        
        searchButton.addEventListener('click', () => {
            this.searchQuery = searchInput.value.trim();
            this.performSearch();
        });
        
        // Filter buttons
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.updateFilters();
            this.performSearch();
        });
        
        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Reset search button
        document.getElementById('resetSearchBtn')?.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Sort filter
        document.getElementById('sortFilter')?.addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.performSearch();
        });
    }

    updateFilters() {
        this.filters = {
            category: document.getElementById('categoryFilter').value,
            difficulty: document.getElementById('difficultyFilter').value,
            progress: document.getElementById('progressFilter').value,
            sort: document.getElementById('sortFilter').value
        };
    }

    clearFilters() {
        this.searchQuery = '';
        this.filters = {
            category: '',
            difficulty: '',
            progress: '',
            sort: 'relevance'
        };
        
        // Reset input fields
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        document.getElementById('progressFilter').value = '';
        document.getElementById('sortFilter').value = 'relevance';
        
        // Clear URL parameters
        window.history.pushState({}, '', 'search.html');
        
        this.performSearch();
    }

    performSearch() {
        this.searchStartTime = Date.now();
        this.showLoading();
        
        // Simulate search delay for better UX
        setTimeout(() => {
            this.filterCourses();
            this.sortCourses();
            this.renderResults();
            this.updateUrlParams();
            this.hideLoading();
            this.updateSearchTime();
        }, 300);
    }

    filterCourses() {
        let filtered = [...this.courses];
        
        // Filter by search query
        if (this.searchQuery) {
            const searchTerm = this.searchQuery.toLowerCase();
            filtered = filtered.filter(course => 
                course.title.toLowerCase().includes(searchTerm) ||
                course.description?.toLowerCase().includes(searchTerm) ||
                course.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                course.category?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by category
        if (this.filters.category) {
            filtered = filtered.filter(course => 
                course.category === this.filters.category
            );
        }
        
        // Filter by difficulty
        if (this.filters.difficulty) {
            filtered = filtered.filter(course => 
                course.difficulty === this.filters.difficulty
            );
        }
        
        // Filter by progress
        if (this.filters.progress) {
            filtered = filtered.filter(course => {
                const progress = storage.getCourseProgress(course.id);
                
                switch (this.filters.progress) {
                    case 'not-started':
                        return progress === 0;
                    case 'in-progress':
                        return progress > 0 && progress < 100;
                    case 'completed':
                        return progress === 100;
                    default:
                        return true;
                }
            });
        }
        
        this.filteredCourses = filtered;
    }

    sortCourses() {
        switch (this.filters.sort) {
            case 'newest':
                this.filteredCourses.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                break;
                
            case 'oldest':
                this.filteredCourses.sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                break;
                
            case 'title':
                this.filteredCourses.sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
                break;
                
            case 'progress':
                this.filteredCourses.sort((a, b) => {
                    const progressA = storage.getCourseProgress(a.id);
                    const progressB = storage.getCourseProgress(b.id);
                    return progressB - progressA;
                });
                break;
                
            case 'relevance':
            default:
                // Already sorted by relevance from search
                break;
        }
    }

    renderResults() {
        const container = document.getElementById('resultsContainer');
        const emptyResults = document.getElementById('emptyResults');
        const resultsTitle = document.getElementById('resultsTitle');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!container) return;
        
        // Update results info
        if (resultsCount) {
            resultsCount.textContent = this.filteredCourses.length;
        }
        
        // Update title
        if (resultsTitle) {
            if (this.searchQuery) {
                resultsTitle.textContent = `Results for "${this.searchQuery}"`;
            } else if (this.filters.category) {
                resultsTitle.textContent = `${this.filters.category} Courses`;
            } else if (this.filters.difficulty) {
                resultsTitle.textContent = `${this.filters.difficulty.charAt(0).toUpperCase() + this.filters.difficulty.slice(1)} Level Courses`;
            } else {
                resultsTitle.textContent = 'All Courses';
            }
        }
        
        // Show empty state if no courses
        if (this.filteredCourses.length === 0) {
            container.innerHTML = '';
            if (emptyResults) {
                emptyResults.style.display = 'block';
            }
            return;
        }
        
        // Hide empty state
        if (emptyResults) {
            emptyResults.style.display = 'none';
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Set container class based on view mode
        container.className = this.viewMode === 'grid' ? 'results-grid' : 'results-list';
        
        // Render courses based on view mode
        if (this.viewMode === 'grid') {
            this.filteredCourses.forEach(course => {
                const card = courseManager.renderCourseCard(course);
                container.appendChild(card);
            });
        } else {
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
        const createdDate = course.createdAt ? new Date(course.createdAt) : new Date();
        const formattedDate = createdDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
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
                        <span class="category-badge">
                            <i class="fas fa-folder"></i> ${course.category || 'Uncategorized'}
                        </span>
                        <span class="date-badge">
                            <i class="fas fa-calendar"></i> ${formattedDate}
                        </span>
                    </div>
                </div>
                <div class="list-item-description">
                    ${course.description || 'No description provided'}
                </div>
                <div class="list-item-footer">
                    <div class="list-item-stats">
                        <span class="stat">
                            <i class="fas fa-list-check"></i>
                            ${completedLessons}/${lessonCount} lessons
                        </span>
                        <span class="stat">
                            <i class="fas fa-percentage"></i>
                            ${progress}% complete
                        </span>
                    </div>
                    <div class="list-item-tags">
                        ${course.tags ? course.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                        ${course.tags && course.tags.length > 3 ? `<span class="tag">+${course.tags.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn" onclick="viewCourse(${course.id})">
                    ${progress > 0 ? 'Continue' : 'Start'} <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        
        listItem.onclick = (e) => {
            // Don't trigger if clicking on buttons
            if (!e.target.closest('button')) {
                viewCourse(course.id);
            }
        };
        
        return listItem;
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update active button
        document.querySelectorAll('.view-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        // Save preference
        localStorage.setItem('searchViewMode', mode);
        
        // Re-render results
        this.renderResults();
    }

    updateUrlParams() {
        const params = new URLSearchParams();
        
        if (this.searchQuery) {
            params.set('q', this.searchQuery);
        }
        
        if (this.filters.category) {
            params.set('category', this.filters.category);
        }
        
        if (this.filters.difficulty) {
            params.set('difficulty', this.filters.difficulty);
        }
        
        const queryString = params.toString();
        const newUrl = queryString ? `search.html?${queryString}` : 'search.html';
        
        window.history.pushState({}, '', newUrl);
    }

    loadPopularTags() {
        const allTags = courseManager.getAllTags();
        const container = document.getElementById('tagsCloud');
        
        if (!container || allTags.length === 0) return;
        
        // Count tag frequency
        const tagCounts = {};
        this.courses.forEach(course => {
            if (course.tags) {
                course.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        // Sort by frequency and get top 20
        const popularTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag]) => tag);
        
        // Render tags with varying sizes based on frequency
        container.innerHTML = popularTags.map(tag => {
            const count = tagCounts[tag];
            let size = 'small';
            
            if (count > 5) size = 'large';
            else if (count > 2) size = 'medium';
            
            return `<span class="tag ${size}" onclick="searchByTag('${tag}')">${tag}</span>`;
        }).join('');
    }

    showLoading() {
        const loading = document.getElementById('loadingResults');
        const container = document.getElementById('resultsContainer');
        const emptyResults = document.getElementById('emptyResults');
        
        if (loading) loading.style.display = 'block';
        if (container) container.style.display = 'none';
        if (emptyResults) emptyResults.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('loadingResults');
        const container = document.getElementById('resultsContainer');
        
        if (loading) loading.style.display = 'none';
        if (container) container.style.display = 'block';
    }

    updateSearchTime() {
        if (!this.searchStartTime) return;
        
        const searchTime = Date.now() - this.searchStartTime;
        const timeElement = document.getElementById('resultsTime');
        
        if (timeElement) {
            timeElement.textContent = `(${searchTime}ms)`;
        }
    }
}

// Global functions
function toggleAdvancedSearch() {
    const filters = document.getElementById('advancedFilters');
    if (filters) {
        filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
    }
}

function setViewMode(mode) {
    if (window.searchPage) {
        window.searchPage.setViewMode(mode);
    }
}

function searchByTag(tag) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = tag;
    }
    
    if (window.searchPage) {
        window.searchPage.searchQuery = tag;
        window.searchPage.performSearch();
    }
}

function viewCourse(courseId) {
    window.location.href = `course.html?id=${courseId}`;
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
    
    // Initialize search page
    window.searchPage = new SearchPage();
});

// Add CSS for search page
const searchCSS = `
.search-header {
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    text-align: center;
}

.search-header h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
}

.search-header p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.search-container {
    max-width: 800px;
    margin: 0 auto;
}

.search-box {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
}

.search-box i {
    color: var(--text-secondary);
    margin: 0 var(--spacing-sm);
}

.search-box input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    outline: none;
}

.search-box input::placeholder {
    color: var(--text-secondary);
}

.search-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-speed);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.search-btn:hover {
    background: var(--secondary-color);
}

.advanced-search-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color);
    font-weight: 500;
    cursor: pointer;
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    transition: background var(--transition-speed);
}

.advanced-search-toggle:hover {
    background: rgba(67, 97, 238, 0.1);
}

.advanced-filters {
    padding: var(--spacing-lg);
    margin-top: var(--spacing-md);
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.filter-group label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-group select {
    padding: var(--spacing-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    color: var(--text-primary);
    background: white;
}

.filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
}

.search-results {
    margin: var(--spacing-xl) 0;
}

.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-md);
}

.results-header h2 {
    font-size: var(--font-size-xl);
    color: var(--text-primary);
}

.results-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.results-time {
    font-size: var(--font-size-xs);
    opacity: 0.7;
}

.results-view {
    margin-bottom: var(--spacing-lg);
}

.view-options {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-tertiary);
    padding: 0.25rem;
    border-radius: var(--border-radius);
    width: fit-content;
}

.view-option {
    background: none;
    border: none;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--border-radius);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-speed);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-sm);
}

.view-option.active {
    background: white;
    color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-container {
    transition: all var(--transition-speed);
}

.results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
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
    min-width: 0;
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

.difficulty-badge, .category-badge, .date-badge {
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

.date-badge {
    background: rgba(76, 201, 240, 0.1);
    color: var(--accent-color);
}

.list-item-description {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.list-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-top: var(--spacing-sm);
}

.list-item-stats {
    display: flex;
    gap: var(--spacing-md);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.list-item-stats .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.list-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.list-item-actions {
    flex-shrink: 0;
}

.empty-results {
    padding: var(--spacing-xl);
    text-align: center;
    margin: var(--spacing-xl) 0;
}

.empty-results i {
    font-size: var(--font-size-3xl);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
}

.empty-results h3 {
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
}

.empty-results p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
}

.loading-results {
    padding: var(--spacing-xl);
    text-align: center;
}

.loading-results .spinner {
    margin-bottom: var(--spacing-md);
}

.popular-tags-section {
    padding: var(--spacing-lg);
    margin-top: var(--spacing-xl);
}

.popular-tags-section h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.tags-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    align-items: center;
    justify-content: center;
}

.tags-cloud .tag {
    cursor: pointer;
    transition: all var(--transition-speed);
}

.tags-cloud .tag:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-2px);
}

.tags-cloud .tag.small {
    font-size: var(--font-size-xs);
    padding: 0.25rem 0.5rem;
}

.tags-cloud .tag.medium {
    font-size: var(--font-size-sm);
    padding: 0.375rem 0.75rem;
}

.tags-cloud .tag.large {
    font-size: var(--font-size-base);
    padding: 0.5rem 1rem;
    font-weight: 500;
}

@media (max-width: 768px) {
    .filters-grid {
        grid-template-columns: 1fr;
    }
    
    .results-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .results-grid {
        grid-template-columns: 1fr;
    }
    
    .course-list-item {
        flex-direction: column;
    }
    
    .list-item-icon {
        align-self: center;
    }
    
    .list-item-footer {
        flex-direction: column;
        align-items: stretch;
    }
    
    .list-item-actions {
        align-self: center;
    }
}
`;

// Add styles for search page
const style = document.createElement('style');
style.textContent = searchCSS;
document.head.appendChild(style);