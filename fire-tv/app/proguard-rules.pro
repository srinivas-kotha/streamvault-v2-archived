# WebView: keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView client classes
-keep class uk.srinivaskotha.streamvault.** { *; }
