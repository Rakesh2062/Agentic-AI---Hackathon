"""
Text chunking utilities for RAG document processing.
Splits municipal SOPs and policy guidelines into semantically coherent overlapping chunks.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TextChunk(BaseModel):
    """Represents a chunked segment of text with position and metadata."""
    chunk_id: str
    text: str
    chunk_index: int
    start_char: int
    end_char: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
    chunk_id_prefix: str = "chunk",
    metadata: Optional[Dict[str, Any]] = None,
) -> List[TextChunk]:
    """
    Splits text into overlapping chunks, respecting paragraph and sentence boundaries.
    """
    if not text or not text.strip():
        return []

    clean_text = text.strip()
    meta = metadata or {}

    # If text is smaller than chunk size, return single chunk
    if len(clean_text) <= chunk_size:
        return [
            TextChunk(
                chunk_id=f"{chunk_id_prefix}-0",
                text=clean_text,
                chunk_index=0,
                start_char=0,
                end_char=len(clean_text),
                metadata=meta,
            )
        ]

    chunks: List[TextChunk] = []
    start = 0
    chunk_idx = 0

    while start < len(clean_text):
        end = min(start + chunk_size, len(clean_text))

        # Try to break at paragraph boundary or sentence boundary
        if end < len(clean_text):
            # Look for paragraph break
            p_break = clean_text.rfind("\n\n", start + chunk_overlap, end)
            if p_break != -1:
                end = p_break + 2
            else:
                # Look for sentence break
                s_break = clean_text.rfind(". ", start + chunk_overlap, end)
                if s_break != -1:
                    end = s_break + 2
                else:
                    # Look for newline break
                    nl_break = clean_text.rfind("\n", start + chunk_overlap, end)
                    if nl_break != -1:
                        end = nl_break + 1
                    else:
                        # Look for space break
                        sp_break = clean_text.rfind(" ", start + chunk_overlap, end)
                        if sp_break != -1:
                            end = sp_break + 1

        chunk_content = clean_text[start:end].strip()
        if chunk_content:
            chunks.append(
                TextChunk(
                    chunk_id=f"{chunk_id_prefix}-{chunk_idx}",
                    text=chunk_content,
                    chunk_index=chunk_idx,
                    start_char=start,
                    end_char=end,
                    metadata=meta,
                )
            )
            chunk_idx += 1

        if end >= len(clean_text):
            break

        # Advance start with overlap
        start = max(end - chunk_overlap, start + 1)

    return chunks


def chunk_document(
    document: Dict[str, Any],
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> List[Dict[str, Any]]:
    """
    Chunks a Knowledge Base document dictionary and returns ready-to-index chunk records.
    """
    doc_id = document.get("document_id", "DOC-UNKNOWN")
    title = document.get("title", "")
    category = document.get("category", "")
    department = document.get("department", "")
    content = document.get("content", "")
    source = document.get("source", "Municipal Policy Handbook")
    doc_meta = document.get("metadata", {})

    text_chunks = chunk_text(
        text=content,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        chunk_id_prefix=doc_id,
        metadata={
            "document_id": doc_id,
            "title": title,
            "category": category,
            "department": department,
            "source": source,
            **doc_meta,
        },
    )

    chunk_records: List[Dict[str, Any]] = []
    for tc in text_chunks:
        chunk_records.append({
            "document_id": doc_id,
            "chunk_id": tc.chunk_id,
            "chunk_index": tc.chunk_index,
            "title": title,
            "category": category,
            "department": department,
            "content": tc.text,
            "source": source,
            "metadata": tc.metadata,
        })

    return chunk_records
