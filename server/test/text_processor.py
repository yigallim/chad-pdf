import spacy
from spacy.util import is_package
import subprocess
import re

def load_spacy_model(model_name="en_core_web_sm"):
    if not is_package(model_name):
        try:
            # Attempt to load model directly (might be installed via pip)
            spacy.load(model_name)
        except OSError:
            print(f"Downloading spaCy model: {model_name}")
            subprocess.run(["python", "-m", "spacy", "download", model_name], check=True)
    return spacy.load(model_name)
nlp = load_spacy_model("en_core_web_sm")

def remove_stopwords(text):
    doc = nlp(text)
    tokens = [token.text for token in doc if not token.is_stop]
    return " ".join(tokens)

def enrich_text_with_entities(text):
    doc = nlp(text)
    entity_strings = [f"{ent.text} ({ent.label_})" for ent in doc.ents]
    enriched_text = f"{text}\nEntities: {', '.join(entity_strings)}"
    return enriched_text

def remove_symbols(text):
    return re.sub(r'[^\w\s]', '', text)

def remove_extra_space(text):
    return re.sub(r'\s+', ' ', text.strip())

def remove_non_ascii(text):
    encoded = text.encode('ascii', errors='ignore')
    decoded = encoded.decode('ascii')
    return decoded

def lemmatize(text):
    doc = nlp(text)
    lemmas = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct]
    return " ".join(lemmas)

# # testing
# sample_text = "Apple Inc. was founded in 1976 by Steve Jobs in California."
# print("Original:", sample_text)
# print("\n1. Clean Symbols:", clean_symbols(sample_text))
# print("\n2. Remove Stopwords:", remove_stopwords(sample_text))
# print("\n3. Lemmatize:", lemmatize(sample_text))
# print("\n4. Enrich with Entities:\n", enrich_text_with_entities(sample_text))