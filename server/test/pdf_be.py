# pip install google-genai
# pip install dotenv
import text_processor as tp
import db_helper as db
import gemini
import groq
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

    return float(similarity)

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


def get_summary_by_path(pdf_path:str):
    pdf_id = db.store_pdf_if_new(pdf_path)
    content = get_pdf_content(pdf_path=pdf_path)
     
    models = {
        'gemini': gemini.summarize,
        'llama': groq.summarize
    }
    
    summaries = dict(map(lambda item: (item[0], item[1](content)), models.items()))

    for model_name, model_summary in summaries.items():
        db.update_summary(pdf_id=pdf_id, model_name=model_name, model_summary=model_summary)
        
    return summaries


from bert_score import score
def compute_bertscore(reference: str, candidate: str, lang: str = 'en') -> dict:
    P, R, F1 = score([candidate], [reference], lang=lang, verbose=False)
    return {
        'precision': P.item(),
        'recall': R.item(),
        'f1': F1.item()
    }
    
def compute_pdf_similarity_summaries(pdf_list: list[str]) -> dict:
    seen_pairs = []
    pairwise_scores = []
    for pdf1 in pdf_list:
        for pdf2 in pdf_list:
            if pdf1 == pdf2 or (pdf1, pdf2) in seen_pairs or (pdf2, pdf1) in seen_pairs:
                continue
            score = compute_similarity(pdf1,pdf2)
            pdf1_id = os.path.basename(pdf1)
            pdf2_id = os.path.basename(pdf2)
            pairwise_scores.append({
                "pdf_1": pdf1_id,
                "pdf_2": pdf2_id,
                "similarity_score": score
            })
            seen_pairs.append((pdf1_id, pdf2_id))
            
    if not pairwise_scores:
        return {
            "pairwise_scores": [],
            "most_similar_pair": None,
            "least_similar_pair": None
        }

    most_similar = max(pairwise_scores, key=lambda x: x["similarity_score"])
    least_similar = min(pairwise_scores, key=lambda x: x["similarity_score"])

    return {
        "pairwise_scores": pairwise_scores,
        "most_similar_pair": (most_similar["pdf_1"], most_similar["pdf_2"], most_similar["similarity_score"]),
        "least_similar_pair": (least_similar["pdf_1"], least_similar["pdf_2"], least_similar["similarity_score"])
    }
        


# expected = "Aditya Mohan’s research interests focus on the real effects of disclosure, institutional investors, and capital markets."
# generated = ['Aditya Mohan’s research interests include business administration, finance, and economics.'
#              ,'Aditya Mohan’s research interests are not explicitly mentioned, but based on his education and experience, it can be inferred that his research interests likely relate to finance, economics, or investment strategy.'
#              ,'Aditya Mohan’s research interests include business administration, finance, and economics, with a focus on asset allocation and investment strategies. His background in energy engineering also suggests potential interdisciplinary interests in energy economics or sustainable finance.']

# for text in generated:
#     print(compute_bertscore(reference=expected, candidate=text))

def jaccard_similarity(set1, set2):
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return len(intersection) / len(union)
while True:
    text1=input('text1')
    text2=input('text2')
    import text_processor as tp
    text1 = tp.remove_symbols(text1)
    text2 = tp.remove_symbols(text2)
    words1 = text1.split()
    words2 = text2.split()
    set1 = set(words1)
    set2 = set(words2)
    similarity = jaccard_similarity(set1,set2)

    print(f"Jaccard Similarity: {similarity:.2f}")


# expected = "The capital of France is Paris."
# generated = "Paris is the capital city of France."

# result = compute_bertscore(expected, generated)
# print(result) # {'precision': 0.9204800128936768, 'recall': 0.9289494752883911, 'f1': 0.9246953129768372}

# expected = "The capital of France is Paris."
# generated = "Quantum mechanics is a fundamental theory in physics."

# result = compute_bertscore(expected, generated)
# print(result) # {'precision': 0.8371249437332153, 'recall': 0.8564563989639282, 'f1': 0.8466803431510925}

# expected = "The capital of France is Paris."
# generated = "The capital of France is Paris."

# result = compute_bertscore(expected, generated)
# print(result) # {'precision': 1.0, 'recall': 1.0, 'f1': 1.0}



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