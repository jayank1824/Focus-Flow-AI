/**
 * FocusFlow AI - Authentication & Student Profile Session Manager
 * 
 * Features:
 * - Student Login & Registration
 * - 1-Click Pre-configured Demo Accounts (Alex, Maya, Liam)
 * - Header Profile Dropdown with real-time level, streak, and gems status
 * - Seamless synchronization across all learning modules and reward wallets
 */

const AuthManager = {
  DEMO_ACCOUNTS: [
    {
      id: 'user_alex',
      name: 'Alex Rivera',
      email: 'alex.rivera@focusflow.ai',
      avatar: '👨‍🎓',
      role: 'Computer Science & AI Specialist',
      level: 3,
      xp: 1450,
      gems: 85,
      streakDays: 6,
      baselineFocusMinutes: 20,
      currentStretchFocusMinutes: 35,
      targetDailyFocusMinutes: 90,
      preferredDomains: ['Computer Science', 'Machine Learning & AI', 'System Design']
    },
    {
      id: 'user_maya',
      name: 'Maya Patel',
      email: 'maya.patel@focusflow.ai',
      avatar: '👩‍💻',
      role: 'Quantitative Finance & ML Researcher',
      level: 5,
      xp: 3800,
      gems: 160,
      streakDays: 14,
      baselineFocusMinutes: 30,
      currentStretchFocusMinutes: 50,
      targetDailyFocusMinutes: 120,
      preferredDomains: ['Quantitative & Mathematics', 'Deep Learning', 'Data Structures']
    },
    {
      id: 'user_liam',
      name: 'Liam Vance',
      email: 'liam.vance@focusflow.ai',
      avatar: '👨‍🔬',
      role: 'Distributed Cloud & Backend Architect',
      level: 2,
      xp: 820,
      gems: 45,
      streakDays: 4,
      baselineFocusMinutes: 15,
      currentStretchFocusMinutes: 30,
      targetDailyFocusMinutes: 60,
      preferredDomains: ['Distributed Systems', 'Web Security', 'Algorithms']
    }
  ],

  init() {
    this.renderHeaderProfile();
    this.setupDropdownListeners();
  },

  getCurrentUser() {
    return FocusStorage.get(FocusStorage.KEYS.USER_PROFILE) || this.DEMO_ACCOUNTS[0];
  },

  renderHeaderProfile() {
    const user = this.getCurrentUser();
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const levelEl = document.getElementById('header-user-level');
    const streakEl = document.getElementById('header-user-streak');
    const gemsEl = document.getElementById('header-user-gems');

    if (avatarEl) avatarEl.textContent = user.avatar || '👨‍🎓';
    if (nameEl) nameEl.textContent = user.name || 'Alex Rivera';
    if (roleEl) roleEl.textContent = user.role || 'Student Scholar';
    if (levelEl) levelEl.textContent = `Lvl ${user.level || 1}`;
    if (streakEl) streakEl.textContent = `${user.streakDays || 0}d Streak 🔥`;
    if (gemsEl) gemsEl.textContent = `${user.gems || 0} 💎`;

    // Sync HUD items in focusEngine
    if (window.FocusEngine) {
      window.FocusEngine.updateUserHUD();
    }
  },

  setupDropdownListeners() {
    const profileBtn = document.getElementById('header-profile-btn');
    const dropdown = document.getElementById('profile-dropdown-menu');

    if (profileBtn && dropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== profileBtn) {
          dropdown.classList.remove('active');
        }
      });
    }
  },

  switchDemoUser(userId) {
    const target = this.DEMO_ACCOUNTS.find(a => a.id === userId);
    if (!target) return;

    FocusStorage.set(FocusStorage.KEYS.USER_PROFILE, { ...target });
    this.renderHeaderProfile();

    if (window.FocusEngine) {
      window.FocusEngine.updateUserHUD();
      window.FocusEngine.showToast(`Switched account to ${target.name} (${target.role})!`, 'success');
    }

    if (window.RewardsStore) {
      window.RewardsStore.renderStore();
    }

    if (window.AnalyticsEngine) {
      window.AnalyticsEngine.init();
    }

    const dropdown = document.getElementById('profile-dropdown-menu');
    if (dropdown) dropdown.classList.remove('active');

    App.closeModal('auth-modal');
  },

  loginWithCredentials(email, password) {
    if (!email || !password) {
      if (window.FocusEngine) window.FocusEngine.showToast('Please enter both email and password', 'warning');
      return;
    }

    // Match existing or demo account
    let matched = this.DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      matched = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email: email,
        avatar: '🎓',
        role: 'FocusFlow Scholar',
        level: 1,
        xp: 100,
        gems: 30,
        streakDays: 1,
        baselineFocusMinutes: 20,
        currentStretchFocusMinutes: 35,
        targetDailyFocusMinutes: 90,
        preferredDomains: ['Computer Science']
      };
    }

    FocusStorage.set(FocusStorage.KEYS.USER_PROFILE, matched);
    this.renderHeaderProfile();

    if (window.FocusEngine) {
      window.FocusEngine.updateUserHUD();
      window.FocusEngine.showToast(`Welcome back, ${matched.name}!`, 'success');
    }

    if (window.RewardsStore) {
      window.RewardsStore.renderStore();
    }

    App.closeModal('auth-modal');
  },

  registerNewUser(name, email, password, baselineMins, domain) {
    if (!name || !email || !password) {
      if (window.FocusEngine) window.FocusEngine.showToast('Please complete all registration fields', 'warning');
      return;
    }

    const newUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      avatar: '🌟',
      role: `${domain} Student`,
      level: 1,
      xp: 200,
      gems: 50, // Starter registration bonus
      streakDays: 1,
      baselineFocusMinutes: parseInt(baselineMins) || 20,
      currentStretchFocusMinutes: (parseInt(baselineMins) || 20) + 15,
      targetDailyFocusMinutes: 90,
      preferredDomains: [domain]
    };

    FocusStorage.set(FocusStorage.KEYS.USER_PROFILE, newUser);
    this.renderHeaderProfile();

    if (window.FocusEngine) {
      window.FocusEngine.updateUserHUD();
      window.FocusEngine.showToast(`Account created! +50 Starter Focus Gems awarded 💎`, 'success');
    }

    if (window.RewardsStore) {
      window.RewardsStore.renderStore();
    }

    App.closeModal('auth-modal');
  },

  openLoginModal(defaultTab = 'login') {
    this.switchAuthTab(defaultTab);
    App.openModal('auth-modal');
  },

  switchAuthTab(tabName) {
    const tabLogin = document.getElementById('auth-tab-btn-login');
    const tabSignup = document.getElementById('auth-tab-btn-signup');
    const tabDemo = document.getElementById('auth-tab-btn-demo');

    const formLogin = document.getElementById('auth-form-login');
    const formSignup = document.getElementById('auth-form-signup');
    const panelDemo = document.getElementById('auth-panel-demo');

    if (tabLogin) tabLogin.classList.toggle('active', tabName === 'login');
    if (tabSignup) tabSignup.classList.toggle('active', tabName === 'signup');
    if (tabDemo) tabDemo.classList.toggle('active', tabName === 'demo');

    if (formLogin) formLogin.style.display = tabName === 'login' ? 'block' : 'none';
    if (formSignup) formSignup.style.display = tabName === 'signup' ? 'block' : 'none';
    if (panelDemo) panelDemo.style.display = tabName === 'demo' ? 'block' : 'none';
  },

  logout() {
    // Reset to demo guest
    FocusStorage.set(FocusStorage.KEYS.USER_PROFILE, { ...this.DEMO_ACCOUNTS[0] });
    this.renderHeaderProfile();
    const dropdown = document.getElementById('profile-dropdown-menu');
    if (dropdown) dropdown.classList.remove('active');

    if (window.FocusEngine) {
      window.FocusEngine.updateUserHUD();
      window.FocusEngine.showToast('Logged out. Reverted to Guest Student profile.', 'info');
    }
  }
};

window.AuthManager = AuthManager;
