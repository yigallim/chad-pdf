import hashlib
from pymongo import MongoClient
import os

client = MongoClient("mongodb://localhost:27017/")
db = client["pdf"]
collection = db["pdf_files"]

# Compute SHA-256 hash of PDF content
def _compute_pdf_hash(file_path):
    with open(file_path, "rb") as f:
        pdf_data = f.read()
        return hashlib.sha256(pdf_data).hexdigest(), pdf_data

# Store PDF if not already in DB
def store_pdf_if_new(file_path):
    pdf_hash, pdf_data = _compute_pdf_hash(file_path)
    existing = collection.find_one({"hash": pdf_hash})
    filename = os.path.basename(file_path)
    if existing:
        print(f"✅ PDF '{filename}' already exists in the database (hash matched).")
        return False  # Already exists
    else:
        result = collection.insert_one({
            "filename": filename,
            "hash": pdf_hash
        })

        os.makedirs("pdf_folders", exist_ok=True)
        local_path = os.path.join("pdf_folders", f"{str(result.inserted_id)}.pdf")
        with open(local_path, "wb") as f:
            f.write(pdf_data)

        print(f"📥 Stored new PDF: '{filename}.pdf in pdf_folders/'")
        return True  # New file stored
    
def get_filepath(file_path):
    filename = os.path.basename(file_path)
    doc = collection.find_one({"filename": filename})

    if doc:
        file_id=str(doc["_id"])
        local_path = os.path.join("pdf_folders", file_id)
        if os.path.exists(local_path):
            print(f"📄 Found local PDF: {local_path}")
            return local_path
        else:
            print(f"❌ File '{local_path}' missing in 'pdf_folders/'. DB record exists but file is not found.")
            return None
    else:
        print(f"❌ PDF with filename '{filename}' not found in MongoDB.")
        return None
