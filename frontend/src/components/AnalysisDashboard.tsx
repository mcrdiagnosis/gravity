import { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import type { GravityAnalysisResult, CalendarEvent } from '../types/analysis';
import { CheckCircle, AlertTriangle, List, AlignLeft, Calendar, Play, Bell, MapPin } from 'lucide-react';
import { StorageService } from '../services/storage';
import { CalendarService } from '../services/calendar_actions';
import { TranscriptView } from './TranscriptView';
import { ExportPDFButton } from './ExportPDFButton';

interface DashboardProps {
    data: GravityAnalysisResult | null;
    highlightQuery?: string;
}

export function AnalysisDashboard({ data, highlightQuery }: DashboardProps) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [localData, setLocalData] = useState<GravityAnalysisResult | null>(data);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    useEffect(() => {
        if (localData?.mermaid_diagram) {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'sans-serif'
            });
            mermaid.contentLoaded();
        }

        if (localData?.audioPath) {
            StorageService.getAudioUrl(localData.audioPath).then(setAudioUrl);
        } else {
            setAudioUrl(null);
        }
    }, [localData]);

    const handleAction = async (event: CalendarEvent, index: number) => {
        const result = await CalendarService.handleEventAction(event);

        if (result.success && localData?.calendar_events) {
            // Update the event status in the current data
            const updatedEvents = [...localData.calendar_events];
            updatedEvents[index] = {
                ...updatedEvents[index],
                status: 'scheduled' as const,
                notificationId: result.notificationId
            };

            // Update local state immediately
            setLocalData({ ...localData, calendar_events: updatedEvents });

            // Persist to storage
            const allHistory = await StorageService.getHistory();
            const updatedHistory = allHistory.map(h => {
                if (h.id === localData.id) {
                    return { ...h, calendar_events: updatedEvents };
                }
                return h;
            });
            await StorageService.saveHistory(updatedHistory);

            if (event.type === 'reminder') {
                alert(`🔔 Recordatorio programado para ${(new Date(new Date(event.start_date).getTime() - 30 * 60000)).toLocaleTimeString()}`);
            }
        } else if (event.type === 'reminder' && !result.success) {
            alert("Permisos de notificación denegados.");
        }
    };

    if (!localData) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 fade-in-up">
            {/* Executive Summary */}
            <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">{localData.executive_summary.title}</h2>
                        <div className="text-sm text-indigo-400">{localData.executive_summary.context}</div>
                    </div>
                    <ExportPDFButton analysis={localData} />
                </div>

                {audioUrl && (
                    <div className="mb-6 relative z-10 bg-slate-950/50 p-3 rounded-lg border border-white/5 shadow-inner">
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                            <Play className="w-3 h-3 text-emerald-400" /> Reproducir Grabación (Contexto)
                        </p>
                        <audio controls src={audioUrl} className="w-full h-8 opacity-90" />
                    </div>
                )}

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-slate-300 italic">"{localData.executive_summary.summary}"</p>
                </div>
            </div>

            {/* Attachments Section */}
            {localData.attachments && localData.attachments.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        📎 Adjuntos ({localData.attachments.length})
                    </h3>
                    <div className="space-y-3">
                        {localData.attachments.map((attachment, index) => (
                            <div key={attachment.id || index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                {attachment.type === 'photo' ? (
                                    <div>
                                        <p className="text-sm text-indigo-400 mb-2 font-semibold">📷 Foto</p>
                                        <img
                                            src={attachment.content}
                                            alt="Adjunto"
                                            className="w-full max-w-md rounded-lg border border-slate-600"
                                        />
                                        {attachment.description && (
                                            <p className="text-xs text-slate-400 mt-2 italic">{attachment.description}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-amber-400 mb-2 font-semibold">📝 Nota</p>
                                        <p className="text-slate-300">{attachment.content}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar Events (New) */}
            {localData.calendar_events && localData.calendar_events.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                        Agenda & Recordatorios
                    </h3>
                    <div className="space-y-3">
                        {localData.calendar_events.map((event, idx) => {
                            const isReminder = event.type === 'reminder';
                            const isScheduled = event.status === 'scheduled';

                            return (
                                <div key={idx} className={`bg-slate-950/40 p-4 rounded-lg border ${isReminder ? 'border-amber-500/20' : 'border-emerald-500/20'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {isReminder ? (
                                                <Bell className="w-4 h-4 text-amber-500" />
                                            ) : (
                                                <Calendar className="w-4 h-4 text-emerald-500" />
                                            )}
                                            <h4 className={`font-bold ${isReminder ? 'text-amber-100' : 'text-emerald-100'}`}>
                                                {event.title}
                                            </h4>
                                            {isScheduled && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                        </div>
                                        <p className="text-xs text-slate-400 mb-1">{event.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>📅 {new Date(event.start_date).toLocaleString()}</span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {event.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction(event, idx)}
                                        disabled={isScheduled}
                                        className={`w-full md:w-auto mt-3 md:mt-0 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isScheduled
                                            ? 'bg-slate-800 text-emerald-500 cursor-default'
                                            : isReminder
                                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                            }`}
                                    >
                                        {isScheduled ? (
                                            <><CheckCircle className="w-4 h-4" /> {isReminder ? 'Alerta Programada' : 'Añadido a Calendario'}</>
                                        ) : (
                                            isReminder ? <><Bell className="w-4 h-4" /> Programar Alerta (30 min antes)</> : <><Calendar className="w-4 h-4" /> Añadir a Google Calendar</>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Key Points */}
            <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <List className="w-5 h-5 text-cyan-400" />
                    Puntos Clave
                </h3>
                <ul className="space-y-3">
                    {localData.key_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                            {point.is_urgent ? (
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={`${point.is_urgent ? 'text-red-200 font-medium' : 'text-slate-300'}`}>
                                {point.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Mermaid Diagram */}
            {localData.mermaid_diagram && (
                <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlignLeft className="w-5 h-5 text-purple-400" />
                        Diagrama de Flujo
                    </h3>
                    <div className="mermaid bg-white/5 p-4 rounded-lg overflow-x-auto">
                        {localData.mermaid_diagram}
                    </div>
                </div>
            )}

            {/* Transcript */}
            {localData.transcript && (
                <TranscriptView text={localData.transcript} highlight={highlightQuery} />
            )}

            {/* Metadata */}
            <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Categoría</p>
                        <p className="text-white font-medium">{localData.metadata.category}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Sentimiento</p>
                        <p className="text-white font-medium">{localData.metadata.sentiment}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Palabras Clave</p>
                        <div className="flex flex-wrap gap-1">
                            {localData.metadata.keywords.map((kw, idx) => (
                                <span key={idx} className="text-xs bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
