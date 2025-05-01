# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(
        api_key=api_key
    )
chat = client.chats.create(model="gemini-2.0-flash")
def generate(input):
    response = chat.send_message(message=input)
    print(response)

if __name__ == "__main__":
    while(True):
        user_input = input("You: ")
        if user_input!= "STOP":
            generate(user_input)
        else: break

