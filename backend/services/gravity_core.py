import os
import json
from typing import List, Dict, Optional
from openai import OpenAI
from ..models.analysis import GravityAnalysisResult

# Initialize OpenAI Client
# Note: In a real environment, use os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
Eres "Gravity", un sistema avanzado de inteligencia conversacional.
Tu objetivo es transformar transcripciones en documentos estructurados.

FORMATO DE SALIDA (JSON ESTRICTO):
Debes responder ÚNICAMENTE con un JSON válido que cumpla con el siguiente esquema:
{
  "executive_summary": {
    "title": "...",
    "participants": "...",
    "context": "...",
    "summary": "..."
  },
  "key_points": [
    {"text": "...", "is_urgent": boolean}
  ],
  "mermaid_diagram": "graph TD; ...",
  "actions": [
    {"description": "...", "owner": "...", "due_date": "..."}
  ],
  "metadata": {
    "keywords": ["..."],
    "category": "...",
    "sentiment": "..."
  }
}

REGLAS:
- El campo "mermaid_diagram" debe contener solo el código del grafo (ej: "graph TD; A-->B;"), sin bloques de markdown.
- Identifica urgencias.
- Sé profesional.
"""

def analyze_image(image_base64: str) -> str:
    """
    Analyzes an image using GPT-4 Vision and returns a description.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # GPT-4 with vision
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe esta imagen en detalle. Identifica objetos, personas, texto visible, contexto y cualquier información relevante que pueda ser útil para entender el contenido."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_base64
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return "Error al analizar la imagen"

def analyze_transcript_with_attachments(
    transcript_text: str,
    attachments: Optional[List[Dict]] = None
) -> GravityAnalysisResult:
    """
    Analyzes transcript with optional attachments (photos and notes).
    Photos are analyzed with GPT-4 Vision and descriptions are included in the analysis.
    """
    try:
        # Build context from attachments
        attachment_context = ""
        
        if attachments:
            attachment_context = "\n\n--- INFORMACIÓN ADICIONAL ---\n"
            
            for att in attachments:
                if att.get("type") == "photo":
                    # Analyze photo with Vision
                    description = analyze_image(att.get("content", ""))
                    attachment_context += f"\n📷 Foto adjunta: {description}\n"
                elif att.get("type") == "note":
                    attachment_context += f"\n📝 Nota: {att.get('content', '')}\n"
        
        # Combine transcript with attachment context
        full_context = f"{transcript_text}{attachment_context}"
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analiza la siguiente transcripción y contexto adicional:\n\n{full_context}"}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return GravityAnalysisResult(**data)
        
    except Exception as e:
        print(f"Error in Gravity Analysis with attachments: {e}")
        raise e

def analyze_transcript(transcript_text: str) -> GravityAnalysisResult:
    """
    Sends the transcript to the LLM and returns specific structured intelligence.
    """
    return analyze_transcript_with_attachments(transcript_text, None)
