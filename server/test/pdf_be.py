# pip install google-genai
# pip install dotenv
import text_processor as tp
import db_helper as db
import gemini
import fitz
from langchain.text_splitter import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_chroma import Chroma
from langchain.schema.document import Document
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline, AutoTokenizer
from nltk.tokenize import sent_tokenize
import nltk
from typing import Optional
from bson import ObjectId
import os

def _safe_nltk_download(resource_path, download_name=None):
    try:
        nltk.data.find(resource_path)
    except LookupError:
        nltk.download(download_name or resource_path.split('/')[-1])

_safe_nltk_download('tokenizers/punkt')

def count_words_pdf(file_path):
    text = ' '.join(get_pdf_content(file_path))
    text = tp.remove_symbols(text)
    words = text.split()
    word_count = len(words)
    return word_count

# extract text from pdf
def get_pdf_content(pdf_path):
    content = []
    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            text = page.get_text("text")
            text = tp.remove_non_ascii(text)
            text = tp.remove_extra_space(text)
            content.append(text)
    return content

# split text into chunks
def get_text_chunks(text:str):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200, # overlapping text to preserve continuity between chunks
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

def extract_information(file_path:str):
    pdf_info = []
    content = get_pdf_content(file_path)
    for page_num, text in enumerate(content,  start=1):
        chunks = get_text_chunks(text)
        pdf_info.append({"page":page_num,"chunks":chunks})
    return pdf_info

def compute_similarity(pdf_path1:str,pdf_path2:str):
    text1 = get_pdf_content(pdf_path1)
    text2 = get_pdf_content(pdf_path2)

    model = SentenceTransformer("all-MiniLM-L6-v2")

    embeddings = model.encode([text1, text2])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

    return similarity

def _chunks_for_sentiment(text:str, tokenizer):
    max_tokens = 500
    token_ids  = tokenizer.encode(text, add_special_tokens=True)
    for i in range(0, len(token_ids), max_tokens):
        chunk_ids = token_ids[i:i + max_tokens]
        decoded_chunk = tokenizer.decode(chunk_ids, skip_special_tokens=True)
        yield decoded_chunk

def _compute_weighted_sentiment(predictions:list):
    sentiment_weights = {'positive': 1, 'neutral': 0, 'negative': -1}
    total_weighted_score = 0
    total_score = 0

    for pred in predictions:
        label = pred['label'].lower()
        score = pred['score']
        weight = sentiment_weights.get(label, 0)
        total_weighted_score += weight * score
        total_score += score

    if total_score == 0:
        return 0  # Avoid division by zero

    weighted_average = total_weighted_score / total_score
    return weighted_average

def compute_sentiment(text:str):
    model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    sentiment_pipeline = pipeline("sentiment-analysis", model=model_name)
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    sentiments = []
    sentences = sent_tokenize(text)  # Split text into sentences

    for sentence in sentences:
        for chunk in _chunks_for_sentiment(sentence,tokenizer):
            result = sentiment_pipeline(chunk)
            sentiments.append(result[0])
    return _compute_weighted_sentiment(sentiments)

def create_vectorstore(model_name:str, pdf_id:str,pdf_info:list[dict[str, list[str]]],chat_id:str):
    persist_path = f"./chroma_store/{chat_id}"
    
    if os.path.exists(persist_path):
        print(f"❌ Vectorstore exists. Try load_vectorstore().")
        return None
    
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    docs=[]
    for page_info in pdf_info:
        docs=[Document(page_content=chunk, metadata={"pdf_id": pdf_id, "page_num":page_info["page"]}) for chunk in page_info["chunks"]]

    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embedding_model,
        persist_directory=persist_path
    )
    return vectorstore

def load_vectorstore(model_name:str, chat_id:str):
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    vectorstore = Chroma(persist_directory=f"./chroma_store/{chat_id}", embedding_function=embedding_model)
    return vectorstore

def remove_pdf_from_vectorstore(vectorstore:Chroma, pdf_id:str):
    vectorstore.delete(where={"pdf_id":pdf_id})

def update_vectorstore(vectorstore:Chroma, pdf_id:str, pdf_info:list[dict[str, list[str]]]):
    docs=[]
    for page_info in pdf_info:
        docs.extend([Document(page_content=chunk, metadata={"pdf_id": pdf_id, "page_num":page_info["page"]}) for chunk in page_info["chunks"]])
    
    vectorstore.add_documents(docs)
    return vectorstore

def retrieve_relevant_docs(query:str, vectorstore:Chroma,top_k:int=3):
    total_docs = vectorstore._collection.count()
    k = min(top_k, total_docs)
    results = vectorstore.similarity_search(query,k=k)
    return [doc for doc in results]

def get_chunks_by_docs(docs:Document):
    return [doc.page_content for doc in docs]
    
def get_page_nums_by_docs(docs:Document):
    return [doc.metadata.get("page_num") for doc in docs]

def get_pdf_ids_by_docs(docs:Document):
    return [doc.metadata.get("pdf_id") for doc in docs]
    
def get_query_with_context(query:str,relevant_chunks:list[str]):
    context = "\n\n".join(relevant_chunks)
    full_prompt = f"""Use the following context to answer the question.

Context:
{context}

Question:
{query}
"""
    return full_prompt

def get_chat_new_messages(user_responses:Optional[list[str]]=None, model_responses:Optional[list[str]]=None):
    m_texts = []
    for r in model_responses:
        m_texts.append({"text": r})
        
    u_texts=[]
    for r in user_responses:
        u_texts.append({"text": r})
    
    user_side={"role": "user", "parts": u_texts}
    model_side={"role": "model", "parts": m_texts}
    
    return [user_side,model_side]

def get_conversation_chain(llm, vectorstore):
    memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
    
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory,
        verbose=True
    )
    return conversation_chain

def ask_question(conversation_chain,question):
    return conversation_chain.run(question)


def pdf_path_to_vectorstore(pdf_path:str,chat_id:ObjectId, embedding_model_name:Optional[str]=None, vectorstore:Optional[Chroma]=None):
    pdf_info = extract_information(pdf_path)
    pdf_id = str(db.store_pdf_if_new(pdf_path))
    
    # Create a vectorstore
    if not vectorstore:
        if embedding_model_name and pdf_id:
            vectorstore = create_vectorstore(embedding_model_name, pdf_id, pdf_info, str(chat_id))
            db.update_vectorstore_path(chat_id=chat_id, vectorstore_path=f"./chroma_store/{chat_id}")
            db.update_chat_pdf_ids(chat_id, [pdf_id])
        else:
            print("❌ Please specify chat_id and embedding_model_name.")
            return None
    else:
        _, _, pdf_ids, _ = db.get_historical_chat(chat_id)
        if not pdf_ids:
                pdf_ids=[]
        if pdf_id not in pdf_ids:
            vectorstore = update_vectorstore(vectorstore=vectorstore, pdf_id=pdf_id, pdf_info=pdf_info)
            pdf_ids.append(pdf_id)
            db.update_chat_pdf_ids(chat_id, pdf_ids)
    return vectorstore
# pdf_paths = [
#     "C:/Users/Kang/Downloads/1706.03762v7.pdf",
#     "C:/Users/Kang/Downloads/2010.11929v2.pdf",
#     "C:/Users/Kang/Downloads/Chapter 1.pdf",
#     "C:/Users/Kang/Downloads/2501.09801v1.pdf"
#     ]
# chat_id = db.create_chat("testing")
# embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
# vectorstore = None
# for path in pdf_paths:
#     vectorstore = pdf_path_to_vectorstore(path, chat_id,embedding_model_name=embedding_model_name, vectorstore=vectorstore)

# query = "what is acting rationally"
# retrieved_docs = retrieve_relevant_docs(query, vectorstore,top_k=20)

# relevant_chunks = get_chunks_by_docs(retrieved_docs)

# for doc in retrieved_docs:
#     print("Chunk:", doc.page_content)
#     print("Page Num:", doc.metadata.get("page_num"))
#     print("PDF ID:", doc.metadata.get("pdf_id"))