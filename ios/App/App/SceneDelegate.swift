import UIKit
import WebKit
import Capacitor

// Pont natif pour les exports CSV/PDF/JSON de l'app de gestion : voir
// native-notes/export-bridge.js pour le détail et le pourquoi. Injecté ici
// (avant le premier chargement de page) plutôt que dans le code du
// Worker/front existant — aucune modification de public/assets/app.js.
private let exportBridgeJS = #"""
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
      var safeName = String(filename || 'export').replace(/[\\/:*?"<>|]+/g, '_');

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
"""#

/// Sous-classe du bridge Capacitor : ajoute uniquement le pont d'export
/// natif ci-dessus. Tout le reste (chargement de gestion.americanfullfightingbons.fr,
/// plugins, splash screen...) reste le comportement standard de Capacitor.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        let script = WKUserScript(
            source: exportBridgeJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        self.webView?.configuration.userContentController.addUserScript(script)
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
