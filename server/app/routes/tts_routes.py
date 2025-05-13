from flask import Blueprint, request, jsonify
from gtts import gTTS
from bs4 import BeautifulSoup, Comment
import io
import base64
import mistune
import re

tts_bp = Blueprint('tts', __name__)

def extract_md_tables(text):
    lines = text.splitlines(keepends=True)
    out, buffer = [], []
    i = 0
    while i < len(lines):
        if re.match(r'^\s*\|.*\|\s*$', lines[i]) \
           and i+1 < len(lines) and re.match(r'^\s*\|[-\s|:]+\|\s*$', lines[i+1]):
            # collect entire table
            buffer = [lines[i].strip(), lines[i+2].strip()]
            i += 3
            while i < len(lines) and re.match(r'^\s*\|.*\|\s*$', lines[i]):
                buffer.append(lines[i].strip())
                i += 1
            headers = [h.strip() for h in buffer[0].strip('|').split('|')]
            rows = [row.strip('|').split('|') for row in buffer[2:]]
            table_text = ["Table:"]
            for row in rows:
                cells = [cell.strip() for cell in row]
                table_text.append(
                    ", ".join(f"{hdr}: {cell}" for hdr, cell in zip(headers, cells))
                )
            out.append("\n".join(table_text) + "\n")
        else:
            out.append(lines[i])
            i += 1
    return "".join(out)

def markdown_to_text(md_content):
    md_content = re.sub(r'<!--\s*pdfnav:.*?-->', '', md_content)
    md_content = extract_md_tables(md_content)
    html = mistune.markdown(md_content)
    soup = BeautifulSoup(html, features="html.parser")

    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()

    for code in soup.find_all("code"):
        code.string = f"Code: {code.get_text()}"

    for li in soup.find_all("li"):
        li.insert_before("• ")

    result = soup.get_text()
    result = re.sub(r'\n\s*\n', '\n\n', result)
    return result

@tts_bp.route('/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text')
    if not text:
        return jsonify({"error": "No text provided"}), 400

    print("\nBefore Cleaned:")
    print(text)
    print("\n")
    cleaned_text = markdown_to_text(text)
    print("After Cleaned:")
    print(cleaned_text)
    print("\n")

    mp3_fp = io.BytesIO()
    tts = gTTS(text=cleaned_text, lang='en')
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    mp3_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')

    return jsonify({
        "mp3_base64": mp3_base64
    }), 200
