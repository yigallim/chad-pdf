# pip install google-genai
# pip install dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import USearch
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")

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

def extract_information(file):
    pdf_info = []
    content = get_pdf_content(file)
    for page_num, text in enumerate(content):
        chunks = get_text_chunks(text)
        pdf_info.append({"page":page_num,"chunks":chunks})
    return pdf_info

def get_vectorstore(model_name, text_chunks):
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    vectorstore = USearch.from_texts(text_chunks, embedding_model)
    return vectorstore

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
