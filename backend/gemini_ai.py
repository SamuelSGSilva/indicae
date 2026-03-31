import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def get_intention_embedding(text: str) -> list[float]:
    """
    Receives text and returns a 768-dimensional float list embedding.
    Google's 'text-embedding-004' model is used here.
    """
    try:
        # text-embedding-004 is the recommended model directly below gemini-1.5
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="semantic_similarity"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        # Return fallback zero vector for MVP fail-safe 
        return [0.0] * 768
