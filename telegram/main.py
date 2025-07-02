from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.client.default import DefaultBotProperties
from aiogram.utils.markdown import hcode, hbold
from dotenv import load_dotenv
import asyncio
import logging
import os
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
TOKEN = os.getenv("TG_TOKEN")
if not TOKEN:
    logger.critical("❌ TG_TOKEN не найден в .env")
    exit(1)

BACKEND_URL = os.getenv("BACKEND_URL", "https://hdghs.onrender.com/chat/telegram")

bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher(storage=MemoryStorage())

class UserState(StatesGroup):
    selected_model = State()

MODELS = {
    "gpt-4.1-mini": "🚀 gpt-4.1-mini",
    "gpt-4o-mini": "🚀 gpt-4o-mini",
    "deepseek": "🧠 DeepSeek 0324",
    "deepseek-r1": "🚀 DeepSeek R1",
    "deepseek-v3": "💎 DeepSeek v3",
    "gemini": "🔮 Gemini Pro",
    "gemma": "💎 Gemma 27B",
    "qwen": "🎲 Qwen 32B",
    "qwen 2.5": "🎲 Qwen 2.5",
    "llama-4-maverick": "🦙 Llama Maverick",
    "llama-4-scout": "🦙 Llama Scout",
    "deepseek-r1-free": "🚀 DeepSeek R1 Free"
}

async def generate(prompt: str, url: str, model: str) -> str:
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                url,
                json={"userInput": prompt, "model": model},
                timeout=30
            ) as resp:
                if resp.status != 200:
                    raise Exception(f"Бэкенд вернул статус {resp.status}")
                data = await resp.json()
                return data.get("content", "")
        except Exception as e:
            print(f"[generate error] {e}")
            return ""

def get_model_keyboard(selected: str = None) -> types.InlineKeyboardMarkup:
    buttons = []

    for key, name in MODELS.items():
        status_icon = "🟢" if key == selected else "⚪"
        buttons.append([
            types.InlineKeyboardButton(
                text=f"{status_icon} {name}",
                callback_data=f"model_{key}"
            )
        ])

    buttons.append([
        types.InlineKeyboardButton(
            text="🧩 Выбрать модель",
            callback_data="open_model_menu"
        ),
        types.InlineKeyboardButton(
            text="🌍 Web App",
            web_app=types.WebAppInfo(url="https://w5model.netlify.app/")
        )
    ])

    return types.InlineKeyboardMarkup(inline_keyboard=buttons)

def get_reply_keyboard() -> types.ReplyKeyboardMarkup:
    return types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text="🧩 Выбрать модель")]
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
        input_field_placeholder="Введите сообщение для ИИ..."
    )

@dp.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    await state.clear()
    await state.set_data({"selected_model": "gpt-4o-mini"})
    await message.answer(
        f"{hbold('🤖 AI Assistant Bot')}\n\n"
        "Выберите модель ИИ или используйте веб-приложение:\n"
        "По умолчанию: 🚀 deepseek-r1-free",
        reply_markup=get_reply_keyboard()  
    )

@dp.callback_query(lambda c: c.data == "open_model_menu")
async def open_model_menu(callback: types.CallbackQuery, state: FSMContext):
    user_data = await state.get_data()
    selected = user_data.get("selected_model", "gpt-4o-mini")

    await callback.message.answer(
        "🔧 Выберите модель ИИ:",
        reply_markup=get_model_keyboard(selected)
    )
    await callback.answer()

@dp.message(Command("model"))
async def model_command(message: types.Message, state: FSMContext):
    user_data = await state.get_data()
    await message.answer(
        "🔧 Выберите модель:",
        reply_markup=get_model_keyboard(user_data.get("selected_model"))
    )

@dp.callback_query(lambda c: c.data.startswith("model_"))
async def model_selected(callback: types.CallbackQuery, state: FSMContext):
    model_key = callback.data.split("_")[1]
    if model_key not in MODELS:
        await callback.answer("❌ Неизвестная модель")
        return
    await state.update_data(selected_model=model_key)
    await callback.message.edit_reply_markup(reply_markup=get_model_keyboard(model_key))
    await callback.answer(f"✅ {MODELS[model_key]} выбрана")

@dp.message()
async def handle_message(message: types.Message, state: FSMContext):
    if message.text == "🧩 Выбрать модель":
        user_data = await state.get_data()
        selected = user_data.get("selected_model", "gpt-4o-mini")
        await message.answer("🔧 Выберите модель:", reply_markup=get_model_keyboard(selected))
        return

    user_data = await state.get_data()
    model = user_data.get("selected_model", "gpt-4o-mini")

    await message.bot.send_chat_action(message.chat.id, "typing")
    processing_msg = await message.answer("⏳ Обработка запроса...")

    try:
        response = await generate(message.text, BACKEND_URL, model)
        await processing_msg.delete()

        if not response:
            raise ValueError("Пустой ответ от модели")

        formatted = response.replace("```", "'''")
        text = f"{hbold(MODELS[model])} ответил:\n{hcode(formatted)}"

        await message.answer(text, reply_markup=get_model_keyboard(model))

    except asyncio.TimeoutError:
        await message.answer("⌛ Превышено время ожидания")
    except Exception as e:
        logger.error(f"Ошибка: {str(e)[:200]}")
        await message.answer("⚠️ Ошибка обработки запроса")

async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("🤖 Бот запущен в режиме поллинга")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
