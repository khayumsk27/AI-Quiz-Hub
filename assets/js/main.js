// Main Application Logic

class QuizWiseApp {
    constructor() {
        this.categories = [
            {
                id: 'javascript',
                name: 'JavaScript',
                icon: 'fab fa-js-square',
                description: 'Test your JavaScript knowledge',
                difficulty: 'intermediate',
                questionCount: 10,
                color: '#f7df1e'
            },
            {
                id: 'python',
                name: 'Python',
                icon: 'fab fa-python',
                description: 'Python programming fundamentals',
                difficulty: 'beginner',
                questionCount: 8,
                color: '#3776ab'
            },
            {
                id: 'react',
                name: 'React',
                icon: 'fab fa-react',
                description: 'React framework and concepts',
                difficulty: 'intermediate',
                questionCount: 12,
                color: '#61dafb'
            },
            {
                id: 'html-css',
                name: 'HTML & CSS',
                icon: 'fab fa-html5',
                description: 'Web fundamentals and styling',
                difficulty: 'beginner',
                questionCount: 10,
                color: '#e34f26'
            },
            {
                id: 'nodejs',
                name: 'Node.js',
                icon: 'fab fa-node-js',
                description: 'Server-side JavaScript',
                difficulty: 'advanced',
                questionCount: 15,
                color: '#339933'
            },
            {
                id: 'database',
                name: 'Databases',
                icon: 'fas fa-database',
                description: 'SQL and database concepts',
                difficulty: 'intermediate',
                questionCount: 12,
                color: '#336791'
            }
        ];

        this.currentQuiz = null;
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.quizTimer = null;
        this.timeRemaining = 0;

        this.initialize();
    }

    initialize() {
        this.loadQuizCategories();
        this.initializeNavigation();
        this.initializeEventListeners();
        this.loadLeaderboard();
    }

    initializeNavigation() {
        // Handle navigation links
        document.querySelectorAll('.nav-link, [href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    this.navigateToSection(href.substring(1));
                }
            });
        });
    }

    initializeEventListeners() {
        // Quiz navigation buttons
        const nextBtn = document.getElementById('next-question');
        const prevBtn = document.getElementById('prev-question');
        const submitBtn = document.getElementById('submit-quiz');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitQuiz());
        }
    }

    navigateToSection(section) {
        // Update URL without page reload
        if (window.location.hash !== `#${section}`) {
            window.history.pushState(null, null, `#${section}`);
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.nav-link[href="#${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Scroll to section
        this.scrollToSection(section);
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const sectionTop = section.offsetTop - navHeight - 20;
            
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }

    loadQuizCategories() {
        const container = document.getElementById('quiz-categories');
        if (!container) return;

        container.innerHTML = '';

        this.categories.forEach(category => {
            const categoryCard = this.createCategoryCard(category);
            container.appendChild(categoryCard);
        });
    }

    createCategoryCard(category) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        
        const difficultyClass = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'danger'
        }[category.difficulty];

        col.innerHTML = `
            <div class="card category-card h-100" onclick="quizApp.startQuiz('${category.id}')">
                <div class="card-body text-center p-4">
                    <div class="category-icon">
                        <i class="${category.icon}"></i>
                    </div>
                    <h5 class="card-title mb-3">${category.name}</h5>
                    <p class="card-text text-muted mb-3">${category.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${difficultyClass}">${category.difficulty}</span>
                        <small class="text-muted">${category.questionCount} questions</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary w-100">
                        <i class="fas fa-play me-2"></i>Start Quiz
                    </button>
                </div>
            </div>
        `;

        return col;
    }

    async startQuiz(categoryId) {
        if (!requireAuth()) return;

        try {
            const category = this.categories.find(c => c.id === categoryId);
            if (!category) {
                showNotification('Quiz category not found.', 'danger');
                return;
            }

            // Generate sample questions for demo
            const quiz = this.generateDemoQuiz(category);

            this.currentQuiz = {
                ...quiz,
                category: category,
                startTime: Date.now(),
                timeLimit: category.questionCount * 60 // 1 minute per question
            };

            this.currentQuestion = 0;
            this.userAnswers = new Array(quiz.questions.length).fill(null);
            
            this.openQuizModal();
            this.displayQuestion();
            this.startTimer();

        } catch (error) {
            console.error('Error starting quiz:', error);
            showNotification('Error loading quiz. Please try again.', 'danger');
        }
    }

    generateDemoQuiz(category) {
        const questions = {
            javascript: [
                {
                    question: "What is the difference between 'let' and 'var' in JavaScript?",
                    type: "multiple-choice",
                    options: [
                        "let has block scope, var has function scope",
                        "let has function scope, var has block scope", 
                        "There is no difference",
                        "let is used for constants, var for variables"
                    ],
                    correctAnswer: 0,
                    explanation: "'let' has block scope while 'var' has function scope."
                },
                {
                    question: "Which method adds an element to the end of an array?",
                    type: "multiple-choice",
                    options: ["push()", "pop()", "shift()", "unshift()"],
                    correctAnswer: 0,
                    explanation: "The push() method adds elements to the end of an array."
                }
            ],
            python: [
                {
                    question: "Which keyword is used to define a function in Python?",
                    type: "multiple-choice",
                    options: ["function", "def", "func", "define"],
                    correctAnswer: 1,
                    explanation: "The 'def' keyword is used to define functions in Python."
                }
            ]
        };

        const categoryQuestions = questions[category.id] || questions.javascript;
        
        return {
            id: category.id,
            title: `${category.name} Quiz`,
            questions: categoryQuestions,
            totalQuestions: categoryQuestions.length
        };
    }

    openQuizModal() {
        const modal = new bootstrap.Modal(document.getElementById('quizModal'));
        modal.show();
        
        // Set quiz title
        document.getElementById('quizTitle').textContent = this.currentQuiz.title;
        
        // Reset navigation buttons
        this.updateNavigationButtons();
    }

    displayQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestion];
        const questionCounter = document.getElementById('question-counter');
        const progressBar = document.getElementById('quiz-progress-bar');
        const quizContent = document.getElementById('quiz-content');

        // Update progress
        const progress = ((this.currentQuestion + 1) / this.currentQuiz.questions.length) * 100;
        questionCounter.textContent = `${this.currentQuestion + 1} / ${this.currentQuiz.questions.length}`;
        progressBar.style.width = `${progress}%`;

        // Display question
        quizContent.innerHTML = this.renderQuestion(question, this.currentQuestion);

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    renderQuestion(question, index) {
        const savedAnswer = this.userAnswers[index];
        
        let optionsHtml = '';
        
        if (question.type === 'multiple-choice') {
            optionsHtml = question.options.map((option, i) => `
                <div class="answer-option ${savedAnswer === i ? 'selected' : ''}" 
                     onclick="quizApp.selectAnswer(${i})">
                    <div class="d-flex align-items-center">
                        <span class="option-letter me-3">${String.fromCharCode(65 + i)}</span>
                        <span>${option}</span>
                    </div>
                </div>
            `).join('');
        }

        return `
            <div class="question-card">
                <div class="question-number">${index + 1}</div>
                <h4 class="question-text mb-4">${question.question}</h4>
                <div class="answer-options">
                    ${optionsHtml}
                </div>
            </div>
        `;
    }

    selectAnswer(answer) {
        this.userAnswers[this.currentQuestion] = answer;
        
        // Update UI to show selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        if (typeof answer === 'number') {
            document.querySelectorAll('.answer-option')[answer].classList.add('selected');
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.currentQuiz.questions.length - 1) {
            this.currentQuestion++;
            this.displayQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.displayQuestion();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        const submitBtn = document.getElementById('submit-quiz');

        if (prevBtn) {
            prevBtn.disabled = this.currentQuestion === 0;
        }

        const isLastQuestion = this.currentQuestion === this.currentQuiz.questions.length - 1;
        
        if (nextBtn) {
            if (isLastQuestion) {
                nextBtn.classList.add('d-none');
            } else {
                nextBtn.classList.remove('d-none');
            }
        }
        
        if (submitBtn) {
            if (isLastQuestion) {
                submitBtn.classList.remove('d-none');
            } else {
                submitBtn.classList.add('d-none');
            }
        }
    }

    startTimer() {
        this.timeRemaining = this.currentQuiz.timeLimit;
        this.updateTimerDisplay();
        
        this.quizTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.submitQuiz();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = display;
        }
    }

    async submitQuiz() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }

        try {
            const results = this.calculateResults();
            this.saveResultToLeaderboard(results);
            this.showResults(results);
            // Close quiz modal
            const quizModal = bootstrap.Modal.getInstance(document.getElementById('quizModal'));
            if (quizModal) {
                quizModal.hide();
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            showNotification('Error submitting quiz. Please try again.', 'danger');
        }
    }

    saveResultToLeaderboard(results) {
        // Get user name from stored user data or fallback to display name
        let userName = 'Guest';
        
        // First try to get username from authManager
        if (window.authManager && typeof window.authManager.getCurrentUsername === 'function') {
            userName = window.authManager.getCurrentUsername();
            console.log('Username from authManager:', userName);
        } else {
            // Fallback to localStorage
            const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
            console.log('User data from localStorage:', userData);
            if (userData.username) {
                userName = userData.username;
            } else if (userData.displayName) {
                userName = userData.displayName;
            } else if (userData.email) {
                userName = userData.email.split('@')[0];
            }
        }
        
        console.log('Final username for leaderboard:', userName);
        
        // Load leaderboard from localStorage
        let leaderboard = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
        
        // Check if user already exists
        let entry = leaderboard.find(e => e.name === userName);
        if (entry) {
            entry.score = results.percentage;
            entry.quizzes = (entry.quizzes || 0) + 1;
            entry.totalPoints = (entry.totalPoints || 0) + results.totalPoints;
        } else {
            entry = {
                name: userName,
                score: results.percentage,
                quizzes: 1,
                totalPoints: results.totalPoints,
                avatar: userName.charAt(0).toUpperCase()
            };
            leaderboard.push(entry);
        }
        
        // Sort and assign ranks
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.forEach((e, i) => e.rank = i + 1);
        
        localStorage.setItem('quizwise_leaderboard', JSON.stringify(leaderboard));
        
        // Update leaderboard display
        this.loadLeaderboard();
    }

    calculateResults() {
        const questions = this.currentQuiz.questions;
        const answers = this.userAnswers;
        
        let correctCount = 0;
        let totalPoints = 0;
        const maxPoints = questions.length * 10;
        
        const questionResults = questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            const points = isCorrect ? 10 : 0;
            
            if (isCorrect) correctCount++;
            totalPoints += points;
            
            return {
                question: question.question,
                userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                points,
                explanation: question.explanation
            };
        });
        
        const percentage = Math.round((totalPoints / maxPoints) * 100);
        
        return {
            quizId: this.currentQuiz.id,
            quizTitle: this.currentQuiz.title,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            totalPoints,
            maxPoints,
            percentage,
            questionResults,
            completedAt: new Date()
        };
    }

    showResults(results) {
        const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
        const content = document.getElementById('results-content');
        const scoreClass = this.getScoreClass(results.percentage);
        content.innerHTML = `
            <div class="results-summary">
                <div class="score-circle ${scoreClass}">
                    ${results.percentage}%
                </div>
                <h3 class="mb-3">${this.getScoreMessage(results.percentage)}</h3>
                <div class="row text-center">
                    <div class="col-md-4">
                        <h5>${results.correctAnswers}</h5>
                        <small class="text-muted">Correct</small>
                    </div>
                    <div class="col-md-4">
                        <h5>${results.totalQuestions - results.correctAnswers}</h5>
                        <small class="text-muted">Incorrect</small>
                    </div>
                    <div class="col-md-4">
                        <h5>${results.totalPoints}/${results.maxPoints}</h5>
                        <small class="text-muted">Points</small>
                    </div>
                </div>
            </div>
            <div class="question-review accordion" id="resultsAccordion">
                <h5 class="mb-3">Question Review</h5>
                ${results.questionResults.map((result, index) => `
                    <div class="accordion-item mb-2">
                        <h2 class="accordion-header" id="heading${index}">
                            <button class="accordion-button ${result.isCorrect ? 'bg-success' : 'bg-danger'} text-white collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                                Question ${index + 1}: ${result.isCorrect ? 'Correct' : 'Incorrect'}
                            </button>
                        </h2>
                        <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#resultsAccordion">
                            <div class="accordion-body">
                                <p><strong>Q:</strong> ${result.question}</p>
                                <p><strong>Your Answer:</strong> <span class="${result.isCorrect ? 'text-success' : 'text-danger'}">${typeof result.userAnswer === 'number' ? (result.options ? result.options[result.userAnswer] : result.userAnswer) : result.userAnswer}</span></p>
                                <p><strong>Correct Answer:</strong> <span class="text-success">${typeof result.correctAnswer === 'number' ? (result.options ? result.options[result.correctAnswer] : result.correctAnswer) : result.correctAnswer}</span></p>
                                ${result.explanation ? `<p class="text-muted mb-0"><small>${result.explanation}</small></p>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        modal.show();
    }

    getScoreClass(percentage) {
        if (percentage >= 90) return 'score-excellent';
        if (percentage >= 75) return 'score-good';
        if (percentage >= 60) return 'score-average';
        return 'score-poor';
    }

    getScoreMessage(percentage) {
        if (percentage >= 90) return 'Excellent Work!';
        if (percentage >= 75) return 'Great Job!';
        if (percentage >= 60) return 'Good Effort!';
        return 'Keep Practicing!';
    }

    loadLeaderboard() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;
        // Load from localStorage if available
        let leaderboard = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
        if (!leaderboard.length) {
            leaderboard = [
                { rank: 1, name: 'Alex Johnson', score: 98, quizzes: 15, avatar: 'A', totalPoints: 980 },
                { rank: 2, name: 'Sarah Chen', score: 95, quizzes: 12, avatar: 'S', totalPoints: 950 },
                { rank: 3, name: 'Mike Davis', score: 92, quizzes: 18, avatar: 'M', totalPoints: 920 },
                { rank: 4, name: 'Emma Wilson', score: 89, quizzes: 9, avatar: 'E', totalPoints: 890 },
                { rank: 5, name: 'John Smith', score: 87, quizzes: 14, avatar: 'J', totalPoints: 870 }
            ];
        }
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.forEach((e, i) => e.rank = i + 1);
        container.innerHTML = leaderboard.map(user => `
            <div class="leaderboard-item">
                <div class="rank-badge rank-${user.rank <= 3 ? user.rank : 'other'}">${user.rank}</div>
                <div class="user-avatar">${user.avatar}</div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${user.name}</h6>
                    <small class="text-muted">${user.quizzes} quizzes completed</small>
                </div>
                <div class="text-end">
                    <h6 class="mb-1">${user.score}%</h6>
                    <small class="text-muted">Avg Score</small>
                </div>
            </div>
        `).join('');
    }
}

// Global functions for HTML onclick events
function scrollToSection(sectionId) {
    if (window.quizApp) {
        window.quizApp.scrollToSection(sectionId);
    }
}

function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'QuizWise Results',
            text: 'Check out my quiz results on QuizWise!',
            url: window.location.href
        });
    } else {
        showNotification('Results shared!', 'success');
    }
}

// Initialize the application
let quizApp;

document.addEventListener('DOMContentLoaded', () => {
    quizApp = new QuizWiseApp();
    window.quizApp = quizApp; // Make it globally accessible
});

console.log('Main application loaded successfully');