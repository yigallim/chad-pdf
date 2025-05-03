from flask import Flask
from .extensions import mongo
from .routes import register_routes
from flask_cors import CORS
from chromadb.config import Settings
import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_store")
pdf_chunks_collection = chroma_client.get_or_create_collection(name="pdf_chunks")

def create_app():
    app = Flask(__name__)
    app.config["MONGO_URI"] = "mongodb://localhost:27017/chad_pdf"
    app.config["DEBUG"] = True
    mongo.init_app(app)
    register_routes(app)
    CORS(app, support_credentials=True)
    app.chroma_client = chroma_client
    app.pdf_chunks_collection = pdf_chunks_collection
    return app