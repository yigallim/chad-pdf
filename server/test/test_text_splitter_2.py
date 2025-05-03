import sys
import re
import os
from pdfminer.high_level import extract_text
from langchain.text_splitter import RecursiveCharacterTextSplitter

def extract_and_clean_text_from_pdf(pdf_path):
    """
    1. extract all text with pdfminer
    2. remove extra blank lines
    3. collapse all whitespace to single spaces
    """
    raw_text = extract_text(pdf_path)
    # remove multiple blank lines, then collapse whitespace
    cleaned = re.sub(r'\n\s*\n', '\n', re.sub(r'\s+', ' ', raw_text.strip()))
    return cleaned

def remove_non_ascii(text):
    """strip out any non-ASCII chars (matching your Streamlit helper)"""
    return text.encode('ascii', errors='ignore').decode('ascii')

def chunk_text(text, chunk_size=1000, chunk_overlap=200):
    """
    Split into overlapping character chunks,
    then strip non-ASCII from each.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    raw_chunks = splitter.split_text(text=text)
    return [remove_non_ascii(c) for c in raw_chunks]

def count_words(text):
    """simple whitespace split"""
    return len(text.split())

def main(pdf_path):
    # 1) Extract & clean
    full_text = extract_and_clean_text_from_pdf(pdf_path)
    # 2) Count words
    total_words = count_words(full_text)
    print(f"📝 Total word count: {total_words}\n")
    # 3) Chunk and print
    chunks = chunk_text(full_text)
    print(f"🔢 Total chunks: {len(chunks)}\n")
    for i, chunk in enumerate(chunks, start=1):
        print(f"--- Chunk {i} ---\n{chunk}\n{'─'*40}\n")

if __name__ == "__main__":
    # Get the directory of the current script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Navigate to the parent directory (server) and then to uploads
    # From test/ go up one level to server/, then to uploads/
    uploads_folder = os.path.join(os.path.dirname(current_dir), "uploads")

    if not os.path.exists(uploads_folder):
        print(f"Error: Uploads folder not found at {uploads_folder}")
        sys.exit(1)

    pdf_files = [f for f in os.listdir(uploads_folder) if f.lower().endswith('.pdf')]

    if not pdf_files:
        print(f"No PDF files found in {uploads_folder}")
        sys.exit(1)

    selected_pdf = pdf_files[0]
    pdf_path = os.path.join(uploads_folder, selected_pdf)

    print(f"Processing PDF: {selected_pdf}")
    main(pdf_path)