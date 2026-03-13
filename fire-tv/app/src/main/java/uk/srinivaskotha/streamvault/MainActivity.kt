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
 * Native WebView wrapper for Fire TV / Fire Stick.
 *
 * Loads the StreamVault PWA and injects D-pad key events directly into
 * JavaScript, bypassing WebView's built-in spatial navigation which
 * consumes arrow key events before they reach window.addEventListener.
 *
 * Why this exists: TWA requires Chrome (not on Fire OS). WebView's own
 * spatial navigation eats D-pad events. Direct JS injection is the only
 * reliable way to get key events into the React app.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView

    companion object {
        private const val PWA_URL = "https://streamvault.srinivaskotha.uk"

        // Map Android KeyEvent codes to JavaScript KeyboardEvent.key values
        private val KEY_MAP = mapOf(
            KeyEvent.KEYCODE_DPAD_UP to Triple("ArrowUp", 38, "ArrowUp"),
            KeyEvent.KEYCODE_DPAD_DOWN to Triple("ArrowDown", 40, "ArrowDown"),
            KeyEvent.KEYCODE_DPAD_LEFT to Triple("ArrowLeft", 37, "ArrowLeft"),
            KeyEvent.KEYCODE_DPAD_RIGHT to Triple("ArrowRight", 39, "ArrowRight"),
            KeyEvent.KEYCODE_DPAD_CENTER to Triple("Enter", 13, "Enter"),
            KeyEvent.KEYCODE_ENTER to Triple("Enter", 13, "Enter"),
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE to Triple("MediaPlayPause", 179, "MediaPlayPause"),
            KeyEvent.KEYCODE_MEDIA_REWIND to Triple("MediaRewind", 227, "MediaRewind"),
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD to Triple("MediaFastForward", 228, "MediaFastForward"),
        )
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
     * Intercept D-pad key events and inject them directly into JavaScript.
     *
     * WebView's built-in spatial navigation consumes arrow key events before
     * they fire as KeyboardEvent on window. By intercepting at the Activity
     * level and using evaluateJavascript(), we bypass WebView's spatial nav
     * entirely and deliver events straight to our LRUD handler.
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val keyInfo = KEY_MAP[event.keyCode]

        if (keyInfo != null) {
            val (key, keyCode, code) = keyInfo
            val eventType = when (event.action) {
                KeyEvent.ACTION_DOWN -> "keydown"
                KeyEvent.ACTION_UP -> "keyup"
                else -> null
            }

            if (eventType != null) {
                // Inject a synthetic KeyboardEvent directly into JavaScript.
                // Dispatch to both window and document so the handler fires
                // regardless of which cached frontend version is loaded.
                // JS-side dedup (50ms window) prevents double-firing.
                val js = """
                    (function() {
                        var e = new KeyboardEvent('$eventType', {
                            key: '$key',
                            code: '$code',
                            keyCode: $keyCode,
                            which: $keyCode,
                            bubbles: true,
                            cancelable: true
                        });
                        // Dispatch to BOTH targets — old cached frontend may listen on
                        // window, new frontend listens on document. Dedup handled in JS.
                        window.dispatchEvent(e);
                        var e2 = new KeyboardEvent('$eventType', {
                            key: '$key',
                            code: '$code',
                            keyCode: $keyCode,
                            which: $keyCode,
                            bubbles: true,
                            cancelable: true
                        });
                        document.dispatchEvent(e2);

                        // Debug overlay — shows key + LRUD state
                        if ('$eventType' === 'keydown') {
                            var d = document.getElementById('sv-debug');
                            if (!d) {
                                d = document.createElement('div');
                                d.id = 'sv-debug';
                                d.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;z-index:99999;background:rgba(0,0,0,0.9);color:#0ff;padding:12px 16px;border-radius:8px;font-size:14px;font-family:monospace;pointer-events:none;white-space:pre-wrap;line-height:1.4;';
                                document.body.appendChild(d);
                            }
                            var lrud = window.__LRUD_INSTANCE__;
                            var focusNode = lrud ? (lrud.currentFocusNode ? lrud.currentFocusNode.id : 'NONE') : 'NO LRUD';
                            var nodeCount = 0;
                            if (lrud && lrud.nodes) { try { nodeCount = Object.keys(lrud.nodes).length; } catch(x) {} }
                            if (lrud && lrud.tree) { try { var c = function(n) { var s = 1; if (n.children) { for (var k in n.children) s += c(n.children[k]); } return s; }; nodeCount = c(lrud.tree) - 1; } catch(x) {} }
                            d.textContent = 'KEY: $key | Focus: ' + focusNode + ' | Nodes: ' + nodeCount;
                            d.style.opacity = '1';
                            clearTimeout(window._svDebugTimer);
                            window._svDebugTimer = setTimeout(function() { d.style.opacity = '0.4'; }, 2000);
                        }
                    })();
                """.trimIndent()

                webView.evaluateJavascript(js, null)
                return true  // Consume the event — don't let WebView handle it
            }
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
