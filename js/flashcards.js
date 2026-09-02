/**
 * FocusFlow AI - Interactive 3D Flashcards & Spaced Repetition Engine
 * 
 * Features:
 * - 3D CSS flip animations with Leitner spaced repetition (Again, Hard, Good, Easy)
 * - Auto-deck generation from video slices and uploaded documents
 * - Active recall tracking & mastery statistics
 */

const FlashcardEngine = {
  state: {
    cards: [],
    currentIndex: 0,
    isFlipped: false,
    selectedDeck: 'all',
    decks: []
  },

  init() {
    this.refreshDeckList();
    this.renderCurrentCard();
  },

  refreshDeckList() {
    this.state.cards = FocusStorage.get(FocusStorage.KEYS.FLASHCARDS) || [];
    
    // Extract unique decks
    const deckSet = new Set(['all']);
    this.state.cards.forEach(c => {
      if (c.deck) deckSet.add(c.deck);
    });
    this.state.decks = Array.from(deckSet);

    this.renderDeckSelector();
  },

  renderDeckSelector() {
    const selector = document.getElementById('flashcard-deck-filter');
    if (!selector) return;

    selector.innerHTML = this.state.decks.map(d => `
      <option value="${d}" ${d === this.state.selectedDeck ? 'selected' : ''}>
        ${d === 'all' ? '📚 All Decks (' + this.state.cards.length + ' cards)' : '🗂️ ' + d}
      </option>
    `).join('');
  },

  filterByDeck(deckName) {
    this.state.selectedDeck = deckName;
    this.state.currentIndex = 0;
    this.state.isFlipped = false;
    this.renderCurrentCard();
  },

  getActiveCards() {
    if (this.state.selectedDeck === 'all') return this.state.cards;
    return this.state.cards.filter(c => c.deck === this.state.selectedDeck);
  },

  renderCurrentCard() {
    const container = document.getElementById('flashcard-interactive-stage');
    if (!container) return;

    const cards = this.getActiveCards();
    if (cards.length === 0) {
      container.innerHTML = `
        <div class="empty-flashcard-state">
          <div class="empty-icon">🗂️</div>
          <h3>No flashcards in this deck</h3>
          <p>Generate flashcards from YouTube slices or create a new card below.</p>
        </div>
      `;
      return;
    }

    if (this.state.currentIndex >= cards.length) {
      this.state.currentIndex = 0;
    }

    const card = cards[this.state.currentIndex];
    const total = cards.length;
    const current = this.state.currentIndex + 1;

    container.innerHTML = `
      <div class="flashcard-hud">
        <span class="fc-counter">Card ${current} of ${total}</span>
        <span class="fc-deck-badge">${card.deck}</span>
        <span class="fc-box-badge">Box ${card.box || 1} / 5</span>
      </div>

      <div class="flashcard-3d-wrapper ${this.state.isFlipped ? 'flipped' : ''}" onclick="FlashcardEngine.flipCard()">
        <div class="flashcard-3d-inner">
          <div class="flashcard-face flashcard-front">
            <div class="fc-face-header">
              <span class="fc-pill">Question</span>
              <span class="fc-hint-icon">💡 Click to reveal answer</span>
            </div>
            <div class="fc-face-body">
              <p>${card.question}</p>
            </div>
          </div>

          <div class="flashcard-face flashcard-back">
            <div class="fc-face-header">
              <span class="fc-pill answer">Answer & Explanation</span>
              <span class="fc-hint-icon">🎯 Active Recall</span>
            </div>
            <div class="fc-face-body">
              <p>${card.answer}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flashcard-action-bar">
        <button class="btn btn-fc btn-again" onclick="FlashcardEngine.rateCard(1)">
          ❌ Again (+1d)
        </button>
        <button class="btn btn-fc btn-hard" onclick="FlashcardEngine.rateCard(2)">
          ⚠️ Hard (+3d)
        </button>
        <button class="btn btn-fc btn-good" onclick="FlashcardEngine.rateCard(3)">
          👍 Good (+7d)
        </button>
        <button class="btn btn-fc btn-easy" onclick="FlashcardEngine.rateCard(4)">
          🔥 Easy (+14d)
        </button>
      </div>

      <div class="flashcard-nav-controls">
        <button class="btn btn-secondary btn-sm" onclick="FlashcardEngine.prevCard()">⬅️ Previous</button>
        <button class="btn btn-secondary btn-sm" onclick="FlashcardEngine.flipCard()">🔄 Flip Card (Space)</button>
        <button class="btn btn-secondary btn-sm" onclick="FlashcardEngine.nextCard()">Next ➡️</button>
      </div>
    `;
  },

  flipCard() {
    this.state.isFlipped = !this.state.isFlipped;
    const wrapper = document.querySelector('.flashcard-3d-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('flipped', this.state.isFlipped);
    }
  },

  nextCard() {
    const cards = this.getActiveCards();
    if (cards.length > 0) {
      this.state.currentIndex = (this.state.currentIndex + 1) % cards.length;
      this.state.isFlipped = false;
      this.renderCurrentCard();
    }
  },

  prevCard() {
    const cards = this.getActiveCards();
    if (cards.length > 0) {
      this.state.currentIndex = (this.state.currentIndex - 1 + cards.length) % cards.length;
      this.state.isFlipped = false;
      this.renderCurrentCard();
    }
  },

  rateCard(rating) {
    const cards = this.getActiveCards();
    if (cards.length === 0) return;

    const currentCard = cards[this.state.currentIndex];
    
    // Update Leitner box
    if (rating === 1) {
      currentCard.box = 1;
    } else if (rating === 4) {
      currentCard.box = Math.min(5, (currentCard.box || 1) + 2);
    } else {
      currentCard.box = Math.min(5, (currentCard.box || 1) + 1);
    }

    FocusStorage.update(FocusStorage.KEYS.FLASHCARDS, (allCards) => {
      const idx = allCards.findIndex(c => c.id === currentCard.id);
      if (idx !== -1) allCards[idx] = currentCard;
      return allCards;
    });

    if (window.FocusEngine) {
      window.FocusEngine.showToast(`Active recall recorded! Card moved to Leitner Box ${currentCard.box}`, 'success');
    }

    this.nextCard();
  },

  addNewCard(deck, question, answer) {
    const newCard = {
      id: 'fc_' + Date.now(),
      deck: deck || 'General Studies',
      question: question,
      answer: answer,
      box: 1,
      nextReviewDate: new Date().toISOString()
    };

    FocusStorage.update(FocusStorage.KEYS.FLASHCARDS, (cards) => [...(cards || []), newCard]);
    this.refreshDeckList();
    this.renderCurrentCard();

    if (window.FocusEngine) {
      window.FocusEngine.showToast('✅ New Flashcard added successfully!', 'success');
    }
  }
};

window.FlashcardEngine = FlashcardEngine;
