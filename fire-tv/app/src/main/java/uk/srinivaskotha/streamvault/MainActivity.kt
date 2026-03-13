package uk.srinivaskotha.streamvault

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Minimal WebView wrapper for Fire TV / Fire Stick.
 *
 * Loads the StreamVault PWA in a fullscreen WebView and ensures D-pad key
 * events from the Fire Stick remote are forwarded to JavaScript as standard
 * KeyboardEvent (keydown / keyup) events on the window object.
 *
 * Why this exists: TWA (Trusted Web Activity) requires Chrome, which is not
 * available on Fire OS. Without Chrome, the TWA APK falls back to Silk
 * browser or a broken Custom Tab, and D-pad events never reach JavaScript.
 * A native WebView wrapper gives us full control over the key event chain.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView

    companion object {
        private const val PWA_URL = "https://streamvault.srinivaskotha.uk"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen immersive (hide system bars)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )

        // Create WebView programmatically (no XML layout needed)
        webView = WebView(this).apply {
            setBackgroundColor(Color.BLACK)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true           // localStorage / sessionStorage
                databaseEnabled = true             // IndexedDB
                mediaPlaybackRequiresUserGesture = false  // autoplay video
                loadWithOverviewMode = true
                useWideViewPort = true
                allowContentAccess = true

                // User agent: include "FireTV" so the PWA can detect the platform
                userAgentString = "$userAgentString StreamVault/1.0 FireTV"
            }

            // Keep navigation inside the WebView (don't open Silk)
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean = false
            }

            // Support fullscreen video (HTML5 video element)
            webChromeClient = WebChromeClient()

            // The WebView MUST have focus for D-pad key events to reach JavaScript.
            isFocusable = true
            isFocusableInTouchMode = true
            requestFocus()
        }

        // Enable cookies (for JWT httpOnly auth)
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        setContentView(webView)

        // Load the PWA
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(PWA_URL)
        }
    }

    /**
     * Forward ALL key events to the WebView. This is the critical piece that
     * makes D-pad navigation work. Without this override, the Activity or
     * WebView's built-in spatial navigation may consume arrow key events
     * before they reach JavaScript.
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Let the WebView handle the event first
        if (webView.dispatchKeyEvent(event)) {
            return true
        }

        // Back button: navigate back in WebView history, or exit app
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
            if (webView.canGoBack()) {
                webView.goBack()
                return true
            }
            // If no history, let the default behavior close the app
        }

        return super.dispatchKeyEvent(event)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        // Re-focus the WebView when returning from background
        webView.requestFocus()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
