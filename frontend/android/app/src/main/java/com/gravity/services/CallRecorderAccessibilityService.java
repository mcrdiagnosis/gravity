package com.gravity.services;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.media.AudioManager;

import androidx.core.app.NotificationCompat;

import com.gravity.audio.MainActivity;
import com.gravity.audio.R;

public class CallRecorderAccessibilityService extends AccessibilityService {
    private static final String TAG = "GravityCallMonitor";
    
    // States for regular calls
    private boolean wasInCall = false;
    private long callStartTime = 0;
    
    // States for VoIP calls (WhatsApp, Telegram, etc)
    private boolean wasInVoipCall = false;
    private long voipCallStartTime = 0;
    private String activeVoipPackage = "";
    
    private TelephonyManager telephonyManager;
    private PhoneStateListener phoneStateListener;
    
    private static CallRecorderAccessibilityService instance;
    
    private static final String CHANNEL_ID = "gravity_call_monitor";
    private static final int NOTIFICATION_ID = 101;

    public static CallRecorderAccessibilityService getInstance() {
        return instance;
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        
        createNotificationChannel();
        setupPhoneStateListener();
        
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED 
                        | AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
                        | AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
                   | AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;
        info.packageNames = new String[]{
            "com.whatsapp", 
            "com.whatsapp.w4b",
            "org.telegram.messenger",
            "org.thunderdog.challegram",
            "com.facebook.orca",
            "com.android.dialer", 
            "com.google.android.dialer",
            "com.samsung.android.dialer",
            "com.android.incallui"
        };
        
        setServiceInfo(info);
        Log.d(TAG, "✅ Call Monitor Service Connected (Phone + VoIP Apps)");
    }

    private void setupPhoneStateListener() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "⚠️ No hay permiso READ_PHONE_STATE. El monitor se activará cuando se conceda.");
                return;
            }
        }

        try {
            telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                Log.e(TAG, "TelephonyManager es NULL");
                return;
            }
            
            if (phoneStateListener == null) {
                phoneStateListener = new PhoneStateListener() {
                    @Override
                    public void onCallStateChanged(int state, String phoneNumber) {
                        Log.d(TAG, "ESTADO LLAMADA CAMBIÓ: " + state);
                        try {
                            switch (state) {
                                case TelephonyManager.CALL_STATE_OFFHOOK: 
                                    Log.d(TAG, "📞 Llamada en curso detectada");
                                    wasInCall = true;
                                    callStartTime = System.currentTimeMillis();
                                    break;
                                    
                                case TelephonyManager.CALL_STATE_IDLE:
                                    if (wasInCall) {
                                        long duration = System.currentTimeMillis() - callStartTime;
                                        Log.d(TAG, "🏁 Llamada finalizada. Duración: " + duration + "ms");
                                        wasInCall = false;
                                        if (duration > 1000) {
                                            onCallEnded();
                                        }
                                    }
                                    break;
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error procesando cambio de estado", e);
                        }
                    }
                };
            }
            
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
            Log.d(TAG, "✅ Monitor de llamadas registrado con éxito");
            
        } catch (SecurityException se) {
            Log.e(TAG, "❌ Error de seguridad al registrar listener", se);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error general en setupPhoneStateListener", e);
        }
    }

    // Método para ser llamado cuando se entra en la App
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "RECHECK_PERMISSIONS".equals(intent.getAction())) {
            Log.d(TAG, "Re-comprobando permisos por petición de MainActivity");
            setupPhoneStateListener();
        }
        return START_STICKY;
    }

    private void onCallEnded() {
        // Wait a few seconds for the SYSTEM recorder to save the file
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Log.d(TAG, "Notifying user to check for recordings");
            showCheckRecordingNotification();
            
            // Broadcast to App (if open)
            Intent intent = new Intent("com.gravity.CALL_ENDED");
            sendBroadcast(intent);
        }, 3000); // 3 seconds delay for file save
    }

    private Handler voipEndHandler = new Handler(Looper.getMainLooper());
    private Runnable voipEndRunnable = null;

    private Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private Runnable watchdogRunnable = null;

    private void startWatchdog() {
        if (watchdogRunnable != null) return;
        
        watchdogRunnable = new Runnable() {
            @Override
            public void run() {
                if (wasInVoipCall) {
                    AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                    boolean isAudioInComm = audioManager.getMode() == AudioManager.MODE_IN_COMMUNICATION;
                    
                    if (!isAudioInComm) {
                        Log.d(TAG, "🛡️ Watchdog: Audio communication ended. Verifying closure...");
                        // Trigger the regular end logic
                        detectVoipCall(activeVoipPackage, "WatchdogCheck");
                    } else {
                        // Still in call, check again in 5 seconds
                        watchdogHandler.postDelayed(this, 5000);
                    }
                } else {
                    watchdogRunnable = null;
                }
            }
        };
        watchdogHandler.postDelayed(watchdogRunnable, 5000);
        Log.d(TAG, "🛡️ Watchdog started for VoIP session");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        
        int eventType = event.getEventType();
        
        if (eventType == AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED && wasInVoipCall) {
            // If we're in a call and notifications change, it might be the "Call ended" or removal of notification
            Log.d(TAG, "🔔 Notification change detected during call");
            detectVoipCall(activeVoipPackage, "NotificationEvent");
            return;
        }

        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return;
        }
        
        String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
        String className = event.getClassName() != null ? event.getClassName().toString() : "";
        
        // Ignore generic layout transitions
        if (className.equals("android.widget.FrameLayout") || 
            className.equals("android.view.ViewGroup") || 
            className.equals("android.view.View")) {
            return;
        }

        Log.d(TAG, "Screen transition: [" + packageName + "] " + className);
        detectVoipCall(packageName, className);
    }
    
    private void detectVoipCall(String packageName, String className) {
        String lowerClass = className.toLowerCase();
        String lowerPackage = packageName.toLowerCase();
        
        boolean isCallScreen = lowerClass.contains("voip") 
                            || lowerClass.contains("call")
                            || lowerClass.contains("incall")
                            || lowerClass.contains("incoming")
                            || lowerClass.contains("calling")
                            || lowerClass.contains("answer")
                            || lowerClass.contains("videoactive");
        
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        boolean isAudioInComm = audioManager.getMode() == AudioManager.MODE_IN_COMMUNICATION;
        
        boolean isMonitoredApp = lowerPackage.contains("whatsapp") 
                              || lowerPackage.contains("telegram") 
                              || lowerPackage.contains("facebook.orca") 
                              || lowerPackage.contains("messenger");

        if (isCallScreen || (isMonitoredApp && isAudioInComm)) {
            if (voipEndRunnable != null) {
                voipEndHandler.removeCallbacks(voipEndRunnable);
                voipEndRunnable = null;
                Log.d(TAG, "🔄 Session Active: Audio/Screen confirmed [" + packageName + "]");
            }

            if (!wasInVoipCall) {
                wasInVoipCall = true;
                voipCallStartTime = System.currentTimeMillis();
                activeVoipPackage = packageName;
                Log.d(TAG, "📞 VoIP STARTED: [" + packageName + "]");
                startWatchdog();
            }
        } else if (wasInVoipCall) {
            // Logic to end the call
            if (voipEndRunnable == null) {
                voipEndRunnable = () -> {
                    boolean stillInCallAudio = audioManager.getMode() == AudioManager.MODE_IN_COMMUNICATION;
                    
                    // If audio is still communication AND we are in the app, we wait
                    if (stillInCallAudio && isMonitoredApp) {
                        Log.d(TAG, "⏳ Call screen lost but Audio Comm active. Waiting...");
                        voipEndHandler.postDelayed(voipEndRunnable, 2500);
                        return;
                    }

                    long duration = System.currentTimeMillis() - voipCallStartTime;
                    Log.d(TAG, "🏁 VoIP ENDED: Duration " + (duration/1000) + "s");
                    
                    wasInVoipCall = false;
                    activeVoipPackage = "";
                    voipEndRunnable = null;
                    
                    if (duration > 3000) {
                        onCallEnded();
                    }
                };
                
                voipEndHandler.postDelayed(voipEndRunnable, 2000);
            }
        }
    }

    @Override
    public void onInterrupt() {}

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Gravity Call Monitor",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifies when a call ends to analyze recordings");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private void showCheckRecordingNotification() {
        Log.d(TAG, "intentando mostrar notificación...");
        
        // Android 13+ Notification Permission Check
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ No se puede mostrar notificación: Permiso POST_NOTIFICATIONS denegado.");
                return;
            }
        }

        // Intent that opens the App and triggers recording interface
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("action", "record_notes");
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("📞 Llamada Finalizada")
                .setContentText("Toca para grabar notas sobre esta llamada")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE) // Ayuda a que aparezca arriba
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .build();

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            Log.d(TAG, "Enviando notificación " + NOTIFICATION_ID);
            manager.notify(NOTIFICATION_ID, notification);
        } else {
            Log.e(TAG, "NotificationManager es NULL");
        }
    }
}
