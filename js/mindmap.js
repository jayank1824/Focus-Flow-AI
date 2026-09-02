/**
 * FocusFlow AI - Interactive Mind Map Visualizer
 * 
 * Renders dynamic, zoomable, interactive concept hierarchy graphs on HTML5 Canvas.
 * Generates visual mind maps from video keyframe slices and study topics.
 */

const MindMapEngine = {
  state: {
    canvas: null,
    ctx: null,
    currentTree: null,
    scale: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    selectedNode: null,
    activeTopic: 'deep_learning'
  },

  TREES: {
    deep_learning: {
      id: 'root_dl',
      label: '🧠 Deep Learning & Backprop',
      color: '#00f2fe',
      desc: 'Hierarchical representation of neural network training mechanics.',
      children: [
        {
          id: 'dl_neurons',
          label: '⚡ Perceptrons & Activations',
          color: '#4facfe',
          desc: 'Biological neurons simulated via linear combinations + non-linear activation functions.',
          children: [
            { id: 'dl_relu', label: 'ReLU / LeakyReLU', color: '#38bdf8', desc: 'max(0, x) prevents vanishing gradients on positive inputs.' },
            { id: 'dl_sigmoid', label: 'Sigmoid / Tanh', color: '#38bdf8', desc: 'Outputs probabilities [0, 1] but saturates at extremes.' },
            { id: 'dl_gelu', label: 'GeLU & Swish', color: '#38bdf8', desc: 'Smooth non-monotonic activations used in modern Transformers.' }
          ]
        },
        {
          id: 'dl_backprop',
          label: '🔄 Backpropagation (Keyframe 28:45)',
          color: '#f6d365',
          desc: 'Chain rule matrix calculus propagating loss backward through layers.',
          children: [
            { id: 'dl_chain', label: 'Chain Rule Derivatives', color: '#fcd34d', desc: 'dL/dW = (dL/dZ) · (A_prev)^T.' },
            { id: 'dl_computegraph', label: 'Computation Graphs', color: '#fcd34d', desc: 'DAG tracking forward tensors for backward autograd.' }
          ]
        },
        {
          id: 'dl_optimizers',
          label: '🚀 Optimization Algorithms',
          color: '#00f5a0',
          desc: 'Iterative parameter update rules to minimize empirical risk.',
          children: [
            { id: 'dl_sgd', label: 'SGD with Momentum', color: '#34d399', desc: 'Accumulates velocity to traverse saddle points.' },
            { id: 'dl_adam', label: 'Adam / AdamW', color: '#34d399', desc: 'Adaptive first and second moment estimation with weight decay.' }
          ]
        }
      ]
    },
    system_design: {
      id: 'root_sd',
      label: '🏛️ Distributed Systems & Caching',
      color: '#4facfe',
      desc: 'Architecture patterns for high-throughput, low-latency scaling.',
      children: [
        {
          id: 'sd_patterns',
          label: '📦 Caching Topologies',
          color: '#00f2fe',
          desc: 'Strategies for read and write path caching.',
          children: [
            { id: 'sd_cache_aside', label: 'Cache-Aside (Lazy)', color: '#38bdf8', desc: 'App manages cache misses by querying DB.' },
            { id: 'sd_write_through', label: 'Write-Through / Behind', color: '#38bdf8', desc: 'Synchronous or asynchronous cache-to-DB sync.' }
          ]
        },
        {
          id: 'sd_sharding',
          label: '🌐 Consistent Hashing',
          color: '#00f5a0',
          desc: 'Virtual hash ring minimizing key migration during node scaling.',
          children: [
            { id: 'sd_vnodes', label: 'Virtual Nodes', color: '#34d399', desc: 'Prevents hot spots by assigning multiple points per node.' },
            { id: 'sd_replication', label: 'Gossip & Replica Quorums', color: '#34d399', desc: 'R + W > N ensures strong consistency.' }
          ]
        }
      ]
    }
  },

  init() {
    this.canvas = document.getElementById('mindmap-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.state.currentTree = this.TREES[this.state.activeTopic];

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindInteractions();
    this.draw();
  },

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 800;
      this.canvas.height = parent.clientHeight || 500;
      this.state.panX = this.canvas.width / 2;
      this.state.panY = 60;
      this.draw();
    }
  },

  switchTopic(topicKey) {
    if (this.TREES[topicKey]) {
      this.state.activeTopic = topicKey;
      this.state.currentTree = this.TREES[topicKey];
      this.state.scale = 1;
      this.state.panX = this.canvas.width / 2;
      this.state.panY = 60;
      this.state.selectedNode = null;
      this.draw();
    }
  },

  bindInteractions() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      this.state.isDragging = true;
      this.state.dragStartX = e.clientX - this.state.panX;
      this.state.dragStartY = e.clientY - this.state.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state.isDragging) {
        this.state.panX = e.clientX - this.state.dragStartX;
        this.state.panY = e.clientY - this.state.dragStartY;
        this.draw();
      }
    });

    window.addEventListener('mouseup', () => {
      this.state.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.state.scale = Math.max(0.4, Math.min(2.5, this.state.scale * zoomFactor));
      this.draw();
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - this.state.panX) / this.state.scale;
      const clickY = (e.clientY - rect.top - this.state.panY) / this.state.scale;

      const hit = this.findNodeAt(this.state.currentTree, clickX, clickY);
      if (hit) {
        this.selectNode(hit);
      }
    });
  },

  findNodeAt(node, x, y) {
    if (!node || node.layoutX === undefined) return null;

    const dx = x - node.layoutX;
    const dy = y - node.layoutY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 30) return node;

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeAt(child, x, y);
        if (found) return found;
      }
    }
    return null;
  },

  selectNode(node) {
    this.state.selectedNode = node;
    this.draw();

    const infoEl = document.getElementById('mindmap-node-info');
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="node-info-card" style="border-left: 4px solid ${node.color}">
          <h4>${node.label}</h4>
          <p>${node.desc || 'Fundamental conceptual branch in learning hierarchy.'}</p>
          <div class="node-info-actions">
            <button class="btn btn-sm btn-primary" onclick="AITutor.openTutorModalWithPrompt('Explain the concept of ${node.label.replace(/'/g, '')} in depth with code/equations')">
              💬 Ask AI About This Node
            </button>
          </div>
        </div>
      `;
    }
  },

  calculateLayout(node, x, y, level, spread) {
    node.layoutX = x;
    node.layoutY = y;

    if (node.children && node.children.length > 0) {
      const count = node.children.length;
      const childSpread = spread * 0.75;
      const startX = x - (spread * (count - 1)) / 2;

      node.children.forEach((child, idx) => {
        const childX = count === 1 ? x : startX + idx * spread;
        const childY = y + 110;
        this.calculateLayout(child, childX, childY, level + 1, childSpread);
      });
    }
  },

  draw() {
    if (!this.ctx || !this.canvas || !this.state.currentTree) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate layout coordinates
    this.calculateLayout(this.state.currentTree, 0, 0, 0, 240);

    this.ctx.save();
    this.ctx.translate(this.state.panX, this.state.panY);
    this.ctx.scale(this.state.scale, this.state.scale);

    // Draw connecting bezier curves
    this.drawEdges(this.state.currentTree);

    // Draw nodes
    this.drawNodes(this.state.currentTree);

    this.ctx.restore();
  },

  drawEdges(node) {
    if (!node.children) return;

    node.children.forEach(child => {
      this.ctx.beginPath();
      this.ctx.moveTo(node.layoutX, node.layoutY);
      
      const midY = (node.layoutY + child.layoutY) / 2;
      this.ctx.bezierCurveTo(node.layoutX, midY, child.layoutX, midY, child.layoutX, child.layoutY);

      this.ctx.strokeStyle = child.color || '#4facfe';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = child.color || '#4facfe';
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();

      this.drawEdges(child);
    });
  },

  drawNodes(node) {
    const isSelected = this.state.selectedNode && this.state.selectedNode.id === node.id;

    // Node glowing bubble
    this.ctx.save();
    this.ctx.shadowColor = node.color || '#00f2fe';
    this.ctx.shadowBlur = isSelected ? 24 : 12;

    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(node.layoutX, node.layoutY, isSelected ? 28 : 22, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = node.color || '#00f2fe';
    this.ctx.lineWidth = isSelected ? 3.5 : 2;
    this.ctx.stroke();

    // Node label badge
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = isSelected ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(node.label, node.layoutX, node.layoutY + 38);

    this.ctx.restore();

    if (node.children) {
      node.children.forEach(child => this.drawNodes(child));
    }
  },

  zoomIn() {
    this.state.scale = Math.min(2.5, this.state.scale * 1.2);
    this.draw();
  },

  zoomOut() {
    this.state.scale = Math.max(0.4, this.state.scale * 0.8);
    this.draw();
  },

  resetView() {
    this.state.scale = 1;
    this.state.panX = this.canvas.width / 2;
    this.state.panY = 60;
    this.draw();
  }
};

window.MindMapEngine = MindMapEngine;
