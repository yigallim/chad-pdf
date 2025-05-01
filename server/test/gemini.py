from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_TOKEN = os.getenv("GEMINI_API_KEY")

def create_chat():
    client = genai.Client(api_key=GEMINI_TOKEN)
    chat = client.chats.create(model="gemini-2.0-flash")
    return chat

def send_message(chat, message):
    """
    **To retrieve message - 
    --------------------------------
    for chunk in response:
        print(chunk.text, end="")
    --------------------------------
    """
    response = chat.send_message_stream(message)
    return response

# test
chat = create_chat()
while True:
    user_input = input("You: ")
    if user_input.lower() in ['exit', 'quit']:
        break

    response = send_message(chat, user_input)
    print("Gemini:")
    for chunk in response:
        print(chunk.text, end="")