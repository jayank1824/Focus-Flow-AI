"""
FocusFlow AI - Retrieval-Augmented Generation (RAG) Vector Engine
Chunks YouTube transcripts, research PDFs, and study notes.
Indexes text into vector representations and performs Top-K Cosine Similarity semantic retrieval.
"""

import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class RAGVectorEngine:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
        self.tfidf_matrix = None
        self._seed_default_knowledge()

    def _seed_default_knowledge(self):
        """
        Initializes core indexed knowledge base chunks for YouTube lectures and research papers.
        """
        seed_chunks = [
            {
                "id": "chunk_yt1_1",
                "source_title": "Neural Networks & Deep Learning Explained from Scratch",
                "source_type": "youtube",
                "video_id": "aircAruvnKk",
                "start_time": "00:00",
                "end_time": "12:30",
                "start_sec": 0,
                "end_sec": 750,
                "text": "Introduction to artificial neurons and perceptrons. Biological synapses receive electrical impulses across dendrites. An artificial neuron computes a weighted sum Z = W * X + b followed by an activation function sigma(Z) to introduce non-linearity."
            },
            {
                "id": "chunk_yt1_2",
                "source_title": "Neural Networks & Deep Learning Explained from Scratch",
                "source_type": "youtube",
                "video_id": "aircAruvnKk",
                "start_time": "12:30",
                "end_time": "28:45",
                "start_sec": 750,
                "end_sec": 1725,
                "text": "Activation functions and vanishing gradients. Sigmoid function squashes values to (0, 1) and tanh to (-1, 1). In deep networks, repeated multiplication of derivatives < 0.25 causes gradients to exponentially decay to 0, preventing weight updates. Rectified Linear Unit (ReLU) f(x) = max(0, x) provides a constant gradient of 1 for positive activations, mitigating vanishing gradients."
            },
            {
                "id": "chunk_yt1_3",
                "source_title": "Neural Networks & Deep Learning Explained from Scratch",
                "source_type": "youtube",
                "video_id": "aircAruvnKk",
                "start_time": "28:45",
                "end_time": "45:10",
                "start_sec": 1725,
                "end_sec": 2710,
                "text": "Backpropagation matrix calculus and computational graphs. Chain rule computes partial derivatives of the loss with respect to weights: dL/dW = dL/dZ * (A_prev)^T. The transpose matrix is necessary to maintain dimensional alignment with the weight tensor W of dimension (m x n)."
            },
            {
                "id": "chunk_yt2_1",
                "source_title": "System Design Interview – Distributed Caching & Redis",
                "source_type": "youtube",
                "video_id": "jgpVdJB2sKQ",
                "start_time": "00:00",
                "end_time": "15:20",
                "start_sec": 0,
                "end_sec": 920,
                "text": "Distributed Caching Topologies. Cache-Aside pattern: Application checks cache first on read; on cache miss, it reads from the primary database, updates the cache, and returns data. Write-Through pattern: Writes update cache and database synchronously, guaranteeing consistency but adding write latency."
            },
            {
                "id": "chunk_yt2_2",
                "source_title": "System Design Interview – Distributed Caching & Redis",
                "source_type": "youtube",
                "video_id": "jgpVdJB2sKQ",
                "start_time": "15:20",
                "end_time": "32:10",
                "start_sec": 920,
                "end_sec": 1930,
                "text": "Consistent Hashing and Ring Topologies. Modulo hashing hash(key) % N invalidates almost all keys when node count N changes. Consistent hashing places nodes and keys on a 2^32 virtual ring, migrating only K/N keys when nodes join or leave. Virtual nodes eliminate hot spots."
            },
            {
                "id": "chunk_pdf_1",
                "source_title": "Attention Is All You Need - Transformer Architecture.pdf",
                "source_type": "pdf",
                "page": 3,
                "text": "Scaled Dot-Product Attention computes Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V. The scaling factor 1 / sqrt(d_k) prevents dot products from growing large in magnitude for large key dimensions, which would otherwise push softmax into regions with vanishing gradients."
            }
        ]

        for chunk in seed_chunks:
            self.documents.append(chunk)

        self._rebuild_index()

    def _rebuild_index(self):
        """
        Re-computes TF-IDF vector space matrix across all indexed documents.
        """
        if not self.documents:
            return
        corpus = [doc["text"] for doc in self.documents]
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def add_document(self, title: str, doc_type: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Chunks and adds a new document to the vector index.
        """
        # Chunk text into ~300 character overlapping chunks
        words = content.split()
        chunk_size = 60
        overlap = 15

        for i in range(0, len(words), chunk_size - overlap):
            chunk_text = " ".join(words[i:i + chunk_size])
            chunk = {
                "id": f"chunk_dyn_{len(self.documents) + 1}",
                "source_title": title,
                "source_type": doc_type,
                "text": chunk_text,
                **(metadata or {})
            }
            self.documents.append(chunk)

        self._rebuild_index()

    def query(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search returning Top-K relevant chunks with cosine similarity scores.
        """
        if not self.documents or self.tfidf_matrix is None:
            return []

        query_vec = self.vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.05:  # Minimum similarity threshold
                doc = self.documents[idx].copy()
                doc["similarity_score"] = round(score, 3)
                results.append(doc)

        return results

    def query_by_timestamp_slice(self, video_id: str, start_sec: int, end_sec: int) -> Dict[str, Any]:
        """
        Retrieves grounded context for an exact YouTube keyframe interval [start_sec, end_sec].
        """
        matching_chunks = []
        for doc in self.documents:
            if doc.get("video_id") == video_id:
                d_start = doc.get("start_sec", 0)
                d_end = doc.get("end_sec", 3600)
                # Overlap check
                if not (end_sec < d_start or start_sec > d_end):
                    matching_chunks.append(doc)

        combined_text = "\n".join([c["text"] for c in matching_chunks])
        return {
            "video_id": video_id,
            "start_sec": start_sec,
            "end_sec": end_sec,
            "matching_chunks": matching_chunks,
            "grounded_context": combined_text
        }


# Global Singleton
rag_engine = RAGVectorEngine()
