import { useState, useEffect } from 'react';
import { Settings, AlertCircle, PhoneOff, ChevronDown, ChevronUp } from 'lucide-react';
import AccessibilityServiceManager from '../plugins/AccessibilityServiceManager';

export function AccessibilitySetup() {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const checkStatus = async () => {
        try {
            const result = await AccessibilityServiceManager.isServiceEnabled();
            setIsEnabled(result.enabled);
        } catch (e) {
            console.error('Error checking accessibility status:', e);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const openSettings = async () => {
        try {
            await AccessibilityServiceManager.openAccessibilitySettings();
        } catch (error) {
            console.error('Error opening settings:', error);
        }
    };

    if (isEnabled === false) {
        return (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 mb-6 animate-in fade-in duration-500">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <p className="text-amber-300 font-bold text-lg mb-2">Activar Asistente de Llamadas</p>
                        <p className="text-amber-200/70 text-sm mb-4 leading-relaxed">
                            Para detectar tus llamadas automáticamente, activa el servicio de Gravity en ajustes.
                        </p>
                        <button
                            onClick={openSettings}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            <Settings className="w-5 h-5" />
                            Configurar Gravity
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isEnabled === true) {
        return (
            <div className="mb-6">
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl cursor-pointer hover:bg-emerald-900/20 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-2 rounded-full ring-4 ring-emerald-500/10">
                            <PhoneOff className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-emerald-400 font-bold">Asistente Activo</p>
                            <p className="text-emerald-200/50 text-xs">Gravity está listo para tu siguiente llamada</p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-500" /> : <ChevronDown className="w-5 h-5 text-emerald-500" />}
                </div>

                {isExpanded && (
                    <div className="mt-2 p-4 bg-emerald-900/10 border border-emerald-500/10 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                        <p className="text-emerald-200/70 text-sm leading-relaxed">
                            El servicio de accesibilidad está funcionando. Gravity detectará cuándo terminas una llamada y te enviará una notificación para que puedas grabar tus notas de voz rápidamente. No grabamos el audio interno de la llamada.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
