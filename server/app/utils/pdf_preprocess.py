import os
import re
import fitz
import time
import spacy
import subprocess
from importlib.util import find_spec as is_package
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_spacy_model(model_name="en_core_web_sm"):
    if not is_package(model_name):
        try:
            spacy.load(model_name)
        except OSError:
            print(f"Downloading spaCy model: {model_name}")
            subprocess.run(["python", "-m", "spacy", "download", model_name], check=True)
    return spacy.load(model_name)

nlp = load_spacy_model("en_core_web_sm")

def remove_stopwords(text):
    doc = nlp(text)
    tokens = [token.text for token in doc if not token.is_stop]
    return " ".join(tokens)

class PDFUtils:
    @staticmethod
    def count_words_pdf(file_path):
        total_words = 0
        content = PDFUtils.get_pdf_content(file_path)
        for text in content:
            words = text.split()
            total_words += len(words)
        return total_words

    @staticmethod
    def count_words_text(text: str) -> int:
        cleaned_text = PDFUtils.remove_non_ascii(text)
        cleaned_text = PDFUtils.remove_extra_space(cleaned_text)
        return len(cleaned_text.split())

    @staticmethod
    def remove_non_ascii(text):
        encoded = text.encode('ascii', errors='ignore')
        decoded = encoded.decode('ascii')
        return decoded

    @staticmethod
    def remove_extra_space(text):
        return re.sub(r'\s+', ' ', text.strip())

    @staticmethod
    def remove_stopwords(text):
        return remove_stopwords(text)
        
    @staticmethod
    def get_pdf_content(pdf_path):
        content = []
        with fitz.open(pdf_path) as pdf:
            for page in pdf:
                text = page.get_text("text")
                text = PDFUtils.remove_non_ascii(text)
                text = PDFUtils.remove_extra_space(text)
                content.append(text)
        return content

    @staticmethod
    def get_text_chunks(text: str):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        return text_splitter.split_text(text)

    @staticmethod
    def extract_information(file_path: str):
        pdf_info = []
        content = PDFUtils.get_pdf_content(file_path)
        for page_num, text in enumerate(content,  start=1):
            chunks = PDFUtils.get_text_chunks(text)
            pdf_info.append({"page":page_num,"chunks":chunks})
        return pdf_info


    @staticmethod
    def store_pdf_chunks_to_chroma(pdf_id: str, pdf_info: list, pdf_chunks_collection):
        documents = []
        metadatas = []
        ids = []

        chunk_counter = 0
        for page_data in pdf_info:
            page = page_data["page"]
            chunks = page_data["chunks"]

            for chunk in chunks:
                if len(chunk.split()) < 5:
                    continue
                documents.append(chunk)
                metadatas.append({"pdf_id": pdf_id, "page": page})
                ids.append(f"{pdf_id}_{chunk_counter}")
                chunk_counter += 1

        if documents:
            pdf_chunks_collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )