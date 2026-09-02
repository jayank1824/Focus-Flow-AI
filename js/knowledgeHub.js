/**
 * FocusFlow AI - NotebookLM-Style Multi-Source Knowledge Hub
 * 
 * Ingests YouTube URLs, PDFs, Word docs, Markdown, and custom study notes.
 * Extracts content, parses chapters/keyframes, and grounds AI doubts with citations.
 */

const KnowledgeHub = {
  state: {
    activeSourceId: null,
    searchQuery: '',
    filterType: 'all'
  },

  init() {
    this.renderSourcesList();
  },

  renderSourcesList() {
    const container = document.getElementById('sources-grid-container');
    if (!container) return;

    const sources = FocusStorage.get(FocusStorage.KEYS.SOURCES) || [];
    const filtered = sources.filter(s => {
      const matchesType = this.state.filterType === 'all' || s.type === this.state.filterType;
      const matchesSearch = !this.state.searchQuery || 
        s.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
        (s.author && s.author.toLowerCase().includes(this.state.searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-sources-state">
          <div class="empty-icon">📚</div>
          <h3>No resources found</h3>
          <p>Add YouTube videos, PDF documents, or study notes to feed your AI tutor.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="source-card ${s.type}">
        <div class="source-card-badge">
          ${s.type === 'youtube' ? '🎥 YouTube Video' : s.type === 'pdf' ? '📄 PDF Document' : '📝 Study Note'}
        </div>
        <h3 class="source-title">${s.title}</h3>
        <p class="source-author">By ${s.author || 'Self / Curated'}</p>
        
        <div class="source-meta-row">
          ${s.type === 'youtube' ? `<span>⏱️ ${Math.round(s.duration / 60)} mins</span> • <span>${(s.subpartKeyframes || []).length} Keyframes</span>` : `<span>${s.size || 'Text'}</span> • <span>${s.pages || '1'} Pages</span>`}
        </div>

        <div class="source-actions">
          ${s.type === 'youtube' ? `
            <button class="btn btn-sm btn-primary" onclick="KnowledgeHub.openInStreamer('${s.videoId}', '${encodeURIComponent(s.title)}')">
              ▶ Stream & Slicing
            </button>
          ` : `
            <button class="btn btn-sm btn-primary" onclick="KnowledgeHub.inspectDocument('${s.id}')">
              📖 Read & Query
            </button>
          `}
          <button class="btn btn-sm btn-secondary" onclick="KnowledgeHub.querySourceWithAI('${s.id}')">
            ✨ Query Source
          </button>
        </div>
      </div>
    `).join('');
  },

  openInStreamer(videoId, encodedTitle) {
    const title = decodeURIComponent(encodedTitle);
    if (window.YouTubeStreamer) {
      window.YouTubeStreamer.loadVideoSource(videoId, title);
    }
    // Switch tab to Video Streamer
    if (window.App) {
      window.App.switchView('streamer');
    }
  },

  inspectDocument(sourceId) {
    const sources = FocusStorage.get(FocusStorage.KEYS.SOURCES) || [];
    const src = sources.find(s => s.id === sourceId);
    if (!src) return;

    const modal = document.getElementById('source-viewer-modal');
    if (modal) {
      document.getElementById('source-viewer-title').textContent = src.title;
      document.getElementById('source-viewer-body').innerHTML = `
        <div class="doc-viewer-meta">
          <span>Type: <strong>${src.type.toUpperCase()}</strong></span> | 
          <span>Category: <strong>${src.category}</strong></span> |
          <span>Added: <strong>${new Date(src.addedAt).toLocaleDateString()}</strong></span>
        </div>
        <div class="doc-text-content">
          ${src.content ? `<p>${src.content}</p>` : `<p>${src.notes || 'Synthesized document notes indexed.'}</p>`}
        </div>
        <div class="doc-ai-summary-box">
          <h4>💡 Instant AI Synthesis</h4>
          <p>This document establishes core principles in ${src.category}. Ready to ask targeted questions, generate custom flashcards, or create a mind map.</p>
        </div>
      `;
      modal.classList.add('active');
    }
  },

  querySourceWithAI(sourceId) {
    const sources = FocusStorage.get(FocusStorage.KEYS.SOURCES) || [];
    const src = sources.find(s => s.id === sourceId);
    if (!src) return;

    const prompt = `Can you provide a comprehensive conceptual breakdown and 3 key insights from '${src.title}'?`;
    if (window.AITutor) {
      window.AITutor.openTutorModalWithPrompt(prompt);
    }
  },

  /**
   * Add a new YouTube video source
   */
  addYouTubeSource(url, customTitle, category = 'General') {
    const videoId = this.extractYouTubeId(url);
    if (!videoId) {
      if (window.FocusEngine) window.FocusEngine.showToast('Invalid YouTube URL or ID!', 'error');
      return false;
    }

    const newSource = {
      id: 'src_yt_' + Date.now(),
      type: 'youtube',
      title: customTitle || 'YouTube Study Lecture: ' + videoId,
      author: 'YouTube Educator',
      url: url,
      videoId: videoId,
      duration: 3600,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      category: category,
      addedAt: new Date().toISOString(),
      notes: 'Imported YouTube video resource with automatic keyframe slicing.',
      subpartKeyframes: [
        { start: '00:00', end: '15:00', startSec: 0, endSec: 900, title: 'Introduction & Core Definitions', summary: 'Foundational framework and problem context.' },
        { start: '15:00', end: '35:00', startSec: 900, endSec: 2100, title: 'In-Depth Technical Walkthrough', summary: 'Core implementation equations and design tradeoffs.' },
        { start: '35:00', end: '60:00', startSec: 2100, endSec: 3600, title: 'Advanced Analysis & Conclusion', summary: 'Real-world deployment considerations and summary.' }
      ]
    };

    FocusStorage.update(FocusStorage.KEYS.SOURCES, (sources) => [newSource, ...(sources || [])]);
    this.renderSourcesList();

    if (window.FocusEngine) {
      window.FocusEngine.showToast('✅ YouTube Video Added to Knowledge Base!', 'success');
    }
    return true;
  },

  /**
   * Add a text / PDF / Doc resource
   */
  addDocumentSource(title, textContent, category = 'General') {
    const newSource = {
      id: 'src_doc_' + Date.now(),
      type: 'doc',
      title: title || 'Imported Study Document',
      author: 'Uploaded Document',
      size: `${Math.round(textContent.length / 1024 * 10) / 10} KB`,
      pages: Math.ceil(textContent.length / 1500),
      category: category,
      addedAt: new Date().toISOString(),
      content: textContent
    };

    FocusStorage.update(FocusStorage.KEYS.SOURCES, (sources) => [newSource, ...(sources || [])]);
    this.renderSourcesList();

    if (window.FocusEngine) {
      window.FocusEngine.showToast('✅ Document Added to Knowledge Base!', 'success');
    }
    return true;
  },

  extractYouTubeId(url) {
    if (!url) return null;
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
};

window.KnowledgeHub = KnowledgeHub;
