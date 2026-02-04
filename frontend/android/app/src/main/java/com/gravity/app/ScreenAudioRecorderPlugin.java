package com.gravity.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.media.MediaRecorder;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;

import java.io.File;
import java.io.IOException;

@CapacitorPlugin(name = "ScreenAudioRecorder")
public class ScreenAudioRecorderPlugin extends Plugin {
    private static final String TAG = "ScreenAudioRecorder";
    
    private MediaProjectionManager projectionManager;
    private MediaProjection mediaProjection;
    private MediaRecorder mediaRecorder;
    private String outputFilePath;
    private int resultCode = -1;
    private Intent resultData = null;

    @Override
    public void load() {
        Log.d(TAG, "Plugin loaded");
        projectionManager = (MediaProjectionManager) getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Log.d(TAG, "Requesting screen capture permission");
        try {
            Intent intent = projectionManager.createScreenCaptureIntent();
            startActivityForResult(call, intent, "handlePermissionResult");
        } catch (Exception e) {
            Log.e(TAG, "Error creating screen capture intent", e);
            call.reject("Failed to request permission: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void handlePermissionResult(PluginCall call, Intent data, int resultCode) {
        Log.d(TAG, "Permission result received. ResultCode: " + resultCode);
        
        if (resultCode == Activity.RESULT_OK && data != null) {
            this.resultCode = resultCode;
            this.resultData = data;
            
            Log.d(TAG, "Permission granted successfully");
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            Log.w(TAG, "Permission denied or cancelled");
            call.reject("Permission denied");
        }
    }

    @PluginMethod
    public void startRecording(PluginCall call) {
        Log.d(TAG, "Starting recording...");
        
        if (resultData == null || resultCode != Activity.RESULT_OK) {
            Log.e(TAG, "No permission granted. resultData: " + resultData + ", resultCode: " + resultCode);
            call.reject("No permission granted. Call requestPermission first.");
            return;
        }

        try {
            // Create MediaProjection
            Log.d(TAG, "Creating MediaProjection");
            mediaProjection = projectionManager.getMediaProjection(resultCode, resultData);
            
            if (mediaProjection == null) {
                Log.e(TAG, "MediaProjection is null");
                call.reject("Failed to create MediaProjection");
                return;
            }
            
            // Create output file
            File outputDir = getContext().getExternalFilesDir(null);
            if (outputDir == null) {
                Log.e(TAG, "External files dir is null");
                call.reject("Cannot access storage");
                return;
            }
            
            File outputFile = new File(outputDir, "screen_audio_" + System.currentTimeMillis() + ".m4a");
            outputFilePath = outputFile.getAbsolutePath();
            Log.d(TAG, "Output file: " + outputFilePath);

            // Setup MediaRecorder for audio only
            mediaRecorder = new MediaRecorder();
            
            // Use MIC as source (MediaProjection is for screen, not audio routing)
            // For call recording, we need VOICE_CALL source which requires system app
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Log.d(TAG, "Using DEFAULT audio source (Android 10+)");
                mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            } else {
                Log.d(TAG, "Using MIC audio source");
                mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            }
            
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setAudioEncodingBitRate(128000);
            mediaRecorder.setAudioSamplingRate(44100);
            mediaRecorder.setOutputFile(outputFilePath);

            Log.d(TAG, "Preparing MediaRecorder");
            mediaRecorder.prepare();
            
            Log.d(TAG, "Starting MediaRecorder");
            mediaRecorder.start();

            JSObject ret = new JSObject();
            ret.put("recording", true);
            ret.put("filePath", outputFilePath);
            Log.d(TAG, "Recording started successfully");
            call.resolve(ret);

        } catch (IOException e) {
            Log.e(TAG, "IOException while starting recording", e);
            call.reject("Failed to start recording: " + e.getMessage());
        } catch (IllegalStateException e) {
            Log.e(TAG, "IllegalStateException while starting recording", e);
            call.reject("MediaRecorder in invalid state: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error while starting recording", e);
            call.reject("Unexpected error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopRecording(PluginCall call) {
        Log.d(TAG, "Stopping recording");
        
        if (mediaRecorder == null) {
            Log.w(TAG, "No active recording to stop");
            call.reject("No active recording");
            return;
        }

        try {
            mediaRecorder.stop();
            mediaRecorder.release();
            mediaRecorder = null;

            if (mediaProjection != null) {
                mediaProjection.stop();
                mediaProjection = null;
            }

            Log.d(TAG, "Recording stopped successfully. File: " + outputFilePath);
            JSObject ret = new JSObject();
            ret.put("filePath", outputFilePath);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Error stopping recording", e);
            call.reject("Failed to stop recording: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isRecording(PluginCall call) {
        boolean recording = mediaRecorder != null;
        Log.d(TAG, "isRecording: " + recording);
        
        JSObject ret = new JSObject();
        ret.put("recording", recording);
        call.resolve(ret);
    }
}
