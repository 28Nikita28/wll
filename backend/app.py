import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os
import re
import logging
from pydantic import BaseModel
import uvicorn

load_dotenv()

app = FastAPI(title="AI Assistant", version="1.2")

origins = [
    "https://w5model.netlify.app",
    "http://localhost:*",
    "http://localhost:8080",  
    "https://*.netlify.app",
    "https://hdghs.onrender.com",
    "https://sadf-pufq.onrender.com",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS", "GET"],  # Явно разрешаем OPTIONS
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn")
logger.setLevel(logging.INFO)

# Проверка наличия обязательных переменных
required_env_vars = ["OPENROUTER_API_KEY", "TOGETHER_API_KEY"]
for var in required_env_vars:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

# Клиенты для разных провайдеров
clients = {
    "openrouter": AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY")
    ),
    "together": AsyncOpenAI(
        base_url="https://api.together.xyz/v1",
        api_key=os.environ.get("TOGETHER_API_KEY")
    )
}

class ChatRequest(BaseModel):
    userInput: str | None = None
    imageUrl: str | None = None
    model: str = "deepseek/deepseek-chat-v3-0324:free"

def format_code_blocks(text: str) -> str:
    """Форматирование Markdown-контента"""
    replacements = [
        (r'```(\w+)?\n(.*?)\n```', r'```\1\n\2\n```', re.DOTALL),
        (r'(#{1,3}) (.*)', r'\n\1 \2\n', 0),
        (r'\*\*(.*?)\*\*', r'**\1**', 0),
        (r'\*(.*?)\*', r'*\1*', 0)
    ]
    
    for pattern, repl, flags in replacements:
        text = re.sub(pattern, repl, text, flags=flags)
    return text

@app.get("/")
async def health_check():
    return {
        "status": "OK",
        "service": "AI Assistant",
        "version": "1.2",
        "providers": ["openrouter", "together"],
        "port": os.environ.get("PORT", "10000")
    }

@app.post("/chat")
async def chat_handler(request: Request, chat_data: ChatRequest):
    try:
        logger.info(f"Incoming request headers: {request.headers}")
        
        if not chat_data.userInput and not chat_data.imageUrl:
            logger.error('Invalid request data')
            raise HTTPException(status_code=400, detail="Требуется текст или изображение")

        user_content = []
        if chat_data.userInput:
            user_content.append({"type": "text", "text": chat_data.userInput})
        if chat_data.imageUrl:
            user_content.append({
                "type": "image_url", 
                "image_url": {"url": chat_data.imageUrl}
            })

        # Определяем провайдера и модель
        model_mapping = {
            "deepseek": ("openrouter", "deepseek/deepseek-chat-v3-0324:free"),
            "deepseek-r1": ("openrouter", "deepseek/deepseek-r1:free"),
            "deepseek-v3": ("openrouter", "deepseek/deepseek-chat:free"),
            "gemini": ("openrouter", "google/gemini-2.5-pro-exp-03-25:free"),
            "gemma": ("openrouter", "google/gemma-3-27b-it:free"),
            "qwen": ("openrouter", "qwen/qwq-32b:free"),
            "qwen 2.5": ("openrouter", "qwen/qwen2.5-vl-32b-instruct:free"),
            "llama-4-maverick": ("together", "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"),
            "llama-4-scout": ("together", "meta-llama/Llama-4-Scout-17B-16E-Instruct"),
            "deepseek-r1-free": ("together", "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"),
            "qwen3 235b": ("together", "Qwen/Qwen3-235B-A22B-fp8-tput")
        }

        model_key = chat_data.model.split('/')[0].lower()
        provider, selected_model = model_mapping.get(
            model_key,
            ("openrouter", "deepseek/deepseek-chat-v3-0324:free")
        )

        client = clients[provider]

        # Параметры для разных провайдеров
        extra_params = {
            "extra_headers": {
                "HTTP-Referer": "https://w5model.netlify.app/",
                "X-Title": "My AI Assistant"
            }
        }

        if provider == "together":
            extra_params["extra_headers"].update({
                "Together-Client-Identifier": "https://w5model.netlify.app/"
            })

        stream = await client.chat.completions.create(
            **extra_params,
            model=selected_model,
            messages=[
                {"role": "system", "content": "Вы очень полезный помощник отвечающий на русском языке!"},
                {"role": "user", "content": user_content}
            ],
            max_tokens=4096,
            temperature=0.5,
            stream=True
        )

        async def generate():
            full_response = []
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response.append(content)
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            yield "data: [DONE]\n\n"

        async def generate_with_errors():
            try:
                async for event in generate():
                    yield event
            except Exception as e:
                logger.error(f"Stream error: {str(e)}")
                yield "data: [ERROR]\n\n"

        return StreamingResponse(generate_with_errors(), media_type="text/event-stream")

    except Exception as e:
        logger.exception("Ошибка обработки запроса")
        raise HTTPException(status_code=500, detail=str(e))

# Добавить после объявления clients (глобальный уровень)
model_mapping = {
    "deepseek": ("openrouter", "deepseek/deepseek-chat-v3-0324:free"),
    "deepseek-r1": ("openrouter", "deepseek/deepseek-r1:free"),
    "deepseek-v3": ("openrouter", "deepseek/deepseek-chat:free"),
    "gemini": ("openrouter", "google/gemini-2.5-pro-exp-03-25:free"),
    "gemma": ("openrouter", "google/gemma-3-27b-it:free"),
    "qwen": ("openrouter", "qwen/qwq-32b:free"),
    "qwen 2.5": ("openrouter", "qwen/qwen2.5-vl-32b-instruct:free"),
    "llama-4-maverick": ("together", "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"),
    "llama-4-scout": ("together", "meta-llama/Llama-4-Scout-17B-16E-Instruct"),
    "deepseek-r1-free": ("together", "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"),
    "qwen3 235b": ("together", "Qwen/Qwen3-235B-A22B-fp8-tput")
}

# Затем добавить новый эндпоинт
@app.post("/chat/telegram")
async def telegram_chat_handler(chat_data: ChatRequest):
    try:
        if not chat_data.userInput:
            raise HTTPException(status_code=400, detail="Требуется текст")

        model_key = chat_data.model.split('/')[0].lower()
        provider, selected_model = model_mapping.get(
            model_key,
            ("openrouter", "deepseek/deepseek-chat-v3-0324:free")
        )
        
        client = clients[provider]

        response = await client.chat.completions.create(
            model=selected_model,
            messages=[
                {"role": "system", "content": "Отвечай на русском языке четко и структурированно!"},
                {"role": "user", "content": chat_data.userInput}
            ],
            max_tokens=2500,
            temperature=0.5
        )

        formatted = response.choices[0].message.content
        formatted = formatted.replace("```", "'''")  # Экранирование для Telegram
        return {"content": formatted}
    
    except Exception as e:
        logger.exception(f"Telegram error: {str(e)}")
        return {"content": "⚠️ Ошибка обработки запроса"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        timeout_keep_alive=60
    )