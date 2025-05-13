from flask import Blueprint, request, jsonify, current_app
from app.extensions import mongo
from bson import ObjectId
import time
from gtts import gTTS
import io
import base64
import os
from app.utils.embeddings import EmbeddingsUtils
from app.utils.llm_api import LLMApi, SYSTEM_PROMPT, FULL_PDF_SYSTEM_PROMPT
from app.utils.pdf_preprocess import PDFUtils

conversation_chat_bp = Blueprint('conversation_chat', __name__)

def embedding_reply(user_message, allowed_pdf_ids):
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
    use_full_pdf = data.get("use_full_pdf", False)
    similarity_scores = conv.get("similarity_scores", [])

    if embedding_only:
        embeddings_response = embedding_reply(user_message, allowed_pdf_ids)
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
    
    if use_full_pdf:
        context_chunks = get_full_pdf_context(allowed_pdf_ids)
    else:
        context_chunks = get_relevant_context(user_message, allowed_pdf_ids)

    history = LLMApi.get_conversation_history(conversation_id)
    messages = build_llm_messages(history, user_message, context_chunks, full_pdf_mode=use_full_pdf, similarity_scores=similarity_scores)
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
    return jsonify({"history": updated.get("history", [])}), 200

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
    use_full_pdf = data.get("use_full_pdf", False)
    similarity_scores = conv.get("similarity_scores", [])

    user_entry = {
        "role": "user",
        "content": user_message
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": user_entry}}
    )

    if use_full_pdf:
        context_chunks = get_full_pdf_context(allowed_pdf_ids)
    else:
        context_chunks = get_relevant_context(user_message, allowed_pdf_ids)
    history = LLMApi.get_conversation_history(conversation_id)
    messages = build_llm_messages(history, user_message, context_chunks, full_pdf_mode=use_full_pdf, similarity_scores=similarity_scores)
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

        try:
            pdf_doc = mongo.db.pdf_files.find_one({"_id": ObjectId(pdf_id)})
            filename = pdf_doc.get("filename", "Unknown") if pdf_doc else "Unknown"
        except Exception:
            filename = "Unknown"

        pdf_nav = f'<!-- pdfnav: name="{filename}" page={page} id={pdf_id} -->'
        context_chunk = f"{pdf_nav}\n{chunk_text}"
        context_chunks.append(context_chunk)

    return context_chunks

def get_full_pdf_context(allowed_pdf_ids):
    full_pdf_context = []

    for pdf_id in allowed_pdf_ids:
        try:
            obj_id = ObjectId(pdf_id)
            pdf_doc = mongo.db.pdf_files.find_one({'_id': obj_id})
            if not pdf_doc:
                continue

            filename = pdf_doc.get("filename", "Unknown")
            upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
            file_path = os.path.join(upload_folder, f"{pdf_id}.pdf")
            print(f"File path: {file_path}")
            if not os.path.exists(file_path):
                print("File doesnt exist")
                continue

            page_texts = PDFUtils.get_pdf_content(file_path)

            for page_num, text in enumerate(page_texts, start=1):
                pdf_nav = f'<!-- pdfnav: name="{filename}" page={page_num} id={pdf_id} -->'
                full_pdf_context.append(f"{pdf_nav}\n{text}")

        except Exception as e:
            current_app.logger.error(f"Error building full context for {pdf_id}: {e}")
            continue

    return full_pdf_context

def build_llm_messages(history, user_message, context_chunks, remove_stopwords=False, full_pdf_mode=False, similarity_scores=None):
    # TODO clean markdown, less token, limit context window
    system_prompt = FULL_PDF_SYSTEM_PROMPT if full_pdf_mode else SYSTEM_PROMPT
    messages = [{"role": "system", "content": system_prompt}]

    if remove_stopwords:
        user_message = PDFUtils.remove_stopwords(user_message)
        context_chunks = [PDFUtils.remove_stopwords(chunk) for chunk in context_chunks]

    if history:
        for entry in history[:-1]:
            messages.append({
                "role": entry["role"],
                "content": entry["content"]
            })
            
    if similarity_scores:
        updated_scores = []
        for score in similarity_scores:
            pdf_id_1 = score.get('pdf_1')
            pdf_id_2 = score.get('pdf_2')
            
            try:
                pdf_doc_1 = mongo.db.pdf_files.find_one({"_id": ObjectId(pdf_id_1)})
                filename_1 = pdf_doc_1.get("filename", "Unknown") if pdf_doc_1 else "Unknown"
            except Exception:
                filename_1 = f"Unknown ({pdf_id_1})"
                
            try:
                pdf_doc_2 = mongo.db.pdf_files.find_one({"_id": ObjectId(pdf_id_2)})
                filename_2 = pdf_doc_2.get("filename", "Unknown") if pdf_doc_2 else "Unknown"
            except Exception:
                filename_2 = f"Unknown ({pdf_id_2})"
                
            updated_score = {
                'pdf_1': filename_1,
                'pdf_2': filename_2,
                'similarity_score': score.get('similarity_score', 0)
            }
            updated_scores.append(updated_score)

        similarity_scores = updated_scores

    # Build the formatted user message with context and/or similarity info
    if context_chunks:
        # When context is present, include both context and similarity if available
        formatted_message = LLMApi.build_prompt_with_context(
            user_message, context_chunks, full_pdf_mode, similarity_scores
        )
    elif similarity_scores:
        # No context chunks, but we still include similarity information
        formatted_message = LLMApi.build_prompt_with_context(
            user_message, [], full_pdf_mode, similarity_scores
        )
    else:
        # Neither context nor similarity info
        if full_pdf_mode:
            formatted_message = f"{user_message}\n\n(Note: No PDF document was found)"
        else:
            formatted_message = f"{user_message}\n\n(Note: No relevant context was found)"

    messages.append({"role": "user", "content": formatted_message})
    return messages