"""
Agent Layer Configuration.

All environment variables and LLM provider settings are centralized here.
The LLM provider is abstracted behind a common interface so the project
can later switch between Gemini, Groq, OpenAI, or any compatible provider.
"""

from __future__ import annotations

import os
import logging
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env file
load_dotenv()


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_FORMAT = "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("agents")


# ---------------------------------------------------------------------------
# Department & Category Constants
# ---------------------------------------------------------------------------
class Department(str, Enum):
    # Names MUST match frontend DepartmentsList exactly (constants.js)
    ROADS             = "Roads & Infrastructure"
    WATER             = "Water & Sewage Board"
    WASTE             = "Solid Waste Management"
    STREETLIGHTS      = "Street Lighting & Electrical"
    DRAINAGE          = "Stormwater & Drainage"
    TRAFFIC           = "Traffic Management & Signals"
    PARKS             = "Parks & Urban Forestry"


class ComplaintCategory(str, Enum):
    ROADS = "roads"
    DRAINAGE = "drainage"
    WASTE = "waste"
    WATER = "water"
    STREETLIGHTS = "streetlights"
    PUBLIC_FACILITIES = "public_facilities"
    OTHER = "other"


class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ComplaintStatus(str, Enum):
    SUBMITTED = "submitted"
    CLASSIFIED = "classified"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"
    DUPLICATE = "duplicate"


# ---------------------------------------------------------------------------
# SLA Configuration (hours)
# ---------------------------------------------------------------------------
SLA_HOURS: dict[str, int] = {
    PriorityLevel.CRITICAL: 4,
    PriorityLevel.HIGH: 24,
    PriorityLevel.MEDIUM: 72,
    PriorityLevel.LOW: 168,  # 7 days
}


# ---------------------------------------------------------------------------
# Category → Department Default Mapping
# ---------------------------------------------------------------------------
CATEGORY_DEPARTMENT_MAP: dict[str, str] = {
    ComplaintCategory.ROADS:             Department.ROADS,
    ComplaintCategory.DRAINAGE:          Department.DRAINAGE,
    ComplaintCategory.WASTE:             Department.WASTE,
    ComplaintCategory.WATER:             Department.WATER,
    ComplaintCategory.STREETLIGHTS:      Department.STREETLIGHTS,
    ComplaintCategory.PUBLIC_FACILITIES: Department.PARKS,
    ComplaintCategory.OTHER:             Department.ROADS,  # fallback
}



# ---------------------------------------------------------------------------
# LLM Provider Abstraction
# ---------------------------------------------------------------------------
class LLMProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OPENAI = "openai"


class LLMConfig(BaseModel):
    """Holds LLM connection settings, read from environment variables."""

    provider: LLMProvider = Field(
        default_factory=lambda: LLMProvider(
            os.getenv("LLM_PROVIDER", "gemini")
        )
    )
    api_key: str = Field(
        default_factory=lambda: os.getenv("LLM_API_KEY", "")
    )
    model_name: str = Field(
        default_factory=lambda: os.getenv("LLM_MODEL_NAME", "gemini-3.5-flash-lite")
    )
    embedding_model: str = Field(
        default_factory=lambda: os.getenv(
            "EMBEDDING_MODEL", "models/text-embedding-004"
        )
    )
    temperature: float = Field(
        default_factory=lambda: float(os.getenv("LLM_TEMPERATURE", "0.2"))
    )
    max_tokens: int = Field(
        default_factory=lambda: int(os.getenv("LLM_MAX_TOKENS", "2048"))
    )


class BaseLLMClient(ABC):
    """Abstract base class for LLM clients.

    Every concrete provider must implement these two methods so agents
    remain provider-agnostic.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        image_url: str | None = None,
    ) -> str:
        """Generate text completion."""
        ...

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """Return an embedding vector for *text*."""
        ...


class GeminiClient(BaseLLMClient):
    """Concrete LLM client for Google Gemini."""

    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self._client: Any = None

    def _ensure_client(self) -> None:
        if self._client is None:
            try:
                from google import genai  # type: ignore

                self._client = genai.Client(api_key=self.config.api_key)
            except ImportError:
                raise ImportError(
                    "google-genai package is required. "
                    "Install with: pip install google-genai"
                )

    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        image_url: str | None = None,
    ) -> str:
        self._ensure_client()
        import asyncio

        config_kwargs: dict[str, Any] = {
            "temperature": temperature or self.config.temperature,
            "max_output_tokens": max_tokens or self.config.max_tokens,
        }
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt

        from google.genai import types  # type: ignore

        gen_config = types.GenerateContentConfig(**config_kwargs)

        contents: list[Any] = []
        if image_url:
            # For multimodal: pass image as a Part
            contents.append(image_url)  # Gemini SDK accepts URL strings
        contents.append(prompt)

        response = await asyncio.to_thread(
            self._client.models.generate_content,
            model=self.config.model_name,
            contents=contents,
            config=gen_config,
        )
        return response.text

    async def embed(self, text: str) -> list[float]:
        self._ensure_client()
        import asyncio

        response = await asyncio.to_thread(
            self._client.models.embed_content,
            model=self.config.embedding_model,
            contents=text,
        )
        return list(response.embeddings[0].values)


class GroqClient(BaseLLMClient):
    """Concrete LLM client for Groq."""

    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self._client: Any = None

    def _ensure_client(self) -> None:
        if self._client is None:
            try:
                from groq import Groq  # type: ignore

                self._client = Groq(api_key=self.config.api_key)
            except ImportError:
                raise ImportError(
                    "groq package is required. Install with: pip install groq"
                )

    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        image_url: str | None = None,
    ) -> str:
        self._ensure_client()
        import asyncio

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await asyncio.to_thread(
            self._client.chat.completions.create,
            model=self.config.model_name,
            messages=messages,
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )
        return response.choices[0].message.content

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError(
            "Groq does not support embeddings. Use a different provider for embeddings."
        )


class OpenAIClient(BaseLLMClient):
    """Concrete LLM client for OpenAI."""

    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self._client: Any = None

    def _ensure_client(self) -> None:
        if self._client is None:
            try:
                from openai import OpenAI  # type: ignore

                self._client = OpenAI(api_key=self.config.api_key)
            except ImportError:
                raise ImportError(
                    "openai package is required. Install with: pip install openai"
                )

    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        image_url: str | None = None,
    ) -> str:
        self._ensure_client()
        import asyncio

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        if image_url:
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                }
            )
        else:
            messages.append({"role": "user", "content": prompt})

        response = await asyncio.to_thread(
            self._client.chat.completions.create,
            model=self.config.model_name,
            messages=messages,
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )
        return response.choices[0].message.content

    async def embed(self, text: str) -> list[float]:
        self._ensure_client()
        import asyncio

        response = await asyncio.to_thread(
            self._client.embeddings.create,
            model=self.config.embedding_model,
            input=text,
        )
        return list(response.data[0].embedding)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
_PROVIDER_MAP: dict[LLMProvider, type[BaseLLMClient]] = {
    LLMProvider.GEMINI: GeminiClient,
    LLMProvider.GROQ: GroqClient,
    LLMProvider.OPENAI: OpenAIClient,
}


def get_llm_client(config: LLMConfig | None = None) -> BaseLLMClient:
    """Create and return an LLM client based on configuration."""
    if config is None:
        config = LLMConfig()
    cls = _PROVIDER_MAP.get(config.provider)
    if cls is None:
        raise ValueError(f"Unsupported LLM provider: {config.provider}")
    return cls(config)
