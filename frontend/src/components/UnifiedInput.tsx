import { useState } from 'react';
import { Mic, Upload } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { AudioUploader } from './AudioUploader';
import type { Attachment } from '../types/analysis';

interface UnifiedInputProps {
    onFileSelected: (file: File) => void;
    isProcessing: boolean;
    onRecordingStateChange?: (isRecording: boolean) => void;
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function UnifiedInput({ onFileSelected, isProcessing, onRecordingStateChange, attachments, onAttachmentsChange }: UnifiedInputProps) {
    const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
    // Just a simple wrapper to toggle between them for now, but in a cleaner UI

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Toggle / Tabs */}
            <div className="flex justify-center mb-6 bg-slate-800/50 p-1 rounded-full w-fit mx-auto border border-white/5">
                <button
                    onClick={() => setActiveTab('record')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'record'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Mic className="w-4 h-4" />
                    Grabar
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Upload className="w-4 h-4" />
                    Subir Archivo
                </button>
            </div>

            <div className="fade-in">
                {activeTab === 'record' ? (
                    <AudioRecorder
                        onRecordingComplete={onFileSelected}
                        isProcessing={isProcessing}
                        onRecordingStateChange={onRecordingStateChange}
                        attachments={attachments}
                        onAttachmentsChange={onAttachmentsChange}
                    />
                ) : (
                    <AudioUploader
                        onFileSelected={onFileSelected}
                        isProcessing={isProcessing}
                    />
                )}
            </div>
        </div>
    );
}
