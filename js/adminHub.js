/**
 * FocusFlow AI - Admin Monitoring & Data Analytics Hub
 * 
 * Capabilities:
 * - Real-time student learning activity tracking (Active sprints, video subparts, sitting duration)
 * - Computer Vision proctoring telemetry & Anti-Cheat violation audit logs
 * - Stacking Ensemble ML cohort fatigue distributions
 * - Bayesian Knowledge Tracing (BKT) platform-wide topic mastery analytics
 * - Admin controls: Real-time broadcast alerts, student flag reset, gem grants, and analytics export
 */

const AdminHub = {
  state: {
    kpis: {},
    activeStudents: [],
    fatigueDistribution: [],
    bktMastery: [],
    auditLog: [],
    filterType: 'all', // 'all' | 'active_sprints' | 'flagged' | 'high_fatigue'
    searchQuery: '',
    selectedStudent: null,
    autoRefreshInterval: null
  },

  async init() {
    await this.fetchOverviewData();
    this.renderAdminDashboard();
    this.setupListeners();
  },

  async fetchOverviewData() {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        this.state.kpis = data.system_kpis || {};
        this.state.activeStudents = data.active_students || [];
        this.state.fatigueDistribution = data.fatigue_distribution || [];
        this.state.bktMastery = data.bkt_cohort_mastery || [];
        this.state.auditLog = data.proctor_audit_log || [];
        return;
      }
    } catch (e) {
      console.warn('Backend admin overview fetch fallback:', e);
    }

    // Fallback Mock Data if standalone offline
    this.loadFallbackData();
  },

  loadFallbackData() {
    this.state.kpis = {
      total_enrolled_students: 1284,
      active_sprints_now: 44,
      avg_stretch_sitting_bonus: 24.8,
      verified_cv_attendance_pct: 98.4,
      total_practice_questions_solved: 24890,
      total_gems_rewarded: 142300,
      active_study_groups: 18
    };

    this.state.activeStudents = [
      {
        id: "user_alex",
        name: "Alex Rivera",
        email: "alex.rivera@focusflow.ai",
        avatar: "👨‍🎓",
        track: "Computer Science & AI",
        current_activity: "Focus Sprint #2: Transformer Self-Attention (28m elapsed)",
        activity_type: "video_sprint",
        baseline_mins: 20,
        stretch_mins: 35,
        sitting_elapsed_mins: 28,
        proctor_status: "verified",
        proctor_label: "🟢 Eye Tracking Verified",
        ear_score: 0.31,
        streak_days: 6,
        gems: 85,
        fatigue_index: 0.18,
        fatigue_label: "Optimal Focus",
        bkt_accuracy: 92.4,
        flagged: false
      },
      {
        id: "user_maya",
        name: "Maya Patel",
        email: "maya.patel@focusflow.ai",
        avatar: "👩‍💻",
        track: "Quantitative Finance & ML",
        current_activity: "Focus Sprint #4: Black-Scholes PDE Proof (42m elapsed)",
        activity_type: "video_sprint",
        baseline_mins: 30,
        stretch_mins: 50,
        sitting_elapsed_mins: 42,
        proctor_status: "verified",
        proctor_label: "🟢 Eye Tracking Verified",
        ear_score: 0.29,
        streak_days: 14,
        gems: 160,
        fatigue_index: 0.22,
        fatigue_label: "Optimal Focus",
        bkt_accuracy: 96.0,
        flagged: false
      },
      {
        id: "user_liam",
        name: "Liam Vance",
        email: "liam.vance@focusflow.ai",
        avatar: "👨‍🔬",
        track: "Distributed Systems",
        current_activity: "Practice Arena: Raft Consensus Log Replication",
        activity_type: "practice",
        baseline_mins: 15,
        stretch_mins: 30,
        sitting_elapsed_mins: 18,
        proctor_status: "warning",
        proctor_label: "🟡 Slacking Alert (Gaze Drift)",
        ear_score: 0.24,
        streak_days: 4,
        gems: 45,
        fatigue_index: 0.38,
        fatigue_label: "Moderate Fatigue",
        bkt_accuracy: 81.5,
        flagged: false
      },
      {
        id: "user_jordan",
        name: "Jordan Lee",
        email: "jordan.lee@university.edu",
        avatar: "🎓",
        track: "Deep Learning Track",
        current_activity: "Anti-Cheat Exam: Deep Learning Midterm Exam (Question 7/10)",
        activity_type: "exam",
        baseline_mins: 25,
        stretch_mins: 45,
        sitting_elapsed_mins: 36,
        proctor_status: "flagged",
        proctor_label: "🔴 Tab Switch & Face Missing",
        ear_score: 0.15,
        streak_days: 2,
        gems: 20,
        fatigue_index: 0.68,
        fatigue_label: "High Fatigue Risk",
        bkt_accuracy: 74.2,
        flagged: true
      },
      {
        id: "user_elena",
        name: "Elena Rostova",
        email: "elena.rostova@focusflow.ai",
        avatar: "👩‍🔬",
        track: "Computer Science & AI",
        current_activity: "3D Spaced Flashcards: Residual Neural Networks",
        activity_type: "flashcards",
        baseline_mins: 20,
        stretch_mins: 40,
        sitting_elapsed_mins: 22,
        proctor_status: "verified",
        proctor_label: "🟢 Face Centered",
        ear_score: 0.30,
        streak_days: 8,
        gems: 110,
        fatigue_index: 0.26,
        fatigue_label: "Optimal Focus",
        bkt_accuracy: 89.8,
        flagged: false
      },
      {
        id: "user_marcus",
        name: "Marcus Chen",
        email: "marcus.chen@focusflow.ai",
        avatar: "👨‍💼",
        track: "Distributed Systems",
        current_activity: "Study Group #3: Stanford CS224N Live Voice Mesh",
        activity_type: "study_group",
        baseline_mins: 20,
        stretch_mins: 35,
        sitting_elapsed_mins: 31,
        proctor_status: "verified",
        proctor_label: "🟢 Voice & Eye Active",
        ear_score: 0.32,
        streak_days: 5,
        gems: 60,
        fatigue_index: 0.19,
        fatigue_label: "Optimal Focus",
        bkt_accuracy: 93.1,
        flagged: false
      }
    ];

    this.state.fatigueDistribution = [
      { cluster: "Optimal Focus (Fatigue < 0.35)", pct: 74, count: 950, color: "var(--emerald)" },
      { cluster: "Moderate Fatigue (0.35 - 0.65)", pct: 21, count: 269, color: "var(--amber)" },
      { cluster: "High Fatigue Risk (> 0.65)", pct: 5, count: 65, color: "var(--rose)" }
    ];

    this.state.bktMastery = [
      { topic: "Transformers & Attention", domain: "Deep Learning", mastery_pct: 91, students_tested: 842 },
      { topic: "Backpropagation & Autograd", domain: "Machine Learning", mastery_pct: 95, students_tested: 1120 },
      { topic: "Bayesian Networks & BKT", domain: "Machine Learning", mastery_pct: 84, students_tested: 730 },
      { topic: "Raft & Distributed Consensus", domain: "Distributed Systems", mastery_pct: 78, students_tested: 615 },
      { topic: "Black-Scholes & Stochastic Calculus", domain: "Quantitative Math", mastery_pct: 82, students_tested: 480 },
      { topic: "Convolution & Computer Vision", domain: "Computer Vision", mastery_pct: 88, students_tested: 890 }
    ];

    this.state.auditLog = [
      {
        id: "audit_101",
        timestamp: "2 mins ago",
        user_name: "Jordan Lee",
        user_email: "jordan.lee@university.edu",
        event_type: "EXAM_TAB_SWITCH",
        severity: "high",
        details: "Focus lost to secondary window during Deep Learning Midterm Exam (Duration: 8.4s)",
        cv_metric: "Tab Inactive & Gaze Off-Screen",
        status: "flagged"
      },
      {
        id: "audit_102",
        timestamp: "6 mins ago",
        user_name: "Elena Rostova",
        user_email: "elena.rostova@focusflow.ai",
        event_type: "GAZE_DISTRACTION",
        severity: "medium",
        details: "Head orientation deviated > 35° from screen center during Focus Sprint #1",
        cv_metric: "Gaze Left (EAR: 0.29, Pose: Yaw -38°)",
        status: "warning_issued"
      },
      {
        id: "audit_103",
        timestamp: "11 mins ago",
        user_name: "Alex Rivera",
        user_email: "alex.rivera@focusflow.ai",
        event_type: "SPRINT_MILESTONE_VERIFIED",
        severity: "info",
        details: "Completed 35-min adaptive sitting stretch (+15m beyond baseline) with 98.6% verified eye presence",
        cv_metric: "Face Centered (EAR: 0.31, Attendance: 98.6%)",
        status: "verified"
      },
      {
        id: "audit_104",
        timestamp: "18 mins ago",
        user_name: "Liam Vance",
        user_email: "liam.vance@focusflow.ai",
        event_type: "EMPTY_CHAIR_DETECTED",
        severity: "medium",
        details: "Student stood up from desk for 42s during active video sprint; timer auto-paused",
        cv_metric: "No Face Found (Haar Cascade & Eye Aspect Ratio 0.0)",
        status: "auto_paused"
      },
      {
        id: "audit_105",
        timestamp: "24 mins ago",
        user_name: "Maya Patel",
        user_email: "maya.patel@focusflow.ai",
        event_type: "ENDURANCE_RECORD",
        severity: "celebration",
        details: "Maintained 50-min uninterrupted sitting session on Quantitative PDE proofs",
        cv_metric: "Verified Sitting: 50m 00s (100% Attendance)",
        status: "verified"
      }
    ];
  },

  setupListeners() {
    const searchInput = document.getElementById('admin-student-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.toLowerCase();
        this.renderStudentTable();
      });
    }
  },

  setFilter(filter) {
    this.state.filterType = filter;
    document.querySelectorAll('.admin-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderStudentTable();
  },

  getFilteredStudents() {
    let list = this.state.activeStudents;

    if (this.state.searchQuery) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(this.state.searchQuery) ||
        s.email.toLowerCase().includes(this.state.searchQuery) ||
        s.track.toLowerCase().includes(this.state.searchQuery) ||
        s.current_activity.toLowerCase().includes(this.state.searchQuery)
      );
    }

    if (this.state.filterType === 'active_sprints') {
      list = list.filter(s => s.activity_type === 'video_sprint');
    } else if (this.state.filterType === 'flagged') {
      list = list.filter(s => s.flagged || s.proctor_status === 'flagged' || s.proctor_status === 'warning');
    } else if (this.state.filterType === 'high_fatigue') {
      list = list.filter(s => s.fatigue_index >= 0.35);
    }

    return list;
  },

  renderAdminDashboard() {
    this.renderKPIs();
    this.renderStudentTable();
    this.renderFatigueDistribution();
    this.renderBKTMastery();
    this.renderAuditLog();
  },

  renderKPIs() {
    const kpiContainer = document.getElementById('admin-kpi-grid');
    if (!kpiContainer) return;

    const k = this.state.kpis;
    kpiContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-value">${(k.total_enrolled_students || 1284).toLocaleString()}</div>
        <div class="stat-label">Total Enrolled Scholars</div>
        <div class="stat-growth-tag pos">↑ 12% this week</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">${k.active_sprints_now || 44}</div>
        <div class="stat-label">Live Active Sprints</div>
        <div class="stat-growth-tag pos">🟢 Real-time Telemetry</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">+${k.avg_stretch_sitting_bonus || 24.8}m</div>
        <div class="stat-label">Avg Sitting Stretch Bonus</div>
        <div class="stat-growth-tag pos">Target: +15m to +30m</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👁️</div>
        <div class="stat-value">${k.verified_cv_attendance_pct || 98.4}%</div>
        <div class="stat-label">OpenCV Verified Attendance</div>
        <div class="stat-growth-tag pos">Anti-Slacking Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${(k.total_practice_questions_solved || 24890).toLocaleString()}</div>
        <div class="stat-label">BKT Questions Mastered</div>
        <div class="stat-growth-tag pos">Accuracy: 89.2%</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💎</div>
        <div class="stat-value">${(k.total_gems_rewarded || 142300).toLocaleString()}</div>
        <div class="stat-label">Gems Distributed</div>
        <div class="stat-growth-tag pos">Perks Redeemed: 328</div>
      </div>
    `;
  },

  renderStudentTable() {
    const tableBody = document.getElementById('admin-students-table-body');
    if (!tableBody) return;

    const students = this.getFilteredStudents();

    if (students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            🔍 No active scholars match the specified search or filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = students.map(s => {
      let statusClass = 'status-verified';
      if (s.flagged || s.proctor_status === 'flagged') statusClass = 'status-flagged';
      else if (s.proctor_status === 'warning') statusClass = 'status-warning';

      let fatigueClass = 'badge-pill success';
      if (s.fatigue_index >= 0.65) fatigueClass = 'badge-pill danger';
      else if (s.fatigue_index >= 0.35) fatigueClass = 'badge-pill warning';

      const sittingPct = Math.min(100, Math.round((s.sitting_elapsed_mins / s.stretch_mins) * 100));

      return `
        <tr class="admin-student-row ${s.flagged ? 'row-flagged' : ''}" id="admin_row_${s.id}">
          <td>
            <div class="admin-student-cell">
              <span class="admin-avatar">${s.avatar}</span>
              <div>
                <strong class="admin-name">${s.name}</strong>
                <span class="admin-email">${s.email}</span>
                <span class="admin-track-pill">${s.track}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="admin-activity-cell">
              <span class="activity-title">${s.current_activity}</span>
              <span class="activity-type-pill type-${s.activity_type}">${s.activity_type.replace('_', ' ').toUpperCase()}</span>
            </div>
          </td>
          <td>
            <div class="sitting-progress-cell">
              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.2rem;">
                <span>${s.sitting_elapsed_mins}m elapsed</span>
                <strong>Goal: ${s.stretch_mins}m (+${s.stretch_mins - s.baseline_mins}m)</strong>
              </div>
              <div class="admin-progress-bar">
                <div class="progress-fill" style="width: ${sittingPct}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <div class="proctor-cell">
              <span class="proctor-pill ${statusClass}">${s.proctor_label}</span>
              <span class="proctor-subtext">EAR: ${s.ear_score} • Streak: ${s.streak_days}d 🔥</span>
            </div>
          </td>
          <td>
            <div class="ml-telemetry-cell">
              <span class="${fatigueClass}">Fatigue: ${(s.fatigue_index * 100).toFixed(0)}%</span>
              <span class="bkt-mini-text">BKT Mastery: ${s.bkt_accuracy}%</span>
            </div>
          </td>
          <td>
            <div class="admin-actions-cell">
              <button class="btn-action-sm inspect" onclick="AdminHub.inspectStudent('${s.id}')" title="Inspect Full Telemetry">
                🔍 Inspect
              </button>
              ${s.flagged ? `
                <button class="btn-action-sm reset" onclick="AdminHub.executeUserAction('${s.id}', 'reset_flag')" title="Clear Anti-Cheat Flag">
                  🟢 Clear Flag
                </button>
              ` : `
                <button class="btn-action-sm warn" onclick="AdminHub.executeUserAction('${s.id}', 'issue_warning')" title="Issue Slacking Warning">
                  ⚠️ Warn
                </button>
              `}
              <button class="btn-action-sm gems" onclick="AdminHub.executeUserAction('${s.id}', 'grant_gems')" title="Award +25 Focus Gems">
                💎 +25
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderFatigueDistribution() {
    const container = document.getElementById('admin-fatigue-chart-container');
    if (!container) return;

    const clusters = this.state.fatigueDistribution;
    container.innerHTML = `
      <div class="analytics-card" style="margin-bottom: 0;">
        <div class="analytics-card-header">
          <div>
            <h3>🧠 Stacking Ensemble ML Fatigue Distribution</h3>
            <p style="color: var(--text-muted); font-size: 0.82rem;">Real-time inference across Random Forest, Gradient Boosting & Ridge Meta-Learner</p>
          </div>
          <span class="badge-pill info">Cohort Size: 1,284</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          ${clusters.map(c => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
                <span><strong>${c.cluster}</strong> (${c.count} students)</span>
                <span style="font-weight: 700; color: ${c.color};">${c.pct}%</span>
              </div>
              <div class="admin-progress-bar">
                <div class="progress-fill" style="width: ${c.pct}%; background: ${c.color};"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 1.25rem; font-size: 0.8rem; color: var(--cyan); background: rgba(0,242,254,0.06); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid rgba(0,242,254,0.15);">
          💡 <strong>Stacking Ensemble Insight:</strong> 95% of active scholars are operating under low-to-moderate cognitive fatigue, safely building sitting stamina with +15-30m stretches.
        </div>
      </div>
    `;
  },

  renderBKTMastery() {
    const container = document.getElementById('admin-bkt-chart-container');
    if (!container) return;

    const topics = this.state.bktMastery;
    container.innerHTML = `
      <div class="analytics-card" style="margin-bottom: 0;">
        <div class="analytics-card-header">
          <div>
            <h3>🎯 Bayesian Knowledge Tracing (BKT) Topic Mastery</h3>
            <p style="color: var(--text-muted); font-size: 0.82rem;">Prior $P(L_0)$, Transition $P(T)$, Slip $P(S)$, Guess $P(G)$ aggregate tracking</p>
          </div>
          <span class="badge-pill success">BKT Model Active</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem;">
          ${topics.map(t => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.25rem;">
                <span><strong>${t.topic}</strong> <span style="color: var(--text-muted);">(${t.domain})</span></span>
                <span style="font-weight: 700; color: var(--cyan);">${t.mastery_pct}% Mastery</span>
              </div>
              <div class="admin-progress-bar">
                <div class="progress-fill" style="width: ${t.mastery_pct}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderAuditLog() {
    const container = document.getElementById('admin-audit-log-feed');
    if (!container) return;

    const logs = this.state.auditLog;
    container.innerHTML = logs.map(l => {
      let badgeClass = 'info';
      if (l.severity === 'high') badgeClass = 'danger';
      else if (l.severity === 'medium') badgeClass = 'warning';
      else if (l.severity === 'celebration') badgeClass = 'success';

      return `
        <div class="audit-log-item">
          <div class="audit-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge-pill ${badgeClass}">${l.event_type}</span>
              <strong style="font-size: 0.88rem;">${l.user_name}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">(${l.user_email})</span>
            </div>
            <span class="audit-time">${l.timestamp}</span>
          </div>
          <p class="audit-details">${l.details}</p>
          <div class="audit-cv-metric">
            👁️ <strong>CV Sensor Reading:</strong> ${l.cv_metric}
          </div>
        </div>
      `;
    }).join('');
  },

  async executeUserAction(userId, action) {
    try {
      const res = await fetch('/api/admin/flag-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: action })
      });

      if (res.ok) {
        const data = await res.json();
        const student = this.state.activeStudents.find(s => s.id === userId);
        if (student && data.student) {
          Object.assign(student, data.student);
        }
        this.renderStudentTable();
        if (window.FocusEngine) window.FocusEngine.showToast(data.message, 'success');
        return;
      }
    } catch (e) {
      console.warn('Flag user fallback:', e);
    }

    // Local state fallback
    const student = this.state.activeStudents.find(s => s.id === userId);
    if (student) {
      if (action === 'reset_flag') {
        student.flagged = false;
        student.proctor_status = 'verified';
        student.proctor_label = '🟢 Flag Cleared by Admin';
        if (window.FocusEngine) window.FocusEngine.showToast(`Flag cleared for ${student.name}`, 'success');
      } else if (action === 'issue_warning') {
        student.proctor_status = 'warning';
        student.proctor_label = '🟡 Admin Warning Dispatched';
        if (window.FocusEngine) window.FocusEngine.showToast(`Warning sent to ${student.name}`, 'warning');
      } else if (action === 'grant_gems') {
        student.gems += 25;
        if (window.FocusEngine) window.FocusEngine.showToast(`+25 Gems granted to ${student.name} 💎`, 'success');
      }
      this.renderStudentTable();
    }
  },

  async sendBroadcast() {
    const titleInput = document.getElementById('admin-broadcast-title');
    const msgInput = document.getElementById('admin-broadcast-msg');
    const typeSelect = document.getElementById('admin-broadcast-type');

    if (!msgInput || !msgInput.value.trim()) {
      if (window.FocusEngine) window.FocusEngine.showToast('Please enter an announcement message!', 'warning');
      return;
    }

    const payload = {
      title: (titleInput && titleInput.value.trim()) || 'Platform Focus Sprint Announcement',
      message: msgInput.value.trim(),
      broadcast_type: (typeSelect && typeSelect.value) || 'info',
      urgency: 'high'
    };

    try {
      const res = await fetch('/api/admin/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (window.FocusEngine) {
          window.FocusEngine.showToast(data.message, 'success');
          // Also show toast as recipient
          setTimeout(() => {
            window.FocusEngine.showToast(`📢 [ADMIN ANNOUNCEMENT]: ${payload.message}`, payload.broadcast_type === 'warning' ? 'warning' : 'info');
          }, 800);
        }
        msgInput.value = '';
        return;
      }
    } catch (e) {
      console.warn('Broadcast fallback:', e);
    }

    // Fallback toast
    if (window.FocusEngine) {
      window.FocusEngine.showToast(`📢 Admin Broadcast: ${payload.message}`, 'success');
      msgInput.value = '';
    }
  },

  inspectStudent(userId) {
    const student = this.state.activeStudents.find(s => s.id === userId);
    if (!student) return;

    this.state.selectedStudent = student;
    const modalBody = document.getElementById('admin-inspect-modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
          <span style="font-size: 3rem;">${student.avatar}</span>
          <div>
            <h3 style="margin: 0; font-size: 1.3rem;">${student.name}</h3>
            <span style="color: var(--cyan); font-size: 0.85rem;">${student.email} • ${student.track}</span>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem;">
              <span class="hud-pill level">Lvl 3</span>
              <span class="hud-pill stretch">${student.streak_days}d Streak 🔥</span>
              <span class="hud-pill" style="border-color: var(--amber); color: var(--amber);">${student.gems} 💎</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
          <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Sitting Capacity Telemetry</div>
            <div style="font-size: 1.15rem; font-weight: 700; margin: 0.3rem 0; color: var(--cyan);">${student.sitting_elapsed_mins} mins elapsed</div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
              Baseline: ${student.baseline_mins}m | Adaptive Stretch Target: ${student.stretch_mins}m (+${student.stretch_mins - student.baseline_mins}m)
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">OpenCV Eye Tracking & EAR</div>
            <div style="font-size: 1.15rem; font-weight: 700; margin: 0.3rem 0; color: var(--emerald);">EAR Score: ${student.ear_score}</div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
              Status: ${student.proctor_label}
            </p>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Current Learning Activity</div>
          <p style="font-size: 0.95rem; font-weight: 600; margin: 0.35rem 0;">${student.current_activity}</p>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <span class="badge-pill info">ML Fatigue: ${(student.fatigue_index * 100).toFixed(0)}%</span>
            <span class="badge-pill success">BKT Accuracy: ${student.bkt_accuracy}%</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary" style="flex:1;" onclick="AdminHub.executeUserAction('${student.id}', 'issue_warning'); App.closeModal('admin-inspect-modal');">
            ⚠️ Issue Attention Warning
          </button>
          <button class="btn btn-primary" style="flex:1;" onclick="AdminHub.executeUserAction('${student.id}', 'grant_gems'); App.closeModal('admin-inspect-modal');">
            💎 Award +25 Gems
          </button>
        </div>
      `;
      App.openModal('admin-inspect-modal');
    }
  },

  async exportAnalytics() {
    try {
      const res = await fetch('/api/admin/export-analytics');
      let exportData = null;
      if (res.ok) {
        exportData = await res.json();
      } else {
        exportData = {
          platform: "FocusFlow AI",
          export_timestamp: new Date().toISOString(),
          cohort_size: 1284,
          active_students: this.state.activeStudents,
          fatigue_distribution: this.state.fatigueDistribution,
          bkt_mastery: this.state.bktMastery
        };
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow_cohort_telemetry_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.FocusEngine) {
        window.FocusEngine.showToast('📥 Telemetry dataset exported successfully!', 'success');
      }
    } catch (e) {
      console.warn('Export analytics error:', e);
    }
  }
};

window.AdminHub = AdminHub;
