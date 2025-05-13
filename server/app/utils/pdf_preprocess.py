import os
import re
import fitz
import time
import spacy
import subprocess
from importlib.util import find_spec as is_package
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from itertools import combinations

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
        text = re.sub(r'[\U0001F300-\U0001F6FF]', '', text)
        text = re.sub(r'[\u2200-\u22FF]', '', text)
        return text

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

    @staticmethod
    def compute_similarity(pdf_path1: str, pdf_path2: str) -> float:
        text1_pages = PDFUtils.get_pdf_content(pdf_path1)
        text2_pages = PDFUtils.get_pdf_content(pdf_path2)
        text1 = " ".join(text1_pages)
        text2 = " ".join(text2_pages)
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return similarity

    @staticmethod
    def compute_pdf_similarity_summaries(pdf_list: list[str]) -> list[dict]:
        pairwise_scores = []
        for p1, p2 in combinations(pdf_list, 2):
            score = PDFUtils.compute_similarity(p1, p2)
            name1 = os.path.splitext(os.path.basename(p1))[0]
            name2 = os.path.splitext(os.path.basename(p2))[0]
            pairwise_scores.append({
                "pdf_1": name1,
                "pdf_2": name2,
                "similarity_score": score
            })
        return pairwise_scores
