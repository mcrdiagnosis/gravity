import axios from 'axios';

// For development, use your local machine's IP address (e.g., http://192.168.1.XX:8000)
// For Easypanel, use your deployment URL.
const API_URL = import.meta.env.VITE_API_URL || 'https://n8n-gravity-local.jspoor.easypanel.host/api';

export class SyncService {
    private static getHeaders(token: string) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    static async getRecordings(token: string) {
        const response = await axios.get(`${API_URL}/recordings`, {
            headers: this.getHeaders(token),
        });
        return response.data;
    }

    static async uploadAndAnalyze(token: string, audioFile: File, attachments: any[]) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('attachments', JSON.stringify(attachments));

        const response = await axios.post(`${API_URL}/recordings/analyze`, formData, {
            headers: {
                ...this.getHeaders(token),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
}
