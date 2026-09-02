/**
 * FocusFlow AI - Practice Arena & Unsolved Revision Ledger
 * 
 * Features:
 * - Domain & Topic categorized question banks
 * - Unsolved & Missed Question revision tracking
 * - Step-by-step hint reveals & deep AI solution breakdowns
 * - Real-time sync with Python Bayesian Knowledge Tracing (BKT) endpoint
 */

const PracticeHub = {
  state: {
    selectedDomain: 'all',
    selectedDifficulty: 'all',
    onlyUnsolved: false,
    selectedOption: null,
    isSubmitted: false,
    currentQuestionId: null,
    hintsRevealed: 0
  },

  init() {
    this.renderDomainFilters();
    this.renderQuestionFeed();
    this.updateUnsolvedBadge();
  },

  renderDomainFilters() {
    const questions = FocusStorage.get(FocusStorage.KEYS.PRACTICE_QUESTIONS) || [];
    const domains = new Set(['all']);
    questions.forEach(q => {
      if (q.domain) domains.add(q.domain);
    });

    const selector = document.getElementById('practice-domain-filter');
    if (selector) {
      selector.innerHTML = Array.from(domains).map(d => `
        <option value="${d}" ${d === this.state.selectedDomain ? 'selected' : ''}>
          ${d === 'all' ? '🌐 All Domains' : '📁 ' + d}
        </option>
      `).join('');
    }
  },

  updateUnsolvedBadge() {
    const unsolvedList = FocusStorage.get(FocusStorage.KEYS.UNSOLVED_QUESTIONS) || [];
    const badge = document.getElementById('unsolved-questions-badge');
    if (badge) {
      badge.textContent = `${unsolvedList.length} Unsolved / Review Required`;
      badge.className = unsolvedList.length > 0 ? 'badge-pill warning' : 'badge-pill success';
    }
  },

  toggleUnsolvedFilter() {
    this.state.onlyUnsolved = !this.state.onlyUnsolved;
    const btn = document.getElementById('toggle-unsolved-btn');
    if (btn) {
      btn.classList.toggle('active', this.state.onlyUnsolved);
      btn.textContent = this.state.onlyUnsolved ? '🎯 Showing Unsolved Only' : '📚 Showing All Questions';
    }
    this.renderQuestionFeed();
  },

  getFilteredQuestions() {
    let questions = FocusStorage.get(FocusStorage.KEYS.PRACTICE_QUESTIONS) || [];
    const unsolvedList = FocusStorage.get(FocusStorage.KEYS.UNSOLVED_QUESTIONS) || [];

    if (this.state.selectedDomain !== 'all') {
      questions = questions.filter(q => q.domain === this.state.selectedDomain);
    }
    if (this.state.selectedDifficulty !== 'all') {
      questions = questions.filter(q => q.difficulty === this.state.selectedDifficulty);
    }
    if (this.state.onlyUnsolved) {
      questions = questions.filter(q => unsolvedList.includes(q.id) || !q.solved);
    }

    return questions;
  },

  renderQuestionFeed() {
    const container = document.getElementById('practice-questions-list');
    if (!container) return;

    const questions = this.getFilteredQuestions();
    const unsolvedList = FocusStorage.get(FocusStorage.KEYS.UNSOLVED_QUESTIONS) || [];

    if (questions.length === 0) {
      container.innerHTML = `
        <div class="empty-practice-state">
          <div class="empty-icon">🎯</div>
          <h3>All Caught Up!</h3>
          <p>No questions match your current filter or all questions in this set are mastered.</p>
          <button class="btn btn-primary btn-sm" onclick="PracticeHub.generateAIQuestions()">✨ Generate New AI Questions</button>
        </div>
      `;
      return;
    }

    container.innerHTML = questions.map((q, idx) => {
      const isUnsolved = unsolvedList.includes(q.id) || !q.solved;
      return `
        <div class="practice-card ${isUnsolved ? 'unsolved-marked' : 'solved-mastered'}" id="pcard_${q.id}">
          <div class="practice-card-header">
            <div class="header-tags">
              <span class="domain-tag">${q.domain}</span>
              <span class="topic-tag">${q.topic}</span>
              <span class="diff-tag diff-${(q.difficulty || 'med').toLowerCase()}">${q.difficulty}</span>
            </div>
            <div class="status-indicator">
              ${isUnsolved ? '<span class="status-pill needs-review">⚠️ Needs Revision</span>' : '<span class="status-pill mastered">✅ Mastered</span>'}
            </div>
          </div>

          <div class="practice-question-text">
            <h4>${idx + 1}. ${q.question}</h4>
          </div>

          <div class="practice-options-grid" id="options_${q.id}">
            ${q.options.map((opt, optIdx) => `
              <div class="practice-option-item" onclick="PracticeHub.selectOption('${q.id}', ${optIdx})">
                <span class="opt-letter">${String.fromCharCode(65 + optIdx)}</span>
                <span class="opt-text">${opt}</span>
              </div>
            `).join('')}
          </div>

          <div class="practice-card-footer">
            <div class="footer-left">
              <button class="btn-text-hint" onclick="PracticeHub.revealHint('${q.id}')">
                💡 Reveal Hint (<span id="hint_count_${q.id}">0</span>/${(q.hints || []).length})
              </button>
              <div class="hint-display-box" id="hint_box_${q.id}"></div>
            </div>

            <div class="footer-right">
              <button class="btn btn-secondary btn-sm" onclick="AITutor.openTutorModalWithPrompt('Help me solve this practice question: ${q.question.replace(/'/g, '')}')">
                🤖 Ask AI Tutor
              </button>
              <button class="btn btn-primary btn-sm" id="btn_submit_${q.id}" onclick="PracticeHub.submitAnswer('${q.id}')">
                Submit Answer ➔
              </button>
            </div>
          </div>

          <div class="explanation-box" id="exp_${q.id}"></div>
        </div>
      `;
    }).join('');
  },

  selectOption(questionId, optionIndex) {
    const card = document.getElementById(`pcard_${questionId}`);
    if (!card) return;

    const options = card.querySelectorAll('.practice-option-item');
    options.forEach((opt, idx) => {
      opt.classList.toggle('selected', idx === optionIndex);
    });

    card.dataset.selectedOpt = optionIndex;
  },

  revealHint(questionId) {
    const questions = FocusStorage.get(FocusStorage.KEYS.PRACTICE_QUESTIONS) || [];
    const q = questions.find(item => item.id === questionId);
    if (!q || !q.hints || q.hints.length === 0) return;

    const hintBox = document.getElementById(`hint_box_${questionId}`);
    const countSpan = document.getElementById(`hint_count_${questionId}`);
    const currentCount = parseInt(countSpan.textContent) || 0;

    if (currentCount < q.hints.length) {
      const nextHint = q.hints[currentCount];
      hintBox.innerHTML += `<div class="hint-bubble">💡 <strong>Hint ${currentCount + 1}:</strong> ${nextHint}</div>`;
      countSpan.textContent = currentCount + 1;
    } else {
      if (window.FocusEngine) window.FocusEngine.showToast('All hints already revealed!', 'info');
    }
  },

  async submitAnswer(questionId) {
    const card = document.getElementById(`pcard_${questionId}`);
    if (!card || card.dataset.selectedOpt === undefined) {
      if (window.FocusEngine) window.FocusEngine.showToast('Please select an option first!', 'warning');
      return;
    }

    const selectedIdx = parseInt(card.dataset.selectedOpt);
    const questions = FocusStorage.get(FocusStorage.KEYS.PRACTICE_QUESTIONS) || [];
    const q = questions.find(item => item.id === questionId);
    if (!q) return;

    const isCorrect = selectedIdx === q.correctIndex;
    const expBox = document.getElementById(`exp_${questionId}`);
    const options = card.querySelectorAll('.practice-option-item');

    // Colorize options
    options.forEach((opt, idx) => {
      if (idx === q.correctIndex) {
        opt.classList.add('correct');
      } else if (idx === selectedIdx && !isCorrect) {
        opt.classList.add('incorrect');
      }
    });

    // Notify Python Bayesian Knowledge Tracing (BKT) backend
    try {
      await fetch('/api/ml/knowledge-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: q.topic || q.domain || 'Machine Learning',
          is_correct: isCorrect,
          question_id: questionId
        })
      });
    } catch (err) {
      console.warn('BKT trace sync fallback:', err);
    }

    if (isCorrect) {
      expBox.className = 'explanation-box correct-feedback';
      expBox.innerHTML = `
        <div class="exp-title">🎉 Correct Answer! (+50 Focus XP)</div>
        <p>${q.explanation}</p>
      `;

      FocusStorage.update(FocusStorage.KEYS.UNSOLVED_QUESTIONS, (unsolved) => {
        return (unsolved || []).filter(id => id !== questionId);
      });

      FocusStorage.update(FocusStorage.KEYS.USER_PROFILE, (profile) => {
        profile.xp += 50;
        return profile;
      });

      if (window.FocusEngine) {
        window.FocusEngine.updateUserHUD();
        window.FocusEngine.showToast('✨ Correct! BKT Skill Mastery updated in Python ML core.', 'success');
      }
    } else {
      expBox.className = 'explanation-box incorrect-feedback';
      expBox.innerHTML = `
        <div class="exp-title">❌ Incorrect. Added to Unsolved Revision Ledger.</div>
        <p>${q.explanation}</p>
      `;

      FocusStorage.update(FocusStorage.KEYS.UNSOLVED_QUESTIONS, (unsolved) => {
        if (!unsolved) unsolved = [];
        if (!unsolved.includes(questionId)) unsolved.push(questionId);
        return unsolved;
      });

      if (window.FocusEngine) {
        window.FocusEngine.showToast('⚠️ Marked for revision in Unsolved Ledger.', 'warning');
      }
    }

    this.updateUnsolvedBadge();
    const submitBtn = document.getElementById(`btn_submit_${questionId}`);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isCorrect ? 'Mastered ✅' : 'Review Later 🔄';
    }
  },

  async generateAIQuestions() {
    try {
      const res = await fetch('/api/llm/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'Machine Learning', topic: 'Residual Skip Connections' })
      });
      if (res.ok) {
        const newQ = await res.json();
        FocusStorage.update(FocusStorage.KEYS.PRACTICE_QUESTIONS, (questions) => [newQ, ...(questions || [])]);
        this.renderDomainFilters();
        this.renderQuestionFeed();
        if (window.FocusEngine) {
          window.FocusEngine.showToast('✨ Python AI synthesized new practice question!', 'success');
        }
        return;
      }
    } catch (e) {
      console.warn('AI question generator fallback:', e);
    }
  }
};

window.PracticeHub = PracticeHub;
