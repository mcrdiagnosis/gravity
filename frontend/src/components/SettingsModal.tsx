import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Settings, X, MessageCircle } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApiKeySaved: (key: string) => void;
}

export function SettingsModal({ isOpen, onClose, onApiKeySaved }: SettingsModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const { value: apiKeyValue } = await Preferences.get({ key: 'openai_api_key' });
        const { value: whatsappValue } = await Preferences.get({ key: 'whatsapp_number' });

        if (apiKeyValue) {
            setApiKey(apiKeyValue);
            onApiKeySaved(apiKeyValue);
        }
        if (whatsappValue) {
            setWhatsappNumber(whatsappValue);
        }
    };

    const saveSettings = async () => {
        await Preferences.set({ key: 'openai_api_key', value: apiKey });
        await Preferences.set({ key: 'whatsapp_number', value: whatsappNumber });
        onApiKeySaved(apiKey);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-400" />
                        Configuración
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">OpenAI API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Tu clave se guarda localmente en el dispositivo de forma segura.
                            Necesaria para "Gravity Intelligence".
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-green-400" />
                            Número de WhatsApp (opcional)
                        </label>
                        <input
                            type="tel"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="+34612345678"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Para compartir PDFs directamente. Formato: +código país + número
                        </p>
                    </div>

                    <button
                        onClick={saveSettings}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
