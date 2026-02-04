import { useState, useRef } from 'react';
import { Camera, FileText, X, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Attachment } from '../types/analysis';

interface AttachmentsPanelProps {
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
    disabled?: boolean;
}

export function AttachmentsPanel({ attachments, onAttachmentsChange, disabled }: AttachmentsPanelProps) {
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const newAttachment: Attachment = {
                    id: `photo-${Date.now()}`,
                    type: 'photo',
                    content: base64,
                    timestamp: new Date().toISOString()
                };
                onAttachmentsChange([...attachments, newAttachment]);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error capturing photo:', error);
            alert('Error al capturar la foto');
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddNote = () => {
        if (!noteText.trim()) return;

        const newAttachment: Attachment = {
            id: `note-${Date.now()}`,
            type: 'note',
            content: noteText.trim(),
            timestamp: new Date().toISOString()
        };
        onAttachmentsChange([...attachments, newAttachment]);
        setNoteText('');
        setShowNoteInput(false);
    };

    const handleDeleteAttachment = (id: string) => {
        onAttachmentsChange(attachments.filter(att => att.id !== id));
    };

    return (
        <div className="w-full bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Adjuntos ({attachments.length})
            </h3>

            {/* Add Buttons */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <Camera className="w-4 h-4" />
                    Foto
                </button>
                <button
                    onClick={() => setShowNoteInput(true)}
                    disabled={disabled}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <FileText className="w-4 h-4" />
                    Nota
                </button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
            />

            {/* Note Input Modal */}
            {showNoteInput && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-white">Añadir Nota</h4>
                            <button
                                onClick={() => {
                                    setShowNoteInput(false);
                                    setNoteText('');
                                }}
                                className="p-1 hover:bg-slate-800 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Escribe tu nota aquí..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-white resize-none"
                            rows={5}
                            autoFocus
                        />

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowNoteInput(false);
                                    setNoteText('');
                                }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddNote}
                                disabled={!noteText.trim()}
                                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-start gap-3"
                        >
                            {attachment.type === 'photo' ? (
                                <div className="flex-shrink-0">
                                    <img
                                        src={attachment.content}
                                        alt="Adjunto"
                                        className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                                    />
                                </div>
                            ) : (
                                <div className="flex-shrink-0 w-16 h-16 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-amber-400" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-400 mb-1">
                                    {attachment.type === 'photo' ? '📷 Foto' : '📝 Nota'}
                                    {' · '}
                                    {new Date(attachment.timestamp).toLocaleString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                {attachment.type === 'note' && (
                                    <p className="text-sm text-slate-300 line-clamp-2">
                                        {attachment.content}
                                    </p>
                                )}
                                {attachment.description && (
                                    <p className="text-xs text-indigo-300 mt-1 italic">
                                        {attachment.description}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                disabled={disabled}
                                className="flex-shrink-0 p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay adjuntos</p>
                    <p className="text-xs mt-1">Añade fotos o notas para más contexto</p>
                </div>
            )}
        </div>
    );
}
