/**
 * FocusFlow AI - Local Data Store & Persistence Layer
 * Provides seamless offline and online data persistence with seed domains,
 * study groups, default courses, practice question banks, and user stats.
 */

const FocusStorage = {
  KEYS: {
    USER_PROFILE: 'ff_user_profile',
    FOCUS_SURVEY: 'ff_focus_survey',
    SOURCES: 'ff_sources',
    FLASHCARDS: 'ff_flashcards',
    PRACTICE_QUESTIONS: 'ff_practice_questions',
    UNSOLVED_QUESTIONS: 'ff_unsolved_questions',
    STUDY_GROUPS: 'ff_study_groups',
    EXAM_RECORDS: 'ff_exam_records',
    INTERVIEW_RECORDS: 'ff_interview_records',
    DAILY_STATS: 'ff_daily_stats',
    SETTINGS: 'ff_settings',
    SAVED_KEYFRAMES: 'ff_saved_keyframes',
    CLAIMED_REWARDS: 'ff_claimed_rewards',
    DEMO_USERS: 'ff_demo_users',
    AUTH_TOKEN: 'ff_auth_token'
  },

  init() {
    if (!this.get(this.KEYS.USER_PROFILE)) {
      this.set(this.KEYS.USER_PROFILE, {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: 'Alex Rivera',
        email: 'alex.rivera@student.focusflow.ai',
        avatar: '👨‍🎓',
        level: 3,
        xp: 1450,
        gems: 85,
        streakDays: 6,
        lastActiveDate: new Date().toISOString().split('T')[0],
        baselineFocusMinutes: 20, // baseline sitting focus before stretch
        currentStretchFocusMinutes: 35, // current target sitting stretch (+15 min)
        targetDailyFocusMinutes: 90,
        enduranceLevel: 'Intermediate Pacer',
        preferredDomains: ['Computer Science', 'Machine Learning & AI', 'System Design']
      });
    }

    if (!this.get(this.KEYS.FOCUS_SURVEY)) {
      this.set(this.KEYS.FOCUS_SURVEY, {
        completed: true,
        baselineFocusMinutes: 20,
        distractionTriggers: ['Short-form videos (Reels/Shorts)', 'Phone notifications', 'Mental fatigue after 15m'],
        preferredStudyTime: 'Evening (6 PM - 10 PM)',
        learningGoal: 'Master System Architecture & Full-Stack AI Engineering',
        targetDailySittingTime: 120
      });
    }

    if (!this.get(this.KEYS.SOURCES)) {
      this.set(this.KEYS.SOURCES, [
        {
          id: 'src_yt_1',
          type: 'youtube',
          title: 'Neural Networks & Deep Learning Explained from Scratch',
          author: '3Blue1Brown & Andrej Karpathy',
          url: 'https://www.youtube.com/watch?v=aircAruvnKk',
          videoId: 'aircAruvnKk',
          duration: 3600, // 60 mins
          thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
          category: 'Machine Learning',
          addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          notes: 'Crucial for understanding backpropagation and gradient descent matrix calculus.',
          subpartKeyframes: [
            { start: '00:00', end: '12:30', startSec: 0, endSec: 750, title: 'Biological vs Artificial Neurons', summary: 'Foundational architecture of biological synapses and perceptrons.' },
            { start: '12:30', end: '28:45', startSec: 750, endSec: 1725, title: 'Activation Functions (ReLU, Sigmoid, GeLU)', summary: 'Non-linear transformations and gradient saturation.' },
            { start: '28:45', end: '45:10', startSec: 1725, endSec: 2710, title: 'Backpropagation & Gradient Descent', summary: 'Derivation of partial derivatives via chain rule in computation graphs.' },
            { start: '45:10', end: '60:00', startSec: 2710, endSec: 3600, title: 'Stochastic Optimizers & Loss Functions', summary: 'Cross-entropy loss, Adam, and momentum updates.' }
          ]
        },
        {
          id: 'src_yt_2',
          type: 'youtube',
          title: 'System Design Interview – Distributed Caching & Redis',
          author: 'ByteByteGo System Architecture',
          url: 'https://www.youtube.com/watch?v=jgpVdJB2sKQ',
          videoId: 'jgpVdJB2sKQ',
          duration: 2700, // 45 mins
          thumbnail: 'https://img.youtube.com/vi/jgpVdJB2sKQ/maxresdefault.jpg',
          category: 'System Design',
          addedAt: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Covers cache eviction (LRU, LFU) and cache consistency protocols.',
          subpartKeyframes: [
            { start: '00:00', end: '15:20', startSec: 0, endSec: 920, title: 'Cache Aside vs Write-Through Patterns', summary: 'Tradeoffs between read-heavy vs write-heavy distributed systems.' },
            { start: '15:20', end: '32:10', startSec: 920, endSec: 1930, title: 'Cache Invalidation & Thundering Herd Problem', summary: 'Preventing DB thundering herds using mutex locks and probabilistic early expiration.' }
          ]
        },
        {
          id: 'src_pdf_1',
          type: 'pdf',
          title: 'Attention Is All You Need - Transformer Architecture.pdf',
          author: 'Vaswani et al. (Google Research)',
          size: '2.4 MB',
          pages: 15,
          category: 'AI Research',
          addedAt: new Date().toISOString(),
          content: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.'
        }
      ]);
    }

    if (!this.get(this.KEYS.FLASHCARDS)) {
      this.set(this.KEYS.FLASHCARDS, [
        {
          id: 'fc_1',
          deck: 'Deep Learning',
          question: 'What problem does the Vanishing Gradient problem cause in Deep Networks, and how does ReLU mitigate it?',
          answer: 'With Sigmoid/Tanh, gradients become exponentially small as depth increases, halting weight updates. ReLU maintains a constant gradient of 1 for all positive inputs, preventing gradient shrinkage.',
          category: 'Machine Learning',
          box: 2, // Leitner box 1-5
          nextReviewDate: new Date().toISOString()
        },
        {
          id: 'fc_2',
          deck: 'System Design',
          question: 'What is the difference between Cache-Aside and Write-Through caching patterns?',
          answer: 'Cache-Aside: The application reads from cache; on miss, loads from DB and updates cache. Write-Through: Data is written to the cache and the database synchronously, ensuring consistency but higher write latency.',
          category: 'System Design',
          box: 3,
          nextReviewDate: new Date().toISOString()
        },
        {
          id: 'fc_3',
          deck: 'Transformers & NLP',
          question: 'Why is Multi-Head Attention superior to Single-Head Self-Attention?',
          answer: 'Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions, capturing multiple relationships (e.g. syntactic, semantic) simultaneously.',
          category: 'Machine Learning',
          box: 1,
          nextReviewDate: new Date().toISOString()
        }
      ]);
    }

    if (!this.get(this.KEYS.PRACTICE_QUESTIONS)) {
      this.set(this.KEYS.PRACTICE_QUESTIONS, [
        {
          id: 'pq_1',
          domain: 'Computer Science',
          topic: 'Data Structures & Algorithms',
          difficulty: 'Intermediate',
          question: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. What is the optimal time and space complexity using a Hash Map?',
          options: [
            'O(N^2) Time, O(1) Space',
            'O(N log N) Time, O(N) Space',
            'O(N) Time, O(N) Space (Hash Map one-pass lookup)',
            'O(1) Time, O(N^2) Space'
          ],
          correctIndex: 2,
          explanation: 'By storing the complement (target - nums[i]) in a Hash Map during a single traversal, lookups occur in average O(1) time, yielding overall O(N) time and O(N) auxiliary space.',
          hints: [
            'Think about what value you need to look for when inspecting the current number.',
            'Can you look up previously seen numbers in constant O(1) time?'
          ],
          solved: true
        },
        {
          id: 'pq_2',
          domain: 'Machine Learning',
          topic: 'Loss Functions & Optimization',
          difficulty: 'Advanced',
          question: 'Why is Cross-Entropy Loss preferred over Mean Squared Error (MSE) for multiclass classification with Softmax output?',
          options: [
            'MSE is not differentiable with Softmax.',
            'Cross-Entropy produces a non-convex optimization surface.',
            'When using Softmax with MSE, gradients saturate near 0 or 1, causing slow learning; Cross-Entropy cancels out the derivative of softmax, providing steep error gradients when predictions are wrong.',
            'Cross-Entropy always guarantees a global minimum in non-linear multi-layer networks.'
          ],
          correctIndex: 2,
          explanation: 'Combining Cross-Entropy with Softmax leads to a simplified gradient formula (p_i - y_i). If prediction is poor, the gradient is large, avoiding vanishing gradients during backprop.',
          hints: [
            'Consider the derivative of the Sigmoid/Softmax function and what happens when the error is high.',
            'Look at the relationship between log probabilities and gradient magnitude.'
          ],
          solved: false
        },
        {
          id: 'pq_3',
          domain: 'System Design',
          topic: 'Distributed Systems & Database Sharding',
          difficulty: 'Advanced',
          question: 'In a distributed database, what is the primary benefit of Consistent Hashing over simple Modulo Hashing (hash(key) % N)?',
          options: [
            'Consistent Hashing guarantees 100% ACID compliance across all replica nodes.',
            'When a new node is added or removed, Consistent Hashing only remaps K/N keys on average, whereas Modulo Hashing invalidates and remaps almost all keys.',
            'Consistent Hashing eliminates network latency between geographical regions.',
            'Consistent Hashing prevents write conflicts without needing two-phase commit.'
          ],
          correctIndex: 1,
          explanation: 'Consistent Hashing places nodes and keys on a virtual ring (0 to 2^32-1). Adding/removing a node only shifts keys between immediate neighbors, drastically reducing re-sharding overhead.',
          hints: [
            'Think about what happens to hash(key) % (N+1) when N changes from 10 to 11 for all existing keys.',
            'How many keys need to move when a node joins a ring structure?'
          ],
          solved: false
        },
        {
          id: 'pq_4',
          domain: 'Web Development',
          topic: 'Frontend Architecture & Security',
          difficulty: 'Intermediate',
          question: 'Which HTTP header prevents your web application from being embedded inside an unauthorized `<iframe>`, mitigating Clickjacking attacks?',
          options: [
            'Content-Security-Policy: frame-ancestors',
            'Access-Control-Allow-Origin',
            'Strict-Transport-Security (HSTS)',
            'X-XSS-Protection'
          ],
          correctIndex: 0,
          explanation: 'CSP frame-ancestors directive (and legacy X-Frame-Options) controls whether a browser can render a page inside <frame>, <iframe>, <embed>, or <object>.',
          hints: [
            'Think about frame embedding security policies.',
            'Look for policies concerning frame ancestor hierarchy.'
          ],
          solved: true
        }
      ]);
    }

    if (!this.get(this.KEYS.UNSOLVED_QUESTIONS)) {
      this.set(this.KEYS.UNSOLVED_QUESTIONS, ['pq_2', 'pq_3']);
    }

    if (!this.get(this.KEYS.STUDY_GROUPS)) {
      this.set(this.KEYS.STUDY_GROUPS, [
        {
          id: 'grp_deepmind_101',
          name: 'AI & Neural Systems Sprint (8/10)',
          inviteCode: 'FOCUS-NEURO-88',
          topic: 'Transformers, Backpropagation & Keyframe Analysis',
          maxMembers: 10,
          currentCount: 8,
          activeVoice: true,
          members: [
            { id: 'm1', name: 'Alex Rivera (You)', avatar: '👨‍🎓', isMuted: false, isSpeaking: false, isHost: true, cameraOn: true },
            { id: 'm2', name: 'Sarah Chen', avatar: '👩‍💻', isMuted: true, isSpeaking: false, isHost: false, cameraOn: true },
            { id: 'm3', name: 'Marcus Brody', avatar: '👨‍🔬', isMuted: false, isSpeaking: true, isHost: false, cameraOn: true },
            { id: 'm4', name: 'Priya Sharma', avatar: '👩‍🏫', isMuted: true, isSpeaking: false, isHost: false, cameraOn: false },
            { id: 'm5', name: 'Liam Vance', avatar: '👨‍🚀', isMuted: true, isSpeaking: false, isHost: false, cameraOn: true },
            { id: 'm6', name: 'Zoe Martinez', avatar: '👩‍🎨', isMuted: false, isSpeaking: false, isHost: false, cameraOn: true },
            { id: 'm7', name: 'Kenji Sato', avatar: '👨‍💼', isMuted: true, isSpeaking: false, isHost: false, cameraOn: false },
            { id: 'm8', name: 'Elena Rostova', avatar: '👩‍🔬', isMuted: true, isSpeaking: false, isHost: false, cameraOn: true }
          ],
          doubts: [
            { id: 'd1', author: 'Marcus Brody', time: '10 mins ago', text: 'Can someone clarify why in keyframe 28:45-35:20 of the backprop video, the gradient matrix dimension is transposed?' },
            { id: 'd2', author: 'Sarah Chen', time: '4 mins ago', text: 'Because dL/dW = X^T * dL/dZ to maintain dimensional alignment with weight matrix W (m x n)!' }
          ]
        },
        {
          id: 'grp_sys_design',
          name: 'System Design Architecture Cohort',
          inviteCode: 'FOCUS-SYS-42',
          topic: 'High Throughput Caching & Microservices',
          maxMembers: 10,
          currentCount: 6,
          activeVoice: false,
          members: [
            { id: 'm1', name: 'Alex Rivera (You)', avatar: '👨‍🎓', isMuted: true, isSpeaking: false, isHost: false, cameraOn: true },
            { id: 'm9', name: 'David Kim', avatar: '👨‍💻', isMuted: true, isSpeaking: false, isHost: true, cameraOn: true }
          ],
          doubts: []
        }
      ]);
    }

    if (!this.get(this.KEYS.DAILY_STATS)) {
      const today = new Date().toISOString().split('T')[0];
      const stats = {};
      // Generate last 14 days of focus progression data
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - 86400000 * i).toISOString().split('T')[0];
        // Gradual upward curve of sitting focus capacity (e.g. 20m -> 45m -> 65m)
        const sittingFocus = Math.round(20 + (13 - i) * 3.5 + (Math.random() * 8 - 4));
        const verifiedWebcamMinutes = Math.round(sittingFocus * 0.92);
        stats[d] = {
          date: d,
          sittingFocusMinutes: sittingFocus,
          verifiedWebcamMinutes: verifiedWebcamMinutes,
          slackingPausedMinutes: sittingFocus - verifiedWebcamMinutes,
          completedMilestones: Math.floor(sittingFocus / 25),
          xpEarned: sittingFocus * 15,
          antiCheatIntegrity: 98
        };
      }
      this.set(this.KEYS.DAILY_STATS, stats);
    }
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  update(key, updaterFn) {
    const current = this.get(key);
    const updated = updaterFn(current);
    this.set(key, updated);
    return updated;
  }
};

// Initialize default storage immediately
FocusStorage.init();
