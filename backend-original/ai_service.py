import httpx
import anthropic
import asyncio
from datetime import datetime, timedelta

CHANNEL_RULES = {
    "blog_article": "2000 words, SEO with H1/H2/H3",
    "youtube_shorts": "300 words, hook+3points+CTA",
    "youtube_full": "1500 words, intro+5sections+outro",
    "x_article": "800 words, long-form X",
    "x_thread": "10 tweets max 280 chars each",
    "medium": "1200 words",
    "paragraph": "1000 words, web3-native",
    "hackernoon": "1200 words, technical",
    "publish0x": "800 words, crypto-native",
    "reddit": "500 words, community-first",
    "stackoverflow": "400 words, Q&A format"
}

# ~1.35 tokens per word, rounded up generously
CHANNEL_MAX_TOKENS = {
    "blog_article": 4096,
    "youtube_shorts": 1024,
    "youtube_full": 3072,
    "x_article": 2048,
    "x_thread": 1024,
    "medium": 2048,
    "paragraph": 2048,
    "hackernoon": 2048,
    "publish0x": 2048,
    "reddit": 1024,
    "stackoverflow": 1024,
}
DEFAULT_MAX_TOKENS = 2048


def _build_prompt(channel, rule, title, source_text, tone, audience, keywords):
    return (
        f"Create content for the {channel} platform.\n"
        f"Rule: {rule}\n"
        f"Title: {title}\n"
        f"Source material: {source_text}\n"
        f"Tone: {tone}\n"
        f"Audience: {audience}\n"
        f"Keywords: {keywords}\n"
        f"Write the full content now."
    )


async def _call_ai(provider: str, model: str, openai_key: str, anthropic_key: str, prompt: str, max_tokens: int = DEFAULT_MAX_TOKENS) -> str:
    if provider == "anthropic" and anthropic_key:
        try:
            client = anthropic.AsyncAnthropic(
                api_key=anthropic_key,
                timeout=httpx.Timeout(None, connect=10.0),
            )
            chunks = []
            async with client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    chunks.append(text)
            return "".join(chunks)
        except Exception as e:
            return f"[AI generation failed: {e}. Please check your API key and model in Settings.]"
    elif provider == "openai" and openai_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": max_tokens},
                    timeout=120
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"[AI generation failed: {e}. Please check your API key and model in Settings.]"
    else:
        return f"No API key configured for provider '{provider}'. Please add your key in Settings."


def _get_ai_config(settings: dict):
    openai_key = settings.get("openai_api_key") or settings.get("OPENAI_API_KEY")
    anthropic_key = settings.get("anthropic_api_key") or settings.get("ANTHROPIC_API_KEY")
    provider = settings.get("ai_provider", "openai")
    stored_model = settings.get("ai_model") or settings.get("AI_MODEL") or ""
    anthropic_model = stored_model if stored_model.startswith("claude") else "claude-sonnet-4-5"
    openai_model = stored_model if not stored_model.startswith("claude") else "gpt-4o"
    model = anthropic_model if provider == "anthropic" else openai_model
    return provider, model, openai_key, anthropic_key


async def generate_drafts(batch_data: dict, settings: dict):
    channels = batch_data.get("channels", [])
    provider, model, openai_key, anthropic_key = _get_ai_config(settings)
    base_date = datetime.utcnow()
    semaphore = asyncio.Semaphore(3)

    async def _generate_one(idx, channel):
        async with semaphore:
            rule = CHANNEL_RULES.get(channel, "Standard content")
            prompt = _build_prompt(
                channel, rule,
                batch_data.get("title", ""),
                batch_data.get("source_text", ""),
                batch_data.get("tone", "professional"),
                batch_data.get("audience", "developers"),
                batch_data.get("keywords", ""),
            )
            max_tokens = CHANNEL_MAX_TOKENS.get(channel, DEFAULT_MAX_TOKENS)
            draft_text = await _call_ai(provider, model, openai_key, anthropic_key, prompt, max_tokens)
            return {
                "channel": channel,
                "draft_text": draft_text,
                "scheduled_date": (base_date + timedelta(days=idx)).strftime("%Y-%m-%d"),
                "scheduled_time": "10:00",
                "ai_reasoning": f"Generated for {channel} using {provider}/{model}.",
            }

    results = await asyncio.gather(*[_generate_one(idx, ch) for idx, ch in enumerate(channels)])
    return list(results)


async def regenerate_single_draft(batch_title, source_text, channel, tone, audience, keywords, settings):
    rule = CHANNEL_RULES.get(channel, "Standard content")
    provider, model, openai_key, anthropic_key = _get_ai_config(settings)
    prompt = _build_prompt(channel, rule, batch_title, source_text, tone, audience, keywords)
    draft_text = await _call_ai(provider, model, openai_key, anthropic_key, prompt, CHANNEL_MAX_TOKENS.get(channel, DEFAULT_MAX_TOKENS))
    return {
        "draft_text": draft_text,
        "ai_reasoning": f"Regenerated using {provider}/{model}."
    }
