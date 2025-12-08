// Dashboard Page
class DashboardPage {
    constructor() {
        this.progressChart = null;
        this.studyChart = null;
        this.initialize();
    }

    initialize() {
        this.loadUserData();
        this.renderAchievements();
        this.renderRecentActivity();
        this.renderContinueLearning();
        this.renderStudyStats();
        this.setupEventListeners();
        this.setupProgressChart();
        this.updateDailyGoal();
        
        // Load user name
        this.loadUserName();
    }

    loadUserData() {
        const data = storage.getUserData();
        const stats = storage.getUserStats();
        
        // Update welcome section
        document.getElementById('userName').textContent = data.user.name;
        document.getElementById('currentStreak').textContent = data.user.streak || 0;
        document.getElementById('totalCourses').textContent = stats.totalCourses || 0;
        document.getElementById('completedLessons').textContent = stats.completedLessons || 0;
        document.getElementById('achievementsCount').textContent = stats.badges || 0;
        
        // Update XP progress
        this.updateXPProgress(data.user);
        
        // Update study stats
        this.updateStudyStats(stats);
    }

    loadUserName() {
        const data = storage.getUserData();
        const name = data.user.name || 'Learner';
        
        // Update in welcome section
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = name;
        }
    }

    updateXPProgress(user) {
        const xpFill = document.getElementById('xpFill');
        const currentXPDisplay = document.getElementById('currentXPDisplay');
        const maxXPDisplay = document.getElementById('maxXPDisplay');
        const currentLevel = document.getElementById('currentLevel');
        const nextLevelXP = document.getElementById('nextLevelXP');
        
        if (xpFill) {
            const xpPercentage = (user.xp / user.maxXP) * 100;
            xpFill.style.width = `${Math.min(xpPercentage, 100)}%`;
        }
        
        if (currentXPDisplay) currentXPDisplay.textContent = user.xp;
        if (maxXPDisplay) maxXPDisplay.textContent = user.maxXP;
        if (currentLevel) currentLevel.textContent = user.level;
        if (nextLevelXP) nextLevelXP.textContent = user.maxXP - user.xp;
    }

    updateStudyStats(stats) {
        document.getElementById('totalStudyTime').textContent = `${Math.floor((stats.totalStudyTime || 0) / 60)}h`;
        document.getElementById('completionRate').textContent = `${stats.completionRate || 0}%`;
        
        // Calculate study days
        const data = storage.getUserData();
        const studyHistory = data.studyHistory || [];
        const uniqueDays = new Set(studyHistory.map(s => new Date(s.date).toDateString())).size;
        document.getElementById('studyDays').textContent = uniqueDays;
        
        // Calculate average daily study time
        const avgDaily = uniqueDays > 0 ? Math.floor((stats.totalStudyTime || 0) / 60 / uniqueDays) : 0;
        document.getElementById('averageDaily').textContent = `${avgDaily}m`;
    }

    renderAchievements() {
        const achievements = storage.getAchievements();
        const container = document.getElementById('achievementsList');
        const badgeCount = document.getElementById('badgeCount');
        
        if (!container) return;
        
        if (achievements.length === 0) {
            container.innerHTML = `
                <div class="empty-achievements">
                    <i class="fas fa-trophy"></i>
                    <p>No achievements yet. Start learning to earn badges!</p>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first)
        const sortedAchievements = achievements.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        ).slice(0, 5);
        
        container.innerHTML = sortedAchievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-content">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-meta">
                        <span class="achievement-date">${formatDate(achievement.date)}</span>
                        <span class="achievement-xp">+${achievement.xpReward} XP</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (badgeCount) {
            badgeCount.textContent = achievements.length;
        }
    }

    renderRecentActivity() {
        const data = storage.getUserData();
        const studyHistory = data.studyHistory || [];
        const achievements = data.achievements || [];
        const recentCourses = data.recentCourses || [];
        
        const container = document.getElementById('activityList');
        if (!container) return;
        
        // Combine all activities
        let activities = [];
        
        // Add study sessions
        studyHistory.slice(-10).forEach(session => {
            const course = storage.getCourseById(session.courseId);
            if (course) {
                activities.push({
                    type: 'study',
                    title: `Studied ${course.title}`,
                    time: new Date(session.date),
                    duration: session.duration,
                    icon: 'fas fa-clock'
                });
            }
        });
        
        // Add achievements
        achievements.slice(-5).forEach(achievement => {
            activities.push({
                type: 'achievement',
                title: `Earned: ${achievement.title}`,
                time: new Date(achievement.date),
                icon: 'fas fa-trophy',
                xp: achievement.xpReward
            });
        });
        
        // Add course completions
        Object.keys(data.progress || {}).forEach(courseId => {
            const progress = data.progress[courseId];
            if (progress && progress.completedLessons && progress.completedLessons.length > 0) {
                const course = storage.getCourseById(courseId);
                if (course) {
                    // Find when the course was completed (last lesson completion)
                    // For simplicity, we'll use the lastAccessed time
                    activities.push({
                        type: 'completion',
                        title: `Progress in ${course.title}`,
                        time: new Date(progress.lastAccessed),
                        progress: storage.getCourseProgress(courseId),
                        icon: 'fas fa-check-circle'
                    });
                }
            }
        });
        
        // Sort by time (newest first) and take top 10
        activities = activities.sort((a, b) => b.time - a.time).slice(0, 10);
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-history"></i>
                    <p>No recent activity</p>
                    <p class="small">Start learning to see your activity here</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-details">
                        <span class="activity-time">${this.formatActivityTime(activity.time)}</span>
                        ${activity.duration ? `<span class="activity-duration">${Math.floor(activity.duration / 60)}m</span>` : ''}
                        ${activity.xp ? `<span class="activity-xp">+${activity.xp} XP</span>` : ''}
                        ${activity.progress ? `<span class="activity-progress">${activity.progress}%</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatActivityTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    renderContinueLearning() {
        const recentProgress = storage.getRecentProgress();
        const container = document.getElementById('continueList');
        
        if (!container) return;
        
        if (recentProgress.length === 0) {
            container.innerHTML = `
                <div class="empty-continue">
                    <i class="fas fa-book-open"></i>
                    <p>Start learning to continue from where you left off</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        recentProgress.forEach(item => {
            const course = storage.getCourseById(item.courseId);
            if (course) {
                const continueItem = document.createElement('div');
                continueItem.className = 'continue-item';
                continueItem.innerHTML = `
                    <div class="continue-item-image" style="background: ${course.color || '#4361ee'}">
                        <i class="${course.icon || 'fas fa-book'}"></i>
                    </div>
                    <div class="continue-item-content">
                        <h4>${course.title}</h4>
                        <div class="continue-item-progress">
                            <div class="progress-bar small">
                                <div class="progress-fill" style="width: ${item.progress}%"></div>
                            </div>
                            <span>${item.progress}%</span>
                        </div>
                    </div>
                    <button class="btn" onclick="viewCourse(${course.id})">
                        <i class="fas fa-play"></i>
                    </button>
                `;
                
                container.appendChild(continueItem);
            }
        });
    }

    renderStudyStats() {
        // This is handled by updateStudyStats
    }

    setupProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.progressChart) {
            this.progressChart.destroy();
        }
        
        // Get study data for the selected time range
        const days = this.getLastNDays(30); // Default 30 days
        const studyData = this.getStudyDataForDays(days);
        
        this.progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days.map(d => d.label),
                datasets: [{
                    label: 'Study Time (minutes)',
                    data: studyData,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} minutes`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + 'm';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    getLastNDays(n) {
        const days = [];
        const today = new Date();
        
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            days.push({
                date: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
        
        return days;
    }

    getStudyDataForDays(days) {
        const data = storage.getUserData();
        const studyHistory = data.studyHistory || [];
        
        return days.map(day => {
            const studyTime = studyHistory
                .filter(s => s.date.startsWith(day.date))
                .reduce((total, s) => total + s.duration, 0);
            
            return Math.floor(studyTime / 60); // Convert to minutes
        });
    }

    updateProgressChart() {
        const timeRange = document.getElementById('timeRange').value;
        const days = this.getLastNDays(parseInt(timeRange));
        const studyData = this.getStudyDataForDays(days);
        
        if (this.progressChart) {
            this.progressChart.data.labels = days.map(d => d.label);
            this.progressChart.data.datasets[0].data = studyData;
            this.progressChart.update();
        }
    }

    updateDailyGoal() {
        const data = storage.getUserData();
        const today = new Date().toDateString();
        let goal = data.dailyGoal || { target: 3, completed: 0, date: today };
        
        // Reset if new day
        if (goal.date !== today) {
            goal.completed = 0;
            goal.date = today;
            data.dailyGoal = goal;
            storage.saveUserData(data);
        }
        
        // Update display
        const goalFill = document.getElementById('goalFill');
        const goalProgress = document.getElementById('goalProgress');
        const goalTarget = document.getElementById('goalTarget');
        
        if (goalFill) {
            const percentage = Math.min((goal.completed / goal.target) * 100, 100);
            goalFill.style.width = `${percentage}%`;
        }
        
        if (goalProgress) goalProgress.textContent = goal.completed;
        if (goalTarget) goalTarget.textContent = goal.target;
    }

    setupEventListeners() {
        // Time range selector
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            timeRange.addEventListener('change', () => {
                this.updateProgressChart();
            });
        }
        
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
        
        // Modals
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
}

// Global functions
function refreshDashboard() {
    if (window.dashboardPage) {
        window.dashboardPage.initialize();
        storage.showNotification('Dashboard refreshed!', 'success');
    }
}

function updateDailyGoal() {
    const target = prompt('Set daily lesson target (1-10):', '3');
    if (target && !isNaN(target) && target >= 1 && target <= 10) {
        const data = storage.getUserData();
        const today = new Date().toDateString();
        
        data.dailyGoal = {
            target: parseInt(target),
            completed: data.dailyGoal?.completed || 0,
            date: today
        };
        
        storage.saveUserData(data);
        
        if (window.dashboardPage) {
            window.dashboardPage.updateDailyGoal();
        }
        
        storage.showNotification(`Daily goal set to ${target} lessons!`, 'success');
    }
}

function markGoalComplete() {
    const data = storage.getUserData();
    const today = new Date().toDateString();
    let goal = data.dailyGoal || { target: 3, completed: 0, date: today };
    
    if (goal.date !== today) {
        goal.completed = 1;
        goal.date = today;
    } else {
        goal.completed = Math.min(goal.completed + 1, goal.target);
    }
    
    data.dailyGoal = goal;
    storage.saveUserData(data);
    
    if (window.dashboardPage) {
        window.dashboardPage.updateDailyGoal();
    }
    
    storage.showNotification('Daily goal updated!', 'success');
    
    // Award XP for completing daily goal
    if (goal.completed === goal.target) {
        storage.updateXP(25);
        storage.showNotification('🎉 Daily goal completed! +25 XP', 'success');
    }
}

function clearActivity() {
    if (confirm('Clear all activity history?')) {
        const data = storage.getUserData();
        data.studyHistory = [];
        storage.saveUserData(data);
        
        if (window.dashboardPage) {
            window.dashboardPage.renderRecentActivity();
        }
        
        storage.showNotification('Activity history cleared', 'success');
    }
}

function exportData() {
    storage.exportData();
}

function exportProgress() {
    const data = storage.getUserData();
    const progressData = {
        progress: data.progress,
        completedLessons: data.completedLessons,
        courseNotes: data.courseNotes,
        achievements: data.achievements,
        user: {
            level: data.user.level,
            xp: data.user.xp,
            maxXP: data.user.maxXP,
            streak: data.user.streak
        }
    };
    
    const blob = new Blob([JSON.stringify(progressData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnhub-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    storage.showNotification('Progress data exported!', 'success');
}

function importDataPrompt() {
    document.getElementById('importModal').style.display = 'flex';
}

function importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files[0]) {
        storage.showNotification('Please select a file', 'error');
        return;
    }
    
    storage.importData(fileInput.files[0])
        .then(() => {
            closeModal('importModal');
            setTimeout(() => window.location.reload(), 1000);
        })
        .catch(error => {
            console.error('Import error:', error);
        });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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
    
    // Initialize dashboard page
    window.dashboardPage = new DashboardPage();
});

// Add CSS for dashboard page
const dashboardCSS = `
.dashboard-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-lg);
}

@media (max-width: 1024px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
    }
}

.welcome-section {
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
}

.welcome-content h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
}

.welcome-content p {
    color: var(--text-secondary);
}

.welcome-actions {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
}

.dashboard-card {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.card-header h3 {
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
}

.card-header select {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    border: 1px solid var(--bg-tertiary);
    background: white;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.chart-container {
    height: 200px;
    position: relative;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.activity-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    transition: background var(--transition-speed);
}

.activity-item:hover {
    background: var(--bg-tertiary);
}

.activity-icon {
    width: 36px;
    height: 36px;
    background: rgba(67, 97, 238, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.activity-icon i {
    color: var(--primary-color);
    font-size: var(--font-size-sm);
}

.activity-content {
    flex: 1;
    min-width: 0;
}

.activity-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.activity-details {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
}

.activity-duration,
.activity-xp,
.activity-progress {
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    background: var(--bg-tertiary);
}

.activity-xp {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning-color);
}

.activity-progress {
    background: rgba(67, 97, 238, 0.1);
    color: var(--primary-color);
}

.empty-activity,
.empty-continue,
.empty-achievements {
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--text-secondary);
}

.empty-activity i,
.empty-continue i,
.empty-achievements i {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
}

.small {
    font-size: var(--font-size-sm);
}

.continue-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.continue-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    transition: transform var(--transition-speed);
}

.continue-item:hover {
    transform: translateX(5px);
}

.continue-item-image {
    width: 50px;
    height: 50px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-xl);
    flex-shrink: 0;
}

.continue-item-content {
    flex: 1;
    min-width: 0;
}

.continue-item-content h4 {
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.continue-item-progress {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.continue-item-progress .progress-bar {
    flex: 1;
}

.continue-item-progress span {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    min-width: 40px;
}

.xp-progress {
    margin-bottom: var(--spacing-md);
}

.xp-bar {
    height: 10px;
    background: var(--bg-tertiary);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: var(--spacing-sm);
}

.xp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    border-radius: 5px;
    transition: width var(--transition-speed);
}

.xp-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.xp-level {
    font-weight: 600;
    color: var(--primary-color);
}

.xp-next {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: var(--spacing-md);
}

.xp-next i {
    color: var(--primary-color);
}

.goal-progress {
    margin-bottom: var(--spacing-md);
}

.goal-bar {
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--spacing-sm);
}

.goal-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--success-color), #22c55e);
    border-radius: 4px;
    transition: width var(--transition-speed);
}

.goal-info {
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-md);
}

.goal-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
}

.achievements-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.achievement-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    transition: transform var(--transition-speed);
}

.achievement-item:hover {
    transform: translateX(5px);
}

.achievement-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--warning-color), #f59e0b);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-lg);
    flex-shrink: 0;
}

.achievement-content {
    flex: 1;
    min-width: 0;
}

.achievement-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.achievement-meta {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
}

.achievement-xp {
    color: var(--warning-color);
    font-weight: 600;
}

.study-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    text-align: left;
}

.stat-item i {
    font-size: var(--font-size-xl);
    color: var(--primary-color);
    flex-shrink: 0;
}

.stat-item div {
    display: flex;
    flex-direction: column;
}

.stat-item span {
    font-weight: 700;
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    line-height: 1;
}

.stat-item small {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    margin-top: 0.25rem;
}

.import-warning {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: rgba(245, 158, 11, 0.1);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-lg);
    color: var(--warning-color);
}

.import-warning i {
    font-size: var(--font-size-xl);
    flex-shrink: 0;
}

.import-warning p {
    font-size: var(--font-size-sm);
    line-height: 1.5;
    margin: 0;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
    .welcome-section {
        flex-direction: column;
        text-align: center;
    }
    
    .welcome-actions {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .study-stats {
        grid-template-columns: 1fr;
    }
    
    .card-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .card-header select {
        width: 100%;
    }
}
`;

// Add styles for dashboard page
const style = document.createElement('style');
style.textContent = dashboardCSS;
document.head.appendChild(style);