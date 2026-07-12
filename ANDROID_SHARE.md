# WhatsApp PDF share inside the Android WebView

Android's WebView has **no Web Share API**, so JavaScript cannot hand a file to
WhatsApp on its own. The web page (`js/ui.js` → `sharePdfWhatsApp`) instead looks
for a native bridge object called **`AndroidShare`** and calls:

```js
AndroidShare.sharePdf(base64Pdf, fileName, text)
```

Add the four pieces below to your Android app and sharing will work. The web side
already handles everything else (it generates the PDF and the base64).

---

## 1. Register the bridge on your WebView

Kotlin:

```kotlin
webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true            // some features rely on it
webView.addJavascriptInterface(WebAppInterface(this), "AndroidShare")   // name MUST be "AndroidShare"
webView.loadUrl("https://your-hosted-url/")           // your existing URL
```

## 2. The bridge class

Kotlin (`WebAppInterface.kt`):

```kotlin
import android.content.Context
import android.content.Intent
import android.util.Base64
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun sharePdf(base64: String, fileName: String, text: String) {
        try {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            val dir = File(context.cacheDir, "shared").apply { mkdirs() }
            val file = File(dir, fileName)
            file.writeBytes(bytes)

            val uri = FileProvider.getUriForFile(
                context, "${context.packageName}.fileprovider", file
            )

            val send = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_TEXT, text)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                // To force WhatsApp only, uncomment:
                // setPackage("com.whatsapp")
            }
            val chooser = Intent.createChooser(send, "Share PDF")
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } catch (e: Exception) {
            Toast.makeText(context, "Share failed: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
```

Java equivalent, if your project is Java:

```java
public class WebAppInterface {
    private final Context context;
    public WebAppInterface(Context c) { context = c; }

    @android.webkit.JavascriptInterface
    public void sharePdf(String base64, String fileName, String text) {
        try {
            byte[] bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
            java.io.File dir = new java.io.File(context.getCacheDir(), "shared");
            dir.mkdirs();
            java.io.File file = new java.io.File(dir, fileName);
            java.io.FileOutputStream fos = new java.io.FileOutputStream(file);
            fos.write(bytes); fos.close();

            android.net.Uri uri = androidx.core.content.FileProvider.getUriForFile(
                context, context.getPackageName() + ".fileprovider", file);

            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("application/pdf");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_TEXT, text);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            // send.setPackage("com.whatsapp");   // force WhatsApp only
            Intent chooser = Intent.createChooser(send, "Share PDF");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);
        } catch (Exception e) {
            android.widget.Toast.makeText(context, "Share failed: " + e.getMessage(),
                android.widget.Toast.LENGTH_LONG).show();
        }
    }
}
```

## 3. Declare a FileProvider in `AndroidManifest.xml`

Inside `<application> … </application>`:

```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

## 4. `res/xml/file_paths.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <cache-path name="shared" path="shared/" />
</paths>
```

---

## Notes / gotchas

- The interface name registered in step 1 **must be exactly `AndroidShare`** — that
  is what the web page looks for.
- `androidx.core:core` provides `FileProvider` (already present in most projects).
- The PDF is written to the app **cache** (`cacheDir/shared/`); Android cleans it up.
- Telugu text in the PDF renders correctly only when the device could load the web
  font (i.e. had internet at least once). Offline, it falls back to a system font.
- If you also want the plain **📄 PDF (print)** button and `wa.me` links to open, add
  these so the WebView doesn't just sit on `target=_blank`/external links:

  ```kotlin
  webView.settings.setSupportMultipleWindows(true)
  webView.webChromeClient = WebChromeClient()
  webView.webViewClient = object : WebViewClient() {
      override fun shouldOverrideUrlLoading(v: WebView, req: WebResourceRequest): Boolean {
          val u = req.url.toString()
          if (u.startsWith("https://wa.me") || u.startsWith("whatsapp://")) {
              context.startActivity(Intent(Intent.ACTION_VIEW, req.url)); return true
          }
          return false
      }
  }
  ```
  But with the `AndroidShare` bridge in place, the share button no longer needs `wa.me`.
