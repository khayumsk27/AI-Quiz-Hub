// Leaderboard System

class LeaderboardManager {
    constructor() {
        this.currentPeriod = 'alltime';
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
        
        // Load new data using main.js method
        if (window.quizApp) {
            window.quizApp.loadLeaderboard(period);
        }
    }

    loadLeaderboard() {
        try {
            this.showLoadingState();
            
            // Use the main.js loadLeaderboard method
            if (window.quizApp) {
                window.quizApp.loadLeaderboard(this.currentPeriod);
            } else {
                // Fallback if main.js is not loaded
                setTimeout(() => {
                    this.showEmptyState();
                }, 500);
            }
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showErrorState();
        }
    }

    showLoadingState() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading leaderboard data...</p>
            </div>
        `;
    }

    showEmptyState() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="empty-leaderboard">
                    <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No Quiz Results Yet</h4>
                    <p class="text-muted">Take your first quiz to appear on the leaderboard!</p>
                    <button class="btn btn-accent" onclick="scrollToSection('quiz-categories')">
                        <i class="fas fa-play me-2"></i>Start Quiz
                    </button>
                </div>
            </div>
        `;
    }

    showErrorState() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h4 class="text-danger">Error Loading Leaderboard</h4>
                    <p class="text-muted">Please try refreshing the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo me-2"></i>Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize leaderboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
});