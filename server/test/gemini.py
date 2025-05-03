import time
import random
from google import genai
from google.genai import errors as genai_errors
from dotenv import load_dotenv
import os
from typing import Optional

load_dotenv()

GEMINI_TOKEN = os.getenv("GEMINI_API_KEY")

def create_chat(history: Optional[list] = None):
    client = genai.Client(api_key=GEMINI_TOKEN)
    chat = client.chats.create(model="gemini-2.0-flash", history=history)
    return chat

def send_message(chat, message, max_retries=5, initial_delay=0.5, max_delay=10):
    """
    **To retrieve message - 
    --------------------------------
    for chunk in response:
        print(chunk.text, end="")
    --------------------------------
    """
    retries = 0
    last_exception = None
    while retries <= max_retries:
        try:
            response = chat.send_message_stream(message)
            for chunk in  response:
                yield chunk.text
            return
        except genai_errors.ClientError as e:
            retriable = [429,503]
            if e.code not in retriable:
                raise Exception(e.message)
            retry_delay = min(max_delay, (initial_delay * (2 ** retries)) + random.uniform(0, 1))
            print(f"Error: {e.status} ({e.code}) - {e.message}")
            print(f"Retrying in {retry_delay:.2f} seconds...")
            time.sleep(retry_delay)
            last_exception = e
            retries += 1
        except genai_errors.ServerError as e:
            raise Exception(f"Server Error : {e.message}")
        except Exception as e: 
            raise Exception(f"Unexpected error : {e}")
            

    if last_exception:
        if isinstance(last_exception, genai_errors.ClientError):
            if last_exception.code == 429:
                raise Exception("You have exceeded your current quota. Retry it later.")
            elif last_exception.code == 503:
                raise Exception("Service is temporarily unavailable.")
        raise Exception(f"Failed to send message after {max_retries} retries due to persistent errors: {last_exception}")
    else:
        # This should ideally not be reached if there were no retriable errors
        raise Exception("Failed to send message for an unexpected reason after all retries.")
    
def summarize(texts):
    text = " ".join(texts)
    client = genai.Client(api_key=GEMINI_TOKEN)

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=f"Please summarize the following content: {text}"
    )
    return response.text

