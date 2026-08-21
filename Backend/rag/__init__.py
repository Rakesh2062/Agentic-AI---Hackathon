"""
RAG (Retrieval-Augmented Generation) Module for Civic Complaint Platform.
Provides embedding generation, municipal knowledge base management, and vector retrieval.
"""

from rag.embeddings import (
    EmbeddingService,
    get_embedding_service,
    generate_embedding,
    generate_embeddings,
    DEFAULT_EMBEDDING_MODEL,
    EMBEDDING_DIMENSION,
)
from rag.chunker import (
    TextChunk,
    chunk_text,
    chunk_document,
)
from rag.knowledge_base import (
    KNOWLEDGE_BASE_COLLECTION,
    KnowledgeBaseDocument,
    get_municipal_knowledge_base_documents,
    seed_knowledge_base,
)
from rag.retriever import (
    RAGRetriever,
    get_rag_retriever,
    retrieve_relevant_guidelines,
    get_relevant_resolution_sop,
)

__all__ = [
    "EmbeddingService",
    "get_embedding_service",
    "generate_embedding",
    "generate_embeddings",
    "DEFAULT_EMBEDDING_MODEL",
    "EMBEDDING_DIMENSION",
    "TextChunk",
    "chunk_text",
    "chunk_document",
    "KNOWLEDGE_BASE_COLLECTION",
    "KnowledgeBaseDocument",
    "get_municipal_knowledge_base_documents",
    "seed_knowledge_base",
    "RAGRetriever",
    "get_rag_retriever",
    "retrieve_relevant_guidelines",
    "get_relevant_resolution_sop",
]
