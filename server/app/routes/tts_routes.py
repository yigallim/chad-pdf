from flask import Blueprint, request, send_file
from gtts import gTTS
import io

tts_bp = Blueprint('tts', __name__)

@tts_bp.route('/tts',methods=['POST'])
def tts():
    data = request.json
    text = data.get('text')
    if not text:
        return {"error": "No text provided"}, 400

    # Use BytesIO instead of saving to disk
    mp3_fp = io.BytesIO()
    tts = gTTS(text=text, lang='en')
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    return send_file(mp3_fp, mimetype='audio/mpeg', as_attachment=False, download_name="speech.mp3")
