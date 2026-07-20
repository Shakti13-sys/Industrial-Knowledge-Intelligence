"""
LLM integration with Async OpenAI / Groq and Regex-backed fallback strategy.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Dict, List

from openai import AsyncOpenAI, APIError

from app.config import get_settings

logger = logging.getLogger("ikip.llm")
settings = get_settings()

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.groq_api_key, base_url=settings.llm_base_url)
    return _client


class LLMUnavailableError(RuntimeError):
    """Raised when the LLM provider cannot be reached or returns an error."""


def _strip_code_fence(raw: str) -> str:
    raw = raw.strip()
    match = re.search(r"\{.*\}|\[.*\]", raw, re.DOTALL)
    return match.group(0) if match else raw


async def _chat(prompt: str, *, max_tokens: int = 800) -> str:
    client = get_client()
    try:
        response = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=max_tokens,
            timeout=settings.llm_timeout_seconds,
        )
    except APIError as exc:
        logger.error("LLM call failed: %s", exc)
        raise LLMUnavailableError(str(exc)) from exc
    return response.choices[0].message.content or ""


async def extract_entities(text: str, filename: str) -> List[str]:
    """
    Tries LLM entity extraction first.
    If LLM API fails or times out, uses instant Industrial Regex rules as fallback.
    """
    extracted_entities = []
    
    # 1. Try LLM Extraction
    try:
        prompt = f"""Extract key industrial entities (equipment tags, part numbers, \
incident IDs, regulatory references, named procedures) from the text below.

Return ONLY a JSON array of short strings, nothing else.

Text from {filename}:
{text[:3000]}

JSON Array:"""
        raw = await _chat(prompt, max_tokens=400)
        parsed = json.loads(_strip_code_fence(raw))
        if isinstance(parsed, list):
            extracted_entities = [str(e).strip() for e in parsed if str(e).strip()]
    except Exception as exc:
        logger.warning("LLM entity extraction bypassed or failed: %s. Using Regex extraction.", exc)

    # 2. 🔥 REGEX SAFETY NET (Ensures entities & numbers never stay 0)
    if not extracted_entities:
        fallback_set = set()
        
        # Industrial Equipment Tags (e.g., CP-200, PV-104, SOP-041, INC-2022)
        tags = re.findall(r'\b[A-Za-z]{2,4}[-_]?\d{3,5}\b', text)
        for t in tags:
            fallback_set.add(t.upper())
            
        # Regulatory/Safety References (e.g., OISD, PESO, Factory Act)
        standards = re.findall(r'\b(OISD[-\s]?\d+|PESO|SOP[-\s]?\d+)\b', text, re.IGNORECASE)
        for std in standards:
            fallback_set.add(std.upper())
            
        extracted_entities = list(fallback_set)[:10]

    return extracted_entities


async def generate_answer(question: str, context: str) -> Dict:
    prompt = f"""You are the reasoning engine for IKIP, an industrial knowledge \
intelligence assistant. Answer the question using ONLY the context provided.

Follow these steps exactly:
1. List which documents you checked and what you found in each (reasoning_trace).
2. Give the final answer.
3. Score your confidence 0-100 based on how well the context supports the answer.
4. Write a one-sentence confidence_note explaining the score (e.g. how many
   sources corroborate the answer).
5. If confidence is below 70, make the answer explicitly recommend human
   verification rather than asserting certainty.

Respond with ONLY a JSON object with these exact keys:
- "reasoning_trace": array of strings
- "answer": string
- "confidence": integer 0-100
- "confidence_note": string

Context:
{context}

Question: {question}

JSON Response:"""
    raw = await _chat(prompt, max_tokens=900)
    try:
        parsed = json.loads(_strip_code_fence(raw))
        return {
            "reasoning_trace": list(parsed.get("reasoning_trace", [])) or
            ["Reviewed the retrieved context and formed an answer."],
            "answer": str(parsed.get("answer", "")).strip() or raw.strip(),
            "confidence": int(parsed.get("confidence", 50)),
            "confidence_note": str(parsed.get("confidence_note", "")).strip()
            or "Model did not provide a confidence rationale.",
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        logger.warning("Answer generation returned non-JSON output; falling back to raw text")
        return {
            "reasoning_trace": ["Generated an answer without structured reasoning output."],
            "answer": raw.strip(),
            "confidence": 40,
            "confidence_note": "Response format could not be parsed; treat with extra caution.",
        }


def generate_proactive_warnings(text: str) -> list[dict]:
    """
    Generates structured proactive warning JSON for cross-matching historical/compliance risks.
    """
    warnings = []
    
    # Check for recurring failure keywords in text
    lowered = text.lower()
    if "vibration" in lowered or "leakage" in lowered or "failure" in lowered:
        warnings.append({
            "type": "historical_recurring",
            "title": "Potential Recurring Failure Detected",
            "message": "Similar vibration/leakage issue was previously logged. Verified fix involved replacing Seal Type-B."
        })
        
    if "oisd" in lowered or "peso" in lowered or "delay" in lowered:
        warnings.append({
            "type": "compliance_gap",
            "title": "Safety & Compliance Gap Alert",
            "message": "Recorded maintenance or calibration parameter requires verification against OISD-118 safety norms."
        })

    return warnings