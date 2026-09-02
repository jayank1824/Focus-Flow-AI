/**
 * FocusFlow AI - Real-World Student Rewards Marketplace & Streak Wallet
 * 
 * Features:
 * - Real-world perks: Travel discounts, Free Movie tickets, Cafe study fuels, Amazon/Tech vouchers, AI subscriptions
 * - Dynamic Gem & Streak gating
 * - Instant Promo Code Generation & Clipboard Copy
 * - "My Claimed Rewards" Wallet with simulated barcodes & expiry tracking
 */

const RewardsStore = {
  state: {
    activeCategory: 'all',
    catalog: [],
    claimedVouchers: []
  },

  async init() {
    this.claimedVouchers = FocusStorage.get(FocusStorage.KEYS.CLAIMED_REWARDS) || [
      {
        id: 'clm_init_1',
        reward_id: 'rew_cafe_1',
        title: 'Free Starbucks Nitro Cold Brew / Latte',
        brand: 'Starbucks Coffee',
        discount: 'Free Beverage Voucher',
        promo_code: 'FOCUS-CAF-8Y7B2M',
        claimed_at: 'Yesterday',
        expires_at: 'Valid till 30 Days',
        category: 'cafes',
        icon: '☕'
      }
    ];

    await this.fetchCatalog();
    this.renderStore();
  },

  async fetchCatalog() {
    try {
      const res = await fetch('/api/rewards/catalog');
      if (res.ok) {
        const data = await res.json();
        this.state.catalog = data.catalog;
        return;
      }
    } catch (e) {
      console.warn('Backend rewards catalog fetch fallback:', e);
    }

    // Fallback catalog
    this.state.catalog = [
      {
        id: 'rew_travel_1',
        category: 'travel',
        category_label: '✈️ Travel & Commute',
        title: '25% Off Domestic Flight & Rail Pass',
        brand: 'MakeMyTrip / StudentUniverse',
        discount: '25% Flat Discount',
        gems_cost: 50,
        required_streak_days: 3,
        icon: '✈️',
        description: 'Save on university commutes, holiday flights, and high-speed rail journeys.',
        terms: 'Valid for 6 months on all domestic routes with student ID.'
      },
      {
        id: 'rew_travel_2',
        category: 'travel',
        category_label: '✈️ Travel & Commute',
        title: '$15 Uber / Ola Student Ride Voucher',
        brand: 'Uber Campus Rides',
        discount: '$15 Credit',
        gems_cost: 35,
        required_streak_days: 2,
        icon: '🚗',
        description: 'Direct ride credits applied to your campus commute or library sprint travel.',
        terms: 'Valid on all Premier and Go rides.'
      },
      {
        id: 'rew_movies_1',
        category: 'movies',
        category_label: '🎬 Cinema & Entertainment',
        title: 'Free IMAX 3D Weekend Movie Ticket',
        brand: 'AMC Theatres / PVR INOX',
        discount: '100% Free Ticket',
        gems_cost: 75,
        required_streak_days: 5,
        icon: '🍿',
        description: 'Unwind after rigorous focus milestones with a free IMAX 3D blockbuster experience.',
        terms: 'Valid for any standard or IMAX 3D showtime Friday through Sunday.'
      },
      {
        id: 'rew_movies_2',
        category: 'movies',
        category_label: '🎬 Cinema & Entertainment',
        title: '1-Month Spotify & Netflix Student Pass',
        brand: 'Spotify & Netflix Duo',
        discount: '1 Month Premium',
        gems_cost: 60,
        required_streak_days: 4,
        icon: '🎧',
        description: 'High-bitrate Lo-Fi study beats and weekend streaming without ad interruptions.',
        terms: 'Redeemable on new and existing student accounts.'
      },
      {
        id: 'rew_cafe_1',
        category: 'cafes',
        category_label: '☕ Cafes & Study Fuel',
        title: 'Free Starbucks Nitro Cold Brew / Latte',
        brand: 'Starbucks Coffee',
        discount: 'Free Beverage Voucher',
        gems_cost: 40,
        required_streak_days: 3,
        icon: '☕',
        description: 'Grab a handcrafted Grande beverage at any Starbucks outlet to power your next study sprint.',
        terms: 'Valid at all participating campus and city stores.'
      },
      {
        id: 'rew_cafe_2',
        category: 'cafes',
        category_label: '☕ Cafes & Study Fuel',
        title: '40% Off Artisanal Coffee & Bakery Combo',
        brand: 'Blue Tokai / Costa Coffee',
        discount: '40% Off Combo',
        gems_cost: 25,
        required_streak_days: 2,
        icon: '🥐',
        description: 'Perfect study fuel combo with freshly roasted single-origin pour-overs and pastries.',
        terms: 'No minimum order requirement.'
      },
      {
        id: 'rew_shop_1',
        category: 'shopping',
        category_label: '🛍️ Shopping & Tech Gear',
        title: '$20 Amazon Tech & Study Supplies Voucher',
        brand: 'Amazon Student',
        discount: '$20 Gift Balance',
        gems_cost: 80,
        required_streak_days: 6,
        icon: '📦',
        description: 'Direct gift card credit towards engineering textbooks, mechanical keyboards, and stationary.',
        terms: 'Applies instantly to Amazon balance upon promo code entry.'
      },
      {
        id: 'rew_shop_2',
        category: 'shopping',
        category_label: '🛍️ Shopping & Tech Gear',
        title: '35% Off ANC Noise-Cancelling Headphones',
        brand: 'Sony / Bose Education',
        discount: '35% Student Voucher',
        gems_cost: 95,
        required_streak_days: 7,
        icon: '🎧',
        description: 'Upgrade to industry-leading active noise cancellation for deep, distraction-free study immersion.',
        terms: 'Redeemable on Sony WH-1000XM5 and Bose QC series.'
      },
      {
        id: 'rew_ai_1',
        category: 'ai_perks',
        category_label: '🚀 AI & Academic Grants',
        title: '1-Month Gemini Advanced & Cloud Credits',
        brand: 'Google Cloud & DeepMind Education',
        discount: '100% Free Access',
        gems_cost: 70,
        required_streak_days: 5,
        icon: '⚡',
        description: 'Unlock 1M token context window, Gemini 1.5 Pro multimodal reasoning, and Colab GPU compute.',
        terms: 'Instantly credited to student Google account.'
      }
    ];
  },

  renderStore() {
    this.renderWalletHero();
    this.renderCategoryFilter();
    this.renderRewardsGrid();
    this.renderClaimedWallet();
  },

  renderWalletHero() {
    const user = FocusStorage.get(FocusStorage.KEYS.USER_PROFILE) || { gems: 85, streakDays: 6, xp: 1450 };
    const elGems = document.getElementById('rewards-hero-gems');
    const elStreak = document.getElementById('rewards-hero-streak');
    const elXP = document.getElementById('rewards-hero-xp');
    const elClaimedCount = document.getElementById('rewards-hero-claimed-count');

    if (elGems) elGems.textContent = `${user.gems || 0} 💎`;
    if (elStreak) elStreak.textContent = `${user.streakDays || 0} Days 🔥`;
    if (elXP) elXP.textContent = `${(user.xp || 0).toLocaleString()} XP`;
    if (elClaimedCount) elClaimedCount.textContent = `${this.claimedVouchers.length} Vouchers`;
  },

  setCategory(category) {
    this.state.activeCategory = category;
    document.querySelectorAll('.reward-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === category);
    });
    this.renderRewardsGrid();
  },

  renderCategoryFilter() {
    // Categories are hardcoded in HTML for fast interactivity, setup active class
    document.querySelectorAll('.reward-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === this.state.activeCategory);
    });
  },

  renderRewardsGrid() {
    const container = document.getElementById('rewards-catalog-grid');
    if (!container) return;

    const user = FocusStorage.get(FocusStorage.KEYS.USER_PROFILE) || { gems: 85, streakDays: 6 };
    let items = this.state.catalog;

    if (this.state.activeCategory !== 'all') {
      items = items.filter(r => r.category === this.state.activeCategory);
    }

    container.innerHTML = items.map(r => {
      const canAffordGems = (user.gems || 0) >= r.gems_cost;
      const meetsStreak = (user.streakDays || 0) >= r.required_streak_days;
      const canRedeem = canAffordGems && meetsStreak;

      return `
        <div class="reward-card ${canRedeem ? 'unlocked' : 'locked'}">
          <div class="reward-card-top">
            <div class="reward-icon-box">${r.icon}</div>
            <div class="reward-brand-info">
              <span class="reward-brand-tag">${r.brand}</span>
              <h4 class="reward-title">${r.title}</h4>
            </div>
          </div>

          <div class="reward-discount-banner">
            <span class="discount-badge">${r.discount}</span>
            <span class="category-pill">${r.category_label}</span>
          </div>

          <p class="reward-desc">${r.description}</p>

          <div class="reward-terms">
            <small>ℹ️ ${r.terms}</small>
          </div>

          <div class="reward-footer">
            <div class="reward-cost-requirements">
              <div class="cost-gem-item ${canAffordGems ? 'met' : 'unmet'}">
                <span>💎 <strong>${r.gems_cost} Gems</strong></span>
              </div>
              <div class="cost-streak-item ${meetsStreak ? 'met' : 'unmet'}">
                <span>🔥 <strong>${r.required_streak_days}d Streak</strong></span>
              </div>
            </div>

            <button class="btn btn-sm ${canRedeem ? 'btn-primary' : 'btn-secondary'}" 
              onclick="RewardsStore.redeemPerk('${r.id}')"
              ${canRedeem ? '' : 'disabled'}>
              ${canRedeem ? '🎁 Redeem Voucher' : (!canAffordGems ? 'Need More Gems' : 'Requires Higher Streak')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async redeemPerk(rewardId) {
    const user = FocusStorage.get(FocusStorage.KEYS.USER_PROFILE) || { gems: 85, streakDays: 6 };
    const reward = this.state.catalog.find(r => r.id === rewardId);
    if (!reward) return;

    if (user.gems < reward.gems_cost) {
      if (window.FocusEngine) window.FocusEngine.showToast(`Insufficient Gems! You need ${reward.gems_cost} 💎`, 'warning');
      return;
    }

    if (user.streakDays < reward.required_streak_days) {
      if (window.FocusEngine) window.FocusEngine.showToast(`Requires at least a ${reward.required_streak_days}-day focus streak!`, 'warning');
      return;
    }

    let promoCode = `FOCUS-${reward.category.substring(0,3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_id: rewardId,
          user_gems: user.gems,
          user_streak: user.streakDays
        })
      });

      if (res.ok) {
        const data = await res.json();
        promoCode = data.promo_code;
      }
    } catch (e) {
      console.warn('Backend redeem fallback:', e);
    }

    // Deduct gems
    FocusStorage.update(FocusStorage.KEYS.USER_PROFILE, (p) => {
      p.gems = Math.max(0, (p.gems || 0) - reward.gems_cost);
      return p;
    });

    const newClaim = {
      id: 'clm_' + Date.now(),
      reward_id: reward.id,
      title: reward.title,
      brand: reward.brand,
      discount: reward.discount,
      promo_code: promoCode,
      claimed_at: 'Just Now',
      expires_at: 'Valid for 30 Days',
      category: reward.category,
      icon: reward.icon
    };

    this.claimedVouchers.unshift(newClaim);
    FocusStorage.set(FocusStorage.KEYS.CLAIMED_REWARDS, this.claimedVouchers);

    if (window.FocusEngine) {
      window.FocusEngine.updateUserHUD();
      window.FocusEngine.showToast(`🎉 Redeemed ${reward.title}! Promo Code: ${promoCode}`, 'success');
    }

    if (window.AuthManager) {
      window.AuthManager.renderHeaderProfile();
    }

    this.renderStore();
    this.showVoucherModal(newClaim);
  },

  renderClaimedWallet() {
    const container = document.getElementById('claimed-vouchers-container');
    if (!container) return;

    if (this.claimedVouchers.length === 0) {
      container.innerHTML = `
        <div class="empty-wallet-box">
          <div style="font-size: 2rem;">🎟️</div>
          <p>No active vouchers claimed yet. Complete focus sprints and streaks to unlock perks!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.claimedVouchers.map(v => `
      <div class="claimed-voucher-card">
        <div class="voucher-top-row">
          <span class="v-icon">${v.icon}</span>
          <div class="v-info">
            <span class="v-brand">${v.brand}</span>
            <strong class="v-title">${v.title}</strong>
          </div>
          <span class="v-status-badge">ACTIVE</span>
        </div>

        <div class="voucher-code-strip">
          <span class="v-code-text">${v.promo_code}</span>
          <button class="btn-copy-code" onclick="RewardsStore.copyPromoCode('${v.promo_code}', this)">
            📋 Copy Code
          </button>
        </div>

        <div class="voucher-bottom-row">
          <span class="v-validity">⏳ ${v.expires_at}</span>
          <span class="v-discount">${v.discount}</span>
        </div>
      </div>
    `).join('');
  },

  copyPromoCode(code, btnElement) {
    navigator.clipboard.writeText(code).then(() => {
      if (btnElement) {
        const original = btnElement.innerHTML;
        btnElement.innerHTML = '✅ Copied!';
        setTimeout(() => btnElement.innerHTML = original, 2000);
      }
      if (window.FocusEngine) {
        window.FocusEngine.showToast(`Copied promo code: ${code} to clipboard!`, 'info');
      }
    });
  },

  showVoucherModal(voucher) {
    const modal = document.getElementById('voucher-claimed-modal');
    if (!modal) return;

    const brandEl = document.getElementById('modal-v-brand');
    const titleEl = document.getElementById('modal-v-title');
    const discountEl = document.getElementById('modal-v-discount');
    const codeEl = document.getElementById('modal-v-code');

    if (brandEl) brandEl.textContent = voucher.brand;
    if (titleEl) titleEl.textContent = voucher.title;
    if (discountEl) discountEl.textContent = voucher.discount;
    if (codeEl) codeEl.textContent = voucher.promo_code;

    App.openModal('voucher-claimed-modal');
  }
};

window.RewardsStore = RewardsStore;
