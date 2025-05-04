
import os
from openai import OpenAI
from openai.types.chat import ChatCompletion
from typing import List, Dict
from app.extensions import mongo
from app.utils.pdf_preprocess import PDFUtils
from bson import ObjectId

API_KEYS = {
    "llama": [
        os.getenv("LLY_GROQ_LLAMA"),
        os.getenv("HUIYEE_GROQ_LLAMA"),
        os.getenv("WUKANG_GROQ_LLAMA")
    ],
    "gemini": [
        os.getenv("LLY_GEMINI_API_KEY"),
        os.getenv("HUIYEE_GEMINI_API_KEY"),
        os.getenv("WUKANG_GEMINI_API_KEY")
    ],
    "deepseek": [
        os.getenv("LLY_OPEN_ROUTER_DEEPSEEK"),
        os.getenv("HUIYEE_OPEN_ROUTER_DEEPSEEK"),
        os.getenv("WUKANG_OPEN_ROUTER_DEEPSEEK")
    ],
}

BASE_URLS = {
    "llama": "https://api.groq.com/openai/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "deepseek": "https://openrouter.ai/api/v1"
}

MODEL_GROUPS = {
    "llama3-70b-8192": "llama",
    "gemini-2.0-flash": "gemini",
    "deepseek/deepseek-chat-v3-0324:free": "deepseek"
}

# SYSTEM_PROMPT = """
# You are an intelligent assistant. For each user query, you may also be provided with additional context.

# Your task:
# 1. Review the input prompt (user query) and the accompanying context (if any).
# 2. If the context is relevant, use it naturally to enhance your answer — but do not mention the context explicitly.
# 3. If the context is irrelevant or missing, simply answer the question using your own knowledge without calling attention to the absence of context.

# Please:
# - Keep your answer focused and concise.
# - Use **Markdown** formatting or $\\LaTeX$ for equations when helpful.
# """

SYSTEM_PROMPT = """
You are an intelligent assistant. For each user query, you may also be provided with additional context.

Your task:
1. Review the input prompt (user query) and the accompanying context (if any).
2. If the context is relevant, use it naturally to enhance your answer — but do not mention the context explicitly.
3. If the context is irrelevant or missing, simply answer the question using your own knowledge without calling attention to the absence of context.

Please keep your answer focused and concise, dont use markdown format, use pure paragraphs.
"""

class LLMApi:
    @staticmethod
    def build_prompt_with_context(query: str, context: list[str]) -> str:
        context_block = "\n".join(f"{item}\n\n" for item in context)
        prompt = f"""INPUT PROMPT:
{query}

-------

CONTENT:
{context_block}"""
        return prompt

    @staticmethod
    def send_message(model_name: str, history: List[Dict[str, str]]) -> str:
        group = MODEL_GROUPS.get(model_name)
        if not group:
            raise ValueError(f"Unknown model name: {model_name}")

        base_url = BASE_URLS[group]
        api_keys = API_KEYS[group]

        print("\n\n\n=== Conversation History ===")
        for i, msg in enumerate(history):
            role = msg.get("role", "unknown").upper()
            content = msg.get("content", "")
            print(f"{i+1}. [{role}]")
            print(f"{'-' * 10}\n{content}\n")

        for api_key in api_keys:
            try:
                client = OpenAI(api_key=api_key, base_url=base_url)
                response: ChatCompletion = client.chat.completions.create(
                    model=model_name,
                    messages=history,
                )
                return response.choices[0].message.content
            except Exception as e:
                error_msg = str(e).lower()
                if "quota" in error_msg or "limit" in error_msg or "unauthorized" in error_msg:
                    continue
                else:
                    raise e
        raise RuntimeError(f"All API keys exhausted for model group '{group}'.")

    @staticmethod
    def get_conversation_history(conversation_id: str):
        try:
            conv = mongo.db.conversations.find_one({"_id": ObjectId(conversation_id)})
        except Exception as e:
            print(f"[ERROR] Failed to retrieve conversation history: {e}")
            return None
        if not conv:
            print(f"[INFO] No conversation found with ID: {conversation_id}")
            return None
        return conv.get("history", [])

    @staticmethod
    def summarize_pdf_with_gemini(file_path: str) -> str:
        gemini_keys = [
            os.getenv("HUIYEE2_GEMINI_API_KEY"),
            os.getenv("WUKANG2_GEMINI_API_KEY")
        ]
        base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        model = "gemini-2.0-flash"

        pdf_info = PDFUtils.extract_information(file_path)
        all_text = "\n".join(chunk for page in pdf_info for chunk in page["chunks"])
        cleaned_text = PDFUtils.remove_stopwords(all_text)

        for api_key in gemini_keys:
            try:
                client = OpenAI(api_key=api_key, base_url=base_url)
                response: ChatCompletion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Summarize the input text clearly and directly in markdown format, without introductory or closing phrases."
                        },
                        {
                            "role": "user",
                            "content": f"Summarize this:\n{cleaned_text}"
                        }
                    ]
                )
                return response.choices[0].message.content
            except Exception as e:
                error_msg = str(e).lower()
                if "quota" in error_msg or "limit" in error_msg or "unauthorized" in error_msg:
                    continue
                else:
                    raise e
        raise RuntimeError("All Gemini keys exhausted or failed.")