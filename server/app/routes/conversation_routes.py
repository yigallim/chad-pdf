from flask import Blueprint, request, jsonify, current_app
from app.extensions import mongo
from app.utils.response import clean_res
import time
import threading
from bson import ObjectId
import os
from app.utils.llm_api import LLMApi
from app.utils.pdf_preprocess import PDFUtils

MAX_WORDS = 50000
MAX_PDFS = 20

conversation_bp = Blueprint('conversation', __name__)

def _async_calculate_similarity(conversation_id, app):
    with app.app_context():
        try:
            time.sleep(3)
            conv_id = ObjectId(conversation_id)
            conversation = mongo.db.conversations.find_one({'_id': conv_id})
            if not conversation:
                app.logger.warning(f"Similarity calculation aborted: Conversation {conversation_id} not found")
                return

            pdf_meta = conversation.get('pdfMeta', [])
            if not pdf_meta or len(pdf_meta) < 2:
                mongo.db.conversations.update_one(
                    {'_id': conv_id},
                    {'$set': {'calculating_similarity': False, 'similarity_scores': []}}
                )
                return

            upload_folder = os.path.join(app.root_path, '..', 'uploads')
            pdf_paths = []
            
            for item in pdf_meta:
                pdf_id = item.get('id')
                file_path = os.path.join(upload_folder, f"{pdf_id}.pdf")
                if os.path.exists(file_path):
                    pdf_paths.append(file_path)
            
            if len(pdf_paths) < 2:
                mongo.db.conversations.update_one(
                    {'_id': conv_id},
                    {'$set': {'calculating_similarity': False, 'similarity_scores': []}}
                )
                return
                
            similarity_scores = PDFUtils.compute_pdf_similarity_summaries(pdf_paths)
            
            mongo.db.conversations.update_one(
                {'_id': conv_id},
                {'$set': {'calculating_similarity': False, 'similarity_scores': similarity_scores}}
            )
            
        except Exception as e:
            app.logger.error(f"Error calculating similarity for conversation {conversation_id}: {e}")
            try:
                mongo.db.conversations.update_one(
                    {'_id': ObjectId(conversation_id)},
                    {'$set': {'calculating_similarity': False}}
                )
            except:
                pass

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
                        meta['summary'] = pdf_doc.get('summary')
                except Exception:
                    meta['filename'] = None
                    meta['word_count'] = -1
                    meta['summary'] = None
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
        'createdAt': int(time.time()),
        'calculating_similarity': len(cleaned_meta) > 1,
        'similarity_scores': []
    }
    result = mongo.db.conversations.insert_one(conversation_doc)
    conversation_id = str(result.inserted_id)
    conversation_doc['id'] = conversation_id

    if len(cleaned_meta) > 1:
        threading.Thread(
            target=_async_calculate_similarity,
            args=(conversation_id, current_app._get_current_object()),
            daemon=True
        ).start()
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

    recalculate_similarity = False
    if 'pdfMeta' in data:
        if not isinstance(data['pdfMeta'], list):
            return jsonify({'error': 'pdfMeta must be a list'}), 400

        for item in data['pdfMeta']:
            if not isinstance(item, dict) or 'id' not in item:
                return jsonify({'error': 'Each pdfMeta item must contain an id'}), 400

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
        recalculate_similarity = True
        update_fields['calculating_similarity'] = len(data['pdfMeta']) > 1
        update_fields['similarity_scores'] = []

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

    if recalculate_similarity and len(data['pdfMeta']) > 1:
        threading.Thread(
            target=_async_calculate_similarity,
            args=(data['id'], current_app._get_current_object()),
            daemon=True
        ).start()

    updated = mongo.db.conversations.find_one({'_id': ObjectId(data['id'])})
    return jsonify(clean_res(updated)), 200

@conversation_bp.route("/conversation/<conversation_id>/summarize-pdfs", methods=["POST"])
def summarize_all_pdfs(conversation_id):
    try:
        conv_id = ObjectId(conversation_id)
    except Exception:
        return jsonify({'error': 'Invalid conversation ID format'}), 400

    conversation = mongo.db.conversations.find_one({'_id': conv_id})
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404

    pdf_meta = conversation.get('pdfMeta', [])
    if not pdf_meta:
        return jsonify({'error': 'No PDFs linked to this conversation'}), 400

    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
    summaries = []

    for item in pdf_meta:
        pdf_id = item.get('id')
        try:
            obj_id = ObjectId(pdf_id)
        except Exception:
            summaries.append({'pdf_id': pdf_id, 'error': 'Invalid PDF ID format'})
            continue

        pdf_doc = mongo.db.pdf_files.find_one({'_id': obj_id})
        if not pdf_doc:
            summaries.append({'pdf_id': pdf_id, 'error': 'PDF not found'})
            continue

        if pdf_doc.get('summary'):
            summaries.append({
                'pdf_id': pdf_id,
                'summary': pdf_doc['summary'],
                'cached': True
            })
            continue

        if pdf_doc.get('summarizing', False):
            summaries.append({'pdf_id': pdf_id, 'error': 'Currently being summarized'})
            continue

        mongo.db.pdf_files.update_one({'_id': obj_id}, {'$set': {'summarizing': True}})

        file_path = os.path.join(upload_folder, f"{pdf_id}.pdf")
        if not os.path.exists(file_path):
            mongo.db.pdf_files.update_one({'_id': obj_id}, {'$unset': {'summarizing': ""}})
            summaries.append({'pdf_id': pdf_id, 'error': 'File not found on server'})
            continue

        try:
            summary = LLMApi.summarize_pdf_with_gemini(file_path)
        except Exception as e:
            mongo.db.pdf_files.update_one({'_id': obj_id}, {'$unset': {'summarizing': ""}})
            summaries.append({'pdf_id': pdf_id, 'error': f'Summarization failed: {str(e)}'})
            continue

        mongo.db.pdf_files.update_one(
            {'_id': obj_id},
            {
                '$set': {'summary': summary},
                '$unset': {'summarizing': ""}
            }
        )

        summaries.append({
            'pdf_id': pdf_id,
            'summary': summary,
            'cached': False
        })

    return jsonify({'conversation_id': conversation_id, 'summaries': summaries}), 200