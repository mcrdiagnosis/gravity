import { registerPlugin } from '@capacitor/core';

export interface RecentRecordingsPlugin {
    scanBrief(): Promise<{
        found: boolean;
        path?: string;
        filename?: string;
        timestamp?: number;
    }>;
}

const RecentRecordings = registerPlugin<RecentRecordingsPlugin>('RecentRecordings');

export default RecentRecordings;
