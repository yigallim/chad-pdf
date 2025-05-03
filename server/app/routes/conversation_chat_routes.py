from flask import Blueprint, request, jsonify, current_app
from app.extensions import mongo
from bson import ObjectId
import time

conversation_chat_bp = Blueprint('conversation_chat', __name__)

def mock_model_reply(user_message):
    collection = current_app.pdf_chunks_collection
    try:
        results = collection.query(
            query_texts=[user_message],
            n_results=5
        )
        matched_chunks = []
        for i in range(len(results['documents'][0])):
            chunk_text = results['documents'][0][i]
            markdown_chunk = f"```markdown\n{chunk_text}\n```\n"
            matched_chunks.append({
                "text": markdown_chunk
            })
        return matched_chunks
    except Exception as e:
        return [
            {"text": "Sorry I don't know what you mean."},
        ]

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

    user_message = data["message"]
    user_entry = {
        "role": "user",
        "parts": [
            {"text": user_message}
        ]
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": user_entry}}
    )
    model_entry = {
        "role": "model",
        "parts": mock_model_reply(user_message)
    }
    mongo.db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"history": model_entry}}
    )

    updated = mongo.db.conversations.find_one({"_id": ObjectId(conversation_id)})
    return jsonify({
        "history": updated.get("history", [])
    }), 200