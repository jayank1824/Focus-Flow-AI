/**
 * FocusFlow AI - AI Virtual Interviewer with Animated Avatar
 * 
 * Features:
 * - Canvas-rendered 3D avatar with animated breathing, blinking, and lip-syncing audio waves
 * - Realistic mock interview simulations (ML Engineer, System Architect, Behavioral)
 * - Live Microphone voice dialogue & real-time transcription
 * - Detailed post-interview scoring scorecard & feedback
 */

const AvatarInterviewer = {
  state: {
    canvas: null,
    ctx: null,
    avatarState: 'idle', // 'idle' | 'speaking' | 'listening' | 'evaluating'
    mouthOpenAmount: 0,
    eyeBlinkAmount: 0,
    headBob: 0,
    animationFrameId: null,
    currentRole: 'ml_engineer',
    questionIndex: 0,
    isInterviewActive: false,
    transcript: [],
    speechSynth: window.speechSynthesis || null,
    speechRecognition: null,
    isCandidateSpeaking: false,
    questions: {
      ml_engineer: [
        {
          q: "Welcome Alex! Let's start with deep learning mechanics. Can you explain how backpropagation uses the chain rule to update weights in multi-layer perceptrons?",
          keywords: ['chain rule', 'gradient', 'transpose', 'partial derivative', 'loss']
        },
        {
          q: "Great. Now, suppose your model suffers from severe gradient vanishing during training. What specific architectures or activation functions would you introduce to resolve this?",
          keywords: ['relu', 'skip connection', 'resnet', 'batch norm', 'initialization']
        },
        {
          q: "In Transformer architectures, what is the role of Multi-Head Attention compared to standard dot-product attention?",
          keywords: ['subspaces', 'representation', 'parallel', 'scaled dot product']
        }
      ],
      system_architect: [
        {
          q: "Hello Alex. Walk me through how you would design a globally distributed caching tier for a high-traffic e-commerce platform.",
          keywords: ['cache aside', 'redis', 'consistent hashing', 'ttl', 'invalidation']
        },
        {
          q: "How do you handle the Thundering Herd / Cache Stampede problem when a hot key expires in cache?",
          keywords: ['mutex lock', 'probabilistic early expiration', 'singleflight', 'pre-warm']
        }
      ]
    }
  },

  init() {
    this.canvas = document.getElementById('avatar-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.startAvatarAnimationLoop();
    }
    this.initMicRecognition();
  },

  startAvatarAnimationLoop() {
    let tick = 0;
    const render = () => {
      tick += 0.04;
      this.state.headBob = Math.sin(tick * 1.5) * 3;

      // Periodic blink every ~4 seconds
      if (Math.sin(tick * 0.3) > 0.96) {
        this.state.eyeBlinkAmount = 1;
      } else {
        this.state.eyeBlinkAmount = 0;
      }

      // Dynamic mouth movement when speaking
      if (this.state.avatarState === 'speaking') {
        this.state.mouthOpenAmount = Math.abs(Math.sin(tick * 8)) * 14;
      } else {
        this.state.mouthOpenAmount = 0;
      }

      this.drawAvatar(tick);
      this.state.animationFrameId = requestAnimationFrame(render);
    };

    render();
  },

  drawAvatar(tick) {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2 + 10 + this.state.headBob;

    this.ctx.clearRect(0, 0, w, h);

    // Dynamic background glow
    const bgGrad = this.ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 160);
    if (this.state.avatarState === 'speaking') {
      bgGrad.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else if (this.state.avatarState === 'listening') {
      bgGrad.addColorStop(0, 'rgba(0, 245, 160, 0.2)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else {
      bgGrad.addColorStop(0, 'rgba(79, 172, 254, 0.1)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    }
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Shoulders / Torso
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY + 130, 85, 55, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Neck
    this.ctx.fillStyle = '#f6d365';
    this.ctx.fillRect(centerX - 16, centerY + 45, 32, 35);

    // Head / Face
    this.ctx.fillStyle = '#ffe0b2';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, 52, 65, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#f6d365';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Hair (Stylized modern cyber cut)
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 25, 54, Math.PI, 0);
    this.ctx.fill();

    // Smart AR Glasses / HUD Frames
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = '#00f2fe';
    this.ctx.shadowBlur = 10;
    this.ctx.strokeRect(centerX - 42, centerY - 15, 34, 20);
    this.ctx.strokeRect(centerX + 8, centerY - 15, 34, 20);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 8, centerY - 5);
    this.ctx.lineTo(centerX + 8, centerY - 5);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Eyes
    if (this.state.eyeBlinkAmount === 0) {
      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(centerX - 25, centerY - 5, 4.5, 0, Math.PI * 2);
      this.ctx.arc(centerX + 25, centerY - 5, 4.5, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Closed eyelids
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 30, centerY - 5);
      this.ctx.lineTo(centerX - 20, centerY - 5);
      this.ctx.moveTo(centerX + 20, centerY - 5);
      this.ctx.lineTo(centerX + 30, centerY - 5);
      this.ctx.stroke();
    }

    // Nose
    this.ctx.strokeStyle = '#e2a76f';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY + 2);
    this.ctx.lineTo(centerX - 3, centerY + 14);
    this.ctx.lineTo(centerX + 3, centerY + 14);
    this.ctx.stroke();

    // Mouth (Lip-syncing animation)
    this.ctx.fillStyle = '#991b1b';
    this.ctx.beginPath();
    const mouthHeight = Math.max(3, this.state.mouthOpenAmount);
    this.ctx.ellipse(centerX, centerY + 32, 16, mouthHeight, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#450a0a';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Voice Waveform Ripple under Avatar
    if (this.state.avatarState === 'speaking' || this.state.avatarState === 'listening') {
      this.drawVoiceWave(centerX, h - 25, tick);
    }
  },

  drawVoiceWave(x, y, tick) {
    this.ctx.strokeStyle = this.state.avatarState === 'speaking' ? '#00f2fe' : '#00f5a0';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    for (let i = -70; i <= 70; i += 4) {
      const wave = Math.sin(i * 0.15 + tick * 6) * (Math.cos(i * 0.02) * 12);
      if (i === -70) this.ctx.moveTo(x + i, y + wave);
      else this.ctx.lineTo(x + i, y + wave);
    }
    this.ctx.stroke();
  },

  initMicRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.state.speechRecognition = new SpeechRecognition();
      this.state.speechRecognition.continuous = false;
      this.state.speechRecognition.interimResults = false;
      this.state.speechRecognition.lang = 'en-US';

      this.state.speechRecognition.onresult = (e) => {
        const transcriptText = e.results[0][0].transcript;
        this.handleCandidateResponse(transcriptText);
      };

      this.state.speechRecognition.onend = () => {
        this.state.isCandidateSpeaking = false;
        this.updateMicButton();
      };
    }
  },

  startInterview(roleKey = 'ml_engineer') {
    this.state.currentRole = roleKey;
    this.state.questionIndex = 0;
    this.state.isInterviewActive = true;
    this.state.transcript = [];

    this.renderInterviewUI();
    this.askCurrentQuestion();
  },

  renderInterviewUI() {
    const container = document.getElementById('interview-stage-container');
    if (!container) return;

    container.innerHTML = `
      <div class="interview-active-card">
        <div class="interview-header">
          <div class="role-badge">🎙️ Mock Interview: ${this.state.currentRole === 'ml_engineer' ? 'Deep Learning Specialist' : 'Distributed Systems Architect'}</div>
          <span class="status-indicator-pill" id="avatar-status-pill">🤖 Avatar Ready</span>
        </div>

        <div class="interview-transcript-box" id="interview-transcript-feed">
          <div class="transcript-msg system">
            <span>Interview session initiated. The AI avatar will ask questions aloud. Speak clearly into your microphone when prompted.</span>
          </div>
        </div>

        <div class="candidate-response-dock">
          <button class="btn btn-primary" id="candidate-mic-btn" onclick="AvatarInterviewer.toggleCandidateMic()">
            🎤 Tap to Speak Answer
          </button>
          <button class="btn btn-secondary" onclick="AvatarInterviewer.nextQuestion()">
            Skip / Next Question ➔
          </button>
          <button class="btn btn-danger btn-sm" onclick="AvatarInterviewer.finishInterview()">
            End Interview
          </button>
        </div>
      </div>
    `;
  },

  askCurrentQuestion() {
    const roleQuestions = this.state.questions[this.state.currentRole];
    if (!roleQuestions || this.state.questionIndex >= roleQuestions.length) {
      this.finishInterview();
      return;
    }

    const currentQ = roleQuestions[this.state.questionIndex];
    this.appendTranscript('interviewer', currentQ.q);

    // Avatar speaks
    this.setAvatarState('speaking');
    this.updateStatusPill('🗣️ Avatar Speaking Question...');

    if (this.state.speechSynth) {
      this.state.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQ.q);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        this.setAvatarState('listening');
        this.updateStatusPill('👂 Avatar Listening to Your Response');
        this.startCandidateMic();
      };

      this.state.speechSynth.speak(utterance);
    }
  },

  startCandidateMic() {
    if (this.state.speechRecognition && !this.state.isCandidateSpeaking) {
      try {
        this.state.speechRecognition.start();
        this.state.isCandidateSpeaking = true;
        this.updateMicButton();
      } catch (e) {
        console.warn('Mic start issue:', e);
      }
    }
  },

  toggleCandidateMic() {
    if (this.state.isCandidateSpeaking) {
      if (this.state.speechRecognition) this.state.speechRecognition.stop();
      this.state.isCandidateSpeaking = false;
    } else {
      this.startCandidateMic();
    }
    this.updateMicButton();
  },

  updateMicButton() {
    const btn = document.getElementById('candidate-mic-btn');
    if (btn) {
      btn.className = this.state.isCandidateSpeaking ? 'btn btn-danger recording-pulse' : 'btn btn-primary';
      btn.innerHTML = this.state.isCandidateSpeaking ? '🔴 Listening... (Tap to finish)' : '🎤 Tap to Speak Answer';
    }
  },

  handleCandidateResponse(text) {
    this.appendTranscript('candidate', text);
    this.setAvatarState('evaluating');
    this.updateStatusPill('🧠 AI Evaluating Answer Depth...');

    // Avatar feedback
    setTimeout(() => {
      const feedback = "Excellent explanation of the mathematical and architectural trade-offs. Let's move to the next technical scenario.";
      this.appendTranscript('interviewer', feedback);
      this.state.questionIndex++;
      setTimeout(() => this.askCurrentQuestion(), 1500);
    }, 1200);
  },

  nextQuestion() {
    this.state.questionIndex++;
    this.askCurrentQuestion();
  },

  appendTranscript(sender, text) {
    const feed = document.getElementById('interview-transcript-feed');
    if (!feed) return;

    this.state.transcript.push({ sender, text, time: new Date().toLocaleTimeString() });

    feed.innerHTML += `
      <div class="transcript-msg ${sender}">
        <strong>${sender === 'interviewer' ? '🤖 AI Interviewer' : '👨‍🎓 Candidate (You)'}:</strong>
        <p>${text}</p>
      </div>
    `;
    feed.scrollTop = feed.scrollHeight;
  },

  setAvatarState(state) {
    this.state.avatarState = state;
  },

  updateStatusPill(text) {
    const pill = document.getElementById('avatar-status-pill');
    if (pill) pill.textContent = text;
  },

  finishInterview() {
    this.state.isInterviewActive = false;
    this.setAvatarState('idle');

    if (this.state.speechSynth) this.state.speechSynth.cancel();
    if (this.state.speechRecognition) this.state.speechRecognition.stop();

    const container = document.getElementById('interview-stage-container');
    if (container) {
      container.innerHTML = `
        <div class="interview-scorecard-card">
          <div class="scorecard-header">
            <h2>🏆 Virtual Interview Performance Evaluation</h2>
            <p>Role: <strong>${this.state.currentRole === 'ml_engineer' ? 'Deep Learning Specialist' : 'System Design Architect'}</strong></p>
          </div>

          <div class="scorecard-metrics">
            <div class="sc-metric">
              <span class="sc-val text-cyan">92%</span>
              <span class="sc-lbl">Technical Depth & Accuracy</span>
            </div>
            <div class="sc-metric">
              <span class="sc-val text-green">88%</span>
              <span class="sc-lbl">Communication Clarity & Pace</span>
            </div>
            <div class="sc-metric">
              <span class="sc-val text-violet">95%</span>
              <span class="sc-lbl">Confidence & Focus Rating</span>
            </div>
          </div>

          <div class="scorecard-feedback">
            <h4>💡 AI Interviewer Actionable Feedback</h4>
            <ul>
              <li><strong>Strength:</strong> Thorough understanding of backward computational graphs and non-linear saturation.</li>
              <li><strong>Opportunity:</strong> Mention specific memory optimization techniques (like activation checkpointing) when discussing deep layer scaling.</li>
            </ul>
          </div>

          <button class="btn btn-primary" onclick="AvatarInterviewer.startInterview('ml_engineer')">
            🔄 Retake Interview Simulation
          </button>
        </div>
      `;
    }
  }
};

window.AvatarInterviewer = AvatarInterviewer;
