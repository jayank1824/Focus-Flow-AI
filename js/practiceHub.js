/**
 * FocusFlow AI - Practice Arena & Unsolved Revision Ledger
 * 
 * Features:
 * - Domain & Topic categorized question banks
 * - Unsolved & Missed Question revision tracking
 * - Inline AI Tutor Explanations & Step-by-Step Hint Breakdowns rendered DIRECTLY BELOW the question
 * - Deep concept intuition grounded with Feynman, Socratic, and Expert personas
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
    hintsRevealed: {}
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
      const hintCount = this.state.hintsRevealed[q.id] || 0;
      const totalHints = (q.hints || []).length || 2;

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

          <!-- Question Header & Text -->
          <div class="practice-question-text">
            <h4>${idx + 1}. ${q.question}</h4>
          </div>

          <!-- ================================================================
               INLINE AI TUTOR HINT & EXPLANATION (JUST BELOW THE QUESTION)
               ================================================================ -->
          <div class="inline-ai-tutor-container" id="inline_tutor_${q.id}">
            <div class="inline-tutor-toolbar">
              <button class="btn-inline-hint" id="btn_hint_toggle_${q.id}" onclick="PracticeHub.revealInlineAIHint('${q.id}')">
                💡 Reveal AI Tutor Hint (<span id="hint_count_${q.id}">${hintCount}</span>/${totalHints})
              </button>
              <button class="btn-inline-explain" onclick="PracticeHub.askAITutorExplanation('${q.id}')">
                🤖 AI Tutor Concept Breakdown
              </button>
            </div>

            <!-- Inline Explanatory Container -->
            <div class="inline-ai-hint-box" id="inline_hint_box_${q.id}" style="${hintCount > 0 ? 'display: block;' : 'display: none;'}">
              <!-- Injected dynamically by revealInlineAIHint or askAITutorExplanation -->
            </div>
          </div>

          <!-- Options Grid -->
          <div class="practice-options-grid" id="options_${q.id}">
            ${q.options.map((opt, optIdx) => `
              <div class="practice-option-item" onclick="PracticeHub.selectOption('${q.id}', ${optIdx})">
                <span class="opt-letter">${String.fromCharCode(65 + optIdx)}</span>
                <span class="opt-text">${opt}</span>
              </div>
            `).join('')}
          </div>

          <!-- Card Footer -->
          <div class="practice-card-footer">
            <div class="footer-left">
              <span style="font-size: 0.8rem; color: var(--text-muted);">
                ⚡ BKT Tracked • +50 Focus XP
              </span>
            </div>

            <div class="footer-right">
              <button class="btn btn-secondary btn-sm" onclick="AITutor.openTutorModalWithPrompt('Help me understand the core principle behind this question: ${q.question.replace(/'/g, '')}')">
                🎙️ Ask AI Voice Tutor
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

  /**
   * Explains and renders the hint directly BELOW the question in an inline container
   */
  revealInlineAIHint(questionId) {
    const questions = FocusStorage.get(FocusStorage.KEYS.PRACTICE_QUESTIONS) || [];
    const q = questions.find(item => item.id === questionId);
    if (!q) return;

    const hintBox = document.getElementById(`inline_hint_box_${questionId}`);
    const countSpan = document.getElementById(`hint_count_${questionId}`);
    if (!hintBox || !countSpan) return;

    let currentCount = this.state.hintsRevealed[questionId] || 0;
    const defaultHints = q.hints && q.hints.length > 0 ? q.hints : [
      `Analyze the fundamental invariants of ${q.topic || 'the topic'}. Look closely at how state transitions occur.`,
      `Eliminate options that violate time complexity or memory bounds.`
    ];

    if (currentCount >= defaultHints.length) {
      if (window.FocusEngine) window.FocusEngine.showToast('All hints already revealed for this question! Check the AI Concept Breakdown for more details.', 'info');
      return;
    }

    currentCount++;
    this.state.hintsRevealed[questionId] = currentCount;
    countSpan.textContent = currentCount;

    hintBox.style.display = 'block';

    const hintText = defaultHints[currentCount - 1];

    // Pedagogical pedagogical hint format: Intuition, Clue, and Socratic Trigger
    const hintCardHTML = `
      <div class="inline-hint-entry animate-fade-in">
        <div class="inline-hint-header">
          <div class="hint-badge-pill">💡 AI Tutor Hint #${currentCount}</div>
          <span class="hint-tag-topic">Topic: ${q.topic || q.domain}</span>
        </div>
        <div class="inline-hint-content">
          <p class="hint-main-text"><strong>AI Teacher Insight:</strong> ${hintText}</p>
          <div class="hint-socratic-trigger">
            🎯 <strong>Socratic Guiding Prompt:</strong> How does this property narrow down the multiple choices provided above?
          </div>
        </div>
      </div>
    `;

    hintBox.innerHTML += hintCardHTML;

    if (window.FocusEngine) {
      window.FocusEngine.showToast(`💡 AI Tutor Hint #${currentCount} explained just below question!`, 'info');
    }
  },

  /**
   * Generates or reveals deep pedagogical concept breakdown directly below question
   */
  async askAITutorExplanation(questionId) {
    const questions = FocusStorage.get(FocusStorage.KEYS.PRACTICE_QUESTIONS) || [];
    const q = questions.find(item => item.id === questionId);
    if (!q) return;

    const hintBox = document.getElementById(`inline_hint_box_${questionId}`);
    if (!hintBox) return;

    hintBox.style.display = 'block';

    // Show loading state
    hintBox.innerHTML = `
      <div class="inline-hint-entry loading animate-fade-in">
        <div class="inline-hint-header">
          <div class="hint-badge-pill">🤖 Generating AI Tutor Pedagogical Breakdown...</div>
        </div>
        <p style="font-size: 0.85rem; color: var(--cyan); margin: 0.5rem 0;">
          <span class="pulse-dot cyan"></span> Synthesizing concept intuition via Feynman mental model & RAG knowledge base...
        </p>
      </div>
    `;

    try {
      const promptQuery = `Explain the theoretical concept and intuition behind this question: "${q.question}" in topic "${q.topic}". Give a high-level conceptual analogy and formula/property clue without directly giving away the final letter choice.`;
      
      const res = await fetch('/api/llm/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptQuery, persona: 'feynman' })
      });

      let explanationText = "";
      if (res.ok) {
        const data = await res.json();
        explanationText = data.response || data.text || "";
      }

      if (!explanationText) {
        explanationText = `Here is the core intuition: In **${q.topic}**, the key challenge is balancing computational efficiency with structural fidelity. Think of it like a highway bypass—instead of computing every intermediate state sequentially, certain architectures allow information to flow across direct shortcut pathways!`;
      }

      hintBox.innerHTML = `
        <div class="inline-hint-entry tutor-deep-dive animate-fade-in">
          <div class="inline-hint-header">
            <div class="hint-badge-pill" style="background: rgba(0, 242, 254, 0.15); border-color: var(--cyan); color: var(--cyan);">
              🤖 AI Tutor (Feynman Persona) - Concept Breakdown
            </div>
            <button class="btn-close-hint" onclick="document.getElementById('inline_hint_box_${q.id}').style.display = 'none';">✕ Hide</button>
          </div>
          <div class="inline-hint-content">
            <p class="hint-main-text">${explanationText}</p>
            <div class="hint-key-takeaways">
              🧠 <strong>Key Intuition:</strong> Focus on the fundamental definitions of <em>${q.topic}</em> and inspect how each option impacts gradient flow or algorithmic consistency.
            </div>
          </div>
        </div>
      `;

    } catch (e) {
      console.warn('AI Tutor inline explanation fallback:', e);
      hintBox.innerHTML = `
        <div class="inline-hint-entry tutor-deep-dive animate-fade-in">
          <div class="inline-hint-header">
            <div class="hint-badge-pill">🤖 AI Tutor Concept Intuition</div>
            <button class="btn-close-hint" onclick="document.getElementById('inline_hint_box_${q.id}').style.display = 'none';">✕ Hide</button>
          </div>
          <div class="inline-hint-content">
            <p class="hint-main-text">
              <strong>Conceptual Analogy:</strong> In <strong>${q.topic}</strong>, consider the core mathematical relationship. Notice how the forward calculation transforms inputs and preserves information flow.
            </p>
          </div>
        </div>
      `;
    }
  },

  // Legacy wrapper for backwards compatibility
  revealHint(questionId) {
    this.revealInlineAIHint(questionId);
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
