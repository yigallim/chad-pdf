from flask import Blueprint, request, jsonify, current_app

vector_bp = Blueprint('vector_bp', __name__)

@vector_bp.route('/vector/search', methods=['POST'])
def search_vector_chunks():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({'error': 'Missing query'}), 400

    query = data['query']
    collection = current_app.pdf_chunks_collection

    try:
        results = collection.query(
            query_texts=[query],
            n_results=5
        )
        matched_chunks = []
        for i in range(len(results['documents'][0])):
            matched_chunks.append({
                'text': results['documents'][0][i],
                'metadata': results['metadatas'][0][i]
            })
        return jsonify({'matches': matched_chunks}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500