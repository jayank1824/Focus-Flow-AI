/**
 * FocusFlow AI - Webcam Focus Proctor & Anti-Slacking Guardian
 * 
 * Tracks real-time student presence at desk using WebRTC + Canvas facial & movement analysis.
 * Pauses video and revokes focus XP when student walks away or stands up.
 * Supports proctored exam snapshots and tab-switch audit trails.
 */

const WebcamProctor = {
  state: {
    stream: null,
    videoEl: null,
    canvasEl: null,
    ctx: null,
    isActive: false,
    isStudentPresent: true,
    absentDurationSeconds: 0,
    maxAllowedAwaySeconds: 6,
    tabSwitchesCount: 0,
    snapshots: [],
    analysisInterval: null,
    snapshotInterval: null,
    lastFrameData: null,
    simulatedMode: false,
    proctorAuditLog: []
  },

  init() {
    this.videoEl = document.getElementById('webcam-video-feed');
    this.canvasEl = document.getElementById('webcam-analysis-canvas');
    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext('2d', { willReadFrequently: true });
    }

    // Monitor tab switching / visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleTabSwitchViolation();
      }
    });

    window.addEventListener('blur', () => {
      this.handleWindowBlur();
    });
  },

  /**
   * Starts camera capture and real-time posture/presence detection
   */
  async startWebcam(onPresenceChangeCallback) {
    this.onPresenceChange = onPresenceChangeCallback;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false
        });
        this.state.stream = stream;
        if (this.videoEl) {
          this.videoEl.srcObject = stream;
          await this.videoEl.play();
        }
        this.state.isActive = true;
        this.state.simulatedMode = false;
        this.logAudit('Webcam initialized successfully. Live presence guardian active.');
      } else {
        throw new Error('Camera not supported by browser.');
      }
    } catch (err) {
      console.warn('Camera access unavailable or denied. Starting in Interactive Simulation Mode:', err.message);
      this.state.simulatedMode = true;
      this.state.isActive = true;
      this.logAudit('Running in Simulated Presence Guardian mode.');
    }

    this.startPresenceLoop();
    this.startPeriodicSnapshots();
    this.updateStatusBadge(true);
  },

  stopWebcam() {
    this.state.isActive = false;
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
      this.state.stream = null;
    }
    if (this.state.analysisInterval) clearInterval(this.state.analysisInterval);
    if (this.state.snapshotInterval) clearInterval(this.state.snapshotInterval);
    this.updateStatusBadge(false);
  },

  startPresenceLoop() {
    if (this.state.analysisInterval) clearInterval(this.state.analysisInterval);
    this.state.analysisInterval = setInterval(() => {
      this.analyzeCurrentFrame();
    }, 1200);
  },

  /**
   * Analyzes camera frame to verify human face/presence in front of the screen
   */
  analyzeCurrentFrame() {
    if (!this.state.isActive) return;

    let isPresent = true;

    if (!this.state.simulatedMode && this.videoEl && this.ctx && this.videoEl.readyState >= 2) {
      const w = this.canvasEl.width || 160;
      const h = this.canvasEl.height || 120;
      this.ctx.drawImage(this.videoEl, 0, 0, w, h);

      const frame = this.ctx.getImageData(0, 0, w, h);
      const pixels = frame.data;

      let skinOrFacialPixels = 0;
      let totalLuminance = 0;

      // Sample pixels for skin tone & brightness distribution in center viewport
      for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;

        // Approximate human facial skin/contour color range in RGB
        if (r > 60 && g > 40 && b > 20 && r > g && (r - b) > 15 && Math.abs(r - g) > 15) {
          skinOrFacialPixels++;
        }
      }

      const avgLum = totalLuminance / (pixels.length / 16);
      const faceCoverageRatio = skinOrFacialPixels / (pixels.length / 16);

      // If camera is pitched black (empty/covered) or 0 face pixels detected
      if (avgLum < 15 || faceCoverageRatio < 0.04) {
        isPresent = false;
      }
    } else if (this.state.simulatedMode) {
      // In simulation mode, maintains current simulated presence state
      isPresent = this.state.isStudentPresent;
    }

    if (isPresent) {
      this.state.absentDurationSeconds = 0;
      if (!this.state.isStudentPresent) {
        this.state.isStudentPresent = true;
        this.logAudit('Student returned to desk. Focus session resumed.');
        this.triggerPresenceEvent(true);
      }
    } else {
      this.state.absentDurationSeconds += 1.2;
      if (this.state.absentDurationSeconds >= this.state.maxAllowedAwaySeconds) {
        if (this.state.isStudentPresent) {
          this.state.isStudentPresent = false;
          this.logAudit('⚠️ Student Stood Up / Left Desk for >6s. Anti-Slacking paused video & rewards.');
          this.triggerPresenceEvent(false);
        }
      }
    }
  },

  triggerPresenceEvent(isPresent) {
    if (window.FocusEngine) {
      window.FocusEngine.setPresenceStatus(isPresent);
    }
    if (this.onPresenceChange) {
      this.onPresenceChange(isPresent);
    }
    this.renderProctorAlertOverlay(!isPresent);
  },

  renderProctorAlertOverlay(showAlert) {
    const overlay = document.getElementById('slacking-warning-overlay');
    if (overlay) {
      if (showAlert) {
        overlay.classList.add('visible');
        this.playWarningBeep();
      } else {
        overlay.classList.remove('visible');
      }
    }
  },

  playWarningBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz alert tone
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted
    }
  },

  /**
   * Periodic snapshot for anti-cheat validation and study timeline audit
   */
  startPeriodicSnapshots() {
    if (this.state.snapshotInterval) clearInterval(this.state.snapshotInterval);
    // Take a snapshot every 30 seconds
    this.state.snapshotInterval = setInterval(() => {
      this.captureSnapshot();
    }, 30000);
    // Take initial snapshot
    setTimeout(() => this.captureSnapshot(), 2000);
  },

  captureSnapshot(tag = 'Routine Focus Check') {
    let dataUrl = '';
    if (!this.state.simulatedMode && this.canvasEl) {
      dataUrl = this.canvasEl.toDataURL('image/jpeg', 0.6);
    } else {
      // Generate synthetic visual avatar snapshot in simulation mode
      dataUrl = this.createSimulatedSnapshotCanvas();
    }

    const snapshot = {
      id: 'snap_' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      tag: tag,
      status: this.state.isStudentPresent ? 'Verified Present' : 'Absence Flagged',
      dataUrl: dataUrl
    };

    this.state.snapshots.unshift(snapshot);
    if (this.state.snapshots.length > 8) this.state.snapshots.pop();

    this.renderSnapshotsGallery();
    return snapshot;
  },

  createSimulatedSnapshotCanvas() {
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 120;
    const ctx = c.getContext('2d');
    // Dark cyber gradient
    const grad = ctx.createLinearGradient(0, 0, 160, 120);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 160, 120);

    // Draw avatar silhouette or indicator
    ctx.fillStyle = this.state.isStudentPresent ? '#00f5a0' : '#ff4b72';
    ctx.beginPath();
    ctx.arc(80, 50, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.state.isStudentPresent ? '#38bdf8' : '#fb7185';
    ctx.beginPath();
    ctx.arc(80, 110, 40, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(this.state.isStudentPresent ? 'Focusing' : 'Empty Desk', 50, 114);

    return c.toDataURL('image/jpeg', 0.6);
  },

  renderSnapshotsGallery() {
    const gallery = document.getElementById('proctor-snapshots-container');
    if (!gallery) return;

    gallery.innerHTML = this.state.snapshots.map(s => `
      <div class="snapshot-card ${s.status === 'Verified Present' ? 'valid' : 'invalid'}">
        <img src="${s.dataUrl}" alt="Proctor Snapshot" />
        <div class="snapshot-meta">
          <span class="snap-time">${s.timestamp}</span>
          <span class="snap-tag">${s.tag}</span>
        </div>
      </div>
    `).join('');
  },

  handleTabSwitchViolation() {
    this.state.tabSwitchesCount++;
    this.logAudit(`⚠️ Tab switch detected! (Violation #${this.state.tabSwitchesCount}). Focus paused.`);
    this.captureSnapshot('Tab Switch Violation');
    if (window.FocusEngine) {
      window.FocusEngine.showToast('⚠️ Focus Violation: Tab switched away from study video!', 'warning');
    }
  },

  handleWindowBlur() {
    this.logAudit('Focus altered: Application window lost primary focus.');
  },

  toggleSimulatedPresence(forcePresent) {
    this.state.isStudentPresent = forcePresent !== undefined ? forcePresent : !this.state.isStudentPresent;
    this.triggerPresenceEvent(this.state.isStudentPresent);
    this.captureSnapshot(this.state.isStudentPresent ? 'Simulated Return' : 'Simulated Stood Up');
  },

  logAudit(message) {
    const entry = {
      time: new Date().toLocaleTimeString(),
      message: message
    };
    this.state.proctorAuditLog.unshift(entry);
    if (this.state.proctorAuditLog.length > 20) this.state.proctorAuditLog.pop();

    const auditListEl = document.getElementById('proctor-audit-log-list');
    if (auditListEl) {
      auditListEl.innerHTML = this.state.proctorAuditLog.map(l => `
        <li class="audit-item">
          <span class="audit-time">[${l.time}]</span>
          <span class="audit-msg">${l.message}</span>
        </li>
      `).join('');
    }
  },

  updateStatusBadge(active) {
    const badge = document.getElementById('camera-guardian-status');
    if (badge) {
      badge.textContent = active ? 'Guardian Active 🟢' : 'Guardian Off ⚪';
      badge.className = active ? 'badge-pill active' : 'badge-pill inactive';
    }
  }
};

window.WebcamProctor = WebcamProctor;
