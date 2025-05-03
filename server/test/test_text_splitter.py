import os
import re
import pdfplumber
from langchain.text_splitter import CharacterTextSplitter
import text_processor as tp

def count_words_pdf(file_path):
    text = ' '.join(get_pdf_content(file_path))
    text = re.sub(r'\s+', ' ', text.strip())
    text = tp.clean_symbols(text)
    words = text.split()
    word_count = len(words)
    return word_count

def get_pdf_content(pdf_path):
    content = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            chars = page.chars
            text = ""
            for i, char in enumerate(chars[:-1]):
                text += char["text"]
                next_char = chars[i + 1]
                if next_char["x0"] - char["x1"] > 1:
                    text += " "
            content.append(text)
    return content

def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    return text_splitter.split_text(text)

def main():
    # Get the directory of the current script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Navigate to the parent directory (server) and then to uploads
    # From test/ go up one level to server/, then to uploads/
    uploads_folder = os.path.join(os.path.dirname(current_dir), "uploads")

    if not os.path.exists(uploads_folder):
        print(f"Error: Uploads folder not found at {uploads_folder}")
        return

    pdf_files = [f for f in os.listdir(uploads_folder) if f.lower().endswith('.pdf')]

    if not pdf_files:
        print(f"No PDF files found in {uploads_folder}")
        return

    selected_pdf = pdf_files[0]
    pdf_path = os.path.join(uploads_folder, selected_pdf)

    print(f"Processing PDF: {selected_pdf}")

    content = get_pdf_content(pdf_path)
    print(f"\nTotal pages extracted: {len(content)}")

    total_word_count = count_words_pdf(pdf_path)
    print(f"\n📝 Total word count in the PDF: {total_word_count}")

    total_chunks = 0
    for page_num, page_text in enumerate(content):
        chunks = get_text_chunks(page_text)
        print(f"\n--- Page {page_num + 1}: {len(chunks)} chunks ---")
        for i, chunk in enumerate(chunks, start=1):
            print(f"\n[Chunk {i}]\n{chunk}\n{'-'*40}")
        total_chunks += len(chunks)

    print(f"\n✅ Total chunks from all pages: {total_chunks}")


if __name__ == "__main__":
    main()