// AI Quiz Generator

class AIQuizGenerator {
    constructor() {
        this.isGenerating = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const form = document.getElementById('ai-generator-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateQuiz();
            });
        }
    }

    async generateQuiz() {
        if (!requireAuth()) return;
        
        if (this.isGenerating) {
            showNotification('Quiz generation is already in progress.', 'warning');
            return;
        }

        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;

        try {
            this.isGenerating = true;
            this.showGenerationProgress();

            // Simulate AI generation with a delay
            await new Promise(resolve => setTimeout(resolve, 3000));

            const quiz = this.generateMockQuiz(formData);
            
            if (quiz && quiz.questions && quiz.questions.length > 0) {
                this.showGeneratedQuiz(quiz);
                showNotification('Quiz generated successfully!', 'success');
            } else {
                throw new Error('Generated quiz is empty or invalid');
            }

        } catch (error) {
            console.error('Error generating quiz:', error);
            showNotification('Error generating quiz. Please try again.', 'danger');
        } finally {
            this.isGenerating = false;
            this.hideGenerationProgress();
        }
    }

    getFormData() {
        return {
            topic: document.getElementById('quiz-topic').value.trim(),
            difficulty: document.getElementById('difficulty').value,
            questionCount: parseInt(document.getElementById('question-count').value),
            questionTypes: Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value)
        };
    }

    validateFormData(data) {
        if (!data.topic) {
            showNotification('Please enter a quiz topic.', 'danger');
            return false;
        }

        if (data.topic.length < 3) {
            showNotification('Quiz topic must be at least 3 characters long.', 'danger');
            return false;
        }

        if (data.topic.length > 100) {
            showNotification('Quiz topic must be no more than 100 characters long.', 'danger');
            return false;
        }

        // Check if topic contains only allowed characters
        const topicRegex = /^[a-zA-Z0-9\s\-_]+$/;
        if (!topicRegex.test(data.topic)) {
            showNotification('Quiz topic can only contain letters, numbers, spaces, hyphens, and underscores.', 'danger');
            return false;
        }

        if (!data.difficulty) {
            showNotification('Please select a difficulty level.', 'danger');
            return false;
        }

        if (!data.questionCount || data.questionCount < 1) {
            showNotification('Please select the number of questions.', 'danger');
            return false;
        }

        if (data.questionTypes.length === 0) {
            showNotification('Please select at least one question type.', 'danger');
            return false;
        }

        return true;
    }

    generateMockQuiz(formData) {
        const questionTemplates = {
            'multiple-choice': [
                {
                    question: `What is a key concept in ${formData.topic}?`,
                    options: [
                        `Core principle A of ${formData.topic}`,
                        `Core principle B of ${formData.topic}`, 
                        `Core principle C of ${formData.topic}`,
                        `Core principle D of ${formData.topic}`
                    ],
                    correctAnswer: 0,
                    explanation: `This is a fundamental concept in ${formData.topic}.`
                },
                {
                    question: `Which of the following best describes ${formData.topic}?`,
                    options: [
                        `Definition A`,
                        `Definition B`,
                        `Definition C`, 
                        `Definition D`
                    ],
                    correctAnswer: 1,
                    explanation: `This definition accurately captures the essence of ${formData.topic}.`
                }
            ],
            'true-false': [
                {
                    question: `${formData.topic} is an important topic in modern technology.`,
                    options: ['True', 'False'],
                    correctAnswer: 0,
                    explanation: `Yes, ${formData.topic} plays a crucial role in current technological advancement.`
                }
            ],
            'open-ended': [
                {
                    question: `Explain the importance of ${formData.topic} in your own words.`,
                    type: 'open-ended',
                    explanation: `This tests your understanding of ${formData.topic} concepts.`
                }
            ]
        };

        const questions = [];
        const questionsPerType = Math.ceil(formData.questionCount / formData.questionTypes.length);

        formData.questionTypes.forEach(type => {
            const templates = questionTemplates[type] || questionTemplates['multiple-choice'];
            
            for (let i = 0; i < questionsPerType && questions.length < formData.questionCount; i++) {
                const template = templates[i % templates.length];
                questions.push({
                    ...template,
                    type: type,
                    id: `q_${questions.length + 1}`,
                    difficulty: formData.difficulty
                });
            }
        });

        return {
            id: `ai_${Date.now()}`,
            title: `AI Generated Quiz: ${formData.topic}`,
            topic: formData.topic,
            difficulty: formData.difficulty,
            questions: questions.slice(0, formData.questionCount),
            totalQuestions: Math.min(questions.length, formData.questionCount),
            createdAt: new Date(),
            createdBy: 'ai'
        };
    }

    showGeneratedQuiz(quiz) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'generatedQuizModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Generated Quiz: ${quiz.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="quiz-preview">
                            <div class="quiz-info mb-4">
                                <div class="row">
                                    <div class="col-md-4">
                                        <strong>Topic:</strong> ${quiz.topic}
                                    </div>
                                    <div class="col-md-4">
                                        <strong>Difficulty:</strong> 
                                        <span class="badge bg-primary">${quiz.difficulty}</span>
                                    </div>
                                    <div class="col-md-4">
                                        <strong>Questions:</strong> ${quiz.totalQuestions}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="questions-preview">
                                <h6>Question Preview:</h6>
                                ${quiz.questions.slice(0, 3).map((q, i) => `
                                    <div class="question-preview mb-3 p-3 rounded" style="background: rgba(255,255,255,0.05);">
                                        <strong>Q${i + 1}:</strong> ${q.question}
                                        ${q.type === 'multiple-choice' && q.options ? `
                                            <div class="mt-2">
                                                ${q.options.map((opt, j) => `
                                                    <div><small>${String.fromCharCode(65 + j)}) ${opt}</small></div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                                ${quiz.questions.length > 3 ? `<p class="text-muted">...and ${quiz.questions.length - 3} more questions</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="aiGenerator.startGeneratedQuiz()">
                            <i class="fas fa-play me-2"></i>Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Store quiz temporarily for starting
        this.currentGeneratedQuiz = quiz;

        // Clean up modal when closed
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    startGeneratedQuiz() {
        if (this.currentGeneratedQuiz && window.quizApp) {
            // Close the preview modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('generatedQuizModal'));
            if (modal) modal.hide();

            // Start the quiz using the main quiz system
            quizApp.currentQuiz = {
                ...this.currentGeneratedQuiz,
                category: { id: 'ai-generated', name: 'AI Generated' },
                startTime: Date.now(),
                timeLimit: this.currentGeneratedQuiz.questions.length * 60
            };

            quizApp.currentQuestion = 0;
            quizApp.userAnswers = new Array(this.currentGeneratedQuiz.questions.length).fill(null);
            
            quizApp.openQuizModal();
            quizApp.displayQuestion();
            quizApp.startTimer();
        }
    }

    showGenerationProgress() {
        const progressElement = document.getElementById('generation-progress');
        const form = document.getElementById('ai-generator-form');
        
        if (progressElement && form) {
            progressElement.classList.remove('d-none');
            form.style.opacity = '0.6';
            form.style.pointerEvents = 'none';
        }
    }

    hideGenerationProgress() {
        const progressElement = document.getElementById('generation-progress');
        const form = document.getElementById('ai-generator-form');
        
        if (progressElement && form) {
            progressElement.classList.add('d-none');
            form.style.opacity = '1';
            form.style.pointerEvents = 'auto';
        }
    }
}

// Initialize AI Generator
let aiGenerator;

document.addEventListener('DOMContentLoaded', () => {
    aiGenerator = new AIQuizGenerator();
    window.aiGenerator = aiGenerator; // Make it globally accessible
});

console.log('AI Generator loaded successfully');