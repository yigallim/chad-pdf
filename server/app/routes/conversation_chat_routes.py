from flask import Blueprint, request, jsonify, current_app
from app.extensions import mongo
from bson import ObjectId
import time
from gtts import gTTS
import io
import base64
from app.utils.embeddings import EmbeddingsUtils
from app.utils.llm_api import LLMApi, SYSTEM_PROMPT
from app.utils.pdf_preprocess import PDFUtils

conversation_chat_bp = Blueprint('conversation_chat', __name__)

def model_reply(user_message, allowed_pdf_ids):
    collection = current_app.pdf_chunks_collection
    results = EmbeddingsUtils.query_pdf_chunks(collection, user_message, allowed_pdf_ids, n_results=5)
    
    if not results or not results['documents'][0]:
        return "I’m sorry, I couldn’t find any relevant sections in the document. Could you rephrase or give me more details about what you’re looking for?"
    
    markdown_chunks = []
    for i in range(len(results['documents'][0])):
        chunk_text = results['documents'][0][i]
        meta = results['metadatas'][0][i]
        distance = results['distances'][0][i]
        pdf_id = meta.get('pdf_id', 'N/A')
        page = meta.get('page', 'N/A')
        
        markdown_chunk = (
            f"> {chunk_text.replace('\n', '\n> ')}\n\n"
            f"Distance: {distance:.4f}  \n"
            f"PDF ID: `{pdf_id}`  \n"
            f"Page: {page}\n"
        )
        markdown_chunks.append(markdown_chunk)
    
    return "\n\n".join(markdown_chunks)

@conversation_chat_bp.route("/conversation/<conversation_id>", methods=["POST"])
def chat_with_conversation(conversation_id):
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing message"}), 400

    try:
        conv = mongo.db.conversations.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        return jsonify({"error": "Invalid conversation id format"}), 400

    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

    pdf_meta = conv.get("pdfMeta", [])
    if not isinstance(pdf_meta, list) or len(pdf_meta) == 0:
        return jsonify({"error": "Cannot chat with a conversation without any PDF attached."}), 400

    allowed_pdf_ids = [str(item["id"]) if isinstance(item["id"], ObjectId) else str(item["id"]) for item in pdf_meta if "id" in item]
    
    user_message = data["message"]
    embedding_only = data.get("embedding_only", False)

    if embedding_only:
        embeddings_response = model_reply(user_message, allowed_pdf_ids)
        return jsonify({
            "history": [
                {
                    "role": "user",
                    "content": user_message
                },
                {
                    "role": "assistant",
                    "content": embeddings_response
                }
            ]
        }), 200

    user_entry = {
        "role": "user",
        "content": user_message
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": user_entry}}
    )
    
    context_chunks = get_relevant_context(user_message, allowed_pdf_ids)
    history = LLMApi.get_conversation_history(conversation_id)
    messages = build_llm_messages(history, user_message, context_chunks)
    model = data.get("model", "llama3-70b-8192")
    
    try:
        assistant_response = LLMApi.send_message(model, messages)
    except Exception as e:
        error_message = f"Error communicating with LLM API: {str(e)}"
        model_entry = {
            "role": "assistant",
            "content": error_message
        }
        mongo.db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$push": {"history": model_entry}}
        )
        return jsonify({"error": error_message}), 500
    
    model_entry = {
        "role": "assistant",
        "content": assistant_response
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": model_entry}}
    )

    updated = mongo.db.conversations.find_one({"_id": ObjectId(conversation_id)})
    return jsonify({
        "history": updated.get("history", [])
    }), 200


def get_relevant_context(user_message, allowed_pdf_ids, n_results=5):
    collection = current_app.pdf_chunks_collection
    results = EmbeddingsUtils.query_pdf_chunks(collection, user_message, allowed_pdf_ids, n_results=n_results)
    
    if not results or not results['documents'][0]:
        return []
    
    context_chunks = []
    for i in range(len(results['documents'][0])):
        chunk_text = results['documents'][0][i]
        meta = results['metadatas'][0][i]
        pdf_id = meta.get('pdf_id', 'N/A')
        page = meta.get('page', 'N/A')
        
        context_chunk = f"[PDF: {pdf_id}, Page: {page}] {chunk_text}"
        context_chunks.append(context_chunk)
    
    return context_chunks


def build_llm_messages(history, user_message, context_chunks, remove_stopwords=False):
    # TODO clean markdown, less token, limit context window
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if remove_stopwords:
        user_message = PDFUtils.remove_stopwords(user_message)
        context_chunks = [PDFUtils.remove_stopwords(chunk) for chunk in context_chunks]

    if history:
        for entry in history[:-1]:
            messages.append({
                "role": entry["role"],
                "content": entry["content"]
            })

    if context_chunks:
        formatted_message = LLMApi.build_prompt_with_context(user_message, context_chunks)
    else:
        formatted_message = f"{user_message}\n\n(Note: No relevant context was found)"
    
    messages.append({"role": "user", "content": formatted_message})
    return messages

# def build_llm_messages(history, user_message, context_chunks, max_words=1200):
#     messages = [{"role": "system", "content": SYSTEM_PROMPT}]
#     total_words = PDFUtils.count_words_text(SYSTEM_PROMPT)

#     if context_chunks:
#         formatted_message = LLMApi.build_prompt_with_context(user_message, context_chunks)
#     else:
#         formatted_message = f"{user_message}\n\n(Note: No relevant context was found)"
#     user_msg_words = PDFUtils.count_words_text(formatted_message)

#     # Step 2: Add history in reverse order to preserve recent messages, limited by word count
#     selected_history = []
#     if history:
#         for entry in reversed(history[:-1]):  # Exclude current message
#             entry_words = PDFUtils.count_words_text(entry["content"])
#             if total_words + entry_words + user_msg_words <= max_words:
#                 selected_history.insert(0, entry)  # prepend to maintain order
#                 total_words += entry_words
#             else:
#                 break

#     # Step 3: Build final message list
#     for entry in selected_history:
#         messages.append({
#             "role": entry["role"],
#             "content": entry["content"]
#         })
#     messages.append({"role": "user", "content": formatted_message})
#     return messages

@conversation_chat_bp.route("/conversation/<conversation_id>/with-tts", methods=["POST"])
def chat_with_conversation_tts(conversation_id):
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing message"}), 400

    try:
        conv = mongo.db.conversations.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        return jsonify({"error": "Invalid conversation id format"}), 400

    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

    pdf_meta = conv.get("pdfMeta", [])
    if not isinstance(pdf_meta, list) or len(pdf_meta) == 0:
        return jsonify({"error": "Cannot chat with a conversation without any PDF attached."}), 400

    allowed_pdf_ids = [str(item["id"]) if isinstance(item["id"], ObjectId) else str(item["id"]) for item in pdf_meta if "id" in item]

    user_message = data["message"]

    user_entry = {
        "role": "user",
        "content": user_message
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": user_entry}}
    )

    context_chunks = get_relevant_context(user_message, allowed_pdf_ids)
    history = LLMApi.get_conversation_history(conversation_id)
    messages = build_llm_messages(history, user_message, context_chunks)
    model = data.get("model", "llama3-70b-8192")

    try:
        assistant_response = LLMApi.send_message(model, messages)
    except Exception as e:
        error_message = f"Error communicating with LLM API: {str(e)}"
        model_entry = {
            "role": "assistant",
            "content": error_message
        }
        mongo.db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$push": {"history": model_entry}}
        )
        return jsonify({"error": error_message}), 500

    model_entry = {
        "role": "assistant",
        "content": assistant_response
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": model_entry}}
    )

    mp3_fp = io.BytesIO()
    tts = gTTS(text=assistant_response, lang='en')
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)
    mp3_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')

    updated = mongo.db.conversations.find_one({"_id": ObjectId(conversation_id)})
    return jsonify({
        "history": updated.get("history", []),
        "mp3_base64": mp3_base64
    }), 200

@conversation_chat_bp.route("/conversation/<conversation_id>/clear-history", methods=["POST"])
def clear_conversation_history(conversation_id):
    try:
        obj_id = ObjectId(conversation_id)
    except Exception:
        return jsonify({"error": "Invalid conversation id format"}), 400

    # Check if conversation exists
    conv = mongo.db.conversations.find_one({"_id": obj_id})
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

    result = mongo.db.conversations.update_one(
        {"_id": obj_id},
        {"$set": {"history": []}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Failed to clear history"}), 500

    return jsonify({
        "message": "Conversation history cleared successfully",
        "conversation_id": conversation_id
    }), 200