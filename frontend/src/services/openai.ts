import OpenAI from "openai";
import type { GravityAnalysisResult, Attachment } from "../types/analysis";

const SYSTEM_PROMPT = `
Eres "Gravity", un sistema avanzado de inteligencia conversacional.
Tu objetivo es transformar transcripciones en documentos estructurados.

FORMATO DE SALIDA (JSON ESTRICTO):
Debes responder ÚNICAMENTE con un JSON válido que cumpla con el siguiente esquema:
{
  "executive_summary": {
    "title": "TÍTULO CORTO Y ACCIONABLE (ej: 'Llamada con Andrés', 'Pedir centralita motor')",
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
  "calendar_events": [
    {
      "type": "event",
      "title": "Cita taller",
      "start_date": "2024-02-02T10:00:00",
      "end_date": "2024-02-02T11:00:00",
      "description": "...",
      "location": "Taller"
    },
    {
      "type": "reminder",
      "title": "Comprar pan",
      "start_date": "2024-02-02T18:00:00",
      "end_date": "2024-02-02T18:00:00",
      "description": "..."
    }
  ],
  "metadata": {
    "keywords": ["..."],
    "category": "...",
    "sentiment": "..."
  }
}

REGLAS:
- El campo "mermaid_diagram" debe contener solo el código del grafo (ej: "graph TD; A-->B;"), sin bloques de markdown.
- Calendar Events:
    - Si el usuario dice "recuérdame", "recordatorio", "avísame" -> type: "reminder".
    - Si es "cita", "reunión", "ir a", "taller", "médico" -> type: "event".
    - Ante la duda, usa "event".
- Para "calendar_events", calcula la fecha exacta ISO basándote en la fecha actual proporcionada.
- Si no se especifica duración, asume 1 hora.
- Identifica urgencias.
- Sé profesional.
`;

export class GravityService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage in Capacitor
    });
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
      });
      return response.text;
    } catch (error) {
      console.error("Transcription error:", error);
      throw new Error("Failed to transcribe audio.");
    }
  }

  async analyzeImage(imageBase64: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe esta imagen en detalle. Identifica objetos, personas, texto visible, contexto y cualquier información relevante que pueda ser útil para entender el contenido."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || "No se pudo analizar la imagen";
    } catch (error) {
      console.error("Image analysis error:", error);
      return "Error al analizar la imagen";
    }
  }

  async analyzeTranscriptWithAttachments(
    transcript: string,
    attachments?: Attachment[]
  ): Promise<GravityAnalysisResult> {
    try {
      let attachmentContext = "";

      if (attachments && attachments.length > 0) {
        attachmentContext = "\n\n--- INFORMACIÓN ADICIONAL ---\n";

        for (const att of attachments) {
          if (att.type === "photo") {
            // Analyze photo with Vision
            const description = await this.analyzeImage(att.content);
            attachmentContext += `\n📷 Foto adjunta: ${description}\n`;
          } else if (att.type === "note") {
            attachmentContext += `\n📝 Nota: ${att.content}\n`;
          }
        }
      }

      const fullContext = `${transcript}${attachmentContext}`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Fecha Actual: ${new Date().toISOString()}\n\nAnaliza la siguiente transcripción y contexto adicional:\n\n${fullContext}` }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No content received from Gravity.");

      return JSON.parse(content) as GravityAnalysisResult;
    } catch (error) {
      console.error("Analysis error:", error);
      throw new Error("Failed to analyze transcript with attachments.");
    }
  }

  async analyzeTranscript(transcript: string): Promise<GravityAnalysisResult> {
    return this.analyzeTranscriptWithAttachments(transcript, undefined);
  }
}
