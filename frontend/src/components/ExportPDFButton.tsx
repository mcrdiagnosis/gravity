import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { GravityAnalysisResult } from '../types/analysis';

interface ExportPDFButtonProps {
    analysis: GravityAnalysisResult;
}

export function ExportPDFButton({ analysis }: ExportPDFButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const createHTMLContent = (): string => {
        const date = analysis.date
            ? new Date(analysis.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Fecha desconocida';

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysis.executive_summary.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; color: #333; }
        h1 { color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; }
        h2 { color: #6366F1; margin-top: 30px; }
        .summary { background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .key-point { margin: 10px 0; padding: 10px; background: #FEF3C7; border-left: 4px solid #F59E0B; }
        .urgent { background: #FEE2E2; border-left-color: #EF4444; }
        .action { margin: 10px 0; padding: 10px; background: #DBEAFE; border-left: 4px solid #3B82F6; }
        .event { margin: 10px 0; padding: 10px; background: #D1FAE5; border-left: 4px solid #10B981; }
        .attachment { margin: 10px 0; padding: 10px; background: #E0E7FF; border-left: 4px solid #818CF8; }
        .metadata { color: #6B7280; font-size: 0.9em; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${analysis.executive_summary.title}</h1>
    <p class="metadata">📅 ${date} | 👥 ${analysis.executive_summary.participants || 'No especificado'}</p>
    
    <div class="summary">
        <h2>📋 Resumen Ejecutivo</h2>
        <p><strong>Contexto:</strong> ${analysis.executive_summary.context}</p>
        <p>${analysis.executive_summary.summary}</p>
    </div>

    ${analysis.key_points && analysis.key_points.length > 0 ? `
    <h2>🔑 Puntos Clave</h2>
    ${analysis.key_points.map(point => `
        <div class="key-point ${point.is_urgent ? 'urgent' : ''}">
            ${point.is_urgent ? '🔴 ' : ''}${point.text}
        </div>
    `).join('')}
    ` : ''}

    ${analysis.attachments && analysis.attachments.length > 0 ? `
    <h2>📎 Adjuntos</h2>
    ${analysis.attachments.map(att => `
        <div class="attachment">
            ${att.type === 'photo' ? `
                <p><strong>📷 Foto</strong></p>
                <img src="${att.content}" alt="Foto adjunta" />
                ${att.description ? `<p><em>${att.description}</em></p>` : ''}
            ` : `
                <p><strong>📝 Nota</strong></p>
                <p>${att.content}</p>
            `}
        </div>
    `).join('')}
    ` : ''}

    ${analysis.actions && analysis.actions.length > 0 ? `
    <h2>✅ Acciones</h2>
    ${analysis.actions.map(action => `
        <div class="action">
            <strong>${action.description}</strong><br>
            👤 ${action.owner || 'No asignado'} | 📅 ${action.due_date || 'Sin fecha'}
        </div>
    `).join('')}
    ` : ''}

    ${analysis.calendar_events && analysis.calendar_events.length > 0 ? `
    <h2>📅 Eventos del Calendario</h2>
    ${analysis.calendar_events.map(event => `
        <div class="event">
            <strong>${event.title}</strong><br>
            📍 ${event.location || 'Sin ubicación'}<br>
            🕐 ${new Date(event.start_date).toLocaleString('es-ES')}
        </div>
    `).join('')}
    ` : ''}

    ${analysis.transcript ? `
    <h2>📝 Transcripción</h2>
    <p style="white-space: pre-wrap; background: #F9FAFB; padding: 15px; border-radius: 8px;">${analysis.transcript}</p>
    ` : ''}
</body>
</html>`;
    };

    const handleShare = async () => {
        try {
            setIsExporting(true);
            const htmlContent = createHTMLContent();
            const fileName = `${analysis.executive_summary.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.html`;

            // Save temporarily
            const result = await Filesystem.writeFile({
                path: fileName,
                data: htmlContent,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            // Share
            await Share.share({
                title: analysis.executive_summary.title,
                text: `📊 ${analysis.executive_summary.title}\n\n${analysis.executive_summary.summary}`,
                url: result.uri,
                dialogTitle: 'Compartir análisis'
            });

        } catch (error) {
            console.error('Error sharing:', error);
            alert('Error al compartir');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 disabled:opacity-50"
        >
            <Share2 className="w-4 h-4" />
            {isExporting ? 'Compartiendo...' : 'Compartir'}
        </button>
    );
}
