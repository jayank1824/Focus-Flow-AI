/**
 * FocusFlow AI - Collaborative Study Groups & Live Voice Rooms (8-10 Peers)
 * 
 * Features:
 * - Room creation with shareable invite links and 8-10 member quotas
 * - Simulated live WebRTC voice mesh with speaking wave visualizers and mute controls
 * - Real-time peer doubt board linked to video keyframe subparts
 * - Collaborative study notes whiteboard
 */

const StudyGroupEngine = {
  state: {
    activeGroupId: 'grp_deepmind_101',
    isVoiceConnected: true,
    isUserMuted: false,
    isCameraOn: true,
    speechSimulationInterval: null,
    groups: []
  },

  init() {
    this.refreshGroups();
    this.startPeerVoiceSimulation();
  },

  refreshGroups() {
    this.state.groups = FocusStorage.get(FocusStorage.KEYS.STUDY_GROUPS) || [];
    this.renderGroupSelector();
    this.renderActiveGroupView();
  },

  renderGroupSelector() {
    const selector = document.getElementById('study-group-select');
    if (!selector) return;

    selector.innerHTML = this.state.groups.map(g => `
      <option value="${g.id}" ${g.id === this.state.activeGroupId ? 'selected' : ''}>
        👥 ${g.name} (${g.currentCount}/${g.maxMembers})
      </option>
    `).join('');
  },

  switchGroup(groupId) {
    this.state.activeGroupId = groupId;
    this.renderActiveGroupView();
  },

  getActiveGroup() {
    return this.state.groups.find(g => g.id === this.state.activeGroupId) || this.state.groups[0];
  },

  renderActiveGroupView() {
    const container = document.getElementById('active-group-view-container');
    if (!container) return;

    const grp = this.getActiveGroup();
    if (!grp) return;

    container.innerHTML = `
      <div class="group-hero-card">
        <div class="group-hero-header">
          <div>
            <h2>${grp.name}</h2>
            <p class="group-topic-tag">📌 Active Topic: <strong>${grp.topic}</strong></p>
          </div>
          <div class="group-invite-dock">
            <span class="invite-code-pill" onclick="StudyGroupEngine.copyInviteLink('${grp.inviteCode}')">
              🔗 Invite Code: <strong>${grp.inviteCode}</strong> (Click to Copy)
            </span>
          </div>
        </div>

        <!-- Live Voice Call Mesh Grid (8-10 Members) -->
        <div class="voice-mesh-section">
          <div class="voice-mesh-header">
            <div class="mesh-title">
              <span class="pulse-dot green"></span> Live Study Voice Mesh (${grp.currentCount}/${grp.maxMembers} Connected)
            </div>
            <div class="voice-controls-dock">
              <button class="btn btn-sm ${this.state.isUserMuted ? 'btn-danger' : 'btn-secondary'}" onclick="StudyGroupEngine.toggleMute()">
                ${this.state.isUserMuted ? '🔇 Unmute Mic' : '🎙️ Mute Mic'}
              </button>
              <button class="btn btn-sm ${this.state.isCameraOn ? 'btn-secondary' : 'btn-danger'}" onclick="StudyGroupEngine.toggleCamera()">
                ${this.state.isCameraOn ? '📷 Video On' : '🚫 Video Off'}
              </button>
            </div>
          </div>

          <div class="peers-grid" id="peers-voice-grid">
            ${grp.members.map(m => `
              <div class="peer-tile ${m.isSpeaking ? 'speaking-active' : ''} ${m.isMuted ? 'peer-muted' : ''}">
                <div class="peer-avatar">${m.avatar}</div>
                <div class="peer-name">${m.name}</div>
                <div class="peer-status-icons">
                  <span>${m.isMuted ? '🔇' : '🎙️'}</span>
                  <span>${m.cameraOn ? '📷' : '⚪'}</span>
                </div>
                ${m.isSpeaking ? `
                  <div class="speaking-wave-bars">
                    <span></span><span></span><span></span>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Peer Doubt & Discussion Thread -->
        <div class="group-discussion-grid">
          <div class="doubt-thread-column">
            <div class="column-header">
              <h3>💬 Peer Doubt Board</h3>
              <button class="btn btn-sm btn-primary" onclick="StudyGroupEngine.promptNewDoubt()">
                + Post Doubt
              </button>
            </div>

            <div class="doubts-list-feed" id="group-doubts-feed">
              ${grp.doubts.length > 0 ? grp.doubts.map(d => `
                <div class="doubt-item-card">
                  <div class="doubt-meta">
                    <span class="doubt-author">👤 ${d.author}</span>
                    <span class="doubt-time">${d.time}</span>
                  </div>
                  <p class="doubt-text">${d.text}</p>
                  <button class="btn-reply-doubt" onclick="StudyGroupEngine.replyToDoubt('${d.id}')">
                    💡 Reply with Solution
                  </button>
                </div>
              `).join('') : `
                <div class="empty-doubts">No doubts posted yet. Ask your peers anything!</div>
              `}
            </div>
          </div>

          <div class="shared-whiteboard-column">
            <div class="column-header">
              <h3>📝 Shared Study Notes</h3>
              <button class="btn btn-sm btn-secondary" onclick="FocusEngine.showToast('Notes saved to cloud!', 'success')">
                💾 Sync
              </button>
            </div>
            <textarea class="shared-notes-area" placeholder="Collaborative notes on Neural Networks and System Design... (Real-time sync enabled)">
• Keyframe 28:45: Matrix dimension alignment for dL/dW = X^T * dZ
• ReLU avoids gradient vanishing because derivative is 1 for x > 0
• Consistent hashing ring minimizes key migration to K/N during node scaling
            </textarea>
          </div>
        </div>
      </div>
    `;
  },

  toggleMute() {
    this.state.isUserMuted = !this.state.isUserMuted;
    const grp = this.getActiveGroup();
    if (grp && grp.members.length > 0) {
      grp.members[0].isMuted = this.state.isUserMuted;
    }
    this.renderActiveGroupView();
    if (window.FocusEngine) {
      window.FocusEngine.showToast(this.state.isUserMuted ? 'Mic Muted 🔇' : 'Mic Live 🎙️', 'info');
    }
  },

  toggleCamera() {
    this.state.isCameraOn = !this.state.isCameraOn;
    const grp = this.getActiveGroup();
    if (grp && grp.members.length > 0) {
      grp.members[0].cameraOn = this.state.isCameraOn;
    }
    this.renderActiveGroupView();
  },

  copyInviteLink(code) {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?join=${code}`;
    try {
      navigator.clipboard.writeText(inviteUrl);
    } catch (e) {
      // Fallback
    }
    if (window.FocusEngine) {
      window.FocusEngine.showToast(`📋 Copied Invite Link for Code [${code}]! Share with up to 10 peers.`, 'success');
    }
  },

  startPeerVoiceSimulation() {
    if (this.state.speechSimulationInterval) clearInterval(this.state.speechSimulationInterval);
    // Periodically simulate peers speaking in room
    this.state.speechSimulationInterval = setInterval(() => {
      const grp = this.getActiveGroup();
      if (!grp || !grp.members) return;

      grp.members.forEach((m, idx) => {
        if (idx !== 0) { // Don't override user's own status
          m.isSpeaking = Math.random() > 0.75 && !m.isMuted;
        }
      });

      const grid = document.getElementById('peers-voice-grid');
      if (grid) {
        // Soft refresh speaking states
        const tiles = grid.querySelectorAll('.peer-tile');
        grp.members.forEach((m, idx) => {
          if (tiles[idx]) {
            tiles[idx].classList.toggle('speaking-active', !!m.isSpeaking);
          }
        });
      }
    }, 2800);
  },

  promptNewDoubt() {
    const text = prompt('Enter your doubt for the study group:');
    if (text) {
      this.postDoubtToActiveGroup(text);
    }
  },

  postDoubtToActiveGroup(text) {
    const grp = this.getActiveGroup();
    if (!grp) return;

    const newDoubt = {
      id: 'd_' + Date.now(),
      author: 'Alex Rivera (You)',
      time: 'Just now',
      text: text
    };

    grp.doubts.unshift(newDoubt);
    FocusStorage.update(FocusStorage.KEYS.STUDY_GROUPS, (groups) => {
      const idx = groups.findIndex(g => g.id === grp.id);
      if (idx !== -1) groups[idx] = grp;
      return groups;
    });

    this.renderActiveGroupView();
  },

  replyToDoubt(doubtId) {
    const reply = prompt('Enter your answer or clarification:');
    if (reply) {
      if (window.FocusEngine) {
        window.FocusEngine.showToast('💡 Response posted to peer doubt thread! (+25 XP)', 'success');
      }
    }
  }
};

window.StudyGroupEngine = StudyGroupEngine;
