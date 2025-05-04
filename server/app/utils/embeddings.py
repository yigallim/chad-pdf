class EmbeddingsUtils:
    @staticmethod
    def query_pdf_chunks(collection, user_message, allowed_pdf_ids, n_results=5):
        try:
            results = collection.query(
                query_texts=[user_message],
                n_results=n_results,
                where={"pdf_id": {"$in": allowed_pdf_ids}}
            )
            filtered_results = {
                "documents": [[]],
                "metadatas": [[]],
                "distances": [[]]
            }
            for i, distance in enumerate(results["distances"][0]):
                if distance < 1.5:
                    filtered_results["documents"][0].append(results["documents"][0][i])
                    filtered_results["metadatas"][0].append(results["metadatas"][0][i])
                    filtered_results["distances"][0].append(distance)
            return filtered_results
        except Exception as e:
            return None