# pip install google-genai
# pip install dotenv
import gemini
import db_helper as db
import text_processor as tp
import pdfplumber
import re
from langchain.text_splitter import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import USearch
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline, AutoTokenizer
from nltk.tokenize import sent_tokenize
import nltk
from typing import Optional

def _safe_nltk_download(resource_path, download_name=None):
    try:
        nltk.data.find(resource_path)
    except LookupError:
        nltk.download(download_name or resource_path.split('/')[-1])

_safe_nltk_download('tokenizers/punkt')

def count_words_pdf(file_path):
    text = ' '.join(get_pdf_content(file_path))

    text = re.sub(r'\s+', ' ', text.strip())
    text = tp.clean_symbols(text)

    words = text.split()

    word_count = len(words)
    return word_count

# extract text from pdf
def get_pdf_content(pdf_path):
    content = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            chars = page.chars
            text = ""
            for i, char in enumerate(chars[:-1]):
                text += char["text"]
                next_char = chars[i + 1]
                if next_char["x0"] - (char["x1"]) > 2:  # Adjust threshold
                    text += " "
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

def extract_information(file):
    pdf_info = []
    content = get_pdf_content(file)
    for page_num, text in enumerate(content):
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

def get_vectorstore(model_name:str, text_chunks:list[str]):
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    vectorstore = USearch.from_texts(text_chunks, embedding_model)
    return vectorstore

def update_vectorstore(text_chunks,vectorstore):
    vectorstore.add_texts(text_chunks)

def retrieve_relevant_chunks(query:str, vectorstore:USearch,top_k:int=3):
    results = vectorstore.similarity_search(query,k=top_k)
    return [doc.page_content for doc in results]

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
