import os
from dotenv import load_dotenv

load_dotenv()

def get_llm_client():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", None)
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        raise ValueError("LLM_API_KEY is not configured or is using default value.")
    
    try:
        import openai
    except ImportError:
        raise ImportError("The 'openai' package is not installed. Please run `pip install openai`.")
        
    kwargs = {"api_key": api_key, "timeout": 20.0}
    if base_url:
        kwargs["base_url"] = base_url
    return openai.OpenAI(**kwargs)

def ask_llm(system_prompt: str, user_prompt: str) -> str:
    """Sends a request to the LLM and returns the response."""
    client = get_llm_client()
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.0
    )
    return response.choices[0].message.content.strip()
