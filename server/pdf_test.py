import os
import tkinter as tk
from tkinterdnd2 import DND_FILES, TkinterDnD
import pdf_be as be
import db_helper as db

def process_pdfs(pdf_list):
    for pdf in pdf_list:
        input_pdf = pdf
        output_pdf = os.path.join("output/", f"{os.path.basename(pdf)}")
        pdf_info=[]
        # process pdf
        # db.load_pdf_by_filename(pdf)
       
        # db.store_pdf_if_new(pdf)
        with open(pdf, 'rb') as input_file:
            text = "".join(be.get_pdf_content(input_file))
            sentiments = be.compute_sentiment(text)
            print(sentiments)
        #     pdf_info = be.extract_information(input_file)
        #     for page_info in pdf_info:
        #         vectorstore = be.get_vectorstore(page_info['chunks'])
        #         conversation_chain = be.get_conversation_chain(vectorstore)

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


if __name__ == "__main__":
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
    status_listbox.pack(fill=tk.BOTH,expand=True)

    status_listbox.drop_target_register(DND_FILES)
    status_listbox.dnd_bind('<<DropEnter>>', on_drag_enter)


    root.mainloop()
