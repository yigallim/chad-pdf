import os
import tkinter as tk
from tkinterdnd2 import DND_FILES, TkinterDnD
import pdf_be as be
import db_helper as db
import threading
import gemini
import test_text_splitter_2 as ts
global_vectorstore = None

def process_pdfs(pdf_list):
    global global_vectorstore
    for pdf in pdf_list:
        input_pdf = pdf
        output_pdf = os.path.join("output/", f"{os.path.basename(pdf)}")
        pdf_info=[]
        # process pdf
        print(be.get_summary_by_path(pdf))
        global_vectorstore = be.pdf_path_to_vectorstore(pdf, chat_id, 'all-MiniLM-L6-v2', global_vectorstore)

        status_listbox.insert(tk.END, f"Processed: {os.path.basename(pdf)}")

def drop(event):
    files = event.data
    file_list = root.tk.splitlist(files)
    pdf_files = [f for f in file_list if f.lower().endswith('.pdf')]
    if pdf_files:
        process_pdfs(pdf_files)
    else:
        print("No PDF files detected.")

def on_drag_enter(event):
    drop_frame.pack(fill=tk.BOTH, expand=True)
    status_listbox.pack_forget()
    drop_label.pack(expand=True)

def on_drag_leave(event):
    drop_frame.pack_forget()
    status_listbox.pack(fill=tk.BOTH, expand=True)

def on_drop(event):
    drop(event)
    drop_frame.pack_forget()
    status_listbox.pack(fill=tk.BOTH, expand=True)


def start_gui():
    global root, drop_frame, drop_label, status_listbox

    # Initialize TkinterDnD
    root = TkinterDnD.Tk()
    root.title("PDF Processor")
    root.geometry("500x300")

    # Create a frame for the drop area
    drop_frame = tk.Frame(root, width=360, height=100, bg='lightgray')
    drop_frame.place(relx=0.5, rely=0.5, anchor=tk.CENTER)
    drop_frame.pack_propagate(False)
    drop_frame.pack_forget()

    drop_frame.drop_target_register(DND_FILES)
    drop_frame.dnd_bind('<<DropLeave>>', on_drag_leave)
    drop_frame.dnd_bind('<<Drop>>', on_drop)

    # Create a label inside the drop area
    drop_label = tk.Label(drop_frame, text="Drag and drop PDF files here", bg='lightgray')

    # Create a listbox to display status messages
    status_listbox = tk.Listbox(root, height=10, width=60)
    status_listbox.place(relx=0.5, rely=0.5, anchor=tk.CENTER)
    status_listbox.pack(fill=tk.BOTH, expand=True)

    status_listbox.drop_target_register(DND_FILES)
    status_listbox.dnd_bind('<<DropEnter>>', on_drag_enter)

    # Run GUI loop (this keeps running on a separate thread)
    root.mainloop()

# Start GUI in a thread
gui_thread = threading.Thread(target=start_gui, daemon=True)
gui_thread.start()
chat_id = db.create_chat('Testing')
first_time = True
chat = gemini.create_chat()
# Main thread for terminal input
while True:
    try:
        print(f"Chat History: {chat.get_history()}")
        user_input = input("You: ").strip()
        if user_input.lower() == 'exit':
            print("Exiting...")
            break
        if global_vectorstore is None:
            print("Please upload pdf before conversation")
            continue
        try:
            # Call the safe_send_message function
            relevant_chunks = be.retrieve_relevant_docs(user_input,global_vectorstore,3)
            query = be.get_query_with_context(user_input,be.get_chunks_by_docs(relevant_chunks))
            print("Gemini:")
            response = gemini.send_message(chat, query)
            chunks = []
            for chunk in response:
                print(chunk, end="")
                chunks.append(chunk)
            print()  # Add a newline at the end
            new_messages = be.get_chat_new_messages(user_responses=[query],model_responses=chunks)
            db.update_chat_history(chat_id=chat_id, new_messages=new_messages)
        except Exception as e:
            print(f"\nAn error occurred: {e}")
    except KeyboardInterrupt:
        break
