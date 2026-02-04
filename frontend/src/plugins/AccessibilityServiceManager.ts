import { registerPlugin } from '@capacitor/core';

export interface AccessibilityServiceManagerPlugin {
    isServiceEnabled(): Promise<{ enabled: boolean }>;
    openAccessibilitySettings(): Promise<{ success: boolean }>;
    getRecordingStatus(): Promise<{ isRecording: boolean; filePath?: string }>;
    startManualRecording(): Promise<void>;
    stopManualRecording(): Promise<void>;
    getLastAction(): Promise<{ action: string | null }>;
}

const AccessibilityServiceManager = registerPlugin<AccessibilityServiceManagerPlugin>('AccessibilityServiceManager');

export default AccessibilityServiceManager;
