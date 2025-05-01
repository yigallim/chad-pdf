import os
import hashlib
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from app.extensions import mongo
from bson import ObjectId
from app.utils.response import clean_res
from flask_cors import cross_origin
from flask import current_app, send_from_directory

pdf_bp = Blueprint('pdf', __name__)

@pdf_bp.route('/pdf', methods=['GET'])
def get_all_pdf():
    pdfs = list(mongo.db.pdf_files.find({}, {'hash': 0}))
    cleaned = clean_res(pdfs)
    return jsonify(cleaned)

@pdf_bp.route('/pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if not file or not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    file_content = file.read()
    file_hash = hashlib.sha256(file_content).hexdigest()

    existing_pdf = mongo.db.pdf_files.find_one({'hash': file_hash})
    if existing_pdf:
        return jsonify({'id': str(existing_pdf['_id']), 'filename': existing_pdf.get('filename', ''), 'existed': True}), 201

    pdf_doc = {'filename': file.filename, 'hash': file_hash}
    pdf_id = mongo.db.pdf_files.insert_one(pdf_doc).inserted_id

    filename = f"{pdf_id}.pdf"
    upload_folder = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    with open(file_path, 'wb') as f:
        f.write(file_content)

    return jsonify({'id': str(pdf_id), 'filename': file.filename, 'existed': False}), 201

@pdf_bp.route('/pdf', methods=['DELETE'])
def delete_pdf():
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({'error': 'Missing id'}), 400

    try:
        pdf_id = ObjectId(data['id'])
    except Exception:
        return jsonify({'error': 'Invalid id format'}), 400

    pdf_doc = mongo.db.pdf_files.find_one({'_id': pdf_id})
    if not pdf_doc:
        return jsonify({'error': 'PDF not found'}), 404

    referencing_convs = list(
        mongo.db.conversations.find({'pdfMeta.id': str(pdf_id)}, {'_id': 1, 'label': 1})
    )

    if referencing_convs:
        conflicted = [{'id': str(c['_id']), 'label': c.get('label', '')}
                      for c in referencing_convs]
        return (
            jsonify({
                'error': 'This PDF is linked to existing conversation(s) '
                         'and cannot be deleted.',
                'linked_conversations': conflicted
            }),
            409  
        )
    filename = f"{pdf_id}.pdf"
    upload_folder = os.path.join(os.getcwd(), 'uploads')
    file_path = os.path.join(upload_folder, filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    mongo.db.pdf_files.delete_one({'_id': pdf_id})

    return jsonify({'deleted_id': data['id']}), 200

@pdf_bp.route('/uploads/<path:filename>')
@cross_origin()
def uploaded_file(filename):
    uploads_dir = os.path.join(current_app.root_path, '..', 'uploads')
    return send_from_directory(uploads_dir, filename)