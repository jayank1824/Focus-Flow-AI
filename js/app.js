/**
 * FocusFlow AI - Master Application Controller
 * 
 * Manages tabbed routing, global state, modals, and initial module orchestration.
 */

const App = {
  currentView: 'streamer',

  init() {
    console.log('⚡ Initializing FocusFlow AI Master Platform...');

    // Initialize all sub-modules
    if (window.AuthManager) window.AuthManager.init();
    if (window.FocusEngine) window.FocusEngine.init();
    if (window.WebcamProctor) window.WebcamProctor.init();
    if (window.YouTubeStreamer) window.YouTubeStreamer.init();
    if (window.KnowledgeHub) window.KnowledgeHub.init();
    if (window.AITutor) window.AITutor.init();
    if (window.FlashcardEngine) window.FlashcardEngine.init();
    if (window.MindMapEngine) window.MindMapEngine.init();
    if (window.PracticeHub) window.PracticeHub.init();
    if (window.ExamProctor) window.ExamProctor.init();
    if (window.AvatarInterviewer) window.AvatarInterviewer.init();
    if (window.StudyGroupEngine) window.StudyGroupEngine.init();
    if (window.AnalyticsEngine) window.AnalyticsEngine.init();
    if (window.RewardsStore) window.RewardsStore.init();

    this.bindNavigation();
    this.bindKeyboardShortcuts();
    this.handleUrlParams();

    // Default to streamer view
    this.switchView('streamer');
  },

  bindNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view) this.switchView(view);
      });
    });
  },

  switchView(viewName) {
    this.currentView = viewName;

    // Update Nav Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update View Containers
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    // Specific triggers per view
    if (viewName === 'mindmap' && window.MindMapEngine) {
      setTimeout(() => window.MindMapEngine.resizeCanvas(), 50);
    } else if ((viewName === 'analytics' || viewName === 'stats') && window.AnalyticsEngine) {
      setTimeout(() => window.AnalyticsEngine.renderStatsView(), 50);
    } else if (viewName === 'rewards' && window.RewardsStore) {
      setTimeout(() => window.RewardsStore.renderStore(), 50);
    } else if (viewName === 'avatar' && window.AvatarInterviewer) {
      // Avatar loop is already running
    } else if (viewName === 'flashcards' && window.FlashcardEngine) {
      window.FlashcardEngine.renderCurrentCard();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Space flips flashcards if in flashcards view and not typing in an input
      if (e.code === 'Space' && this.currentView === 'flashcards' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (window.FlashcardEngine) window.FlashcardEngine.flipCard();
      }

      // Escape closes modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  },

  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && window.FocusEngine) {
      this.switchView('groups');
      window.FocusEngine.showToast(`🎉 Joined Study Group with code [${joinCode}]!`, 'success');
    }
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
