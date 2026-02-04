package com.gravity.plugins;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.gravity.services.CallRecorderAccessibilityService;

@CapacitorPlugin(name = "AccessibilityServiceManager")
public class AccessibilityServiceManagerPlugin extends Plugin {
    
    private static final String SERVICE_NAME = "com.gravity.services.CallRecorderAccessibilityService";

    @PluginMethod
    public void isServiceEnabled(PluginCall call) {
        boolean enabled = isAccessibilityServiceEnabled(getContext(), SERVICE_NAME);
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Log.d("GravityPlugin", "Intentando abrir ajustes de accesibilidad (Método Robust)...");
            
            // Try standard action first
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            try {
                getContext().startActivity(intent);
                Log.d("GravityPlugin", "Ajustes abiertos con ACTION_ACCESSIBILITY_SETTINGS");
            } catch (Exception e1) {
                // Fallback to Settings root if accessibility fails
                Log.w("GravityPlugin", "Falló ACTION_ACCESSIBILITY_SETTINGS, probando ACTION_SETTINGS", e1);
                Intent intent2 = new Intent(Settings.ACTION_SETTINGS);
                intent2.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent2);
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e("GravityPlugin", "Error fatal abriendo ajustes", e);
            Toast.makeText(getContext(), "No se pudo abrir configuración: " + e.getMessage(), Toast.LENGTH_LONG).show();
            call.reject("No se pudo abrir la configuración: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getRecordingStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isRecording", false);
        ret.put("filePath", null);
        call.resolve(ret);
    }

    @PluginMethod
    public void startManualRecording(PluginCall call) {
        call.reject("Manual recording disabled. Use system recorder.");
    }

    @PluginMethod
    public void stopManualRecording(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void getLastAction(PluginCall call) {
        String action = com.gravity.audio.MainActivity.lastAction;
        Log.d("GravityPlugin", "Native getLastAction called. Current action: " + action);
        
        JSObject ret = new JSObject();
        ret.put("action", action);
        
        // Consumir la acción para que no se repita
        com.gravity.audio.MainActivity.lastAction = null;
        Log.d("GravityPlugin", "Action consumed and cleared.");
        
        call.resolve(ret);
    }

    private boolean isAccessibilityServiceEnabled(Context context, String serviceName) {
        int accessibilityEnabled = 0;
        try {
            accessibilityEnabled = Settings.Secure.getInt(
                    context.getApplicationContext().getContentResolver(),
                    android.provider.Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            Log.e("GravityPlugin", "Error settings not found: " + e.getMessage());
        }

        if (accessibilityEnabled == 1) {
            String settingValue = Settings.Secure.getString(
                    context.getApplicationContext().getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            
            Log.d("GravityPlugin", "Servicios habilitados: " + settingValue);

            if (settingValue != null) {
                return settingValue.contains("CallRecorderAccessibilityService");
            }
        }

        return false;
    }
}
