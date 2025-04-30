from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter

# extract text from pdf
def get_pdf_content(pdf):
    content = []
    pdf_reader = PdfReader(pdf)
    for page in pdf_reader.pages:
        content.append(page.extract_text())
    return content

# split text into chunks
def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200, # overlapping text to preserve continuity between chunks
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

