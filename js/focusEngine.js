/**
 * FocusFlow AI - Adaptive Focus Stretch Engine
 * 
 * Main Objective: Overcome short-form attention degradation by progressively stretching
 * student sitting focus endurance (+15 to +30 min stretch increments), managing rewards,
 * streak streaks, and focus milestone verification.
 */

const FocusEngine = {
  state: {
    activeSession: null,
    isTimerRunning: false,
    sessionElapsedSeconds: 0,
    currentMilestoneTargetSeconds: 0,
    currentMilestoneIndex: 0,
    isPresenceVerified: true,
    slackingPenaltyTimer: null,
    unverifiedSeconds: 0,
    sessionXPEarned: 0,
    onboardingOpen: false
  },

  init() {
    this.checkSurveyStatus();
    this.updateUserHUD();
  },

  checkSurveyStatus() {
    const survey = FocusStorage.get(FocusStorage.KEYS.FOCUS_SURVEY);
    if (!survey || !survey.completed) {
      this.openSurveyModal();
    }
  },

  openSurveyModal() {
    const modal = document.getElementById('survey-modal');
    if (modal) {
      modal.classList.add('active');
      this.state.onboardingOpen = true;
    }
  },

  closeSurveyModal() {
    const modal = document.getElementById('survey-modal');
    if (modal) {
      modal.classList.remove('active');
      this.state.onboardingOpen = false;
    }
  },

  /**
   * Submits the student baseline onboarding survey
   * Calculates personalized focus stretch and sitting capacity
   */
  submitSurvey(formData) {
    const baseline = parseInt(formData.baselineMinutes) || 20;
    // Core Formula: Add +15 to +30 minutes beyond baseline to systematically build sitting stamina
    const stretchTarget = baseline + Math.min(30, Math.max(15, Math.round(baseline * 0.75)));

    const surveyData = {
      completed: true,
      baselineFocusMinutes: baseline,
      stretchFocusMinutes: stretchTarget,
      distractionTriggers: formData.distractions || [],
      primaryDomain: formData.primaryDomain || 'Computer Science & AI',
      dailyGoalMinutes: parseInt(formData.dailyGoalMinutes) || 90,
      sittingEnduranceGoal: parseInt(formData.sittingEnduranceGoal) || 60,
      timestamp: new Date().toISOString()
    };

    FocusStorage.set(FocusStorage.KEYS.FOCUS_SURVEY, surveyData);

    // Update User Profile with new baseline & stretch parameters
    FocusStorage.update(FocusStorage.KEYS.USER_PROFILE, (profile) => {
      profile.baselineFocusMinutes = baseline;
      profile.currentStretchFocusMinutes = stretchTarget;
      profile.targetDailyFocusMinutes = surveyData.dailyGoalMinutes;
      profile.enduranceLevel = this.calculateEnduranceTier(baseline);
      return profile;
    });

    this.closeSurveyModal();
    this.updateUserHUD();
    this.showToast(`🎯 Focus Protocol Configured! Your adaptive sitting target is set to ${stretchTarget} mins.`, 'success');
  },

  calculateEnduranceTier(minutes) {
    if (minutes < 20) return '🌱 Focus Apprentice (15-20m)';
    if (minutes < 35) return '⚡ Flow Builder (25-35m)';
    if (minutes < 55) return '🔥 Deep Diver (40-55m)';
    if (minutes < 80) return '🚀 Marathon Scholar (60-80m)';
    return '👑 Grandmaster Focus (90m+)';
  },

  /**
   * Generates dynamic adaptive video keyframe chunks based on student's current stretch sitting capacity
   * E.g. A 60-min or 120-min video is broken into customized chunks (+15 to +30 min beyond baseline)
   */
  generateAdaptiveVideoMilestones(videoDurationSeconds) {
    const user = FocusStorage.get(FocusStorage.KEYS.USER_PROFILE) || { currentStretchFocusMinutes: 35 };
    const chunkSeconds = Math.max(900, user.currentStretchFocusMinutes * 60); // e.g. 35 mins = 2100s

    const milestones = [];
    let currentStart = 0;
    let index = 1;

    while (currentStart < videoDurationSeconds) {
      const currentEnd = Math.min(videoDurationSeconds, currentStart + chunkSeconds);
      const startFormatted = this.formatTime(currentStart);
      const endFormatted = this.formatTime(currentEnd);
      const durationMin = Math.round((currentEnd - currentStart) / 60);

      milestones.push({
        id: `ms_${index}`,
        index: index,
        title: `Focus Sprint #${index} (${durationMin} min chunk)`,
        startSec: currentStart,
        endSec: currentEnd,
        startFormatted: startFormatted,
        endFormatted: endFormatted,
        durationMin: durationMin,
        xpReward: durationMin * 20,
        gemReward: Math.ceil(durationMin / 10),
        status: 'pending', // 'pending' | 'active' | 'completed' | 'failed'
        verifiedSittingSeconds: 0
      });

      currentStart = currentEnd;
      index++;
    }

    return milestones;
  },

  /**
   * Start a focus learning session for a video milestone
   */
  startMilestoneSession(milestone, onTickCallback, onCompleteCallback) {
    if (this.state.isTimerRunning) {
      this.pauseSession();
    }

    this.state.activeSession = {
      milestone: milestone,
      totalRequiredSeconds: (milestone.endSec - milestone.startSec),
      elapsedVerifiedSeconds: 0,
      startTime: Date.now(),
      onTick: onTickCallback,
      onComplete: onCompleteCallback
    };

    this.state.isTimerRunning = true;
    this.state.isPresenceVerified = true;

    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => this.tick(), 1000);

    this.showToast(`⏱️ Focus Sprint Started: ${milestone.title}. Keep in camera frame!`, 'info');
  },

  /**
   * Called every 1 second during active video/study session
   */
  tick() {
    if (!this.state.isTimerRunning || !this.state.activeSession) return;

    // Check presence status reported by Webcam Proctor
    if (this.state.isPresenceVerified) {
      this.state.activeSession.elapsedVerifiedSeconds++;
      this.state.sessionXPEarned += 0.33; // ~20 XP per minute

      // Notify caller
      if (this.state.activeSession.onTick) {
        this.state.activeSession.onTick({
          elapsed: this.state.activeSession.elapsedVerifiedSeconds,
          total: this.state.activeSession.totalRequiredSeconds,
          percent: Math.min(100, Math.round((this.state.activeSession.elapsedVerifiedSeconds / this.state.activeSession.totalRequiredSeconds) * 100)),
          isPresenceVerified: true
        });
      }

      // Check for milestone completion
      if (this.state.activeSession.elapsedVerifiedSeconds >= this.state.activeSession.totalRequiredSeconds) {
        this.completeMilestone();
      }
    } else {
      // Student stood up, walked away, or switched tab
      this.state.unverifiedSeconds++;
      if (this.state.activeSession.onTick) {
        this.state.activeSession.onTick({
          elapsed: this.state.activeSession.elapsedVerifiedSeconds,
          total: this.state.activeSession.totalRequiredSeconds,
          percent: Math.min(100, Math.round((this.state.activeSession.elapsedVerifiedSeconds / this.state.activeSession.totalRequiredSeconds) * 100)),
          isPresenceVerified: false,
          warning: 'Student not detected at desk. Timer paused.'
        });
      }
    }
  },

  setPresenceStatus(isPresent) {
    this.state.isPresenceVerified = isPresent;
    const hudBadge = document.getElementById('webcam-presence-indicator');
    if (hudBadge) {
      if (isPresent) {
        hudBadge.className = 'presence-badge status-present';
        hudBadge.innerHTML = '<span class="pulse-dot green"></span> In Seat & Focusing';
      } else {
        hudBadge.className = 'presence-badge status-absent';
        hudBadge.innerHTML = '<span class="pulse-dot red"></span> Empty Seat / Looking Away (Paused)';
      }
    }
  },

  pauseSession() {
    this.state.isTimerRunning = false;
    if (this._timerInterval) clearInterval(this._timerInterval);
  },

  resumeSession() {
    if (this.state.activeSession) {
      this.state.isTimerRunning = true;
      if (this._timerInterval) clearInterval(this._timerInterval);
      this._timerInterval = setInterval(() => this.tick(), 1000);
    }
  },

  /**
   * Reward user upon verified milestone completion
   */
  completeMilestone() {
    this.pauseSession();
    const milestone = this.state.activeSession.milestone;
    milestone.status = 'completed';

    const xp = milestone.xpReward || 500;
    const gems = milestone.gemReward || 5;

    // Grant rewards
    FocusStorage.update(FocusStorage.KEYS.USER_PROFILE, (profile) => {
      profile.xp += xp;
      profile.gems += gems;
      // Level calculation: Every 1000 XP
      const newLevel = Math.floor(profile.xp / 1000) + 1;
      profile.level = newLevel;
      return profile;
    });

    // Record daily stats
    const today = new Date().toISOString().split('T')[0];
    FocusStorage.update(FocusStorage.KEYS.DAILY_STATS, (stats) => {
      if (!stats) stats = {};
      if (!stats[today]) {
        stats[today] = {
          date: today,
          sittingFocusMinutes: 0,
          verifiedWebcamMinutes: 0,
          slackingPausedMinutes: 0,
          completedMilestones: 0,
          xpEarned: 0,
          antiCheatIntegrity: 100
        };
      }
      stats[today].sittingFocusMinutes += Math.round(milestone.durationMin);
      stats[today].verifiedWebcamMinutes += Math.round(milestone.durationMin);
      stats[today].completedMilestones += 1;
      stats[today].xpEarned += xp;
      return stats;
    });

    this.updateUserHUD();

    if (this.state.activeSession.onComplete) {
      this.state.activeSession.onComplete(milestone);
    }

    this.showRewardModal(milestone, xp, gems);
  },

  showRewardModal(milestone, xp, gems) {
    const modal = document.getElementById('reward-modal');
    if (modal) {
      document.getElementById('reward-xp-text').textContent = `+${xp} XP`;
      document.getElementById('reward-gems-text').textContent = `+${gems} Gems`;
      document.getElementById('reward-title-text').textContent = `🎉 Sprint Completed: ${milestone.title}`;
      modal.classList.add('active');
    }
  },

  updateUserHUD() {
    const profile = FocusStorage.get(FocusStorage.KEYS.USER_PROFILE);
    if (!profile) return;

    const streakEl = document.getElementById('hud-streak-count');
    const xpEl = document.getElementById('hud-xp-count');
    const gemsEl = document.getElementById('hud-gems-count');
    const levelEl = document.getElementById('hud-level-badge');
    const sittingTargetEl = document.getElementById('hud-sitting-target');

    if (streakEl) streakEl.textContent = `${profile.streakDays}d Streak 🔥`;
    if (xpEl) xpEl.textContent = `${profile.xp.toLocaleString()} XP`;
    if (gemsEl) gemsEl.textContent = `${profile.gems} 💎`;
    if (levelEl) levelEl.textContent = `Lvl ${profile.level}`;
    if (sittingTargetEl) sittingTargetEl.textContent = `Stretch Goal: ${profile.currentStretchFocusMinutes}m (+15m)`;
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
};

window.FocusEngine = FocusEngine;
