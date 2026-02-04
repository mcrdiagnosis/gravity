package com.gravity.plugins;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@CapacitorPlugin(name = "RecentRecordings")
public class RecentRecordingsPlugin extends Plugin {

    @PluginMethod
    public void scanBrief(PluginCall call) {
        // Scans specifically for very recent files (last 5 minutes)
        try {
            List<File> candidates = new ArrayList<>();
            long timeThreshold = System.currentTimeMillis() - (5 * 60 * 1000); // 5 mins ago
            
            // 1. Scan Common Directories
            List<String> pathsToScan = Arrays.asList(
                Environment.getExternalStorageDirectory() + "/Music",
                Environment.getExternalStorageDirectory() + "/Recordings",
                Environment.getExternalStorageDirectory() + "/MIUI/sound_recorder/call_rec", // Xiaomi
                Environment.getExternalStorageDirectory() + "/Sounds",
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC).getAbsolutePath(),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath()
            );

            for (String path : pathsToScan) {
                File dir = new File(path);
                if (dir.exists() && dir.isDirectory()) {
                    scanDirectory(dir, candidates, timeThreshold);
                }
            }

            // 2. Sort by Date (Newest first)
            if (!candidates.isEmpty()) {
                Collections.sort(candidates, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
                
                File newest = candidates.get(0);
                
                JSObject ret = new JSObject();
                ret.put("found", true);
                ret.put("path", newest.getAbsolutePath());
                ret.put("filename", newest.getName());
                ret.put("timestamp", newest.lastModified());
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("found", false);
                call.resolve(ret);
            }

        } catch (Exception e) {
            call.reject("Error scanning: " + e.getMessage());
        }
    }

    private void scanDirectory(File dir, List<File> candidates, long timeThreshold) {
        File[] files = dir.listFiles();
        if (files == null) return;

        for (File file : files) {
            if (file.isDirectory()) {
                // Shallow recursion (1 level deep)
                scanDirectory(file, candidates, timeThreshold);
            } else {
                // Check if audio file and recent
                if (isAudioFile(file.getName()) && file.lastModified() > timeThreshold) {
                    candidates.add(file);
                }
            }
        }
    }

    private boolean isAudioFile(String name) {
        String n = name.toLowerCase();
        return n.endsWith(".mp3") || n.endsWith(".m4a") || n.endsWith(".aac") || 
               n.endsWith(".wav") || n.endsWith(".amr") || n.endsWith(".ogg") || n.endsWith(".opus");
    }
}
