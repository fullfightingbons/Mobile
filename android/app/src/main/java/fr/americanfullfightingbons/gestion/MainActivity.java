package fr.americanfullfightingbons.gestion;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    // Pont natif pour les exports CSV/PDF/JSON de l'app de gestion : voir
    // native-notes/export-bridge.js pour le détail et le pourquoi. Injecté
    // ici (après chaque chargement de page) plutôt que dans le code du
    // Worker/front existant — aucune modification de public/assets/app.js.
    private static final String EXPORT_BRIDGE_JS = """
        (function () {
          if (window.__affbcExportBridgeInstalled) return;
          window.__affbcExportBridgeInstalled = true;

          function plugins() {
            return (window.Capacitor && window.Capacitor.Plugins) || {};
          }

          function blobToBase64(blob) {
            return new Promise(function (resolve, reject) {
              var reader = new FileReader();
              reader.onloadend = function () {
                var result = reader.result || '';
                var i = result.indexOf(',');
                resolve(i >= 0 ? result.slice(i + 1) : result);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }

          async function handleDownload(blobUrl, filename) {
            var Filesystem = plugins().Filesystem;
            var Share = plugins().Share;
            if (!Filesystem || !Share) return false;

            try {
              var response = await fetch(blobUrl);
              var blob = await response.blob();
              var base64 = await blobToBase64(blob);
              var safeName = String(filename || 'export').replace(/[\\\\/:*?"<>|]+/g, '_');

              var written = await Filesystem.writeFile({
                path: safeName,
                data: base64,
                directory: 'CACHE',
                recursive: true,
              });

              await Share.share({ title: safeName, files: [written.uri] });
              return true;
            } catch (err) {
              console.error('[export-bridge] echec export natif', err);
              return false;
            }
          }

          var nativeClick = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function () {
            var href = this.href || '';
            var filename = this.getAttribute('download');
            var self = this;
            if (filename && href.indexOf('blob:') === 0) {
              handleDownload(href, filename).then(function (handled) {
                if (!handled) nativeClick.call(self);
              });
              return;
            }
            return nativeClick.apply(this, arguments);
          };
        })();
        """;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                webView.evaluateJavascript(EXPORT_BRIDGE_JS, null);
            }
        });
    }
}
