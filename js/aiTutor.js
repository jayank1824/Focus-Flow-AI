/**
 * FocusFlow AI - AI Chatbot & Expert Voice Tutor
 * 
 * Features:
 * - Multi-persona teaching styles (Socratic, Feynman, Strict Exam Grader, Focus Coach)
 * - Full Voice support: Microphone Speech-to-Text & Text-to-Speech audio readout
 * - Gemini API key integration with rich heuristic fallback responses
 */

const AITutor = {
  state: {
    persona: 'feynman', // 'socratic' | 'feynman' | 'strict' | 'coach'
    apiKey: '',
    isListening: false,
    isSpeaking: false,
    speechRecognition: null,
    speechSynth: window.speechSynthesis || null,
    chatHistory: [
      {
        role: 'assistant',
        persona: 'feynman',
        text: "👋 Hey Alex! I'm your AI Expert Tutor. Whether you need a video keyframe explained like you're five, a Socratic deep-dive, or practice hints, I'm ready. You can type or tap the mic to speak!",
        time: 'Just now'
      }
    ]
  },

  init() {
    this.initSpeechRecognition();
    this.renderChatHistory();
    this.loadSavedApiKey();
  },

  loadSavedApiKey() {
    const settings = FocusStorage.get(FocusStorage.KEYS.SETTINGS) || {};
    if (settings.geminiApiKey) {
      this.state.apiKey = settings.geminiApiKey;
    }
  },

  saveApiKey(key) {
    this.state.apiKey = key;
    FocusStorage.update(FocusStorage.KEYS.SETTINGS, (settings) => {
      if (!settings) settings = {};
      settings.geminiApiKey = key;
      return settings;
    });
    if (window.FocusEngine) window.FocusEngine.showToast('🔑 API Key Saved!', 'success');
  },

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.state.speechRecognition = new SpeechRecognition();
      this.state.speechRecognition.continuous = false;
      this.state.speechRecognition.interimResults = false;
      this.state.speechRecognition.lang = 'en-US';

      this.state.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputEl = document.getElementById('tutor-chat-input');
        if (inputEl) {
          inputEl.value = transcript;
          this.sendMessage();
        }
      };

      this.state.speechRecognition.onend = () => {
        this.state.isListening = false;
        this.updateMicButtonUI();
      };

      this.state.speechRecognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        this.state.isListening = false;
        this.updateMicButtonUI();
      };
    }
  },

  toggleSpeechToText() {
    if (!this.state.speechRecognition) {
      if (window.FocusEngine) window.FocusEngine.showToast('Speech recognition not supported in this browser.', 'warning');
      return;
    }

    if (this.state.isListening) {
      this.state.speechRecognition.stop();
      this.state.isListening = false;
    } else {
      try {
        this.state.speechRecognition.start();
        this.state.isListening = true;
        if (window.FocusEngine) window.FocusEngine.showToast('🎙️ Listening... Speak your doubt clearly!', 'info');
      } catch (err) {
        console.warn('Recognition start issue:', err);
      }
    }
    this.updateMicButtonUI();
  },

  updateMicButtonUI() {
    const micBtn = document.getElementById('tutor-mic-btn');
    if (micBtn) {
      if (this.state.isListening) {
        micBtn.classList.add('recording-active');
        micBtn.innerHTML = '🔴 <span>Listening...</span>';
      } else {
        micBtn.classList.remove('recording-active');
        micBtn.innerHTML = '🎤';
      }
    }
  },

  setPersona(personaKey) {
    this.state.persona = personaKey;
    const personaLabels = {
      socratic: '🏛️ Socratic Teacher',
      feynman: '🧪 Feynman (ELI5 Analogies)',
      strict: '🎯 Strict Exam Grader',
      coach: '⚡ Focus & Sitting Coach'
    };

    const currentBadge = document.getElementById('active-persona-badge');
    if (currentBadge) {
      currentBadge.textContent = personaLabels[personaKey] || 'AI Tutor';
    }

    if (window.FocusEngine) {
      window.FocusEngine.showToast(`Switched teaching persona to ${personaLabels[personaKey]}`, 'info');
    }
  },

  async sendMessage() {
    const inputEl = document.getElementById('tutor-chat-input');
    if (!inputEl) return;

    const message = inputEl.value.trim();
    if (!message) return;

    // Append user message
    this.state.chatHistory.push({
      role: 'user',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    inputEl.value = '';
    this.renderChatHistory();

    // Show AI typing indicator
    this.showTypingIndicator(true);

    // Generate AI response (using Gemini if key provided, else intelligent heuristic)
    try {
      const responseText = await this.generateResponse(message);
      this.showTypingIndicator(false);

      this.state.chatHistory.push({
        role: 'assistant',
        persona: this.state.persona,
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      this.renderChatHistory();

      // Read out response if auto-speak is enabled
      const autoSpeak = document.getElementById('tutor-auto-speak-toggle');
      if (autoSpeak && autoSpeak.checked) {
        this.speakText(responseText);
      }
    } catch (err) {
      this.showTypingIndicator(false);
      console.error('AI Tutor error:', err);
    }
  },

  async generateResponse(userPrompt) {
    // If user provided Gemini API Key
    if (this.state.apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.state.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `You are an expert AI tutor with personality: ${this.state.persona}. Help the student with this question clearly: ${userPrompt}` }]
              }
            ]
          })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        console.warn('Gemini API call failed, falling back to local reasoning:', e);
      }
    }

    // Built-in Intelligent Reasoning Fallback
    return this.generateSmartHeuristicResponse(userPrompt, this.state.persona);
  },

  generateSmartHeuristicResponse(prompt, persona) {
    const lower = prompt.toLowerCase();

    // Context: Video Keyframe Doubts
    if (lower.includes('keyframe') || lower.includes('subpart') || lower.includes('timestamp') || lower.includes('backpropagation') || lower.includes('matrix') || lower.includes('neural')) {
      if (persona === 'feynman') {
        return `💡 **Think of backpropagation like adjusting water valves in a factory:**\n\nWhen water overflows at the end (the error/loss), you don't randomly smash pipes. You trace backward from the faucet to see which specific valve leaked the most! The transpose matrix $(\\mathbf{X}^T)$ is simply orienting the dimensions so the adjustment knob fits the pipe size. In mathematics, $\\frac{\\partial L}{\\partial W} = X^T \\cdot \\delta$. Does that mental picture click for you?`;
      } else if (persona === 'socratic') {
        return `🏛️ **Let's reason through this step by step:**\n\n1. If our weight matrix $W$ has dimension $(m \\times n)$ and output activation $A$ has dimension $(m \\times 1)$, what must the gradient matrix $\\frac{\\partial L}{\\partial W}$ dimension be to update $W$ directly?\n2. What happens if we do not transpose the input vector $X$ during matrix multiplication?`;
      } else if (persona === 'strict') {
        return `🎯 **Rigor Check:** The gradient of loss with respect to weight matrix $W^{[l]}$ is given by $\\nabla_{W^{[l]}} L = dZ^{[l]} \\cdot (A^{[l-1]})^T$. Failure to use the transpose results in an inner dimension mismatch error during linear algebra execution. Review equation (4.2) in deep learning fundamentals.`;
      } else {
        return `⚡ **Great focus!** You've targeted an essential concept in this subpart. Take 3 deep breaths, write down the formula $Z = WX + b$, and remember you're building solid sitting stamina today!`;
      }
    }

    // Context: System Design / Caching
    if (lower.includes('cache') || lower.includes('redis') || lower.includes('distributed') || lower.includes('system design')) {
      if (persona === 'feynman') {
        return `🧪 **Cache-Aside vs Write-Through Analogy:**\n\nImagine you run a busy restaurant. **Cache-Aside** is keeping a whiteboard of today's top 5 dishes. When someone orders, you check the whiteboard; if it's not there, you run to the walk-in pantry. **Write-Through** is having your cook and accountant write the ticket simultaneously so no order is ever lost, even if it takes 2 extra seconds.`;
      } else {
        return `💡 In distributed architectures, **Cache-Aside** offers flexible on-demand memory management, while **Write-Through** prevents cache staleness at the expense of write latency. To prevent thundering herds, always combine it with probabilistic early expiration or mutex locks!`;
      }
    }

    // General Query
    if (persona === 'socratic') {
      return `🏛️ That's a great question about *"${prompt}"*. Before I give the answer, what do you think is the primary bottleneck or constraint in this scenario?`;
    } else if (persona === 'feynman') {
      return `💡 Let's break down **${prompt}** using simple intuition: Imagine you're explaining this to a friend over coffee. The core principle comes down to three things: 1) What goes in, 2) The transformation rule, and 3) The validated outcome. How would you apply this to your current study topic?`;
    } else {
      return `🎯 **Core Concept Breakdown:**\n\n1. **Principle:** Ground all reasoning in first principles.\n2. **Application:** Test yourself with practice questions or active flashcards.\n3. **Action:** Break this into an active 30-min focus chunk to retain 85%+ of the material.`;
    }
  },

  speakText(text) {
    if (!this.state.speechSynth) return;

    // Clean markdown formatting before speaking
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');

    this.state.speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const visualizer = document.getElementById('tutor-voice-visualizer');

    utterance.onstart = () => {
      this.state.isSpeaking = true;
      if (visualizer) visualizer.classList.add('speaking-active');
    };

    utterance.onend = () => {
      this.state.isSpeaking = false;
      if (visualizer) visualizer.classList.remove('speaking-active');
    };

    utterance.onerror = () => {
      this.state.isSpeaking = false;
      if (visualizer) visualizer.classList.remove('speaking-active');
    };

    this.state.speechSynth.speak(utterance);
  },

  renderChatHistory() {
    const container = document.getElementById('tutor-messages-container');
    if (!container) return;

    container.innerHTML = this.state.chatHistory.map(msg => `
      <div class="chat-bubble ${msg.role}">
        <div class="bubble-header">
          <span class="bubble-sender">${msg.role === 'user' ? '👤 You' : '🤖 AI Expert Tutor (' + (msg.persona || 'Expert') + ')'}</span>
          <span class="bubble-time">${msg.time}</span>
        </div>
        <div class="bubble-text">${msg.text.replace(/\n/g, '<br>')}</div>
        ${msg.role === 'assistant' ? `
          <button class="btn-bubble-speak" onclick="AITutor.speakText(\`${msg.text.replace(/`/g, '\\`').replace(/"/g, '&quot;')}\`)">
            🔊 Listen
          </button>
        ` : ''}
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  },

  showTypingIndicator(show) {
    const indicator = document.getElementById('tutor-typing-indicator');
    if (indicator) {
      indicator.style.display = show ? 'flex' : 'none';
    }
  },

  openTutorModalWithPrompt(prompt) {
    if (window.App) window.App.switchView('tutor');
    const inputEl = document.getElementById('tutor-chat-input');
    if (inputEl) {
      inputEl.value = prompt;
      this.sendMessage();
    }
  }
};

window.AITutor = AITutor;
