import { useState, useEffect } from 'react';
import { Mic, Square, ArrowLeft } from 'lucide-react';
import SystemAudioRecorder from '../plugins/SystemAudioRecorder';
import { AttachmentsPanel } from './AttachmentsPanel';
import type { Attachment } from '../types/analysis';

interface RecordingContextOverlayProps {
    onClose: () => void;
    onRecordingComplete: (filePath: string) => void;
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function RecordingContextOverlay({
    onClose,
    onRecordingComplete,
    attachments,
    onAttachmentsChange
}: RecordingContextOverlayProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    useEffect(() => {
        let interval: number;
        if (isRecording) {
            interval = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const startRec = async () => {
        try {
            await SystemAudioRecorder.requestPermissions();
            const res = await SystemAudioRecorder.startRecording();
            if (res.success) setIsRecording(true);
        } catch (e) {
            console.error("Error starting recording:", e);
        }
    };

    const stopRec = async () => {
        if (isStopping) return;
        setIsStopping(true);
        try {
            const res = await SystemAudioRecorder.stopRecording();
            if (res.success && res.filePath) {
                onRecordingComplete(res.filePath);
            }
        } catch (e) {
            console.error("Error stopping recording:", e);
        } finally {
            setIsStopping(false);
            setIsRecording(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Context Layer */}
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">

                {/* Back Button */}
                {!isRecording && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 left-6 p-3 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}

                <div className="flex flex-col items-center text-center space-y-8 mt-4">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Contexto de la Llamada</h2>
                        <p className="text-slate-400 text-sm">Resume lo acordado ahora que está fresco</p>
                    </div>

                    {/* Main Pulse Button */}
                    <div className="relative">
                        {isRecording && (
                            <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20"></div>
                        )}
                        <button
                            onClick={isRecording ? stopRec : startRec}
                            disabled={isStopping}
                            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative z-10 ${isRecording
                                    ? 'bg-red-600 ring-8 ring-red-600/20'
                                    : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
                                } ${isStopping ? 'opacity-50' : ''}`}
                        >
                            {isRecording ? (
                                <Square className="w-12 h-12 text-white fill-current" />
                            ) : (
                                <Mic className="w-12 h-12 text-white" />
                            )}
                            <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/80">
                                {isRecording ? formatTime(recordingTime) : 'Grabar Contexto'}
                            </span>
                        </button>
                    </div>

                    {/* Attachments (only if recording or stopped) */}
                    <div className="w-full bg-slate-800/50 rounded-3xl p-4 border border-white/5">
                        <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Añadir notas/fotos</h3>
                        <AttachmentsPanel
                            attachments={attachments}
                            onAttachmentsChange={onAttachmentsChange}
                            disabled={isStopping}
                        />
                    </div>

                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
                        Gravity procesará esto para tu calendario y CRM
                    </p>
                </div>
            </div>
        </div>
    );
}
