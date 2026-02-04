export interface ScreenAudioRecorderPlugin {
    requestPermission(): Promise<{ granted: boolean }>;
    startRecording(): Promise<{ recording: boolean; filePath: string }>;
    stopRecording(): Promise<{ filePath: string }>;
    isRecording(): Promise<{ recording: boolean }>;
}
