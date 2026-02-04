import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { GravityAnalysisResult } from '../types/analysis';

const HISTORY_KEY = 'gravity_history_v1';

export const StorageService = {
    async saveAnalysis(result: GravityAnalysisResult, audioFile?: File): Promise<void> {
        const history = await this.getHistory();
        const id = crypto.randomUUID();
        const date = new Date().toISOString();

        let audioPath = undefined;

        // Save Audio File if provided
        if (audioFile) {
            try {
                const fileName = `${id}.webm`;
                const base64Data = await this.blobToBase64(audioFile);

                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Data
                });
                audioPath = savedFile.uri;
            } catch (e) {
                console.error("Failed to save audio file", e);
            }
        }

        const newResult = { ...result, id, date, audioPath };
        const newHistory = [newResult, ...history];

        await Preferences.set({
            key: HISTORY_KEY,
            value: JSON.stringify(newHistory),
        });
    },

    async getHistory(): Promise<GravityAnalysisResult[]> {
        const { value } = await Preferences.get({ key: HISTORY_KEY });
        if (!value) return [];
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error("Failed to parse history", e);
            return [];
        }
    },

    async saveHistory(history: GravityAnalysisResult[]): Promise<void> {
        await Preferences.set({
            key: HISTORY_KEY,
            value: JSON.stringify(history),
        });
    },

    async deleteAnalysis(id: string): Promise<void> {
        const history = await this.getHistory();
        const itemToDelete = history.find(item => item.id === id);

        if (itemToDelete?.audioPath) {
            try {
                // Attempt to delete the audio file
                // Currently audioPath is a full URI (file://...) or a path.
                // Filesystem.deleteFile needs path.
                const fileName = itemToDelete.audioPath.split('/').pop();
                if (fileName) {
                    await Filesystem.deleteFile({
                        path: fileName,
                        directory: Directory.Data
                    });
                }
            } catch (e) {
                console.warn("Could not delete audio file (might not exist):", e);
            }
        }

        const newHistory = history.filter(item => item.id !== id);
        await Preferences.set({
            key: HISTORY_KEY,
            value: JSON.stringify(newHistory),
        });
    },

    async clearHistory(): Promise<void> {
        await Preferences.remove({ key: HISTORY_KEY });
    },

    async getAudioUrl(path: string): Promise<string> {
        // For Capacitor, we might need to convert the native path to a web-accessible URL
        // However, Capacitor.convertFileSrc is the way, but pure Filesystem.readFile might also work for small files.
        // For simplicity/performance with <audio>, we try to read as base64 and play.
        // NOTE: For large files, specific Capacitor Audio plugins are better, but let's try reading.
        try {
            // Extract filename from uri or just use path if it was saved relative
            const fileName = path.split('/').pop();
            if (!fileName) return "";

            const file = await Filesystem.readFile({
                path: fileName,
                directory: Directory.Data
            });

            return `data:audio/webm;base64,${file.data}`;
        } catch (e) {
            console.error("Error loading audio", e);
            return "";
        }
    },

    blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data url prefix (e.g. "data:audio/webm;base64,")
                const base64 = base64String.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
};
