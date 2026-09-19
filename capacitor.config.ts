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
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#07111dff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07111d',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
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
