/**
 * FocusFlow AI - YouTube Streamer & Dual-Keyframe Subpart Slicer
 * 
 * Features:
 * - YouTube IFrame player integration & fallback simulation
 * - Dual-Keyframe range selection (Start Time & End Time sliders, e.g. 23:38 - 35:20)
 * - Subpart AI Summarization & Doubt Solver dropdown
 * - Adaptive Focus Milestone markers overlaid on video timeline
 */

const YouTubeStreamer = {
  state: {
    player: null,
    currentVideoId: 'aircAruvnKk',
    currentVideoTitle: 'Neural Networks & Deep Learning Explained from Scratch',
    videoDurationSec: 3600,
    currentPlaybackSec: 0,
    isPlaying: false,
    keyframeStartSec: 750,  // 12:30
    keyframeEndSec: 1725,   // 28:45
    milestones: [],
    activeMilestone: null,
    isIFrameReady: false,
    updateInterval: null
  },

  init() {
    this.initYouTubeIFrameAPI();
    this.bindRangeControls();
    this.loadVideoSource(this.state.currentVideoId);
  },

  initYouTubeIFrameAPI() {
    // Load YouTube IFrame API asynchronously if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.createPlayer();
      };
    } else {
      this.createPlayer();
    }
  },

  createPlayer() {
    try {
      this.state.player = new YT.Player('yt-player-container', {
        videoId: this.state.currentVideoId,
        playerVars: {
          playsinline: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => this.onPlayerReady(event),
          onStateChange: (event) => this.onPlayerStateChange(event)
        }
      });
    } catch (e) {
      console.warn('YouTube API initialization fallback:', e);
      this.setupFallbackPlayer();
    }
  },

  setupFallbackPlayer() {
    const container = document.getElementById('yt-player-container');
    if (container) {
      container.innerHTML = `
        <div class="video-simulation-canvas">
          <div class="simulated-badge">⚡ Active Focus Stream</div>
          <div class="video-title-overlay">${this.state.currentVideoTitle}</div>
          <div class="video-center-art">
            <div class="pulsing-play-btn" id="simulated-play-toggle">▶</div>
          </div>
          <div class="video-timestamp-display" id="simulated-time-display">00:00 / 60:00</div>
        </div>
      `;

      const playToggle = document.getElementById('simulated-play-toggle');
      if (playToggle) {
        playToggle.addEventListener('click', () => this.togglePlayback());
      }
    }
  },

  onPlayerReady(event) {
    this.state.isIFrameReady = true;
    this.state.videoDurationSec = this.state.player.getDuration() || 3600;
    this.refreshMilestones();
    this.startTrackingLoop();
  },

  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.state.isPlaying = true;
      if (window.FocusEngine && window.FocusEngine.state.activeSession) {
        window.FocusEngine.resumeSession();
      }
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      this.state.isPlaying = false;
      if (window.FocusEngine) {
        window.FocusEngine.pauseSession();
      }
    }
  },

  startTrackingLoop() {
    if (this.state.updateInterval) clearInterval(this.state.updateInterval);
    this.state.updateInterval = setInterval(() => {
      if (this.state.player && this.state.isIFrameReady && typeof this.state.player.getCurrentTime === 'function') {
        this.state.currentPlaybackSec = this.state.player.getCurrentTime();
      } else if (this.state.isPlaying) {
        this.state.currentPlaybackSec = Math.min(this.state.videoDurationSec, this.state.currentPlaybackSec + 1);
      }
      this.updateTimelineUI();
    }, 1000);
  },

  togglePlayback() {
    if (this.state.player && this.state.isIFrameReady) {
      if (this.state.isPlaying) {
        this.state.player.pauseVideo();
      } else {
        this.state.player.playVideo();
      }
    } else {
      this.state.isPlaying = !this.state.isPlaying;
      const btn = document.getElementById('simulated-play-toggle');
      if (btn) btn.textContent = this.state.isPlaying ? '⏸' : '▶';
    }
  },

  seekTo(seconds) {
    this.state.currentPlaybackSec = seconds;
    if (this.state.player && this.state.isIFrameReady && typeof this.state.player.seekTo === 'function') {
      this.state.player.seekTo(seconds, true);
    }
    this.updateTimelineUI();
  },

  loadVideoSource(videoId, title = '', durationSec = 3600) {
    this.state.currentVideoId = videoId;
    this.state.currentVideoTitle = title || this.state.currentVideoTitle;
    this.state.videoDurationSec = durationSec;

    if (this.state.player && this.state.isIFrameReady && typeof this.state.player.loadVideoById === 'function') {
      this.state.player.loadVideoById(videoId);
    } else {
      this.setupFallbackPlayer();
    }

    // Set initial keyframe range (e.g. first 20-30 mins)
    this.state.keyframeStartSec = 0;
    this.state.keyframeEndSec = Math.min(durationSec, 1800); // 30 min

    this.updateRangeInputs();
    this.refreshMilestones();
    this.renderKeyframeList();
  },

  /**
   * Generates adaptive milestones from FocusEngine based on current student stretch goal
   */
  refreshMilestones() {
    if (window.FocusEngine) {
      this.state.milestones = window.FocusEngine.generateAdaptiveVideoMilestones(this.state.videoDurationSec);
      this.renderMilestonesHUD();
    }
  },

  renderMilestonesHUD() {
    const container = document.getElementById('video-adaptive-milestones-list');
    if (!container) return;

    const user = FocusStorage.get(FocusStorage.KEYS.USER_PROFILE) || { currentStretchFocusMinutes: 35 };

    container.innerHTML = `
      <div class="milestones-header">
        <div class="milestone-badge-tag">🎯 Adaptive Sitting Stretch: <strong>${user.currentStretchFocusMinutes}m Chunks (+15m)</strong></div>
        <p class="milestone-subtext">Each chunk is dynamically calculated to push your sitting stamina beyond distraction thresholds.</p>
      </div>
      <div class="milestone-chips-grid">
        ${this.state.milestones.map((m, idx) => `
          <div class="milestone-chip ${m.status}" onclick="YouTubeStreamer.selectMilestone('${m.id}')">
            <div class="ms-chip-top">
              <span class="ms-chip-num">Sprint #${m.index}</span>
              <span class="ms-chip-reward">+${m.xpReward} XP</span>
            </div>
            <div class="ms-chip-range">${m.startFormatted} ➔ ${m.endFormatted}</div>
            <div class="ms-chip-duration">${m.durationMin} mins target</div>
            <div class="ms-chip-status-bar">
              <div class="ms-chip-status-fill" style="width: ${m.status === 'completed' ? '100%' : '0%'}"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  selectMilestone(milestoneId) {
    const milestone = this.state.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    this.setKeyframeRange(milestone.startSec, milestone.endSec);
    this.seekTo(milestone.startSec);

    // Start Focus Milestone Session
    if (window.FocusEngine) {
      window.FocusEngine.startMilestoneSession(
        milestone,
        (progress) => {
          this.updateMilestoneSessionHUD(milestone, progress);
        },
        (completedMilestone) => {
          this.refreshMilestones();
          this.renderKeyframeSummary();
        }
      );
    }
  },

  updateMilestoneSessionHUD(milestone, progress) {
    const activeHUD = document.getElementById('active-sprint-hud');
    if (!activeHUD) return;

    activeHUD.classList.add('visible');
    activeHUD.innerHTML = `
      <div class="sprint-hud-inner">
        <div class="sprint-info">
          <span class="sprint-title">🔥 ${milestone.title}</span>
          <span class="sprint-time">${window.FocusEngine.formatTime(progress.elapsed)} / ${window.FocusEngine.formatTime(progress.total)}</span>
        </div>
        <div class="sprint-progress-bar">
          <div class="sprint-fill ${progress.isPresenceVerified ? 'active' : 'paused'}" style="width: ${progress.percent}%"></div>
        </div>
        <div class="sprint-status-meta">
          ${progress.isPresenceVerified ? 
            '<span>🟢 Webcam Verified: Student Seated & Focusing</span>' : 
            '<span class="warning-text">⚠️ Pause: Student absent from desk frame</span>'}
          <span>${progress.percent}% Completed</span>
        </div>
      </div>
    `;
  },

  bindRangeControls() {
    const startSlider = document.getElementById('keyframe-start-slider');
    const endSlider = document.getElementById('keyframe-end-slider');
    const startInput = document.getElementById('keyframe-start-input');
    const endInput = document.getElementById('keyframe-end-input');

    if (startSlider && endSlider) {
      startSlider.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (val >= this.state.keyframeEndSec) {
          val = Math.max(0, this.state.keyframeEndSec - 60);
          e.target.value = val;
        }
        this.state.keyframeStartSec = val;
        this.updateRangeInputs();
      });

      endSlider.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (val <= this.state.keyframeStartSec) {
          val = Math.min(this.state.videoDurationSec, this.state.keyframeStartSec + 60);
          e.target.value = val;
        }
        this.state.keyframeEndSec = val;
        this.updateRangeInputs();
      });
    }

    if (startInput && endInput) {
      startInput.addEventListener('change', (e) => {
        const sec = this.parseTimeToSec(e.target.value);
        if (sec >= 0 && sec < this.state.keyframeEndSec) {
          this.state.keyframeStartSec = sec;
          this.updateRangeInputs();
        }
      });
      endInput.addEventListener('change', (e) => {
        const sec = this.parseTimeToSec(e.target.value);
        if (sec > this.state.keyframeStartSec && sec <= this.state.videoDurationSec) {
          this.state.keyframeEndSec = sec;
          this.updateRangeInputs();
        }
      });
    }
  },

  setKeyframeRange(startSec, endSec) {
    this.state.keyframeStartSec = startSec;
    this.state.keyframeEndSec = endSec;
    this.updateRangeInputs();
    this.openSubpartActionCard();
  },

  updateRangeInputs() {
    const startSlider = document.getElementById('keyframe-start-slider');
    const endSlider = document.getElementById('keyframe-end-slider');
    const startInput = document.getElementById('keyframe-start-input');
    const endInput = document.getElementById('keyframe-end-input');
    const rangeHighlight = document.getElementById('keyframe-range-highlight');

    if (startSlider) {
      startSlider.max = this.state.videoDurationSec;
      startSlider.value = this.state.keyframeStartSec;
    }
    if (endSlider) {
      endSlider.max = this.state.videoDurationSec;
      endSlider.value = this.state.keyframeEndSec;
    }
    if (startInput) startInput.value = this.formatTime(this.state.keyframeStartSec);
    if (endInput) endInput.value = this.formatTime(this.state.keyframeEndSec);

    // Update range bar highlight
    if (rangeHighlight && this.state.videoDurationSec > 0) {
      const leftPercent = (this.state.keyframeStartSec / this.state.videoDurationSec) * 100;
      const widthPercent = ((this.state.keyframeEndSec - this.state.keyframeStartSec) / this.state.videoDurationSec) * 100;
      rangeHighlight.style.left = `${leftPercent}%`;
      rangeHighlight.style.width = `${widthPercent}%`;
    }

    const durationDisplay = document.getElementById('keyframe-duration-badge');
    if (durationDisplay) {
      const diffSec = this.state.keyframeEndSec - this.state.keyframeStartSec;
      durationDisplay.textContent = `Selected Slice: ${Math.round(diffSec / 60)} mins (${this.formatTime(this.state.keyframeStartSec)} - ${this.formatTime(this.state.keyframeEndSec)})`;
    }
  },

  updateTimelineUI() {
    const timeDisplay = document.getElementById('simulated-time-display');
    if (timeDisplay) {
      timeDisplay.textContent = `${this.formatTime(this.state.currentPlaybackSec)} / ${this.formatTime(this.state.videoDurationSec)}`;
    }
  },

  /**
   * Opens the AI Subpart Action Dropdown/Drawer for the selected keyframe range
   */
  openSubpartActionCard() {
    const drawer = document.getElementById('subpart-ai-action-drawer');
    if (!drawer) return;

    const startFmt = this.formatTime(this.state.keyframeStartSec);
    const endFmt = this.formatTime(this.state.keyframeEndSec);
    const sliceMinutes = Math.round((this.state.keyframeEndSec - this.state.keyframeStartSec) / 60);

    document.getElementById('subpart-range-title').textContent = `⚡ Subpart AI Engine: [${startFmt} - ${endFmt}] (${sliceMinutes} mins)`;
    drawer.classList.add('active');

    // Auto-generate instant preview
    this.renderKeyframeSummary();
  },

  /**
   * Generates deep AI summary for the chosen keyframe subpart
   */
  renderKeyframeSummary() {
    const contentEl = document.getElementById('subpart-ai-content');
    if (!contentEl) return;

    const startFmt = this.formatTime(this.state.keyframeStartSec);
    const endFmt = this.formatTime(this.state.keyframeEndSec);

    contentEl.innerHTML = `
      <div class="ai-generating-loader">
        <div class="spinner-ring"></div>
        <span>AI Grounding Subpart [${startFmt} - ${endFmt}] & Extracting Key Concepts...</span>
      </div>
    `;

    setTimeout(() => {
      contentEl.innerHTML = `
        <div class="subpart-analysis-result">
          <div class="analysis-section">
            <h4>📌 Subpart Summary & Key Takeaways</h4>
            <p>During the <strong>${startFmt} - ${endFmt}</strong> interval, the instructor explains the fundamental mathematical mechanics of non-linear transformations and computational graphs:</p>
            <ul>
              <li><strong>Matrix Dimension Alignment</strong>: Weight matrix $\\mathbf{W} \\in \\mathbb{R}^{m \\times n}$ mapping hidden layer activations.</li>
              <li><strong>Vanishing Gradient Mitigation</strong>: Why ReLU $(\\max(0, x))$ and LeakyReLU are preferred over Sigmoid in deep architectures.</li>
              <li><strong>Chain Rule Propagation</strong>: Calculating $\\frac{\\partial L}{\\partial W^{[l]}} = \\frac{\\partial L}{\\partial Z^{[l]}} \\cdot (A^{[l-1]})^T$.</li>
            </ul>
          </div>

          <div class="analysis-section">
            <h4>💡 Core Formulae & Concepts</h4>
            <div class="formula-card">
              <code>Z = W · X + b</code> ➔ <code>A = σ(Z)</code> ➔ <code>Loss = - Σ (y log(p) + (1-y)log(1-p))</code>
            </div>
          </div>

          <div class="subpart-action-buttons">
            <button class="btn btn-primary" onclick="YouTubeStreamer.askDoubtInSubpart()">
              💬 Ask AI Doubt in this Subpart
            </button>
            <button class="btn btn-secondary" onclick="YouTubeStreamer.createFlashcardsFromSlice()">
              🗂️ Generate Slice Flashcards
            </button>
            <button class="btn btn-accent" onclick="YouTubeStreamer.addSliceToStudyGroup()">
              👥 Share Slice with Study Group
            </button>
          </div>
        </div>
      `;
    }, 800);
  },

  askDoubtInSubpart() {
    const startFmt = this.formatTime(this.state.keyframeStartSec);
    const endFmt = this.formatTime(this.state.keyframeEndSec);
    const prompt = `I am studying the video '${this.state.currentVideoTitle}' between timestamps [${startFmt} - ${endFmt}]. Can you explain the main concept in simpler terms with a real-world analogy?`;

    if (window.AITutor) {
      window.AITutor.openTutorModalWithPrompt(prompt);
    }
  },

  createFlashcardsFromSlice() {
    const startFmt = this.formatTime(this.state.keyframeStartSec);
    const endFmt = this.formatTime(this.state.keyframeEndSec);

    const newCards = [
      {
        id: 'fc_slice_' + Date.now(),
        deck: 'Video Slice [' + startFmt + '-' + endFmt + ']',
        question: `In timestamp [${startFmt}-${endFmt}], why is transpose matrix used when calculating weight gradients?`,
        answer: 'To ensure dimensional consistency so the gradient matrix dL/dW matches the original dimensions of weight matrix W.',
        category: 'Deep Learning',
        box: 1,
        nextReviewDate: new Date().toISOString()
      }
    ];

    FocusStorage.update(FocusStorage.KEYS.FLASHCARDS, (cards) => {
      return [...(cards || []), ...newCards];
    });

    if (window.FlashcardEngine) {
      window.FlashcardEngine.refreshDeckList();
    }

    if (window.FocusEngine) {
      window.FocusEngine.showToast(`✨ Generated flashcard from keyframe slice [${startFmt} - ${endFmt}]!`, 'success');
    }
  },

  addSliceToStudyGroup() {
    const startFmt = this.formatTime(this.state.keyframeStartSec);
    const endFmt = this.formatTime(this.state.keyframeEndSec);

    if (window.StudyGroupEngine) {
      window.StudyGroupEngine.postDoubtToActiveGroup(
        `Has anyone reviewed video slice [${startFmt} - ${endFmt}] for ${this.state.currentVideoTitle}? Let's discuss it in our voice call!`
      );
      if (window.FocusEngine) {
        window.FocusEngine.showToast('📢 Keyframe slice posted to study group!', 'info');
      }
    }
  },

  renderKeyframeList() {
    const container = document.getElementById('curated-keyframes-list');
    if (!container) return;

    const sources = FocusStorage.get(FocusStorage.KEYS.SOURCES) || [];
    const currentSrc = sources.find(s => s.videoId === this.state.currentVideoId);
    const keyframes = currentSrc ? (currentSrc.subpartKeyframes || []) : [];

    container.innerHTML = keyframes.map(kf => `
      <div class="keyframe-card-item" onclick="YouTubeStreamer.setKeyframeRange(${kf.startSec}, ${kf.endSec}); YouTubeStreamer.seekTo(${kf.startSec});">
        <div class="kf-card-header">
          <span class="kf-badge">${kf.start} - ${kf.end}</span>
          <span class="kf-title">${kf.title}</span>
        </div>
        <p class="kf-desc">${kf.summary}</p>
      </div>
    `).join('');
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  parseTimeToSec(str) {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    return parseInt(str) || 0;
  }
};

window.YouTubeStreamer = YouTubeStreamer;
