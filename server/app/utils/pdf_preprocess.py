def get_pdf_content(pdf_path):
    content = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            chars = page.chars
            text = ""
            for i, char in enumerate(chars[:-1]):
                text += char["text"]
                next_char = chars[i + 1]
                if next_char["x0"] - (char["x1"]) > 2:
                    text += " "
            content.append(text)
    return content

def count_words_pdf(file_path):
    text = ' '.join(get_pdf_content(file_path))

    text = re.sub(r'\s+', ' ', text.strip())
    text = tp.clean_symbols(text)

    words = text.split()

    word_count = len(words)
    return word_count