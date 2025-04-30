import utils.PDFHelper as pdf


def extract_information(file):
    pdf_info = []
    content = pdf.get_pdf_content(file)
    for page_num, text in enumerate(content):
        chunks = pdf.get_text_chunks(text)
        pdf_info.append({"page":page_num,"chunks":chunks})
    return pdf_info