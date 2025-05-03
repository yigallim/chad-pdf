import requests
import json
import time
import random
from dotenv import load_dotenv
import os
from typing import Optional

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def create_chat(history: Optional[list] = None):
    """
    Create a chat session with optional conversation history.
    History should be a list of message dictionaries with 'role' and 'content' keys.
    Returns a dictionary with chat ID and history.
    """
    if history is None:
        history = []
    return {"id": "groq-chat-placeholder", "history": history}

def send_message(chat, message, max_retries=5, initial_delay=0.5, max_delay=10):
    """
    Send a message to Groq API and stream the response.
    Incorporates chat history and updates it with the new message and response.
    Returns a generator yielding response chunks.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    # Handle special command to show history
    if message.lower() == "show history":
        if not chat["history"]:
            yield "No conversation history yet."
        else:
            for msg in chat["history"]:
                role = "You" if msg["role"] == "user" else "Groq"
                yield f"{role}: {msg['content']}\n"
        return

    # Append the new user message to the history
    chat["history"].append({"role": "user", "content": message})

    # Use LLaMA 3.3 70B as the model
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": chat["history"],
        "stream": True
    }

    retries = 0
    last_exception = None
    response_content = ""
    while retries <= max_retries:
        try:
            response = requests.post(GROQ_API_URL, headers=headers, json=payload, stream=True)
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        chunk = json.loads(data)
                        content = chunk["choices"][0]["delta"].get("content", "")
                        if content:
                            response_content += content
                            yield content
            # Append the assistant's response to the history
            if response_content:
                chat["history"].append({"role": "assistant", "content": response_content})
            return

        except requests.exceptions.RequestException as e:
            retry_codes = [429, 503]
            if e.response is not None and e.response.status_code not in retry_codes:
                raise Exception(f"API error: {e.response.status_code} - {e.response.text}")
            retry_delay = min(max_delay, (initial_delay * (2 ** retries)) + random.uniform(0, 1))
            print(f"Error: {e}")
            print(f"Retrying in {retry_delay:.2f} seconds...")
            time.sleep(retry_delay)
            last_exception = e
            retries += 1
        except Exception as e:
            print(type(e))
            raise Exception(f"Unexpected error: {e}")

    if last_exception:
        if isinstance(last_exception, requests.exceptions.RequestException):
            if last_exception.response.status_code == 429:
                raise Exception("Rate limit exceeded. Retry later or upgrade to a paid plan.")
            elif last_exception.response.status_code == 503:
                raise Exception("Service temporarily unavailable.")
        raise Exception(f"Failed after {max_retries} retries: {last_exception}")
    else:
        raise Exception("Failed for an unexpected reason after all retries.")

def summarize(texts):
    text = " ".join(texts)
    chat = create_chat()

    # Send the summary request and collect the streamed response
    response_chunks = send_message(chat, f"Please summarize the following content: {text}")
    summary = "".join(chunk for chunk in response_chunks)

    return summary

if __name__ == "__main__":
    chat = create_chat()
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() == "stop":
            break
        response = send_message(chat, user_input)
        print("Groq:", end="")
        for chunk in response:
            print(chunk, end="")
        print()