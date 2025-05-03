import hashlib
from pymongo import MongoClient
from bson import ObjectId
import os
from typing import Optional

client = MongoClient("mongodb://localhost:27017/")
db = client["chad_pdf"]
pdf_files_collection = db["pdf_files"]
chat_history_collection = db["chat_history"]
pdf_folders_dir = "../pdf_folders"

# Compute SHA-256 hash of PDF content
def _compute_pdf_hash(file_path):
    with open(file_path, "rb") as f:
        pdf_data = f.read()
        return hashlib.sha256(pdf_data).hexdigest(), pdf_data

# Store PDF if not already in DB
def store_pdf_if_new(file_path):
    pdf_hash, pdf_data = _compute_pdf_hash(file_path)
    existing = pdf_files_collection.find_one({"hash": pdf_hash})
    filename = os.path.basename(file_path)
    if existing:
        print(f"✅ PDF '{filename}' already exists in the database (hash matched).")
        return False  # Already exists
    else:
        result = pdf_files_collection.insert_one({
            "filename": filename,
            "hash": pdf_hash
        })

        os.makedirs(pdf_folders_dir, exist_ok=True)
        local_path = os.path.join(pdf_folders_dir, f"{str(result.inserted_id)}.pdf")
        with open(local_path, "wb") as f:
            f.write(pdf_data)

        print(f"📥 Stored new PDF: '{filename}.pdf in pdf_folders/'")
        return True  # New file stored
    
def get_filepath(file_path):
    filename = os.path.basename(file_path)
    doc = pdf_files_collection.find_one({"filename": filename})

    if doc:
        file_id=str(doc["_id"])
        get_filepath_by_id(file_id)
    else:
        print(f"❌ PDF with filename '{filename}' not found in MongoDB.")
        return None

def get_filepath_by_id(file_id):
    local_path = os.path.join("pdf_folders", f"{file_id}.pdf")
    if os.path.exists(local_path):
        print(f"📄 Found local PDF: {local_path}")
        return local_path
    else:
        print(f"❌ File '{local_path}' missing in 'pdf_folders/'. DB record exists but file is not found.")
        return None

def create_chat(chat_name:str):
    result = chat_history_collection.insert_one({
            "chat_name": chat_name,
            "chat_history": []
        })
    return result.inserted_id

def _get_chat(chat_id:ObjectId):
    chat = chat_history_collection.find_one({"_id": chat_id})
    
    if not chat:
        print(f"❌ Chat ('{chat_id}') not found in MongoDB.")
        raise ValueError(f"Chat with ID {chat_id} not found.")
    return chat

def update_chat_history(chat_id:ObjectId,new_messages:list):
    chat = _get_chat(chat_id)
    
    existing_history = chat.get('chat_history',[])
    existing_history.extend(new_messages)
    
    chat_history_collection.update_one(
        {"_id": chat_id},
        {"$set": {"chat_history": existing_history}}
    )
    print(f"✅ Chat history with chat id ('{chat_id}') updated.")

def update_vectorstore(chat_id:ObjectId, vectorstore):
    _get_chat(chat_id)
    chat_history_collection.update_one(
        {"_id": chat_id},
        {"$set": {
            "vectorstore": vectorstore
            }
         }
    )
    print(f"✅ Vectorstore with chat id ('{chat_id}') updated.")

def update_vector_ids(chat_id:ObjectId, vector_ids):
    _get_chat(chat_id)
    chat_history_collection.update_one(
        {"_id": chat_id},
        {"$set": {
            "vector_ids": vector_ids
            }
         }
    )
    print(f"✅ Vector IDs with chat id ('{chat_id}') updated.")
    
def update_chat_pdfs(chat_id:ObjectId, pdfs):
    _get_chat(chat_id)
    chat_history_collection.update_one(
        {"_id": chat_id},
        {"$set": {
            "pdfs": pdfs
            }
         }
    )
    print(f"✅ PDFs with chat id ('{chat_id}') updated.")
    
def get_all_chat_id():
    chat_ids = chat_history_collection.find({}, {"_id": 1})
    return [id['_id'] for id in chat_ids]

def get_historical_chat(chat_id:ObjectId):
    chat = _get_chat(chat_id)
    
    existing_history = chat.get('chat_history',None)
    chat_name = chat.get('chat_name',None)
    relevant_pdfs = chat.get('pdfs',None)
    vectorstore = chat.get('vectorstore',None)
    vector_ids = chat.get('vector_ids',None)
    return existing_history, chat_name, relevant_pdfs, vectorstore, vector_ids

