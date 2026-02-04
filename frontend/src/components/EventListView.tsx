import { Calendar, ArrowUpRight, Bell, MapPin, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { GravityAnalysisResult, CalendarEvent } from '../types/analysis';
import { CalendarService } from '../services/calendar_actions';
import { StorageService } from '../services/storage';

interface EventListViewProps {
    history: GravityAnalysisResult[];
    onSelectOriginal: (item: GravityAnalysisResult) => void;
    onUpdateHistory?: () => void; // Trigger reload
}

export function EventListView({ history, onSelectOriginal, onUpdateHistory }: EventListViewProps) {
    const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
    const [editForm, setEditForm] = useState<{ title: string; start_date: string }>({ title: '', start_date: '' });

    // 1. Flatten all events and extend type
    type ExtendedEvent = CalendarEvent & { sourceAnalysis: GravityAnalysisResult };

    const allEvents: ExtendedEvent[] = history.flatMap(analysis =>
        (analysis.calendar_events || []).map(event => ({
            ...event,
            sourceAnalysis: analysis
        }))
    ).sort((a, b) => {
        const dateA = new Date(a.start_date || 0).getTime();
        const dateB = new Date(b.start_date || 0).getTime();
        return dateA - dateB;
    });



    // 2. Group by Day
    const groupedEvents: { [key: string]: typeof allEvents } = {};

    allEvents.forEach(event => {
        const dateObj = new Date(event.start_date);
        const key = dateObj.toISOString().split('T')[0];
        if (!groupedEvents[key]) groupedEvents[key] = [];
        groupedEvents[key].push(event);
    });

    const sortedDateKeys = Object.keys(groupedEvents).sort();

    const handleAction = async (event: typeof allEvents[0]) => {
        const result = await CalendarService.handleEventAction(event);
        if (result.success) {
            // Update status locally for UI feedback (reloading history is better)
            // We need to update the history object
            if (onUpdateHistory) {
                // But first we must persist the status update in the data source? 
                // We need to modify the underlying data similar to App.tsx logic.
                // Ideally this logic is lifted up, but for now we do it here:

                const updatedHistory = history.map(h => {
                    if (h.id === event.sourceAnalysis.id && h.calendar_events) {
                        const updatedEvts = h.calendar_events.map(e => {
                            if (e.title === event.title && e.start_date === event.start_date) { // Best effort match
                                return { ...e, status: 'scheduled' as const, notificationId: result.notificationId };
                            }
                            return e;
                        });
                        return { ...h, calendar_events: updatedEvts };
                    }
                    return h;
                });
                await StorageService.saveHistory(updatedHistory);
                onUpdateHistory();
            }

            if (event.type === 'reminder') {
                alert(`🔔 Recordatorio programado para ${(new Date(new Date(event.start_date).getTime() - 30 * 60000)).toLocaleTimeString()}`);
            }
        } else if (event.type === 'reminder' && !result.success) {
            alert("Permisos de notificación denegados.");
        }
    };

    const handleDelete = async (event: typeof allEvents[0]) => {
        if (!confirm("¿Borrar este evento?")) return;

        await CalendarService.deleteEvent(event);

        const updatedHistory = history.map(h => {
            if (h.id === event.sourceAnalysis.id && h.calendar_events) {
                const updatedEvts = h.calendar_events.filter(e => !(e.title === event.title && e.start_date === event.start_date));
                return { ...h, calendar_events: updatedEvts };
            }
            return h;
        });
        await StorageService.saveHistory(updatedHistory);
        if (onUpdateHistory) onUpdateHistory();
    };

    const startEdit = (event: typeof allEvents[0]) => {
        setEditingEvent(event);
        setEditForm({ title: event.title, start_date: event.start_date });
    };

    const saveEdit = async () => {
        if (!editingEvent) return;

        // If this was a scheduled reminder, cancel the old notification first
        if (editingEvent.type === 'reminder' && editingEvent.status === 'scheduled' && editingEvent.notificationId) {
            await CalendarService.deleteEvent(editingEvent);
        }

        const updatedHistory = history.map(h => {
            if (h.id === editingEvent.sourceAnalysis.id && h.calendar_events) {
                const updatedEvts = h.calendar_events.map(e => {
                    // Match by title and date
                    if (e.title === editingEvent.title && e.start_date === editingEvent.start_date) {
                        // Update the event and reset status to 'pending' so user can reschedule
                        return {
                            ...e,
                            title: editForm.title,
                            start_date: editForm.start_date,
                            status: undefined, // Reset status so button shows "Programar" again
                            notificationId: undefined // Clear old notification ID
                        };
                    }
                    return e;
                });
                return { ...h, calendar_events: updatedEvts };
            }
            return h;
        });

        await StorageService.saveHistory(updatedHistory);
        setEditingEvent(null);
        if (onUpdateHistory) onUpdateHistory();
    };

    if (allEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-60">
                <Calendar className="w-16 h-16 mb-4" />
                <p>No hay eventos pendientes.</p>
            </div>
        );
    }

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return "Hoy";
        if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <div className="space-y-6 pb-32 fade-in pt-4">
            <h2 className="text-2xl font-bold text-white px-4">Agenda Inteligente</h2>

            {sortedDateKeys.map(dateKey => (
                <div key={dateKey} className="space-y-3">
                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider px-4 sticky top-14 bg-slate-900/90 py-2 z-10 backdrop-blur">
                        {formatDateHeader(dateKey)}
                    </h3>

                    {groupedEvents[dateKey].map((item, idx) => (
                        <div key={idx} className={`bg-slate-900/40 border ${item.type === 'reminder' ? 'border-amber-500/20' : 'border-emerald-500/20'} rounded-xl p-4 mx-4 shadow-lg backdrop-blur relative overflow-hidden`}>

                            {/* Actions overlay for Edit/Delete - Always visible on mobile */}
                            <div className="absolute top-2 right-2 flex gap-1 z-20">
                                <button onClick={() => startEdit(item)} className="p-1.5 bg-slate-800/90 rounded-lg hover:bg-slate-700 text-slate-300 shadow-lg">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(item)} className="p-1.5 bg-slate-800/90 rounded-lg hover:bg-red-900/50 text-red-400 shadow-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Icon Background */}
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                {item.type === 'reminder' ? <Bell className="w-24 h-24 text-amber-500" /> : <Calendar className="w-24 h-24 text-emerald-500" />}
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'scheduled' || item.status === 'added' ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        ) : null}

                                        {item.type === 'reminder' ? (
                                            <span className="bg-amber-900/30 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/20">RECORDATORIO</span>
                                        ) : (
                                            <span className="bg-emerald-900/30 text-emerald-300 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">CITA</span>
                                        )}
                                        <span className={`font-bold text-lg ${item.type === 'reminder' ? 'text-amber-100' : 'text-emerald-100'}`}>
                                            {item.title}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onSelectOriginal(item.sourceAnalysis)}
                                        className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors pr-16" // Pad for action btns
                                    >
                                        <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1 text-sm text-slate-300 mb-3 ml-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-400">
                                            {new Date(item.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {item.location && (
                                            <span className="flex items-center gap-1 text-slate-400 text-xs">
                                                <MapPin className="w-3 h-3" /> {item.location}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 italic mb-4 border-l-2 border-slate-700 pl-2">
                                    {item.description}
                                </p>

                                <button
                                    onClick={() => handleAction(item)}
                                    disabled={item.status === 'scheduled'}
                                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors shadow flex items-center justify-center gap-2 
                                        ${item.status === 'scheduled'
                                            ? 'bg-slate-800 text-emerald-500 cursor-default'
                                            : item.type === 'reminder'
                                                ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                                                : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                                        }`}
                                >
                                    {item.status === 'scheduled' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            {item.type === 'reminder' ? 'Alerta Programada' : 'Añadido'}
                                        </>
                                    ) : (
                                        item.type === 'reminder' ? (
                                            <>
                                                <Bell className="w-4 h-4" /> Programar Alerta (30 min antes)
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-4 h-4" /> Añadir a Google Calendar
                                            </>
                                        )
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {/* Edit Modal Logic would go here (simplified) */}
            {editingEvent && (
                <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm">
                        <h3 className="text-white font-bold mb-4">Editar Evento</h3>
                        <input
                            value={editForm.title}
                            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-slate-800 text-white p-2 rounded mb-2 border border-slate-700"
                        />
                        <input
                            type="datetime-local"
                            value={editForm.start_date.substring(0, 16)}
                            onChange={e => setEditForm(prev => ({ ...prev, start_date: new Date(e.target.value).toISOString() }))}
                            className="w-full bg-slate-800 text-white p-2 rounded mb-4 border border-slate-700"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingEvent(null)} className="px-4 py-2 text-slate-400">Cancelar</button>
                            <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
