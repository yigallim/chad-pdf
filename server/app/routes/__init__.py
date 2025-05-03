from .pdf_routes import pdf_bp
from .conversation_routes import conversation_bp
from .vector_routes import vector_bp
from .conversation_chat_routes import conversation_chat_bp
from .tts_routes import tts_bp

def register_routes(app):
    app.register_blueprint(pdf_bp, url_prefix='/api')
    app.register_blueprint(conversation_bp, url_prefix='/api')
    app.register_blueprint(vector_bp, url_prefix='/api')
    app.register_blueprint(conversation_chat_bp, url_prefix='/api')
    app.register_blueprint(tts_bp, url_prefix='/api')

