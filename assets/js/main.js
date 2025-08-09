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
                questionCount: 5,
                color: '#f7df1e'
            },
            {
                id: 'python',
                name: 'Python',
                icon: 'fab fa-python',
                description: 'Python programming fundamentals',
                difficulty: 'beginner',
                questionCount: 5,
                color: '#3776ab'
            },
            {
                id: 'react',
                name: 'React',
                icon: 'fab fa-react',
                description: 'React framework and concepts',
                difficulty: 'intermediate',
                questionCount: 5,
                color: '#61dafb'
            },
            {
                id: 'html-css',
                name: 'HTML & CSS',
                icon: 'fab fa-html5',
                description: 'Web fundamentals and styling',
                difficulty: 'beginner',
                questionCount: 5,
                color: '#e34f26'
            },
            {
                id: 'nodejs',
                name: 'Node.js',
                icon: 'fab fa-node-js',
                description: 'Server-side JavaScript',
                difficulty: 'advanced',
                questionCount: 5,
                color: '#339933'
            },
            {
                id: 'database',
                name: 'Databases',
                icon: 'fas fa-database',
                description: 'SQL and database concepts',
                difficulty: 'intermediate',
                questionCount: 5,
                color: '#336791'
            }
        ];

        this.currentQuiz = null;
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.quizTimer = null;
        this.timeRemaining = 0;
        this.questionsData = null;
        this.userAttemptedQuestions = this.loadUserAttemptedQuestions();

        this.initialize();
    }

    initialize() {
        // Purge any legacy/static leaderboard data once
        this.sanitizeLeaderboardData(true);
        
        this.loadQuestionsData();
        this.loadQuizCategories();
        this.initializeNavigation();
        this.initializeEventListeners();
        this.loadLeaderboard();
    }

    async loadQuestionsData() {
        try {
            const response = await fetch('assets/data/questions.json');
            this.questionsData = await response.json();
        } catch (error) {
            console.error('Error loading questions data:', error);
            this.questionsData = {};
        }
    }

    loadUserAttemptedQuestions() {
        const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
        const username = userData.username || 'Guest';
        const attemptedQuestions = JSON.parse(localStorage.getItem(`quizwise_attempted_${username}`) || '{}');
        return attemptedQuestions;
    }

    saveUserAttemptedQuestions() {
        const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
        const username = userData.username || 'Guest';
        localStorage.setItem(`quizwise_attempted_${username}`, JSON.stringify(this.userAttemptedQuestions));
    }

    getUnattemptedQuestions(categoryId) {
        if (!this.questionsData || !this.questionsData[categoryId]) {
            return [];
        }

        const allQuestions = this.questionsData[categoryId].questions;
        const attemptedQuestionIds = this.userAttemptedQuestions[categoryId] || [];
        
        // Filter out attempted questions
        let unattemptedQuestions = allQuestions.filter(question => 
            !attemptedQuestionIds.includes(question.id)
        );

        // If all questions have been attempted, reset for this category
        if (unattemptedQuestions.length === 0) {
            this.userAttemptedQuestions[categoryId] = [];
            this.saveUserAttemptedQuestions();
            unattemptedQuestions = allQuestions;
        }

        // If we have very few unattempted questions, mix in some attempted ones for variety
        if (unattemptedQuestions.length < 3 && allQuestions.length > 3) {
            const attemptedQuestions = allQuestions.filter(question => 
                attemptedQuestionIds.includes(question.id)
            );
            
            // Add some attempted questions back for variety (but not the most recent ones)
            const recentAttempted = attemptedQuestions.slice(-2); // Last 2 attempted
            const olderAttempted = attemptedQuestions.slice(0, -2); // Older attempted
            
            if (olderAttempted.length > 0) {
                // Shuffle and add some older attempted questions
                const shuffledOlder = olderAttempted.sort(() => 0.5 - Math.random());
                const additionalQuestions = shuffledOlder.slice(0, Math.min(2, olderAttempted.length));
                unattemptedQuestions = [...unattemptedQuestions, ...additionalQuestions];
            }
        }

        return unattemptedQuestions;
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

        // Leaderboard period selection
        document.querySelectorAll('[data-period]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const period = link.getAttribute('data-period');
                this.changeLeaderboardPeriod(period);
            });
        });
    }

    changeLeaderboardPeriod(period) {
        // Update active state
        document.querySelectorAll('[data-period]').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`)?.classList.add('active');
        
        // Load leaderboard with new period
        this.loadLeaderboard(period);
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
        
        // If navigating to leaderboard, refresh it
        if (section === 'leaderboard') {
            setTimeout(() => {
                this.loadLeaderboard();
            }, 300);
        }
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

        // Get unattempted questions count
        const unattemptedQuestions = this.getUnattemptedQuestions(category.id);
        const attemptedCount = (this.questionsData && this.questionsData[category.id]) ? 
            this.questionsData[category.id].questions.length - unattemptedQuestions.length : 0;

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
                        <small class="text-muted">${unattemptedQuestions.length} questions remaining</small>
                    </div>
                    ${attemptedCount > 0 ? `<small class="text-info">${attemptedCount} questions attempted</small>` : ''}
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

            // Get unattempted questions
            const unattemptedQuestions = this.getUnattemptedQuestions(categoryId);
            
            if (unattemptedQuestions.length === 0) {
                showNotification('All questions in this category have been attempted!', 'info');
                return;
            }

            // Select random questions (up to 5 or all available)
            const selectedQuestions = this.selectRandomQuestions(unattemptedQuestions, 5);

            this.currentQuiz = {
                id: category.id,
                title: `${category.name} Quiz`,
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
                category: category,
                startTime: Date.now(),
                timeLimit: selectedQuestions.length * 60 // 1 minute per question
            };

            this.currentQuestion = 0;
            this.userAnswers = new Array(selectedQuestions.length).fill(null);
            
            this.openQuizModal();
            this.displayQuestion();
            this.startTimer();

        } catch (error) {
            console.error('Error starting quiz:', error);
            showNotification('Error loading quiz. Please try again.', 'danger');
        }
    }

    selectRandomQuestions(questions, count) {
        if (!questions || questions.length === 0) return [];
        
        // Create a more robust random selection using current timestamp as seed
        const timestamp = Date.now();
        const seed = timestamp % 1000000;
        
        // Fisher-Yates shuffle with seed
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor((seed + i) % (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Select questions ensuring variety
        const selectedQuestions = shuffled.slice(0, Math.min(count, questions.length));
        
        // If we have fewer questions than requested, add some from the remaining pool
        if (selectedQuestions.length < count && questions.length > count) {
            const remainingQuestions = questions.filter(q => 
                !selectedQuestions.some(selected => selected.id === q.id)
            );
            
            // Shuffle remaining questions and add more
            const additionalQuestions = remainingQuestions
                .sort(() => 0.5 - Math.random())
                .slice(0, count - selectedQuestions.length);
            
            selectedQuestions.push(...additionalQuestions);
        }
        
        return selectedQuestions;
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
                        <span class="option-text">${this.escapeHtml(String(option))}</span>
                    </div>
                </div>
            `).join('');
        } else if (question.type === 'true-false') {
            const trueSelected = savedAnswer === 0 || savedAnswer === true;
            const falseSelected = savedAnswer === 1 || savedAnswer === false;
            optionsHtml = `
                <div class="answer-option ${trueSelected ? 'selected' : ''}" onclick="quizApp.selectAnswer(0)">
                    <div class="d-flex align-items-center">
                        <span class="option-letter me-3">T</span>
                        <span class="option-text">True</span>
                    </div>
                </div>
                <div class="answer-option ${falseSelected ? 'selected' : ''}" onclick="quizApp.selectAnswer(1)">
                    <div class="d-flex align-items-center">
                        <span class="option-letter me-3">F</span>
                        <span class="option-text">False</span>
                    </div>
                </div>`;
        } else if (question.type === 'short-answer' || question.type === 'open-ended') {
            const value = typeof savedAnswer === 'string' ? savedAnswer : '';
            optionsHtml = `
                <div class="mb-3">
                    <label class="form-label">Your Answer</label>
                    <textarea class="form-control" rows="4" placeholder="Type your answer here..." oninput="setShortAnswer(${index}, this.value)">${this.escapeHtml(value)}</textarea>
                </div>`;
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
            this.markQuestionsAsAttempted();
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

    markQuestionsAsAttempted() {
        const categoryId = this.currentQuiz.id;
        if (!this.userAttemptedQuestions[categoryId]) {
            this.userAttemptedQuestions[categoryId] = [];
        }

        // Mark all questions in this quiz as attempted
        this.currentQuiz.questions.forEach(question => {
            if (!this.userAttemptedQuestions[categoryId].includes(question.id)) {
                this.userAttemptedQuestions[categoryId].push(question.id);
            }
        });

        this.saveUserAttemptedQuestions();
    }

    saveResultToLeaderboard(results) {
        // Ensure no demo data remains
        this.sanitizeLeaderboardData();
        
        // Get user name from stored user data or fallback to display name
        let userName = 'Guest';
        
        // First try to get username from authManager
        if (window.authManager && typeof window.authManager.getCurrentUsername === 'function') {
            userName = window.authManager.getCurrentUsername();
        } else {
            // Fallback to localStorage
            const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
            if (userData.username) {
                userName = userData.username;
            } else if (userData.displayName) {
                userName = userData.displayName;
            } else if (userData.email) {
                userName = userData.email.split('@')[0];
            }
        }
        
        // Load leaderboard from localStorage
        let leaderboard = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
        
        // Check if user already exists
        let entry = leaderboard.find(e => e.name === userName);
        if (entry) {
            // Update existing user's data
            entry.quizzes = (entry.quizzes || 0) + 1;
            entry.totalPoints = (entry.totalPoints || 0) + results.totalPoints;
            entry.maxPoints = (entry.maxPoints || 0) + results.maxPoints;
            // Calculate average score
            entry.score = Math.round((entry.totalPoints / entry.maxPoints) * 100);
            // Store individual quiz results
            if (!entry.quizResults) {
                entry.quizResults = [];
            }
            entry.quizResults.push({
                quizId: results.quizId,
                quizTitle: results.quizTitle,
                score: results.percentage,
                totalPoints: results.totalPoints,
                maxPoints: results.maxPoints,
                completedAt: results.completedAt
            });
        } else {
            // Create new user entry
            entry = {
                name: userName,
                score: results.percentage,
                quizzes: 1,
                totalPoints: results.totalPoints,
                maxPoints: results.maxPoints,
                avatar: userName.charAt(0).toUpperCase(),
                quizResults: [{
                    quizId: results.quizId,
                    quizTitle: results.quizTitle,
                    score: results.percentage,
                    totalPoints: results.totalPoints,
                    maxPoints: results.maxPoints,
                    completedAt: results.completedAt
                }]
            };
            leaderboard.push(entry);
        }
        
        // Sort by average score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.forEach((e, i) => e.rank = i + 1);
        
        localStorage.setItem('quizwise_leaderboard', JSON.stringify(leaderboard));
        
        // Update leaderboard display immediately
        this.loadLeaderboard();
        
        // Show notification about leaderboard update
        showNotification(`Your result has been saved to the leaderboard! Current rank: ${entry.rank}`, 'success');
        
        // Trigger leaderboard update for all users (if they're on the leaderboard page)
        setTimeout(() => {
            if (window.leaderboardManager) {
                window.leaderboardManager.loadLeaderboard();
            }
        }, 500);
    }

    calculateResults() {
        const questions = this.currentQuiz.questions;
        const answers = this.userAnswers;
        
        let correctCount = 0;
        let totalPoints = 0;
        const maxPoints = questions.length * 10;
        
        const questionResults = questions.map((question, index) => {
            const userAnswer = answers[index];
            let isCorrect;
            let points = 0;

            if (question.type === 'multiple-choice' || question.type === 'true-false') {
                // For true/false we store 0 for True and 1 for False when using selectAnswer
                isCorrect = userAnswer === question.correctAnswer;
                points = isCorrect ? 10 : 0;
            } else if (question.type === 'short-answer' || question.type === 'open-ended') {
                if (typeof question.correctAnswer === 'string' && typeof userAnswer === 'string') {
                    const norm = (s) => s.trim().toLowerCase();
                    isCorrect = norm(userAnswer) === norm(question.correctAnswer);
                    points = isCorrect ? 10 : 0;
                } else {
                    // No auto-grade available
                    isCorrect = null;
                    points = 0;
                }
            } else {
                isCorrect = userAnswer === question.correctAnswer;
                points = isCorrect ? 10 : 0;
            }
            
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
            
            <!-- Pie Chart for Results -->
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Results Breakdown</h5>
                            <canvas id="resultsPieChart" width="300" height="300"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Performance Summary</h5>
                            <div class="performance-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Accuracy:</span>
                                    <span class="stat-value">${results.percentage}%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Correct Answers:</span>
                                    <span class="stat-value text-success">${results.correctAnswers}/${results.totalQuestions}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Incorrect Answers:</span>
                                    <span class="stat-value text-danger">${results.totalQuestions - results.correctAnswers}/${results.totalQuestions}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="question-review accordion mt-4" id="resultsAccordion">
                <h5 class="mb-3">Question Review</h5>
                ${results.questionResults.map((result, index) => `
                    <div class="accordion-item mb-2">
                        <h2 class="accordion-header" id="heading${index}">
                            <button class="accordion-button ${result.isCorrect === true ? 'bg-success' : (result.isCorrect === false ? 'bg-danger' : 'bg-warning')} text-white collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                                Question ${index + 1}: ${result.isCorrect === null ? 'Pending Review' : (result.isCorrect ? 'Correct' : 'Incorrect')}
                            </button>
                        </h2>
                        <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#resultsAccordion">
                            <div class="accordion-body">
                                <p><strong>Q:</strong> ${result.question}</p>
                                <p><strong>Your Answer:</strong> <span class="${result.isCorrect ? 'text-success' : (result.isCorrect===false ? 'text-danger' : 'text-warning')}">${this.getAnswerText(result.userAnswer, this.currentQuiz.questions[index])}</span></p>
                                <p><strong>Correct Answer:</strong> <span class="text-success">${this.getAnswerText(result.correctAnswer, this.currentQuiz.questions[index])}</span></p>
                                ${result.explanation ? `<p class="text-muted mb-0"><small>${result.explanation}</small></p>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.show();
        
        // Create pie chart after modal is fully shown
        setTimeout(() => {
            const canvas = document.getElementById('resultsPieChart');
            if (canvas && canvas.getContext) {
                this.createResultsPieChart(results);
            }
        }, 300);
    }

    getAnswerText(answerIndex, question) {
        if (answerIndex === null || answerIndex === undefined) return 'Not Answered';
        if (typeof answerIndex === 'number' && question.options) {
            const text = question.options[answerIndex] || 'Invalid Answer';
            return this.escapeHtml(String(text));
        }
        // For boolean true/false stored as 0/1 or boolean
        if (typeof answerIndex === 'boolean') {
            return answerIndex ? 'True' : 'False';
        }
        return this.escapeHtml(String(answerIndex));
    }

    // Safely escape HTML to show tags like <p> as text
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    createResultsPieChart(results) {
        const ctx = document.getElementById('resultsPieChart');
        if (!ctx) {
            console.warn('Results pie chart canvas not found');
            return;
        }

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        // Destroy existing chart if it exists
        if (window.resultsPieChart && typeof window.resultsPieChart.destroy === 'function') {
            window.resultsPieChart.destroy();
        }

        const correctCount = results.correctAnswers;
        const incorrectCount = results.totalQuestions - results.correctAnswers;

        try {
            // Create new chart
            window.resultsPieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Correct', 'Incorrect'],
                    datasets: [{
                        data: [correctCount, incorrectCount],
                        backgroundColor: [
                            '#3EF8B7', // Aqua Mint for correct
                            '#FF3366'  // Electric Magenta-Red for incorrect
                        ],
                        borderColor: [
                            '#2dd4a8',
                            '#e62e5c'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#FFFFFF',
                                font: {
                                    size: 14
                                },
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(27, 21, 57, 0.95)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#B0B3C7',
                            borderColor: '#6C5CE7',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 800,
                        easing: 'easeOutCubic'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating results pie chart:', error);
        }
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

    loadLeaderboard(period = 'alltime') {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;
        
        // Ensure no demo data remains
        this.sanitizeLeaderboardData();
        
        // Load from localStorage only - no static data
        let leaderboard = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
        
        // Filter by time period
        leaderboard = this.filterLeaderboardByPeriod(leaderboard, period);
        
        // Sort by average score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.forEach((e, i) => e.rank = i + 1);
        
        if (leaderboard.length === 0) {
            // Show empty state when no users have taken quizzes
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
            return;
        }
        
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-trophy me-2"></i>Leaderboard Rankings
                            </h5>
                        </div>
                        <div class="card-body">
                            ${leaderboard.map(user => `
                                <div class="leaderboard-item">
                                    <div class="rank-badge rank-${user.rank <= 3 ? user.rank : 'other'}">${user.rank}</div>
                                    <div class="user-avatar">${user.avatar}</div>
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">${user.name}</h6>
                                        <small class="text-muted">${user.quizzes} quiz${user.quizzes > 1 ? 'zes' : ''} completed</small>
                                    </div>
                                    <div class="text-end">
                                        <h6 class="mb-1">${user.score}%</h6>
                                        <small class="text-muted">Avg Score</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="row">
                        <div class="col-12 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-chart-pie me-2"></i>Performance Distribution
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <canvas id="leaderboardPieChart" width="300" height="300"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-chart-bar me-2"></i>Score Comparison
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <canvas id="leaderboardBarChart" width="300" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create charts only if there are users
        if (leaderboard.length > 0) {
            setTimeout(() => {
                this.createLeaderboardPieChart(leaderboard);
                this.createLeaderboardBarChart(leaderboard);
            }, 100);
        }
    }

    filterLeaderboardByPeriod(leaderboard, period) {
        const now = new Date();
        const filteredLeaderboard = [];

        leaderboard.forEach(user => {
            let filteredQuizResults = [];
            
            if (user.quizResults && user.quizResults.length > 0) {
                switch (period) {
                    case 'daily':
                        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        filteredQuizResults = user.quizResults.filter(result => 
                            new Date(result.completedAt) >= oneDayAgo
                        );
                        break;
                    case 'weekly':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        filteredQuizResults = user.quizResults.filter(result => 
                            new Date(result.completedAt) >= oneWeekAgo
                        );
                        break;
                    case 'monthly':
                        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        filteredQuizResults = user.quizResults.filter(result => 
                            new Date(result.completedAt) >= oneMonthAgo
                        );
                        break;
                    case 'alltime':
                    default:
                        filteredQuizResults = user.quizResults;
                        break;
                }
            }

            if (filteredQuizResults.length > 0) {
                // Calculate filtered stats
                const totalPoints = filteredQuizResults.reduce((sum, result) => sum + result.totalPoints, 0);
                const maxPoints = filteredQuizResults.reduce((sum, result) => sum + result.maxPoints, 0);
                const averageScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

                filteredLeaderboard.push({
                    ...user,
                    score: averageScore,
                    quizzes: filteredQuizResults.length,
                    totalPoints: totalPoints,
                    maxPoints: maxPoints,
                    quizResults: filteredQuizResults
                });
            }
        });

        return filteredLeaderboard;
    }

    createLeaderboardPieChart(leaderboard) {
        const ctx = document.getElementById('leaderboardPieChart');
        if (!ctx || leaderboard.length === 0) return;

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        // Destroy existing chart if it exists
        if (window.leaderboardChart && typeof window.leaderboardChart.destroy === 'function') {
            try {
                window.leaderboardChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing leaderboard chart:', error);
            }
        }

        // Calculate statistics
        const totalUsers = leaderboard.length;
        const excellentUsers = leaderboard.filter(user => user.score >= 90).length;
        const goodUsers = leaderboard.filter(user => user.score >= 75 && user.score < 90).length;
        const averageUsers = leaderboard.filter(user => user.score >= 60 && user.score < 75).length;
        const poorUsers = leaderboard.filter(user => user.score < 60).length;

        // Only create chart if there are users with scores
        if (totalUsers === 0) return;

        try {
            // Create new chart
            window.leaderboardChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Excellent (90%+)', 'Good (75-89%)', 'Average (60-74%)', 'Poor (<60%)'],
                    datasets: [{
                        data: [excellentUsers, goodUsers, averageUsers, poorUsers],
                        backgroundColor: [
                            '#3EF8B7', // Aqua Mint for excellent
                            '#6C5CE7', // Soft Violet Glow for good
                            '#FFD86F', // Luminous Amber for average
                            '#FF3366'  // Electric Magenta-Red for poor
                        ],
                        borderColor: [
                            '#2dd4a8',
                            '#5a4fd8',
                            '#e6c25a',
                            '#e62e5c'
                        ],
                        borderWidth: 3,
                        hoverBorderWidth: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#FFFFFF',
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(27, 21, 57, 0.95)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#B0B3C7',
                            borderColor: '#6C5CE7',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating leaderboard pie chart:', error);
        }
    }

    createLeaderboardBarChart(leaderboard) {
        const ctx = document.getElementById('leaderboardBarChart');
        if (!ctx || leaderboard.length === 0) return;

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        // Destroy existing chart if it exists
        if (window.leaderboardBarChart && typeof window.leaderboardBarChart.destroy === 'function') {
            try {
                window.leaderboardBarChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing leaderboard bar chart:', error);
            }
        }

        // Prepare data for bar chart
        const scores = leaderboard.map(user => user.score);
        const names = leaderboard.map(user => user.name);

        try {
            // Create new chart
            window.leaderboardBarChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: names,
                    datasets: [{
                        label: 'Average Score (%)',
                        data: scores,
                        backgroundColor: [
                            '#3EF8B7', // Aqua Mint for excellent
                            '#6C5CE7', // Soft Violet Glow for good
                            '#FFD86F', // Luminous Amber for average
                            '#FF3366'  // Electric Magenta-Red for poor
                        ],
                        borderColor: [
                            '#2dd4a8',
                            '#5a4fd8',
                            '#e6c25a',
                            '#e62e5c'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                color: '#B0B3C7'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#B0B3C7'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(27, 21, 57, 0.95)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#B0B3C7',
                            borderColor: '#6C5CE7',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating leaderboard bar chart:', error);
        }
    }

    // Method to refresh leaderboard (can be called from other parts of the app)
    refreshLeaderboard() {
        this.loadLeaderboard();
    }

    // Method to check if user is on leaderboard page and update accordingly
    checkAndUpdateLeaderboard() {
        const leaderboardSection = document.getElementById('leaderboard');
        if (leaderboardSection && leaderboardSection.offsetParent !== null) {
            // Leaderboard section is visible, refresh it
            this.loadLeaderboard();
        }
    }

    // Remove any static/demo entries accidentally left in localStorage
    sanitizeLeaderboardData(runOnce = false) {
        try {
            // Deep purge for any keys that might contain demo content
            this.purgeDemoFromLocalStorage();

            if (runOnce) {
                const alreadyCleared = localStorage.getItem('quizwise_cleared_demo');
                if (alreadyCleared) return;
            }
            const DEMO_NAMES = ['Alex Johnson','Sarah Chen','Emma Wilson','Mike Davis','Lisa Zhang'];
            const raw = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
            const sanitized = raw.filter(entry => {
                const hasRealResults = Array.isArray(entry?.quizResults) && entry.quizResults.length > 0;
                const isDemoName = typeof entry?.name === 'string' && DEMO_NAMES.includes(entry.name);
                return hasRealResults && !isDemoName;
            });
            if (sanitized.length !== raw.length) {
                localStorage.setItem('quizwise_leaderboard', JSON.stringify(sanitized));
            }
            if (runOnce) {
                localStorage.setItem('quizwise_cleared_demo', '1');
            }
        } catch (e) {
            console.warn('sanitizeLeaderboardData error:', e);
        }
    }

    // Scan all localStorage keys and remove any that contain demo leaderboard content
    purgeDemoFromLocalStorage() {
        try {
            const DEMO_TOKENS = ['Alex Johnson','Sarah Chen','Emma Wilson','Mike Davis','Lisa Zhang'];
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (!key) continue;
                const value = localStorage.getItem(key) || '';
                let containsDemo = false;
                for (const token of DEMO_TOKENS) {
                    if (value.includes(token)) { containsDemo = true; break; }
                }
                // Remove obvious old keys often used for demos
                const isSuspiciousKey = /leaderboard/i.test(key) && /demo|seed|sample/i.test(key);
                if (containsDemo || isSuspiciousKey) {
                    try { localStorage.removeItem(key); } catch {}
                }
            }
        } catch (e) {
            console.warn('purgeDemoFromLocalStorage error:', e);
        }
    }

    // Show user's previous quiz history in a modal
    showUserHistory() {
        try {
            // Resolve current username
            let userName = 'Guest';
            if (window.authManager && typeof window.authManager.getCurrentUsername === 'function') {
                userName = window.authManager.getCurrentUsername();
            } else {
                const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
                userName = userData.username || userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Guest');
            }

            const leaderboard = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
            const entry = leaderboard.find(e => e.name === userName);

            const modalEl = document.getElementById('historyModal');
            if (!modalEl) return;
            const body = document.getElementById('history-content');
            if (!body) return;

            if (!entry || !entry.quizResults || entry.quizResults.length === 0) {
                body.innerHTML = `<div class="text-center py-4 text-muted">No quiz history yet. Take your first quiz to see it here.</div>`;
            } else {
                const results = [...entry.quizResults].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
                const rows = results.map(r => `
                    <tr>
                        <td>${new Date(r.completedAt).toLocaleString()}</td>
                        <td>${this.escapeHtml(r.quizTitle || r.quizId)}</td>
                        <td>${r.score}%</td>
                        <td>${r.totalPoints}/${r.maxPoints}</td>
                    </tr>
                `).join('');
                body.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-dark table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Quiz</th>
                                    <th>Score</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>`;
            }

            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } catch (e) {
            console.error('Error showing history:', e);
            showNotification('Unable to load your quiz history.', 'danger');
        }
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

// Clear localStorage data for this app
function clearAppLocalStorage() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (/^quizwise_/i.test(key)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Also clear demo-cleared flag so sanitizer can run fresh
        localStorage.removeItem('quizwise_cleared_demo');

        // Notify and refresh leaderboard
        if (typeof showNotification === 'function') {
            showNotification('Local data cleared successfully.', 'success');
        }
        if (window.quizApp) {
            window.quizApp.loadLeaderboard();
        }
    } catch (e) {
        console.warn('clearAppLocalStorage error:', e);
    }
}

window.clearAppLocalStorage = clearAppLocalStorage;

// Expose history modal helper globally
function showUserHistory() {
    if (window.quizApp) {
        window.quizApp.showUserHistory();
    }
}
window.showUserHistory = showUserHistory;

// Global wrapper to attach short-answer input updates safely
function setShortAnswer(index, value) {
    if (window.quizApp && typeof window.quizApp.setShortAnswer === 'function') {
        window.quizApp.setShortAnswer(index, value);
    }
}
window.setShortAnswer = setShortAnswer;

// Show the latest and aggregate results for the current user
function showMyResults() {
    try {
        let userName = 'Guest';
        if (window.authManager && typeof window.authManager.getCurrentUsername === 'function') {
            userName = window.authManager.getCurrentUsername();
        } else {
            const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
            userName = userData.username || userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Guest');
        }

        const leaderboard = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
        const entry = leaderboard.find(e => e.name === userName);
        const content = document.getElementById('my-results-content');
        if (!content) return;

        if (!entry || !entry.quizResults || entry.quizResults.length === 0) {
            content.innerHTML = `<div class="text-center py-4 text-muted">No results yet. Take a quiz to see your results here.</div>`;
        } else {
            const latest = [...entry.quizResults].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
            const totalPoints = entry.quizResults.reduce((s,r)=> s + (r.totalPoints||0), 0);
            const maxPoints = entry.quizResults.reduce((s,r)=> s + (r.maxPoints||0), 0);
            const avgScore = maxPoints > 0 ? Math.round((totalPoints/maxPoints)*100) : 0;
            const correct = Math.round((avgScore/100) *  latest.maxPoints/10); // approximate
            const incorrect = Math.max(0, (latest.maxPoints/10) - correct);

            content.innerHTML = `
                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title mb-3">Latest Attempt</h5>
                                <p class="mb-1"><strong>Quiz:</strong> ${window.quizApp ? window.quizApp.escapeHtml(latest.quizTitle || latest.quizId) : (latest.quizTitle || latest.quizId)}</p>
                                <p class="mb-1"><strong>Date:</strong> ${new Date(latest.completedAt).toLocaleString()}</p>
                                <p class="mb-1"><strong>Score:</strong> ${latest.score}%</p>
                                <p class="mb-0"><strong>Points:</strong> ${latest.totalPoints}/${latest.maxPoints}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title mb-3">Overall Performance</h5>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Average Score</span>
                                    <strong>${avgScore}%</strong>
                                </div>
                                <canvas id="myResultsMiniChart" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>`;

            // Draw a mini doughnut of latest correct/incorrect (approx for quick view)
            const ctx = document.getElementById('myResultsMiniChart');
            if (ctx && typeof Chart !== 'undefined') {
                try {
                    if (window.myResultsMiniChart && typeof window.myResultsMiniChart.destroy === 'function') {
                        window.myResultsMiniChart.destroy();
                    }
                    window.myResultsMiniChart = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Correct', 'Incorrect'],
                            datasets: [{
                                data: [correct, incorrect],
                                backgroundColor: ['#3EF8B7','#FF3366'],
                                borderColor: ['#2dd4a8','#e62e5c'],
                                borderWidth: 2
                            }]
                        },
                        options: {
                            plugins: { legend: { position: 'bottom', labels: { color: '#FFFFFF' } } },
                            maintainAspectRatio: false
                        }
                    });
                } catch (e) { console.warn('Mini chart error:', e); }
            }
        }

        const modal = new bootstrap.Modal(document.getElementById('myResultsModal'));
        modal.show();
    } catch (e) {
        console.error('showMyResults error:', e);
        showNotification('Unable to load your results.', 'danger');
    }
}

window.showMyResults = showMyResults;

// Ensure AI generator inputs are enabled and validated
(function initAIGeneratorUX(){
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('ai-generator-form');
        if (!form) return;
        // Ensure at least one type is checked by default
        const mc = document.getElementById('multiple-choice');
        const tf = document.getElementById('true-false');
        const oe = document.getElementById('open-ended');
        if (mc) mc.checked = true;
        // Visual enable
        [mc, tf, oe].filter(Boolean).forEach(el => { el.disabled = false; });

        form.addEventListener('submit', (e) => {
            const anyChecked = [mc, tf, oe].some(el => el && el.checked);
            if (!anyChecked) {
                e.preventDefault();
                showNotification('Please select at least one question type.', 'danger');
            }
        });
    });
})();

// Navigate to Profile section when hash changes or menu clicked
(function initProfileRouting(){
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#','');
        const profileSection = document.getElementById('profile');
        if (!profileSection) return;
        if (hash === 'profile') {
            profileSection.classList.remove('d-none');
            if (typeof loadProfileIntoForm === 'function') loadProfileIntoForm();
            // scroll into view
            setTimeout(() => { profileSection.scrollIntoView({behavior:'smooth'}); }, 50);
        } else {
            profileSection.classList.add('d-none');
        }
    });
})();

function getCurrentUserData() {
    const userData = JSON.parse(localStorage.getItem('quizwise_user_data') || '{}');
    if (window.authManager && typeof window.authManager.getCurrentUsername === 'function') {
        // ensure username field present
        userData.username = window.authManager.getCurrentUsername();
    }
    return userData;
}

function loadProfileIntoForm() {
    const data = getCurrentUserData();
    document.getElementById('profileName').value = data.fullName || data.displayName || '';
    document.getElementById('profileUsername').value = data.username || (data.email ? data.email.split('@')[0] : '');
    document.getElementById('profileEmail').value = data.email || '';
}

// Handle profile save
(function initProfileSave(){
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('profileForm');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('profileName').value.trim();
                const username = document.getElementById('profileUsername').value.trim();
                const email = document.getElementById('profileEmail').value.trim();

                // Update localStorage user data
                const data = getCurrentUserData();
                const oldUsername = data.username || (data.email ? data.email.split('@')[0] : 'Guest');
                data.fullName = name;
                data.displayName = username;
                data.username = username;
                data.email = email || data.email;
                localStorage.setItem('quizwise_user_data', JSON.stringify(data));

                // Update Firebase displayName if available
                if (window.auth && window.auth.currentUser) {
                    try {
                        const { updateProfile } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
                        await updateProfile(window.auth.currentUser, { displayName: username });
                    } catch {}
                }

                // Migrate leaderboard entry if username changed
                if (username && username !== oldUsername) {
                    const board = JSON.parse(localStorage.getItem('quizwise_leaderboard') || '[]');
                    const idx = board.findIndex(e => e.name === oldUsername);
                    if (idx !== -1) {
                        // If new username exists, merge
                        const existingIdx = board.findIndex(e => e.name === username);
                        if (existingIdx !== -1) {
                            const from = board[idx];
                            const to = board[existingIdx];
                            to.quizzes = (to.quizzes||0) + (from.quizzes||0);
                            to.totalPoints = (to.totalPoints||0) + (from.totalPoints||0);
                            to.maxPoints = (to.maxPoints||0) + (from.maxPoints||0);
                            to.score = Math.round((to.totalPoints / Math.max(1,to.maxPoints)) * 100);
                            to.quizResults = [...(to.quizResults||[]), ...(from.quizResults||[])];
                            board.splice(idx,1);
                        } else {
                            board[idx].name = username;
                            board[idx].avatar = username.charAt(0).toUpperCase();
                        }
                        board.sort((a,b)=> b.score - a.score);
                        board.forEach((e,i)=> e.rank = i+1);
                        localStorage.setItem('quizwise_leaderboard', JSON.stringify(board));
                    }

                    // Migrate attempted question key to new username
                    const oldKey = `quizwise_attempted_${oldUsername}`;
                    const newKey = `quizwise_attempted_${username}`;
                    const attempts = localStorage.getItem(oldKey);
                    if (attempts && !localStorage.getItem(newKey)) {
                        localStorage.setItem(newKey, attempts);
                        localStorage.removeItem(oldKey);
                    }
                }

                // Refresh UI pieces that show the user name
                if (typeof updateUIForAuthenticatedUser === 'function' && window.auth && window.auth.currentUser) {
                    const mock = Object.assign({}, window.auth.currentUser, { displayName: username });
                    updateUIForAuthenticatedUser(mock);
                } else {
                    const nameEl = document.getElementById('user-name');
                    if (nameEl) nameEl.textContent = username;
                }

                // Reload leaderboard to reflect possible change
                if (window.quizApp) window.quizApp.loadLeaderboard();

                showNotification('Profile updated successfully.', 'success');
            } catch (err) {
                console.error('Profile update error:', err);
                showNotification('Could not update profile. Please try again.', 'danger');
            }
        });
    });
})();

// Initialize the application
let quizApp;

document.addEventListener('DOMContentLoaded', () => {
    quizApp = new QuizWiseApp();
    window.quizApp = quizApp; // Make it globally accessible
});

console.log('Main application loaded successfully');