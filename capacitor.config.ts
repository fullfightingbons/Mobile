/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.americanfullfightingbons.gestion',
  appName: 'AFFBC Gestion',
  webDir: 'www',

  // Coeur de l'archi : l'app charge directement le site distant, sur son
  // vrai domaine. Comme ça les cookies de session et le CORS (verrouillé
  // côté Worker à TRUSTED_ORIGINS, voir src/index.ts) fonctionnent
  // exactement comme dans un navigateur classique, sans rien changer au
  // backend. "gestion.americanfullfightingbons.fr" est déjà dans cette
  // liste de confiance.
  server: {
    url: 'https://gestion.americanfullfightingbons.fr',
    cleartext: false,
    // Permet à la webview de naviguer vers les autres sous-domaines de
    // l'écosystème AFFBC (liens "Site / Inscription / Calendrier /
    // Boutique" dans l'en-tête de l'app) sans les faire s'ouvrir dans le
    // navigateur externe du téléphone.
    allowNavigation: [
      '*.americanfullfightingbons.fr',
      'americanfullfightingbons.fr',
    ],
    // Page locale (embarquée dans l'app, voir www/offline.html) affichée
    // automatiquement par Capacitor à la place d'une page d'erreur Chrome
    // brute, uniquement pour un échec de la requête principale (pas pour
    // une image ou un appel API qui échoue en cours de route — Capacitor
    // filtre déjà ça en natif). Couvre coupure réseau ET erreur serveur.
    errorPath: 'offline.html',
  },

  plugins: {
    // Masquage manuel (plutôt qu'un minuteur fixe de 800ms) : vu que la
    // page réelle vient du réseau (gestion.americanfullfightingbons.fr) et
    // pas d'assets embarqués, un minuteur fixe peut laisser voir un flash
    // blanc ou la page à moitié chargée sur une connexion lente. Le splash
    // reste affiché jusqu'à ce que MainActivity appelle SplashScreen.hide()
    // (au premier onPageLoaded ou en cas d'échec réseau — voir MainActivity.java).
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#07111dff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // StatusBar : conservé pour iOS (où overlaysWebView fonctionne encore
    // normalement). Sur Android, ces options ne font plus rien depuis
    // Android 16 (API 36, notre targetSdkVersion) — l'edge-to-edge y est
    // désormais imposé par le système sans échappatoire possible. C'est
    // SystemBars + le plugin EdgeToEdge ci-dessous qui prennent le relais
    // côté Android.
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07111d',
      overlaysWebView: false,
    },
    // API moderne (Capacitor 8 core) pour le style des icônes des barres
    // système sur les deux plateformes. insetsHandling "disable" est requis
    // par le plugin EdgeToEdge ci-dessous, qui prend en charge lui-même
    // l'application des marges de sécurité à la webview Android.
    SystemBars: {
      style: 'DARK',
      insetsHandling: 'disable',
    },
    // Sans ce plugin, sur Android 16 (targetSdkVersion 36), la webview
    // s'étendrait sous la barre de statut et la barre de navigation : le
    // contenu du site distant (non conçu pour l'edge-to-edge, et qu'on ne
    // peut pas retoucher en CSS depuis cette coque) serait alors caché
    // derrière ces barres. Ce plugin restaure le comportement traditionnel
    // en appliquant les marges de sécurité directement à la webview, sans
    // rien changer au site.
    EdgeToEdge: {
      backgroundColor: '#07111d',
      statusBarColor: '#07111d',
      navigationBarColor: '#07111d',
    },
    Keyboard: {
      resize: 'body',
      // Requis par le plugin EdgeToEdge (voir sa doc) : à false (la
      // valeur par défaut), sans quoi la webview serait redimensionnée en
      // plus du remplissage déjà géré par EdgeToEdge, ce qui casserait la
      // mise en page à l'ouverture du clavier.
      resizeOnFullScreen: false,
    },
    // Le handler par défaut du plugin App a un comportement trompeur sur
    // l'écran racine (aucun historique de navigation dans la webview) : il
    // intercepte quand même l'appui sur retour et... ne fait rien, au lieu
    // de quitter l'app au sens normal (moveTaskToBack). Désactivé ici au
    // profit d'une gestion équivalente mais correcte dans MainActivity.java.
    App: {
      disableBackButtonHandler: true,
    },
  },

  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
