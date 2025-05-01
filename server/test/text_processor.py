import spacy.cli
import spacy
import re

spacy.cli.download("en_core_web_sm")
nlp = spacy.load("en_core_web_sm")

def remove_stopwords(text):
    doc = nlp(text)
    tokens = [token.text for token in doc if not token.is_stop]
    return " ".join(tokens)

def enrich_text_with_entities(text):
    doc = nlp(text)
    entity_strings = [f"{ent.text} ({ent.label_})" for ent in doc.ents]
    enriched_text = f"{text}\nEntities: {', '.join(entity_strings)}"
    return enriched_text

def clean_symbols(text):
    return re.sub(r'[^\w\s]', '', text)

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