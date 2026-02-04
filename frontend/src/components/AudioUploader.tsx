import { useState, useRef } from 'react';
import { Upload, FileAudio, Loader2, X } from 'lucide-react';

interface AudioUploaderProps {
    onFileSelected: (file: File) => void;
    isProcessing: boolean;
}

export function AudioUploader({ onFileSelected, isProcessing }: AudioUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        // Basic validation
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            setSelectedFile(file);
        } else {
            alert("Por favor selecciona un archivo de audio válido.");
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const processFile = () => {
        if (selectedFile) {
            onFileSelected(selectedFile);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/50'
                    } ${selectedFile ? 'border-emerald-500/50 bg-emerald-900/10' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="audio/*,video/*" // Video often contains audio (e.g. mp4)
                    onChange={handleChange}
                />

                {isProcessing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                        <p className="text-indigo-200 font-medium">Procesando audio...</p>
                        <p className="text-xs text-slate-400 mt-2">Esto puede tardar unos segundos</p>
                    </div>
                ) : selectedFile ? (
                    <div className="flex flex-col items-center w-full">
                        <div className="relative mb-4">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <FileAudio className="w-8 h-8 text-emerald-400" />
                            </div>
                            <button
                                onClick={clearFile}
                                className="absolute -top-1 -right-1 bg-slate-800 rounded-full p-1 border border-slate-600 hover:bg-slate-700"
                            >
                                <X className="w-3 h-3 text-slate-300" />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-slate-200 truncate w-64 text-center mb-1">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 mb-6">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>

                        <button
                            onClick={processFile}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            Analizar Grabación
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => inputRef.current?.click()}>
                            <Upload className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Cargar Grabación</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Toca para seleccionar o arrastra un archivo aquí
                        </p>
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                        >
                            Seleccionar Archivo
                        </button>
                        <p className="text-xs text-slate-500 mt-4">
                            Soporta MP3, M4A, WAV, MP4
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
