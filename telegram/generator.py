import aiohttp
import logging

logger = logging.getLogger(__name__)

async def generate(text: str, ai_url: str, model: str) -> str:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                ai_url,
                json={"userInput": text, "model": model},
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                data = await response.json()
                return data.get("content", "Нет ответа от модели")
    except Exception as e:
        logger.error(f"Generator error: {str(e)[:200]}")
        return "⚠️ Ошибка связи с сервером"