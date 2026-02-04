package com.gravity.audio;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.gravity.plugins.AccessibilityServiceManagerPlugin;
import com.gravity.plugins.GravityAudioRecorderPlugin;
import com.gravity.plugins.RecentRecordingsPlugin;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    public static String lastAction = null;
    private static final int PERMISSION_REQUEST_CODE = 456;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d("GravityMain", "-------------- PRE-INIT PLUGINS --------------");
        try {
            registerPlugin(GravityAudioRecorderPlugin.class);
            registerPlugin(AccessibilityServiceManagerPlugin.class);
            registerPlugin(RecentRecordingsPlugin.class);
        } catch (Exception e) {
            Log.e("GravityMain", "Error registering plugins", e);
        }

        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        checkAndRequestPermissions();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.hasExtra("action")) {
            lastAction = intent.getStringExtra("action");
            Log.d("GravityMain", "🚀 [NATIVO] Acción detectada: " + lastAction);
        }
    }

    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        List<String> permissionsNeeded = new ArrayList<>();
        if (checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) permissionsNeeded.add(Manifest.permission.READ_PHONE_STATE);
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) permissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
            if (checkSelfPermission(Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) permissionsNeeded.add(Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            if (checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) permissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        if (!permissionsNeeded.isEmpty()) {
            requestPermissions(permissionsNeeded.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            for (int i = 0; i < permissions.length; i++) {
                if (permissions[i].equals(Manifest.permission.READ_PHONE_STATE) && grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    Intent intent = new Intent(this, com.gravity.services.CallRecorderAccessibilityService.class);
                    intent.setAction("RECHECK_PERMISSIONS");
                    startService(intent);
                }
            }
        }
    }
}
