import os
import re
import fitz
import time
from langchain.text_splitter import RecursiveCharacterTextSplitter

def count_words_pdf(file_path):
    total_words = 0
    content = get_pdf_content(file_path)
    for text in content:
        words = text.split()
        total_words += len(words)
    return total_words
    
def remove_non_ascii(text):
    encoded = text.encode('ascii', errors='ignore')
    decoded = encoded.decode('ascii')
    return decoded

def remove_extra_space(text):
    return re.sub(r'\s+', ' ', text.strip())

def get_pdf_content(pdf_path):
    content = []
    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            text = page.get_text("text")
            text = remove_non_ascii(text)
            text = remove_extra_space(text)
            content.append(text)
    return content

def get_text_chunks(text: str):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    return text_splitter.split_text(text)

def extract_information(file_path: str):
    pdf_info = []
    content = get_pdf_content(file_path)
    for page_num, text in enumerate(content,  start=1):
        chunks = get_text_chunks(text)
        pdf_info.append({"page":page_num,"chunks":chunks})
    return pdf_info


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

# def create_vectorstore(model_name: str, pdf_id: str, pdf_info: list[dict], persist_path: str):
#     if os.path.exists(persist_path):
#         print(f"❌ Vectorstore exists at {persist_path}. Try load_vectorstore().")
#         return None

#     embedding_model = HuggingFaceEmbeddings(model_name=model_name)
#     docs = []

#     for page_info in pdf_info:
#         page_num = page_info["page"]
#         chunks = page_info["chunks"]
#         docs.extend([
#             Document(page_content=chunk, metadata={"pdf_id": pdf_id, "page_num": page_num})
#             for chunk in chunks
#         ])

#     vectorstore = Chroma.from_documents(
#         documents=docs,
#         embedding=embedding_model,
#         persist_directory=persist_path
#     )
#     return vectorstore
# def pdf_to_vectorstore(pdf_id: str, pdf_path:str, chat_id:ObjectId, embedding_model_name:Optional[str] = "sentence-transformers/all-MiniLM-L6-v2", vectorstore:Optional[Chroma]=None):
#     pdf_info = extract_information(pdf_path)
    
#     # IF VECTOR STORE IS NEW
#     if not vectorstore:
#         if embedding_model_name and pdf_id:
#             vectorstore = create_vectorstore(embedding_model_name, pdf_id, pdf_info, str(chat_id), "./chroma_store") # TODO

#             db.update_vectorstore_path(chat_id=chat_id, vectorstore_path=f"./chroma_store/{chat_id}")  # TODO
#             db.update_chat_pdf_ids(chat_id, [pdf_id])  # TODO

#     # IF VECTOR STORE IS PREVIOUSLY CREATED
#     else:
#         _, _, pdf_ids, _ = db.get_historical_chat(chat_id) # TODO
#         if not pdf_ids:
#                 pdf_ids=[]
#         if pdf_id not in pdf_ids:
#             vectorstore = update_vectorstore(vectorstore=vectorstore, pdf_id=pdf_id, pdf_info=pdf_info)
#             pdf_ids.append(pdf_id)
#             db.update_chat_pdf_ids(chat_id, pdf_ids)
#     return vectorstore

# pdf_paths = [
#     "C:/Users/Yigal Lim/Downloads/test-paper-pdf/1512.03385v1.pdf",
#     "C:/Users/Yigal Lim/Downloads/test-paper-pdf/1706.03762v7.pdf",
#     "C:/Users/Yigal Lim/Downloads/test-paper-pdf/2010.11929v2.pdf",
# ]

# chat_id = db.create_chat("testing")
# embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
# vectorstore = None
# for path in pdf_paths:
#     vectorstore = pdf_to_vectorstore(path, chat_id, vectorstore=vectorstore)

# query = "Natural Language Processing"
# retrieved_docs = retrieve_relevant_docs(query, vectorstore)

# for doc in retrieved_docs:
#     print("Chunk:", doc.page_content)
#     print("Page Num:", doc.metadata.get("page_num"))
#     print("PDF ID:", doc.metadata.get("pdf_id"))