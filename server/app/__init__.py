from typing import List
from flask import Flask
from .extensions import mongo
from .routes import register_routes
from flask_cors import CORS
from chromadb.config import Settings
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings
import os
from sentence_transformers import SentenceTransformer

USE_MINI_MODEL = True 

if USE_MINI_MODEL:
    model_id = "sentence-transformers/all-MiniLM-L6-v2"
    model_path = "./local_models/all-MiniLM-L6-v2"
else:
    model_id = "sentence-transformers/all-mpnet-base-v2"
    model_path = "./local_models/all-mpnet-base-v2"

class ChromaEmbeddingFunction:
    def __init__(self, model_path: str, model_id: str):
        self.model_path = model_path

        if not os.path.isdir(model_path):
            os.makedirs(model_path, exist_ok=True)
            print(f"Downloading and saving model to {model_path}...")
            model = SentenceTransformer(model_id)
            model.save(model_path)

        self.embedder = HuggingFaceEmbeddings(model_name=model_path)

    def __call__(self, input: List[str]) -> List[List[float]]:
        return self.embedder.embed_documents(input)

embedding_func = ChromaEmbeddingFunction(model_path, model_id)

chroma_client = chromadb.PersistentClient(path="./chroma_store")
pdf_chunks_collection = chroma_client.get_or_create_collection(
    name="pdf_chunks",
    embedding_function=embedding_func
)

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
