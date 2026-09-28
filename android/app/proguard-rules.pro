# 🚀 AgriSense Pro v19.0.0 Production Proguard Rules
# Prevents R8 from stripping critical Capacitor plugins and hardware bridges.

# ─── CAPACITOR CORE ────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class com.getcapacitor.Bridge { public *; }
-keep class com.getcapacitor.Plugin { public *; }
-keep class com.getcapacitor.JSObject { public *; }

# 🚀 Keep all plugins (Crucial for Release builds)
-keep public class * extends com.getcapacitor.Plugin

# ─── WEBVIEW BRIDGE ────────────────────────────────────────────────────────
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ─── FIREBASE / GOOGLE ─────────────────────────────────────────────────────
# Keep all Firebase and Google Play Services classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keepnames class com.google.firebase.** { *; }

# Firebase Auth specific (if using native auth)
-keep class com.google.firebase.auth.** { *; }
-keep class com.google.firebase.dynamiclinks.** { *; }

# ─── MQTT / PAHO (Industrial Stream) ───────────────────────────────────────
-keep class org.eclipse.paho.client.mqttv3.** { *; }
-keep class org.eclipse.paho.android.service.** { *; }
-keep class mqtt.** { *; }

# ─── SERIALIZATION / GSON ──────────────────────────────────────────────────
# Prevents stripping of data models used in JSON parsing
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class com.agrisense.app.models.** { *; }

# ─── ANDROID CORE ──────────────────────────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# ─── OKHTTP / RETROFIT (If used) ───────────────────────────────────────────
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
