package com.gravity.plugins;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;

@CapacitorPlugin(
    name = "GravityAudioRecorder",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "audio")
    }
)
public class GravityAudioRecorderPlugin extends Plugin {
    private static final String TAG = "GravityAudioRecorder";
    
    private MediaRecorder mediaRecorder;
    private boolean isRecording = false;
    private File outputFile;

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (!hasRequiredPermissions()) {
            requestAllPermissions(call, "permissionCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (!hasRequiredPermissions()) {
            call.reject("Permiso de micrófono denegado por el usuario");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void startRecording(PluginCall call) {
        if (!hasRequiredPermissions()) {
            call.reject("Permiso de micrófono no concedido");
            return;
        }

        if (isRecording) {
            call.reject("Ya se está grabando");
            return;
        }

        try {
            outputFile = new File(getContext().getCacheDir(), "manual_rec_" + System.currentTimeMillis() + ".m4a");

            mediaRecorder = new MediaRecorder();
            // VOICE_COMMUNICATION: Optimized for VoIP/calls, captures both mic and speaker on speakerphone
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setAudioEncodingBitRate(128000);
            mediaRecorder.setAudioSamplingRate(44100);
            mediaRecorder.setOutputFile(outputFile.getAbsolutePath());

            mediaRecorder.prepare();
            mediaRecorder.start();
            
            isRecording = true;

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Grabación iniciada");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Start fail", e);
            isRecording = false;
            call.reject("Error al iniciar grabación: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopRecording(PluginCall call) {
        if (!isRecording) {
            call.reject("No se está grabando");
            return;
        }

        try {
            if (mediaRecorder != null) {
                try {
                    mediaRecorder.stop();
                } catch (RuntimeException e) {
                    // Ignore immediate stop error
                }
                mediaRecorder.release();
                mediaRecorder = null;
            }
            
            isRecording = false;

            JSObject ret = new JSObject();
            if (outputFile != null && outputFile.exists()) {
                ret.put("success", true);
                ret.put("filePath", outputFile.getAbsolutePath());
                ret.put("fileSize", outputFile.length());
            } else {
                ret.put("success", false);
                ret.put("error", "Archivo no encontrado");
            }
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Stop fail", e);
            call.reject("Error al detener: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isRecording(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("recording", isRecording);
        call.resolve(ret);
    }
}
