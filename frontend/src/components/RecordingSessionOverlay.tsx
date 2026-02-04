import { Mic, X, Check } from 'lucide-react';
import { AttachmentsPanel } from './AttachmentsPanel';
import type { Attachment } from '../types/analysis';
import { useEffect, useState } from 'react';

interface RecordingSessionOverlayProps {
    isRecording: boolean;
    isStopping: boolean;
    onStart: () => void;
    onStop: () => void;
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function RecordingSessionOverlay({
    isRecording,
    isStopping,
    onStart,
    onStop,
    attachments,
    onAttachmentsChange
}: RecordingSessionOverlayProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Si comienza la grabación (auto-start), expandir la interfaz automáticamente
    useEffect(() => {
        if (isRecording) {
            setIsExpanded(true);
        }
    }, [isRecording]);

    if (!isExpanded && !isRecording) {
        return (
            <div className="flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500 my-10">
                <div
                    onClick={onStart}
                    className="w-48 h-48 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] cursor-pointer hover:scale-110 active:scale-95 transition-all group relative border-4 border-white/20"
                >
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping shadow-[0_0_30px_rgba(37,99,235,0.6)] opacity-20 group-hover:opacity-40"></div>
                    <Mic className="w-20 h-20 text-white" />
                </div>
                <p className="mt-8 text-blue-400 font-bold text-xl animate-bounce">Toca para iniciar notas de voz</p>
                <p className="mt-2 text-slate-500 text-sm">Ideal para resumir tus llamadas</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col p-6 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse ring-4 ring-red-500/20' : 'bg-slate-500'}`}></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">SESIÓN ACTIVA</h2>
                </div>
                {!isRecording && (
                    <button onClick={() => setIsExpanded(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-32">
                {/* Panel de Adjuntos (Notas, Fotos, etc) */}
                <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-slate-500 text-xs font-black mb-4 uppercase tracking-[0.2em]">Añadir a esta llamada</h3>
                    <AttachmentsPanel
                        attachments={attachments}
                        onAttachmentsChange={onAttachmentsChange}
                        disabled={isStopping}
                    />
                </div>

                <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
                    <p className="text-blue-200 text-sm leading-relaxed text-center">
                        <span className="block text-2xl mb-2">🔊</span>
                        Asegúrate de tener el <strong className="text-white text-base">Altavoz activado</strong> para capturar ambas partes de la conversación.
                    </p>
                </div>
            </div>

            {/* Botón de Finalizar (Flotante abajo) */}
            <div className="absolute bottom-10 left-6 right-6">
                <button
                    onClick={onStop}
                    disabled={isStopping || !isRecording}
                    className={`w-full py-6 rounded-3xl font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-4 ${isStopping
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white hover:brightness-110 active:scale-95 border-t border-white/20'
                        }`}
                >
                    {isStopping ? (
                        <>
                            <div className="w-8 h-8 border-4 border-slate-500 border-t-white rounded-full animate-spin"></div>
                            PROCESANDO...
                        </>
                    ) : (
                        <>
                            <Check className="w-10 h-10" />
                            FINALIZAR LLAMADA
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
