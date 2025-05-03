from gtts import gTTS
from io import BytesIO

def text_to_speech(text:str)->BytesIO:
    mp3_fp = BytesIO()
    tts = gTTS(text=text, lang='en')
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)
    return mp3_fp
