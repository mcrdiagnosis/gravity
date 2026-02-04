interface TranscriptViewProps {
    text?: string;
    highlight?: string;
}

export function TranscriptView({ text, highlight }: TranscriptViewProps) {
    if (!text) return null;

    const getHighlightedText = (text: string, highlight: string) => {
        if (!highlight || !highlight.trim()) return text;

        // Escape regex special characters to prevent errors
        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const terms = highlight.trim().split(/\s+/).filter(t => t.length > 0).map(escapeRegExp).join('|');
        if (!terms) return text;

        const parts = text.split(new RegExp(`(${terms})`, 'gi'));

        return parts.map((part, i) =>
            new RegExp(`^(${terms})$`, 'i').test(part) ? (
                <mark key={i} className="bg-yellow-500/30 text-yellow-100 rounded px-0.5 font-medium">{part}</mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-4">Transcripción Completa</h3>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 h-64 overflow-y-auto text-sm text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                {getHighlightedText(text, highlight || '')}
            </div>
        </div>
    );
}
