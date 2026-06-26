package com.example.venezuelasos

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Interceptar el botón BACK: si el WebView puede ir atrás, navegar en él
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView?.canGoBack() == true) {
                    webView?.goBack()
                } else {
                    // Si no hay historial, minimizar la app (no cerrarla)
                    moveTaskToBack(true)
                }
            }
        })

        setContent {
            WebViewScreen(onWebViewCreated = { wv -> webView = wv })
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(onWebViewCreated: (WebView) -> Unit) {
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                // Configurar WebView con soporte HTML5 premium
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.databaseEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                settings.setGeolocationEnabled(true)
                
                // Fix para Google Login "Error 403: disallowed_useragent"
                // Engañamos a Google quitando el flag "; wv" (WebView) del User-Agent
                settings.userAgentString = settings.userAgentString.replace("; wv", "")

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
                        val url = request?.url.toString()
                        if (url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("intent:") || url.contains("wa.me")) {
                            try {
                                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                                context.startActivity(intent)
                                return true
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        return super.shouldOverrideUrlLoading(view, request)
                    }
                }
                webChromeClient = object : WebChromeClient() {
                    override fun onGeolocationPermissionsShowPrompt(
                        origin: String?,
                        callback: GeolocationPermissions.Callback?
                    ) {
                        callback?.invoke(origin, true, false)
                    }
                }

                // Carga la app en producción
                loadUrl("https://filosos.site")

                // Registrar el WebView para el control de back
                onWebViewCreated(this)
            }
        }
    )
}
