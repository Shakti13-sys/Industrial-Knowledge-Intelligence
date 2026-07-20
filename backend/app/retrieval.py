"""
Retrieval layer.

The original implementation scored documents by raw word-overlap count
(`len(question_words & doc_words)`), which ranks a chunk containing every
stopword in the question above a chunk that precisely answers it, and gives
identical scores to wildly different matches. It also matched at the whole
*document* level, so a single relevant paragraph was diluted by an entire
unrelated report.

This module replaces that with dependency-free TF-IDF + cosine similarity
over individual chunks. It's still "keyword-ish" (no embeddings, no vector
DB) -- deliberately, to match the PRD's stated build risk trade-off -- but it
ranks correctly and is expressed behind a `Retriever` interface so a future
swap to a real vector database only means writing a new class, exactly the
"dict -> Neo4j, keyword match -> vector search" scalability story the PRD
asks teams to tell.
"""
from __future__ import annotations

import math
import re
from abc import ABC, abstractmethod
from collections import Counter
from dataclasses import dataclass
from typing import List

from app.storage import Chunk

_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9\-]*")
_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "of", "to", "in", "on", "for",
    "and", "or", "what", "when", "where", "how", "does", "do", "did", "it",
    "this", "that", "with", "as", "at", "by", "from", "be", "has", "have",
}


def tokenize(text: str) -> List[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if t not in _STOPWORDS]


@dataclass
class ScoredChunk:
    chunk: Chunk
    score: float


class Retriever(ABC):
    @abstractmethod
    def top_k(self, question: str, chunks: List[Chunk], k: int) -> List[ScoredChunk]:
        ...


class TfIdfRetriever(Retriever):
    """Ranks chunks by cosine similarity between TF-IDF vectors of the
    question and each chunk. O(n) per query at demo scale; swap for an ANN
    index (FAISS/pgvector) once corpus size makes that necessary."""

    def top_k(self, question: str, chunks: List[Chunk], k: int) -> List[ScoredChunk]:
        if not chunks:
            return []

        question_tokens = tokenize(question)
        if not question_tokens:
            return []

        doc_tokens = [tokenize(c.content) for c in chunks]
        doc_freq: Counter = Counter()
        for tokens in doc_tokens:
            doc_freq.update(set(tokens))

        n_docs = len(chunks)

        def idf(term: str) -> float:
            return math.log((n_docs + 1) / (doc_freq.get(term, 0) + 1)) + 1.0

        def vectorize(tokens: List[str]) -> Counter:
            tf = Counter(tokens)
            length = len(tokens) or 1
            return Counter({term: (count / length) * idf(term) for term, count in tf.items()})

        q_vec = vectorize(question_tokens)
        q_norm = math.sqrt(sum(v * v for v in q_vec.values())) or 1.0

        scored = []
        for chunk, tokens in zip(chunks, doc_tokens):
            if not tokens:
                continue
            d_vec = vectorize(tokens)
            d_norm = math.sqrt(sum(v * v for v in d_vec.values())) or 1.0
            dot = sum(q_vec[t] * d_vec.get(t, 0.0) for t in q_vec)
            score = dot / (q_norm * d_norm)
            if score > 0:
                scored.append(ScoredChunk(chunk=chunk, score=round(score, 4)))

        scored.sort(key=lambda s: s.score, reverse=True)
        return scored[:k]


def get_retriever() -> Retriever:
    return TfIdfRetriever()
