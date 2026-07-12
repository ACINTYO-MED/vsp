# WhatsApp PDF share from a Flutter WebView

The web page already generates a real PDF and looks for a bridge. Inside a
**Flutter WebView** there is no Web Share API, so the PDF must be handed to Dart,
which saves it and opens the native share sheet (WhatsApp included).

The JS (`js/ui.js` → `sharePdfWhatsApp`) supports three bridges automatically:

| WebView package        | What JS calls                                             |
|------------------------|-----------------------------------------------------------|
| `webview_flutter`      | `AndroidShare.postMessage(jsonString)`  ← **most common** |
| `flutter_inappwebview` | `window.flutter_inappwebview.callHandler('sharePdf', …)`  |
| native Android         | `AndroidShare.sharePdf(base64, name, text)`               |

You only need to implement **one** — matching the package you use. Below is
`webview_flutter` (the official one). The JS channel name must be **`AndroidShare`**.

---

## Option A — `webview_flutter` (recommended)

### 1. pubspec.yaml
```yaml
dependencies:
  webview_flutter: ^4.7.0
  share_plus: ^9.0.0
  path_provider: ^2.1.0
```

### 2. WebView setup
```dart
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';

late final WebViewController controller;

@override
void initState() {
  super.initState();
  controller = WebViewController()
    ..setJavaScriptMode(JavaScriptMode.unrestricted)
    ..addJavaScriptChannel(
      'AndroidShare',                       // <-- name MUST be exactly this
      onMessageReceived: (JavaScriptMessage m) async {
        final data = jsonDecode(m.message) as Map<String, dynamic>;
        await _sharePdf(
          data['base64'] as String,
          data['fileName'] as String,
          data['text'] as String,
        );
      },
    )
    ..loadRequest(Uri.parse('https://your-hosted-url/'));   // your existing URL
}

Future<void> _sharePdf(String base64Str, String fileName, String text) async {
  final bytes = base64Decode(base64Str);
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/$fileName');
  await file.writeAsBytes(bytes, flush: true);
  await Share.shareXFiles(
    [XFile(file.path, mimeType: 'application/pdf')],
    text: text,
  );
}
```

That's it — tapping the green share button now opens the Android share sheet with
the real PDF; pick WhatsApp (or any app).

---

## Option B — `flutter_inappwebview`

```dart
InAppWebView(
  initialUrlRequest: URLRequest(url: WebUri('https://your-hosted-url/')),
  onWebViewCreated: (c) {
    c.addJavaScriptHandler(
      handlerName: 'sharePdf',
      callback: (args) async {
        final base64Str = args[0] as String;
        final fileName  = args[1] as String;
        final text      = args[2] as String;
        final bytes = base64Decode(base64Str);
        final dir = await getTemporaryDirectory();
        final file = File('${dir.path}/$fileName');
        await file.writeAsBytes(bytes, flush: true);
        await Share.shareXFiles([XFile(file.path, mimeType: 'application/pdf')], text: text);
        return null;
      },
    );
  },
  initialSettings: InAppWebViewSettings(javaScriptEnabled: true),
)
```

---

## Checklist if it still doesn't work

1. **JavaScript enabled** — `JavaScriptMode.unrestricted` (webview_flutter) or
   `javaScriptEnabled: true` (inappwebview).
2. **Channel name** is exactly `AndroidShare` (case-sensitive).
3. The **vendor libs load** — `js/vendor/jspdf.umd.min.js` and
   `js/vendor/html2canvas.min.js` must be deployed to your host and reachable
   (open DevTools/remote debugging; a 404 there means no PDF is generated).
4. **share_plus** needs no extra Android permission for cache-dir files, but make
   sure your `minSdkVersion` ≥ 21.
5. Test with remote debugging (`chrome://inspect`) — you should see the button
   generate a blob, then the channel message fire. If you see
   *"PDF లైబ్రరీ లోడ్ కాలేదు"*, the vendor scripts didn't load.

> The earlier `ANDROID_SHARE.md` (native Kotlin `addJavascriptInterface`) only
> applies if you build a **native** Android WebView, not a Flutter one. For
> Flutter, use this file.
