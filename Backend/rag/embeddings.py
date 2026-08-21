"""
Gemini Embedding Service for RAG & Vector Similarity Search.
Uses the official Google GenAI SDK (google-genai) with 768-dimensional embeddings.
Includes graceful fallback to deterministic synthetic embeddings for tests and offline development.
"""

import os
import math
import random
import logging
from typing import Any, List, Optional

logger = logging.getLogger(__name__)

# Default model configuration
DEFAULT_EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "768"))


def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two numerical vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return float(dot / (norm1 * norm2))


import re

def generate_synthetic_embedding(seed_text: str, dim: int = EMBEDDING_DIMENSION) -> List[float]:
    """
    Generates a deterministic normalized synthetic embedding vector from seed text
    using word and character n-gram vector accumulation. Words sharing stems and vocabulary
    yield strong positive cosine similarity. Used for unit testing, offline development, and fallback mode.
    """
    if not seed_text or not seed_text.strip():
        return [0.0] * dim

    words = re.findall(r"\w+", seed_text.lower())
    if not words:
        return [0.0] * dim

    vec = [0.0] * dim
    for w in words:
        tokens = [w]
        if len(w) >= 3:
            tokens.extend([w[i:i + 3] for i in range(len(w) - 2)])
        for t in tokens:
            rng = random.Random(t)
            for i in range(dim):
                vec[i] += rng.gauss(0, 1)

    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0.0:
        return [0.0] * dim
    return [round(x / norm, 6) for x in vec]


class EmbeddingService:
    """
    Manages embedding generation using Google GenAI SDK (google-genai).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        dimension: int = EMBEDDING_DIMENSION,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model_name = model_name or DEFAULT_EMBEDDING_MODEL
        self.dimension = dimension
        self._client = None

    def _get_client(self):
        """Lazy-initializes the Google GenAI client."""
        if self._client is None and self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except ImportError:
                logger.warning("google-genai not installed; using synthetic fallback.")
            except Exception as e:
                logger.warning("Failed to initialize Google GenAI Client: %s", e)
        return self._client

    def generate_embedding(
        self,
        text: str,
        is_query: bool = False,
        title: Optional[str] = None,
    ) -> List[float]:
        """
        Generates a 768-dimensional embedding vector for input text.
        Applies asymmetric task formatting when using gemini-embedding-2.
        """
        if not text or not text.strip():
            return [0.0] * self.dimension

        client = self._get_client()
        if client is None:
            # Deterministic fallback
            return generate_synthetic_embedding(text, dim=self.dimension)

        try:
            from google.genai import types

            # Format prompt for asymmetric retrieval
            if "gemini-embedding-2" in self.model_name:
                if is_query:
                    formatted_text = f"task: search result | query: {text}"
                else:
                    doc_title = title or "none"
                    formatted_text = f"title: {doc_title} | text: {text}"
            else:
                formatted_text = text

            response = client.models.embed_content(
                model=self.model_name,
                contents=formatted_text,
                config=types.EmbedContentConfig(output_dimensionality=self.dimension),
            )

            if response and response.embeddings:
                values = list(response.embeddings[0].values)
                # Ensure dimension
                if len(values) > self.dimension:
                    values = values[:self.dimension]
                elif len(values) < self.dimension:
                    values.extend([0.0] * (self.dimension - len(values)))
                return [round(float(v), 6) for v in values]

        except Exception as e:
            logger.warning("Gemini embedding API call failed (%s). Falling back to synthetic embedding.", e)

        return generate_synthetic_embedding(text, dim=self.dimension)

    def generate_embeddings(
        self,
        texts: List[str],
        is_query: bool = False,
        titles: Optional[List[Optional[str]]] = None,
    ) -> List[List[float]]:
        """
        Generates embeddings for a batch of texts.
        """
        results: List[List[float]] = []
        for i, text in enumerate(texts):
            doc_title = titles[i] if titles and i < len(titles) else None
            emb = self.generate_embedding(text, is_query=is_query, title=doc_title)
            results.append(emb)
        return results


# Global singleton instance
_embedding_service_instance: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Returns the global EmbeddingService singleton."""
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService()
    return _embedding_service_instance


def generate_embedding(text: str, is_query: bool = False, title: Optional[str] = None) -> List[float]:
    """Convenience helper to generate an embedding for a single text."""
    return get_embedding_service().generate_embedding(text, is_query=is_query, title=title)


def generate_embeddings(texts: List[str], is_query: bool = False) -> List[List[float]]:
    """Convenience helper to generate embeddings for a list of texts."""
    return get_embedding_service().generate_embeddings(texts, is_query=is_query)
