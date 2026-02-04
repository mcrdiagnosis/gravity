import { Calendar, Bell, X, Check, SkipForward } from 'lucide-react';
import type { CalendarEvent } from '../types/analysis';

interface EventConfirmationModalProps {
    event: CalendarEvent;
    onConfirm: () => void;
    onSkip: () => void;
    onCancel: () => void;
}

export function EventConfirmationModal({ event, onConfirm, onSkip, onCancel }: EventConfirmationModalProps) {
    const isReminder = event.type === 'reminder';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm fade-in h-screen w-screen">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className={`p-4 flex items-center gap-3 border-b ${isReminder ? 'bg-amber-950/30 border-amber-500/20' : 'bg-emerald-950/30 border-emerald-500/20'}`}>
                    <div className={`p-2 rounded-full ${isReminder ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isReminder ? <Bell className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">
                            {isReminder ? 'Nuevo Recordatorio' : 'Nueva Cita'}
                        </h3>
                        <p className="text-xs text-slate-400">Detectado en la grabación</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="ml-auto text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <h4 className="text-xl font-bold text-white leading-tight">{event.title}</h4>
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="bg-slate-950/50 rounded-lg p-3 space-y-2 border border-white/5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Fecha:</span>
                            <span className="text-slate-200">{new Date(event.start_date).toLocaleString()}</span>
                        </div>
                        {event.location && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Lugar:</span>
                                <span className="text-slate-200">{event.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onSkip}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                        >
                            <SkipForward className="w-4 h-4" />
                            Omitir
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isReminder
                                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20'
                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                                }`}
                        >
                            <Check className="w-4 h-4" />
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
