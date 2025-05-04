from flask import Blueprint, request, jsonify
from gtts import gTTS
import io
import base64

tts_bp = Blueprint('tts', __name__)

@tts_bp.route('/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text')
    if not text:
        return jsonify({"error": "No text provided"}), 400

    mp3_fp = io.BytesIO()
    tts = gTTS(text=text, lang='en')
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    mp3_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')

    return jsonify({
        "mp3_base64": mp3_base64
    }), 200