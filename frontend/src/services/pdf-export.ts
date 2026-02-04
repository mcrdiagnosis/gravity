import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { GravityAnalysisResult } from '../types/analysis';

export class PDFExportService {

    /**
     * Generate PDF from analysis result
     */
    static async generatePDF(analysis: GravityAnalysisResult): Promise<string> {
        // Create HTML content for PDF
        const htmlContent = this.createHTMLContent(analysis);

        // Convert to PDF using a simple approach (we'll use html2pdf or similar)
        // For now, we'll create a data URL that can be shared
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const base64 = await this.blobToBase64(blob);

        return base64;
    }

    /**
     * Create formatted HTML content
     */
    private static createHTMLContent(analysis: GravityAnalysisResult): string {
        const date = analysis.date
            ? new Date(analysis.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Fecha desconocida';

        const duration = analysis.duration || 0;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #4F46E5;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 10px;
        }
        h2 {
            color: #6366F1;
            margin-top: 30px;
        }
        .metadata {
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .key-point {
            background: #FEF3C7;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #F59E0B;
            border-radius: 4px;
        }
        .action {
            background: #DBEAFE;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #3B82F6;
            border-radius: 4px;
        }
        .event {
            background: #D1FAE5;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #10B981;
            border-radius: 4px;
        }
        .transcript {
            background: #F9FAFB;
            padding: 15px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            font-style: italic;
        }
        .attachment {
            margin: 15px 0;
            padding: 10px;
            background: #FEE2E2;
            border-left: 4px solid #EF4444;
            border-radius: 4px;
        }
        .attachment img {
            max-width: 100%;
            border-radius: 8px;
            margin-top: 10px;
        }
        .diagram {
            background: white;
            padding: 20px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>${analysis.executive_summary.title}</h1>
    
    <div class="metadata">
        <p><strong>Fecha:</strong> ${date}</p>
        <p><strong>Duración:</strong> ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s</p>
        <p><strong>Participantes:</strong> ${analysis.executive_summary.participants}</p>
        <p><strong>Categoría:</strong> ${analysis.metadata.category}</p>
        <p><strong>Sentimiento:</strong> ${analysis.metadata.sentiment}</p>
    </div>
    
    <h2>📋 Resumen Ejecutivo</h2>
    <p><strong>Contexto:</strong> ${analysis.executive_summary.context}</p>
    <p>${analysis.executive_summary.summary}</p>
    
    <h2>🎯 Puntos Clave</h2>
    ${analysis.key_points.map(point => `
        <div class="key-point">
            ${point.is_urgent ? '⚠️ <strong>URGENTE:</strong> ' : ''}
            ${point.text}
        </div>
    `).join('')}
    
    ${analysis.actions && analysis.actions.length > 0 ? `
        <h2>✅ Acciones</h2>
        ${analysis.actions.map(action => `
            <div class="action">
                <strong>${action.description}</strong><br>
                <small>Responsable: ${action.owner}${action.due_date ? ` | Fecha límite: ${new Date(action.due_date).toLocaleDateString('es-ES')}` : ''}</small>
            </div>
        `).join('')}
    ` : ''}
    
    ${analysis.calendar_events && analysis.calendar_events.length > 0 ? `
        <h2>📅 Eventos del Calendario</h2>
        ${analysis.calendar_events.map(event => `
            <div class="event">
                <strong>${event.title}</strong><br>
                <small>${event.type === 'reminder' ? '🔔 Recordatorio' : '📆 Evento'} | ${event.start_date ? new Date(event.start_date).toLocaleString('es-ES') : 'Sin fecha'}</small>
                ${event.description ? `<p>${event.description}</p>` : ''}
            </div>
        `).join('')}
    ` : ''}
    
    ${analysis.attachments && analysis.attachments.length > 0 ? `
        <h2>📎 Adjuntos</h2>
        ${analysis.attachments.map(att => `
            <div class="attachment">
                ${att.type === 'photo' ? `
                    <strong>📷 Foto</strong>
                    ${att.description ? `<p>${att.description}</p>` : ''}
                    <img src="${att.content}" alt="Adjunto">
                ` : `
                    <strong>📝 Nota</strong>
                    <p>${att.content}</p>
                `}
                <small>Añadido: ${new Date(att.timestamp).toLocaleString('es-ES')}</small>
            </div>
        `).join('')}
    ` : ''}
    
    <h2>📝 Transcripción Completa</h2>
    <div class="transcript">
        ${analysis.transcript}
    </div>
    
    ${analysis.mermaid_diagram && analysis.mermaid_diagram !== 'graph TD;' ? `
        <h2>🗺️ Diagrama</h2>
        <div class="diagram">
            <pre>${analysis.mermaid_diagram}</pre>
        </div>
    ` : ''}
    
    <hr style="margin-top: 40px; border: none; border-top: 1px solid #E5E7EB;">
    <p style="text-align: center; color: #9CA3AF; font-size: 12px;">
        Generado por Gravity AI • ${new Date().toLocaleString('es-ES')}
    </p>
</body>
</html>
        `;
    }

    /**
     * Convert blob to base64
     */
    private static blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Save PDF and share via WhatsApp
     */
    static async shareViaWhatsApp(analysis: GravityAnalysisResult): Promise<void> {
        try {
            const htmlContent = this.createHTMLContent(analysis);

            // Save as HTML file (we'll convert to PDF in a future update)
            const fileName = `gravity-${analysis.id}.html`;
            const result = await Filesystem.writeFile({
                path: fileName,
                data: htmlContent,
                directory: Directory.Cache,
                encoding: undefined
            });

            // Create WhatsApp message
            const message = `📊 Resumen de "${analysis.executive_summary.title}"\n\nAdjunto el análisis completo.`;

            // Use Capacitor Share API
            await Share.share({
                title: analysis.executive_summary.title,
                text: message,
                url: result.uri,
                dialogTitle: 'Compartir vía WhatsApp'
            });

        } catch (error) {
            console.error('Error sharing via WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Get file size
     */
    static async getFileSize(filePath: string): Promise<number> {
        try {
            const stat = await Filesystem.stat({
                path: filePath,
                directory: Directory.Data
            });
            return stat.size;
        } catch (error) {
            console.error('Error getting file size:', error);
            return 0;
        }
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}
