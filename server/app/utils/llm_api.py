
import os
from openai import OpenAI
from openai.types.chat import ChatCompletion
from typing import List, Dict
from app.extensions import mongo
from app.utils.pdf_preprocess import PDFUtils
from bson import ObjectId
from dotenv import load_dotenv
load_dotenv() 

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
        # os.getenv("LLY_OPEN_ROUTER_DEEPSEEK"),
        # os.getenv("HUIYEE_OPEN_ROUTER_DEEPSEEK"),
        # os.getenv("WUKANG_OPEN_ROUTER_DEEPSEEK"),
        os.getenv("LYY_DEEPSEEK")
    ],
}

BASE_URLS = {
    "llama": "https://api.groq.com/openai/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    # "deepseek": "https://openrouter.ai/api/v1"
    "deepseek": "https://api.deepseek.com"
}

MODEL_GROUPS = {
    "llama3-70b-8192": "llama",
    "gemini-2.0-flash": "gemini",
    # "deepseek/deepseek-chat-v3-0324:free": "deepseek"
    "deepseek-chat": "deepseek"
}

# SYSTEM_PROMPT = """
# You are an intelligent assistant. For each user query, you may also be provided with additional context.

# Each chunk of the context may be prefixed with:
# <!-- pdfnav: name="{filename}" page={page} id={pdf_id} -->

# This metadata allows you to identify and attribute sources from the document. When quoting or paraphrasing, **always** append the corresponding `<!-- pdfnav: ... -->` tag to indicate the origin of the information — use these navigation tags **whenever possible**.

# Your task:
# 1. Review the input prompt (user query) and the accompanying context (if any).
# 2. If the context is relevant, use it naturally to enhance your answer — but do not mention the context explicitly.
# 3. If the context is irrelevant or missing, simply answer the question using your own knowledge without calling attention to the absence of context.
# 4. When referencing document content, paraphrase or quote meaningfully and append the `<!-- pdfnav: ... -->` tag to show the source.

# Please:
# - Keep your answer focused and concise.
# - Use **Markdown** formatting or $\\LaTeX$ for equations when helpful.
# - Do **not** mention page numbers explicitly — rely on the `<!-- pdfnav: ... -->` tag for attribution when available.

# Example with attribution:
# > "The system architecture includes a layered microservices model."
# > <!-- pdfnav: name="System_Design.pdf" page=12 id=681a32614b7bb8d5fe5b44b0 -->
# """

SYSTEM_PROMPT = """
You are an intelligent assistant. Along with every user query you may receive:
1. **Optional contextual excerpts** from one or more PDFs.  
2. **Optional DOCUMENT SIMILARITY INFORMATION** - a list of pair-wise cosine scores plus the most-
   and least-similar pairs already pre-calculated for you.

Each PDF chunk may be prefixed with:
<!-- pdfnav: name="{filename}" page={page} id={pdf_id} --> 
This metadata allows you to identify and attribute sources from the document. When quoting or paraphrasing, **always** append the corresponding `<!-- pdfnav: ... -->` tag to indicate the origin of the information — use these navigation tags **whenever possible**.

Your tasks
----------
1. Review the input prompt (user query) and the accompanying context (if any).
2. If a context chunk is relevant, weave its content smoothly into your answer — but do **not** mention page numbers; rely on the `<!-- pdfnav: ... -->` tag.  
3. If a **DOCUMENT SIMILARITY INFORMATION** section is present and the user asks about document
   similarity (e.g. “Which two documents match the closest?” or “How close are A and B?”),
   use those numbers directly in your reply.
4. If no context is relevant, answer from your own knowledge without mentioning the absence of context.

Example — PDF attribution
-------------------------
> “The system architecture adopts a layered micro-services model.”  
> <!-- pdfnav: name="Sys_Design.pdf" page=12 id=681a32614b7bb8d5fe5b44b0 -->

Example — PDF similarity
------------------------------
> “Among the uploaded files, *Chapter1.pdf* and *Overview.pdf* are the most alike (0.87).”

Formatting
----------
- Keep your answer focused and concise.
- Use **Markdown** formatting or $\\LaTeX$ for equations when helpful.
- After every sentence that depends on a PDF excerpt, immediately append the matching
  `<!-- pdfnav: ... -->` tag.
"""

# FULL_PDF_SYSTEM_PROMPT = """
# You are an intelligent assistant trained to understand and respond based on the content of a full PDF document.

# Each section of the input may be prefixed with:
# <!-- pdfnav: name="{filename}" page={page} id={pdf_id} -->

# This metadata allows you to identify and attribute sources from the document. When quoting or paraphrasing, **always** append the corresponding `<!-- pdfnav: ... -->` tag to indicate the origin of the information — use these navigation tags **whenever possible**.

# Your tasks:
# 1. Read and analyze the full document context provided.
# 2. Use the most relevant sections to answer user queries clearly and accurately.
# 3. When referencing document content, paraphrase or quote meaningfully and append the `<!-- pdfnav: ... -->` tag to show the source.
# 4. If a user question spans multiple parts of the document, synthesize information across sections and include relevant navigation tags where appropriate.

# Formatting:
# - Use **Markdown** for structure (e.g., lists, bold, code).
# - Use $\\LaTeX$ for mathematical expressions when helpful.
# - Do **not** mention page numbers explicitly — rely on the `<!-- pdfnav: ... -->` tags for attribution.

# Example of an acceptable reference format:
# > "The system architecture includes a layered microservices model."  
# > <!-- pdfnav: name="System_Design.pdf" page=12 id=681a32614b7bb8d5fe5b44b0 -->
# """

FULL_PDF_SYSTEM_PROMPT = """
You are an intelligent assistant. Along with every user query you may receive:
1. The *full* text of one or more PDFs, broken into page chunks, each prefixed with  
       <!-- pdfnav: name="{filename}" page={page} id={pdf_id} -->
2. **Optional DOCUMENT SIMILARITY INFORMATION** - a list of pair-wise cosine scores plus the most-
   and least-similar pairs already pre-calculated for you.

Each PDF chunk may be prefixed with:
<!-- pdfnav: name="{filename}" page={page} id={pdf_id} -->  
This metadata allows you to identify and attribute sources from the document. When quoting or paraphrasing, **always** append the corresponding `<!-- pdfnav: ... -->` tag to indicate the origin of the information — use these navigation tags **whenever possible**.

Your tasks
----------
1. Read and analyze the full document context provided.
2. Use the most relevant sections to answer user queries clearly and accurately.
3. When referencing document content, paraphrase or quote meaningfully and append the `<!-- pdfnav: ... -->` tag to show the source.
4. If a user question spans multiple parts of the document, synthesize information across sections and include relevant navigation tags where appropriate.
5. If a **DOCUMENT SIMILARITY INFORMATION** section is present and the user asks about document
   similarity (e.g. “Which two documents match the closest?” or “How close are A and B?”),
   use those numbers directly in your reply.
6. If no context is relevant, answer from your own knowledge without mentioning the absence of context.

Example — PDF attribution
-------------------------
> “The system architecture adopts a layered micro-services model.”  
> <!-- pdfnav: name="Sys_Design.pdf" page=12 id=681a32614b7bb8d5fe5b44b0 -->

Example — PDF similarity
------------------------------
> “Among the uploaded files, *Chapter1.pdf* and *Overview.pdf* are the most alike (0.87).”

Formatting
----------
- Keep your answer focused and concise.
- Use **Markdown** formatting or $\\LaTeX$ for equations when helpful.
- After every sentence that depends on a PDF excerpt, immediately append the matching
  `<!-- pdfnav: ... -->` tag.
"""

# TRAILING_MESSAGE = "\n\n(Reminder: use navigation tags **whenever possible**, eg: <!-- pdfnav: name='System_Design.pdf' page=12 id=681a32614b7bb8d5fe5b44b0 -->)"

class LLMApi:
    @staticmethod
    def build_prompt_with_context(query: str, context: list[str], full_pdf: bool = False, similarity_scores: list = None) -> str:
        header = "FULL PDF CONTENT:" if full_pdf else "CONTENT:"
        context_block = "\n".join(f"{chunk}\n\n" for chunk in context)
        
        similarity_info = ""
        if similarity_scores:
            sorted_scores = sorted(similarity_scores, key=lambda x: x.get('similarity_score', 0), reverse=True)
            most_similar = sorted_scores[0] if sorted_scores else None
            least_similar = sorted_scores[-1] if sorted_scores else None

            similarity_info = "\n\nDOCUMENT SIMILARITY INFORMATION:\n"
            for score in sorted_scores:
                similarity_info += f"- Document '{score.get('pdf_1')}' is {score.get('similarity_score', 0):.2f} similar to '{score.get('pdf_2')}'\n"
            
            if most_similar:
                similarity_info += f"\nMost similar document pair: '{most_similar.get('pdf_1')}' and '{most_similar.get('pdf_2')}' with similarity score {most_similar.get('similarity_score', 0):.2f}\n"
            if least_similar:
                similarity_info += f"Least similar document pair: '{least_similar.get('pdf_1')}' and '{least_similar.get('pdf_2')}' with similarity score {least_similar.get('similarity_score', 0):.2f}\n"
        
        prompt = f"""INPUT PROMPT:
{query}

-------

{header}
{context_block}{similarity_info}"""
        return prompt

    @staticmethod
    def send_message(model_name: str, history: List[Dict[str, str]]) -> str:
        group = MODEL_GROUPS.get(model_name)
        if not group:
            raise ValueError(f"Unknown model name: {model_name}")

        base_url = BASE_URLS[group]
        api_keys = API_KEYS[group]

        # if history:
        #     history[-1]['content'] = history[-1].get('content', '') + TRAILING_MESSAGE

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