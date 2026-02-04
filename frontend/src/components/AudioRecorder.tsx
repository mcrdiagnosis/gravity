import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, HelpCircle, X, Video, Camera } from 'lucide-react';
import { AttachmentsPanel } from './AttachmentsPanel';
import type { Attachment } from '../types/analysis';

interface AudioRecorderProps {
    onRecordingComplete: (file: File) => void;
    isProcessing: boolean;
    onRecordingStateChange?: (isRecording: boolean) => void;
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function AudioRecorder({ onRecordingComplete, isProcessing, onRecordingStateChange, attachments, onAttachmentsChange }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showInstructions, setShowInstructions] = useState(false);
    const [recordingMode, setRecordingMode] = useState<'audio' | 'video'>('audio');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const wakeLockRef = useRef<any>(null);
    const timerRef = useRef<number | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            // Request wake lock
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    console.log('Wake lock acquired');
                } catch (err) {
                    console.warn('Wake lock failed:', err);
                }
            }

            // Get media stream based on mode
            const constraints = recordingMode === 'video'
                ? {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: true
                    }
                }
                : {
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: true
                    }
                };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            // Show video preview if in video mode
            if (recordingMode === 'video' && videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
                videoPreviewRef.current.play();
            }

            const mimeType = recordingMode === 'video'
                ? 'video/webm;codecs=vp8,opus'
                : 'audio/webm;codecs=opus';

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: recordingMode === 'video' ? 'video/webm' : 'audio/webm'
                });
                const fileName = recordingMode === 'video'
                    ? `recording-${Date.now()}.webm`
                    : `recording-${Date.now()}.webm`;
                const file = new File([blob], fileName, {
                    type: recordingMode === 'video' ? 'video/webm' : 'audio/webm'
                });
                onRecordingComplete(file);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                // Clear video preview
                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = null;
                }

                if (wakeLockRef.current) {
                    wakeLockRef.current.release();
                    wakeLockRef.current = null;
                }

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };

            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            onRecordingStateChange?.(true); // Notify parent
            setRecordingTime(0);

            timerRef.current = window.setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing media:", err);
            alert(`No se pudo acceder ${recordingMode === 'video' ? 'a la cámara/micrófono' : 'al micrófono'}. Verifica los permisos.`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            onRecordingStateChange?.(false); // Notify parent
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl w-full max-w-sm mx-auto relative">

            {/* Help Icon - Top Right */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 rounded-full transition-colors"
                    aria-label="Ayuda"
                >
                    {showInstructions ? (
                        <X className="w-5 h-5 text-indigo-300" />
                    ) : (
                        <HelpCircle className="w-5 h-5 text-indigo-300" />
                    )}
                </button>
            </div>

            {/* Expandable Instructions */}
            {showInstructions && (
                <div className="mb-6 w-full bg-indigo-900/30 border border-indigo-500/40 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-indigo-300 font-semibold mb-3">📱 Cómo grabar llamadas:</p>
                    <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                        <li><strong className="text-amber-400">IMPORTANTE:</strong> Toca "Grabar" <strong>ANTES</strong> de hacer la llamada</li>
                        <li>Luego haz tu llamada (WhatsApp, teléfono, etc.)</li>
                        <li><strong>Activa el altavoz</strong> 🔊 durante la llamada</li>
                        <li>La app grabará ambas voces</li>
                        <li>Toca "Detener" cuando termines</li>
                    </ol>
                    <p className="text-xs text-amber-300 mt-3 bg-amber-900/20 p-2 rounded border border-amber-500/30">
                        ⚠️ Si grabas después de contestar, WhatsApp bloqueará el micrófono y no habrá audio.
                    </p>
                </div>
            )}

            {/* Attachments Panel - Only visible when recording */}
            {isRecording && (
                <div className="mb-4 space-y-3">
                    {/* Microphone Warning */}
                    <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3">
                        <p className="text-amber-300 text-sm font-semibold flex items-center gap-2">
                            🎤 Grabando - El micrófono está en uso
                        </p>
                        <p className="text-amber-200/70 text-xs mt-1">
                            Otras apps (WhatsApp, etc.) no podrán usar el micrófono hasta que detengas la grabación.
                        </p>
                    </div>

                    {/* Attachments */}
                    <AttachmentsPanel
                        attachments={attachments}
                        onAttachmentsChange={onAttachmentsChange}
                        disabled={false}
                    />
                </div>
            )}

            {/* Mode Selector */}
            {!isRecording && (
                <div className="mb-4 w-full flex gap-2">
                    <button
                        onClick={() => setRecordingMode('audio')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${recordingMode === 'audio'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Mic className="w-4 h-4 inline mr-2" />
                        Audio
                    </button>
                    <button
                        onClick={() => setRecordingMode('video')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${recordingMode === 'video'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Video className="w-4 h-4 inline mr-2" />
                        Video
                    </button>
                </div>
            )}

            {/* Video Preview */}
            {recordingMode === 'video' && isRecording && (
                <div className="mb-4 w-full rounded-lg overflow-hidden border-2 border-red-500">
                    <video
                        ref={videoPreviewRef}
                        className="w-full h-48 object-cover bg-black"
                        muted
                        playsInline
                    />
                </div>
            )}

            <div className={`relative flex items-center justify-center mb-6 ${showInstructions ? 'mt-0' : 'mt-8'}`}>
                {isRecording && (
                    <div className="absolute w-full h-full bg-red-500/20 rounded-full animate-ping"></div>
                )}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-slate-800'
                    }`}>
                    {isProcessing ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : isRecording ? (
                        recordingMode === 'video' ? (
                            <Camera className="w-10 h-10 text-white animate-pulse" />
                        ) : (
                            <Mic className="w-10 h-10 text-white animate-pulse" />
                        )
                    ) : (
                        recordingMode === 'video' ? (
                            <Camera className="w-10 h-10 text-slate-400" />
                        ) : (
                            <Mic className="w-10 h-10 text-slate-400" />
                        )
                    )}
                </div>
            </div>

            {isRecording && (
                <div className="text-2xl font-mono text-white mb-4">
                    {formatTime(recordingTime)}
                </div>
            )}

            <div className="flex gap-4">
                {!isRecording && !isProcessing && (
                    <button
                        onClick={startRecording}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25"
                    >
                        Grabar {recordingMode === 'video' ? 'Video' : 'Audio'}
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/25 flex items-center gap-2"
                    >
                        <Square className="w-4 h-4 fill-current" />
                        Detener
                    </button>
                )}
            </div>

            <p className="mt-4 text-sm text-slate-400 text-center">
                {isRecording
                    ? `🔴 Grabando ${recordingMode === 'video' ? 'video' : 'audio'}... ${recordingMode === 'audio' ? '(Activa el altavoz 🔊)' : ''}`
                    : isProcessing
                        ? "Procesando..."
                        : `Listo para grabar ${recordingMode === 'video' ? 'video' : 'audio'}`}
            </p>

            {!showInstructions && !isRecording && (
                <p className="mt-2 text-xs text-indigo-400 text-center">
                    Toca el <HelpCircle className="w-3 h-3 inline" /> para ver instrucciones
                </p>
            )}
        </div>
    );
}
