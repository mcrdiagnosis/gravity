import { Mic, Calendar } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'recordings' | 'calendar';
    onChange: (tab: 'recordings' | 'calendar') => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-white/10 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)', paddingTop: '8px' }}>
            <div className="flex justify-around items-center max-w-md mx-auto h-14">
                <button
                    onClick={() => onChange('recordings')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'recordings' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Mic className={`w-6 h-6 ${activeTab === 'recordings' ? 'fill-current/20' : ''}`} />
                    <span className="text-[10px] font-medium">Grabaciones</span>
                </button>

                <button
                    onClick={() => onChange('calendar')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calendar' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Calendar className={`w-6 h-6 ${activeTab === 'calendar' ? 'fill-current/20' : ''}`} />
                    <span className="text-[10px] font-medium">Agenda</span>
                </button>
            </div>
        </div>
    );
}
