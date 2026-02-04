import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
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
`;

export async function transcribeAudio(filePath: string): Promise<string> {
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
        });
        return transcription.text;
    } catch (error) {
        console.error('Transcription Error:', error);
        throw error;
    }
}

export async function analyzeTranscript(transcript: string, attachmentContext: string = '') {
    try {
        const fullContext = `${transcript}${attachmentContext ? '\n\n--- INFORMACIÓN ADICIONAL ---\n' + attachmentContext : ''}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Analiza la siguiente transcripción y contexto adicional:\n\n${fullContext}` },
            ],
            response_format: { type: 'json_object' },
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
        console.error('Analysis Error:', error);
        throw error;
    }
}

export async function analyzeImage(imageBase64: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Describe esta imagen en detalle. Identifica objetos, personas, texto visible, contexto y cualquier información relevante que pueda ser útil para entender el contenido.' },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageBase64,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 500,
        });

        return response.choices[0].message.content || 'Error al analizar la imagen';
    } catch (error) {
        console.error('Image Analysis Error:', error);
        return 'Error al analizar la imagen';
    }
}
