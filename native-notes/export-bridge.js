/**
 * Pont natif pour les exports (CSV, PDF, JSON...) de l'app de gestion AFFBC.
 *
 * Pourquoi ce script : dans une webview native (Android/iOS), un lien
 * <a download href="blob:...">.click() ne déclenche PAS le gestionnaire de
 * téléchargements du système (contrairement à un vrai navigateur). C'est une
 * limitation connue des webviews, pas un bug de l'app existante. Ce script
 * intercepte ces clics et route le fichier vers le stockage natif, puis
 * ouvre la feuille de partage native (« Enregistrer dans Fichiers »,
 * partager par mail/AirDrop, etc.) grâce aux plugins Capacitor Filesystem +
 * Share — sans toucher au code de public/assets/app.js.
 *
 * Injecté côté natif uniquement (voir MainActivity.java / SceneDelegate.swift) :
 * rien à installer/modifier dans le Worker ni dans le front existant.
 */
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
    if (!Filesystem || !Share) return false; // plugins natifs indisponibles

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
      console.error('[export-bridge] échec export natif', err);
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
