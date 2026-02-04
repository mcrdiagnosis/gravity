import { registerPlugin } from '@capacitor/core';

export interface SystemAudioRecorderPlugin {
    requestPermissions(): Promise<{ granted: boolean }>;
    startRecording(): Promise<{ success: boolean; message: string }>;
    stopRecording(): Promise<{ success: boolean; filePath?: string; fileSize?: number; error?: string }>;
    isRecording(): Promise<{ recording: boolean }>;
}

const SystemAudioRecorder = registerPlugin<SystemAudioRecorderPlugin>('GravityAudioRecorder');

export default SystemAudioRecorder;
