"""
LLM Provider Service
====================
Handles streaming and non-streaming calls to the configured LLM provider
(ArvanCloud OpenAI-compatible or Google Gemini).
"""
from __future__ import annotations

import os
import json
import time
from typing import AsyncGenerator, Optional

from django.conf import settings

from .quotas import TIER_MODELS, EDUCATIONAL_SYSTEM_PROMPT

# ---------------------------------------------------------------------------
# Provider configuration
# ---------------------------------------------------------------------------

def _get_api_keys():
    """Load API keys from settings/env."""
    return {
        'google': getattr(settings, 'GOOGLE_API_KEY', os.getenv('GOOGLE_API_KEY', '')),
        'llm': getattr(settings, 'LLM_API_KEY', os.getenv('LLM_API_KEY', '')),
        'arvan_base_url': getattr(settings, 'ARVAN_BASE_URL', os.getenv('ARVAN_BASE_URL', '')),
    }


def get_provider_for_tier(tier: int) -> str:
    """Determine which provider to use for a given tier."""
    keys = _get_api_keys()
    if keys['llm']:
        return 'arvan'
    if keys['google']:
        return 'google'
    return 'none'


def get_model_name(tier: int) -> str:
    """Return the model name for a tier."""
    return TIER_MODELS.get(tier, TIER_MODELS[2])['name']


def get_model_display(tier: int) -> str:
    """Return display name for a tier."""
    return TIER_MODELS.get(tier, TIER_MODELS[2])['display_name']


# ---------------------------------------------------------------------------
# Non-streaming call (fallback)
# ---------------------------------------------------------------------------

def generate_response(
    question: str,
    context_messages: Optional[list[dict]] = None,
    tier: int = 2,
    attachments: Optional[list[dict]] = None,
    max_retries: int = 2,
) -> dict:
    """
    Generate a non-streaming AI response.

    Returns dict with keys: content, model_name, tier, provider, reasoning
    """
    provider = get_provider_for_tier(tier)
    model_name = get_model_name(tier)

    if provider == 'arvan':
        return _generate_arvan(question, context_messages, tier, model_name, attachments, max_retries)
    elif provider == 'google':
        return _generate_google(question, context_messages, tier, model_name, attachments, max_retries)
    else:
        raise ValueError("هیچ کلید API برای هوش مصنوعی تنظیم نشده است")


def _build_messages(question: str, context_messages: Optional[list[dict]], attachments: Optional[list[dict]]) -> list[dict]:
    """Build the message list for the LLM."""
    messages = [{"role": "system", "content": EDUCATIONAL_SYSTEM_PROMPT}]

    # Add context history
    if context_messages:
        for msg in context_messages:
            role = "user" if msg.get('role') == 'user' else "assistant"
            messages.append({"role": role, "content": msg.get('content', '')})

    # Add attachment context
    if attachments:
        attachment_text = "\n\nپیوست‌های کاربر:\n"
        for att in attachments:
            att_type = att.get('type', '')
            name = att.get('name', '')
            extracted = att.get('extracted_text', '')
            if att_type == 'pdf' and extracted:
                attachment_text += f"[PDF: {name}]\n{extracted[:3000]}\n\n"
            elif att_type == 'image':
                attachment_text += f"[تصویر: {name}]\n"
        if attachment_text.strip():
            messages.append({"role": "system", "content": attachment_text})

    # Add the user question
    messages.append({"role": "user", "content": question})
    return messages


def _generate_arvan(question, context_messages, tier, model_name, attachments, max_retries):
    """Call ArvanCloud OpenAI-compatible API."""
    from openai import OpenAI

    keys = _get_api_keys()
    base_url = keys['arvan_base_url'] or "https://arvancloudai.ir/gateway/models/Gemini-2.0-Flash-001/IrqBP9-EdacvJA55cDev8pv7DOrpOxIYmfR_5NZtLOsReNJMHWVPJgdF3vXjIwzytO5HB-j6XIMWN6LEyAd1z0k-7dCyFHZ3nT2L6jjMVniR4lWDfIOMZdYgg8bgSbJutok5rV2R_WHUH73RHUgd0Q2hsyco4JYWHsoRPTICYDeomDIo97qIBSsSDu6e5xgb4hDUxrDEsQBsje46KS9Yqg9mMveCK-LRFiqgIcE5pb4XtbDrqCiszIPPtg__pDkH8J58DUR1QzSmdNMUIIs/v1"
    client = OpenAI(base_url=base_url, api_key=keys['llm'])

    messages = _build_messages(question, context_messages, attachments)

    retry_count = 0
    while retry_count <= max_retries:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
            )
            content = completion.choices[0].message.content or ""
            return {
                'content': content,
                'model_name': model_name,
                'tier': tier,
                'provider': 'arvan',
                'reasoning': None,
                'tokens_used': completion.usage.total_tokens if completion.usage else 0,
            }
        except Exception as e:
            retry_count += 1
            print(f"Arvan API error (attempt {retry_count}): {str(e)}")
            if retry_count > max_retries:
                raise ConnectionError("خطا در ارتباط با سرویس هوش مصنوعی")
            time.sleep(2)


def _generate_google(question, context_messages, tier, model_name, attachments, max_retries):
    """Call Google Gemini API directly."""
    import google.generativeai as genai

    keys = _get_api_keys()
    genai.configure(api_key=keys['google'])
    model = genai.GenerativeModel(model_name)

    messages = _build_messages(question, context_messages, attachments)
    prompt = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])

    retry_count = 0
    while retry_count <= max_retries:
        try:
            response = model.generate_content(prompt)
            return {
                'content': response.text,
                'model_name': model_name,
                'tier': tier,
                'provider': 'google',
                'reasoning': None,
                'tokens_used': 0,
            }
        except Exception as e:
            retry_count += 1
            print(f"Google API error (attempt {retry_count}): {str(e)}")
            if retry_count > max_retries:
                raise ConnectionError("خطا در ارتباط با سرویس هوش مصنوعی")
            time.sleep(2)


# ---------------------------------------------------------------------------
# Streaming call
# ---------------------------------------------------------------------------

async def stream_response(
    question: str,
    context_messages: Optional[list[dict]] = None,
    tier: int = 2,
    attachments: Optional[list[dict]] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream an AI response token-by-token.

    Yields JSON-encoded chunks:
      {"type": "start", "tier": 2, "model": "..."}
      {"type": "delta", "content": "..."}
      {"type": "done", "model": "...", "tier": 2}
      {"type": "error", "message": "..."}
    """
    provider = get_provider_for_tier(tier)
    model_name = get_model_name(tier)

    yield json.dumps({"type": "start", "tier": tier, "model": model_name, "provider": provider})

    try:
        if provider == 'arvan':
            async for chunk in _stream_arvan(question, context_messages, tier, model_name, attachments):
                yield chunk
        elif provider == 'google':
            async for chunk in _stream_google(question, context_messages, tier, model_name, attachments):
                yield chunk
        else:
            yield json.dumps({"type": "error", "message": "هیچ کلید API برای هوش مصنوعی تنظیم نشده است"})
    except Exception as e:
        print(f"Stream error: {str(e)}")
        yield json.dumps({"type": "error", "message": "خطا در دریافت پاسخ از هوش مصنوعی"})


async def _stream_arvan(question, context_messages, tier, model_name, attachments):
    """Stream from ArvanCloud OpenAI-compatible API."""
    from openai import AsyncOpenAI

    keys = _get_api_keys()
    base_url = keys['arvan_base_url'] or "https://arvancloudai.ir/gateway/models/Gemini-2.0-Flash-001/IrqBP9-EdacvJA55cDev8pv7DOrpOxIYmfR_5NZtLOsReNJMHWVPJgdF3vXjIwzytO5HB-j6XIMWN6LEyAd1z0k-7dCyFHZ3nT2L6jjMVniR4lWDfIOMZdYgg8bgSbJutok5rV2R_WHUH73RHUgd0Q2hsyco4JYWHsoRPTICYDeomDIo97qIBSsSDu6e5xgb4hDUxrDEsQBsje46KS9Yqg9mMveCK-LRFiqgIcE5pb4XtbDrqCiszIPPtg__pDkH8J58DUR1QzSmdNMUIIs/v1"
    client = AsyncOpenAI(base_url=base_url, api_key=keys['llm'])

    messages = _build_messages(question, context_messages, attachments)

    stream = await client.chat.completions.create(
        model=model_name,
        messages=messages,
        stream=True,
    )

    full_content = ""
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
            delta = chunk.choices[0].delta.content
            full_content += delta
            yield json.dumps({"type": "delta", "content": delta})

    yield json.dumps({"type": "done", "model": model_name, "tier": tier, "content": full_content})


async def _stream_google(question, context_messages, tier, model_name, attachments):
    """Stream from Google Gemini API."""
    import google.generativeai as genai

    keys = _get_api_keys()
    genai.configure(api_key=keys['google'])
    model = genai.GenerativeModel(model_name)

    messages = _build_messages(question, context_messages, attachments)
    prompt = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])

    response = model.generate_content(prompt, stream=True)

    full_content = ""
    for chunk in response:
        if chunk.text:
            full_content += chunk.text
            yield json.dumps({"type": "delta", "content": chunk.text})

    yield json.dumps({"type": "done", "model": model_name, "tier": tier, "content": full_content})