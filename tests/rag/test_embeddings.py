"""
Tests for RAG Embedding Service (rag/embeddings.py).
"""

import pytest
from unittest.mock import MagicMock, patch

from rag.embeddings import (
    EmbeddingService,
    compute_cosine_similarity,
    generate_synthetic_embedding,
    generate_embedding,
    generate_embeddings,
    EMBEDDING_DIMENSION,
)


def test_embedding_dimension():
    """Verifies that generated embeddings always conform to 768 dimensions."""
    emb = generate_embedding("Pothole on 5th Avenue")
    assert isinstance(emb, list)
    assert len(emb) == EMBEDDING_DIMENSION
    assert all(isinstance(x, float) for x in emb)


def test_batch_embeddings_dimension():
    """Verifies batch embedding generation and matching dimensions."""
    texts = [
        "Dangerous road cave-in",
        "Water main valve leaking",
        "Streetlight blackout on Main St",
    ]
    embeddings = generate_embeddings(texts)
    assert len(embeddings) == 3
    for emb in embeddings:
        assert len(emb) == EMBEDDING_DIMENSION


def test_cosine_similarity_identical_vectors():
    """Verifies cosine similarity of identical vectors is 1.0."""
    v1 = [0.5, 0.5, 0.5, 0.5]
    assert pytest.approx(compute_cosine_similarity(v1, v1), 0.0001) == 1.0


def test_cosine_similarity_orthogonal_vectors():
    """Verifies cosine similarity of orthogonal vectors is 0.0."""
    v1 = [1.0, 0.0]
    v2 = [0.0, 1.0]
    assert compute_cosine_similarity(v1, v2) == 0.0


def test_synthetic_embedding_determinism():
    """Verifies deterministic output for identical text seeds."""
    emb1 = generate_synthetic_embedding("Road repair on Broadway", dim=768)
    emb2 = generate_synthetic_embedding("Road repair on Broadway", dim=768)
    assert emb1 == emb2

    # Different text should produce different vectors
    emb3 = generate_synthetic_embedding("Water leak on Elm St", dim=768)
    assert emb1 != emb3


def test_mocked_gemini_client_call():
    """Verifies that Google GenAI SDK client response is properly parsed."""
    service = EmbeddingService(api_key="test-mock-key", model_name="gemini-embedding-2", dimension=768)

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_emb_obj = MagicMock()
    mock_emb_obj.values = [0.1] * 768
    mock_response.embeddings = [mock_emb_obj]
    mock_client.models.embed_content.return_value = mock_response

    with patch.object(service, "_get_client", return_value=mock_client):
        emb = service.generate_embedding("Test civic problem", is_query=True)
        assert len(emb) == 768
        assert emb[0] == 0.1
        mock_client.models.embed_content.assert_called_once()
