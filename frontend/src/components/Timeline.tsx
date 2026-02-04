import type { GravityAnalysisResult } from '../types/analysis';
import { Clock, Tag, ChevronRight, Trash2, HardDrive } from 'lucide-react';

interface TimelineProps {
    items: GravityAnalysisResult[];
    onSelect: (item: GravityAnalysisResult) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export function Timeline({ items, onSelect, onDelete }: TimelineProps) {
    if (items.length === 0) {
        return (
            <div className="text-center py-10 opacity-50">
                <p>No hay grabaciones recientes.</p>
            </div>
        );
    }

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'Reciente';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4 fade-in-up">
            <h3 className="text-lg font-semibold text-slate-300 ml-1">Historial Reciente</h3>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div
                        key={item.id || index}
                        onClick={() => onSelect(item)}
                        className="group bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 rounded-xl p-4 cursor-pointer transition-all active:scale-98 relative"
                    >
                        <div className="flex justify-between items-start">
                            <div className="pr-8 flex-1">
                                <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                    {item.executive_summary.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                                    <span className="flex items-center gap-1 font-mono text-indigo-200/70">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(item.date)}
                                        {item.duration ? ` · ${formatDuration(item.duration)}` : ''}
                                    </span>
                                    <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full">
                                        <Tag className="w-3 h-3" />
                                        {item.metadata.category}
                                    </span>
                                    {item.audioSize && (
                                        <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-full text-slate-500">
                                            <HardDrive className="w-3 h-3" />
                                            {formatFileSize(item.audioSize)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => onDelete(item.id!, e)}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors z-10"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
