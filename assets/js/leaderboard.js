// Leaderboard System

class LeaderboardManager {
    constructor() {
        this.currentPeriod = 'daily';
        this.demoData = {
            daily: [
                { rank: 1, name: 'Alex Johnson', score: 98, quizzes: 3, avatar: 'A', totalPoints: 294 },
                { rank: 2, name: 'Sarah Chen', score: 95, quizzes: 2, avatar: 'S', totalPoints: 190 },
                { rank: 3, name: 'Mike Davis', score: 92, quizzes: 4, avatar: 'M', totalPoints: 368 },
                { rank: 4, name: 'Emma Wilson', score: 89, quizzes: 2, avatar: 'E', totalPoints: 178 },
                { rank: 5, name: 'John Smith', score: 87, quizzes: 3, avatar: 'J', totalPoints: 261 }
            ],
            weekly: [
                { rank: 1, name: 'Sarah Chen', score: 96, quizzes: 8, avatar: 'S', totalPoints: 768 },
                { rank: 2, name: 'Alex Johnson', score: 94, quizzes: 12, avatar: 'A', totalPoints: 1128 },
                { rank: 3, name: 'David Kim', score: 91, quizzes: 7, avatar: 'D', totalPoints: 637 },
                { rank: 4, name: 'Lisa Zhang', score: 88, quizzes: 9, avatar: 'L', totalPoints: 792 },
                { rank: 5, name: 'Tom Brown', score: 85, quizzes: 6, avatar: 'T', totalPoints: 510 }
            ],
            monthly: [
                { rank: 1, name: 'Alex Johnson', score: 95, quizzes: 45, avatar: 'A', totalPoints: 4275 },
                { rank: 2, name: 'Sarah Chen', score: 93, quizzes: 38, avatar: 'S', totalPoints: 3534 },
                { rank: 3, name: 'Emma Wilson', score: 90, quizzes: 42, avatar: 'E', totalPoints: 3780 },
                { rank: 4, name: 'Mike Davis', score: 88, quizzes: 35, avatar: 'M', totalPoints: 3080 },
                { rank: 5, name: 'Lisa Zhang', score: 86, quizzes: 40, avatar: 'L', totalPoints: 3440 }
            ],
            alltime: [
                { rank: 1, name: 'Alex Johnson', score: 94, quizzes: 156, avatar: 'A', totalPoints: 14664 },
                { rank: 2, name: 'Sarah Chen', score: 92, quizzes: 142, avatar: 'S', totalPoints: 13064 },
                { rank: 3, name: 'Mike Davis', score: 89, quizzes: 134, avatar: 'M', totalPoints: 11926 },
                { rank: 4, name: 'Emma Wilson', score: 87, quizzes: 128, avatar: 'E', totalPoints: 11136 },
                { rank: 5, name: 'John Smith', score: 85, quizzes: 145, avatar: 'J', totalPoints: 12325 }
            ]
        };
        
        this.initializeEventListeners();
        this.loadLeaderboard();
    }

    initializeEventListeners() {
        // Period selection
        document.querySelectorAll('[data-period]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.changePeriod(link.getAttribute('data-period'));
            });
        });
    }

    changePeriod(period) {
        this.currentPeriod = period;
        
        // Update active state
        document.querySelectorAll('[data-period]').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`)?.classList.add('active');
        
        // Load new data
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        try {
            this.showLoadingState();
            
            // Simulate loading delay
            setTimeout(() => {
                const data = this.demoData[this.currentPeriod] || this.demoData.daily;
                this.displayLeaderboard(data);
            }, 500);
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showErrorState();
        }
    }

    displayLeaderboard(data) {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        if (!data || data.length === 0) {
            this.showEmptyState();
            return;
        }

        container.innerHTML = `
            <div class="leaderboard-list">
                ${data.map(user => this.createLeaderboardItem(user)).join('')}
            </div>
            ${this.createLeaderboardStats(data)}
        `;
    }

    createLeaderboardItem(user) {
        const rankClass = user.rank <= 3 ? `rank-${user.rank}` : 'rank-other';
        
        return `
            <div class="leaderboard-item" data-user-id="${user.name}">
                <div class="rank-badge ${rankClass}">
                    ${user.rank <= 3 ? this.getRankIcon(user.rank) : user.rank}
                </div>
                
                <div class="user-avatar" style="background: ${this.generateUserColor(user.name)}">
                    ${user.avatar}
                </div>
                
                <div class="user-info flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${user.name}</h6>
                            <div class="user-stats">
                                <small class="text-muted">
                                    ${user.quizzes} quiz${user.quizzes !== 1 ? 'es' : ''} • 
                                    Avg: ${user.score}%
                                </small>
                            </div>
                        </div>
                        
                        <div class="score-section text-end">
                            <div class="best-score">
                                <h5 class="mb-0">${user.score}%</h5>
                                <small class="text-muted">Best Score</small>
                            </div>
                            <div class="total-points mt-1">
                                <small class="text-primary">${user.totalPoints} pts</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress mt-2" style="height: 4px;">
                        <div class="progress-bar" style="width: ${user.score}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getRankIcon(rank) {
        const icons = {
            1: '<i class="fas fa-crown"></i>',
            2: '<i class="fas fa-medal"></i>',
            3: '<i class="fas fa-award"></i>'
        };
        return icons[rank] || rank;
    }

    generateUserColor(userName) {
        if (!userName) return 'var(--primary-color)';
        
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        
        const hash = userName.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        return colors[Math.abs(hash) % colors.length];
    }

    createLeaderboardStats(data) {
        const totalUsers = data.length;
        const averageScore = Math.round(data.reduce((sum, user) => sum + user.score, 0) / totalUsers);
        const totalQuizzes = data.reduce((sum, user) => sum + user.quizzes, 0);
        const topScore = data[0]?.score || 0;

        return `
            <div class="leaderboard-stats mt-4 p-3 rounded" style="background: rgba(255,255,255,0.05);">
                <h6 class="mb-3">Leaderboard Statistics</h6>
                <div class="row text-center">
                    <div class="col-3">
                        <div class="stat-value">${totalUsers}</div>
                        <div class="stat-label">Participants</div>
                    </div>
                    <div class="col-3">
                        <div class="stat-value">${topScore}%</div>
                        <div class="stat-label">Top Score</div>
                    </div>
                    <div class="col-3">
                        <div class="stat-value">${averageScore}%</div>
                        <div class="stat-label">Average</div>
                    </div>
                    <div class="col-3">
                        <div class="stat-value">${totalQuizzes}</div>
                        <div class="stat-label">Total Quizzes</div>
                    </div>
                </div>
            </div>
        `;
    }

    showLoadingState() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading leaderboard...</p>
            </div>
        `;
    }

    showEmptyState() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No results yet</h5>
                <p class="text-muted">Be the first to complete a quiz in this period!</p>
                <button class="btn btn-primary mt-3" onclick="scrollToSection('quizzes')">
                    <i class="fas fa-play me-2"></i>Start a Quiz
                </button>
            </div>
        `;
    }

    showErrorState() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h5 class="text-warning">Unable to load leaderboard</h5>
                <p class="text-muted">Please check your connection and try again.</p>
                <button class="btn btn-outline-primary mt-3" onclick="leaderboardManager.loadLeaderboard()">
                    <i class="fas fa-redo me-2"></i>Retry
                </button>
            </div>
        `;
    }

    // Animation for stat counters
    animateValue(element, start, end, duration) {
        const range = end - start;
        const current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }
}

// Initialize leaderboard manager
let leaderboardManager;

document.addEventListener('DOMContentLoaded', () => {
    leaderboardManager = new LeaderboardManager();
    window.leaderboardManager = leaderboardManager; // Make it globally accessible
});

console.log('Leaderboard system loaded successfully');