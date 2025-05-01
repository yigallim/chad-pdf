from flask import Flask
from .extensions import mongo
from .routes import register_routes
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config["MONGO_URI"] = "mongodb://localhost:27017/chad_pdf"
    app.config["DEBUG"] = True
    mongo.init_app(app)
    register_routes(app)
    CORS(app, support_credentials=True)
    return app