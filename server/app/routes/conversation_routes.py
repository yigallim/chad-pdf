from flask import Blueprint, request, jsonify
from app.extensions import mongo
from app.utils.response import clean_res
import time
from bson import ObjectId

MAX_WORDS = 50000
MAX_PDFS = 20

conversation_bp = Blueprint('conversation', __name__)

@conversation_bp.route("/conversation", methods=["GET"])
def get_conversations():
    conversations = list(mongo.db.conversations.find())
    for conv in conversations:
        if 'pdfMeta' in conv and isinstance(conv['pdfMeta'], list):
            for meta in conv['pdfMeta']:
                try:
                    pdf_doc = mongo.db.pdf_files.find_one({'_id': ObjectId(meta['id'])})
                    if pdf_doc:
                        meta['filename'] = pdf_doc.get('filename')
                        meta['word_count'] = pdf_doc.get('word_count', -1)
                except Exception:
                    meta['filename'] = None
                    meta['word_count'] = -1
    cleaned = clean_res(conversations)
    return jsonify(cleaned), 200

@conversation_bp.route("/conversation", methods=["POST"])
def create_conversation():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON body'}), 400

    label = data.get('label')
    pdf_meta = data.get('pdfMeta', [])

    if label is None or not isinstance(pdf_meta, list):
        return jsonify({'error': 'Invalid parameters'}), 400

    for item in pdf_meta:
        if not isinstance(item, dict) or 'id' not in item:
            return jsonify({'error': 'Each pdfMeta item must contain an id'}), 400

    if len(pdf_meta) > MAX_PDFS:
        return jsonify({
            'error': f'You may attach at most {MAX_PDFS} PDFs per conversation.'
        }), 400

    cleaned_meta = []
    total_words  = 0
    for item in pdf_meta:
        pid = item['id']
        doc = mongo.db.pdf_files.find_one({'_id': ObjectId(pid)}, {'word_count': 1})
        wc  = doc.get('word_count', 0) if doc else 0
        total_words += max(wc, 0)
        cleaned_meta.append({'id': pid})

    if total_words > MAX_WORDS:
        return jsonify({
            'error': (
                f'The combined word count of your PDFs is {total_words}, '
                f'which exceeds the limit of {MAX_WORDS}.'
            )
        }), 400

    conversation_doc = {
        'label':    label,
        'pdfMeta':  cleaned_meta,
        'history':  [],
        'createdAt': int(time.time())
    }
    result = mongo.db.conversations.insert_one(conversation_doc)
    conversation_doc['id'] = str(result.inserted_id)
    return jsonify(clean_res(conversation_doc)), 201

@conversation_bp.route("/conversation", methods=["DELETE"])
def delete_conversation():
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({'error': 'Missing id'}), 400

    try:
        result = mongo.db.conversations.delete_one({'_id': ObjectId(data['id'])})
    except Exception as e:
        return jsonify({'error': 'Invalid id format'}), 400

    if result.deleted_count == 0:
        return jsonify({'error': 'Conversation not found'}), 404

    return jsonify({'success': True, 'deleted_id': data['id']}), 200

@conversation_bp.route("/conversation", methods=["PATCH"])
def update_conversation():
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({'error': 'Missing id'}), 400

    update_fields = {}
    if 'label' in data:
        update_fields['label'] = data['label']

    if 'pdfMeta' in data:
        if not isinstance(data['pdfMeta'], list):
            return jsonify({'error': 'pdfMeta must be a list'}), 400

        for item in data['pdfMeta']:
            if not isinstance(item, dict) or 'id' not in item:
                return jsonify({'error': 'Each pdfMeta item must contain an id'}), 400

        # 2) enforce PDF‐count limit
        if len(data['pdfMeta']) > MAX_PDFS:
            return jsonify({
                'error': f'You may attach at most {MAX_PDFS} PDFs per conversation.'
            }), 400

        total_words = 0
        for item in data['pdfMeta']:
            pid = item['id']
            doc = mongo.db.pdf_files.find_one({'_id': ObjectId(pid)}, {'word_count': 1})
            wc  = doc.get('word_count', 0) if doc else 0
            total_words += max(wc, 0)

        if total_words > MAX_WORDS:
            return jsonify({
                'error': (
                    f'The combined word count of your PDFs is {total_words}, '
                    f'which exceeds the limit of {MAX_WORDS}.'
                )
            }), 400

        update_fields['pdfMeta'] = data['pdfMeta']

    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    try:
        result = mongo.db.conversations.update_one(
            {'_id': ObjectId(data['id'])},
            {'$set': update_fields}
        )
    except Exception:
        return jsonify({'error': 'Invalid id format'}), 400

    if result.matched_count == 0:
        return jsonify({'error': 'Conversation not found'}), 404

    updated = mongo.db.conversations.find_one({'_id': ObjectId(data['id'])})
    return jsonify(clean_res(updated)), 200