# AFFBC Gestion — App mobile

App native qui embarque votre outil de gestion existant
(`gestion.americanfullfightingbons.fr`) dans une coque Android, via
[Capacitor](https://capacitorjs.com/). La compilation se fait **dans le
cloud** (GitHub Actions) : pas d'Android Studio à installer, tout est
gratuit.

**Pour iOS**, choix retenu : rester sur la PWA existante (« Ajouter à
l'écran d'accueil » depuis Safari) — gratuit, fonctionne déjà, aucune
contrainte Apple à gérer. Voir la section dédiée plus bas. Le dossier
`ios/` (projet Capacitor complet, fonctionnel) reste dans ce zip si vous
changez d'avis un jour ; il n'est simplement pas la voie active.

## Comment ça marche

L'app ne recopie **pas** votre HTML/CSS/JS dans le binaire. Elle ouvre une
webview native qui charge directement
`https://gestion.americanfullfightingbons.fr` (voir `server.url` dans
`capacitor.config.ts`). Donc : mêmes cookies de session, même origine → le
CORS `TRUSTED_ORIGINS` de `src/index.ts` n'a **pas besoin d'être modifié**,
et toute mise à jour de votre site (déployée comme d'habitude via
`wrangler deploy`) apparaît immédiatement dans l'app.

Seule subtilité gérée à part : dans une webview native, les boutons
« Exporter CSV/PDF/JSON » (qui font `<a download>` sur un blob) ne
déclenchent pas de téléchargement comme dans un navigateur. Un script est
injecté côté natif (`MainActivity.java`, détaillé dans
`native-notes/export-bridge.js`) pour rediriger ces exports vers le
partage natif du téléphone. **À tester en premier** après votre premier
APK.

## Mise en place (une seule fois)

### 1. Créer le dépôt GitHub

Un compte GitHub est gratuit. Créez un dépôt (je recommande **privé** —
vous avez largement assez de minutes gratuites pour ça, voir plus bas),
puis poussez ce dossier dedans :

```bash
cd affbc-mobile
git init
git add .
git commit -m "App mobile AFFBC Gestion"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/affbc-gestion-mobile.git
git push -u origin main
```

(`node_modules/` n'est pas poussé — normal, `.gitignore` l'exclut ; c'est
la CI qui fait `npm ci` à chaque build, comme pour votre projet Worker.)

À ce stade, l'onglet **Actions** du dépôt GitHub lance déjà une
compilation automatique — mais l'APK produit ne sera **pas signé** tant
que l'étape suivante n'est pas faite.

### 2. Créer votre clé de signature (une seule fois, à vie)

Cette clé prouve que c'est bien vous qui publiez les mises à jour de
l'app — **sans elle, impossible de mettre à jour l'app plus tard sans que
les téléphones désinstallent l'ancienne version d'abord**. À garder
précieusement (gestionnaire de mots de passe du club).

Sur votre ordinateur (nécessite juste Java, pas Android Studio — si
`keytool` n'est pas trouvé, un `sudo apt install default-jre` ou
équivalent suffit, quelques Mo à peine) :

```bash
keytool -genkeypair -v -keystore affbc-release.keystore \
  -alias affbc -keyalg RSA -keysize 2048 -validity 10000
```

Répondez aux questions (nom, organisation = club, ville, pays...), notez
le mot de passe du keystore et celui de la clé (souvent identiques, à vous
de voir).

*Vous préférez ne rien installer, même ça ? Dites-le moi, je peux
préparer un petit workflow GitHub Actions qui génère la clé à votre place
dans le cloud — à faire sur dépôt privé uniquement pour ne pas exposer la
clé.*

### 3. Ajouter la clé au dépôt GitHub (en Secrets, jamais en clair)

Dans le dépôt GitHub : **Settings → Secrets and variables → Actions → New
repository secret**, ajoutez ces 4 secrets :

| Nom | Valeur |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Résultat de `base64 -w0 affbc-release.keystore` (Linux/Mac ; sur Mac sans `-w0` : `base64 -i affbc-release.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | Le mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | `affbc` (ou l'alias choisi à l'étape 2) |
| `ANDROID_KEY_PASSWORD` | Le mot de passe de la clé |

### 4. Lancer un build

Un `git push` suffit désormais à déclencher une compilation signée.
Vous pouvez aussi la lancer manuellement sans rien pousser : onglet
**Actions** → *Build Android APK* → **Run workflow**.

Après 3-5 minutes, récupérez l'APK de deux façons :
- Onglet **Actions** → le build → section *Artifacts* en bas de page ;
- Ou, plus simple à partager : onglet **Releases** (à droite de la page
  du dépôt) → chaque build y publie une Release avec l'APK en pièce
  jointe, lien direct à envoyer aux membres du bureau.

### 5. Installer l'APK sur un téléphone Android

Transférez le fichier `.apk` (mail, Drive, câble) et ouvrez-le sur le
téléphone. Android demande d'autoriser « Installer des applications
inconnues » pour l'app utilisée pour l'ouvrir (Fichiers, Gmail...) — à
accepter une fois.

## Pourquoi c'est gratuit

GitHub Actions est gratuit pour un dépôt privé jusqu'à 2000 minutes de
calcul par mois (et illimité si le dépôt est public). Un build Android
prend 3 à 5 minutes : même en compilant à chaque commit, vous êtes très
loin de la limite. Aucune carte bancaire à renseigner pour ce cas d'usage.

## iOS : utiliser la PWA (option retenue)

Sur iPhone, Safari → ouvrez `https://gestion.americanfullfightingbons.fr`
→ bouton Partager → **Sur l'écran d'accueil**. Ça crée une icône qui lance
l'app en plein écran, sans barre d'adresse.

Deux lignes à ajouter dans `public/index.html` (à côté de la ligne
`apple-touch-icon` déjà présente) rendraient cette expérience meilleure :
sans elles, l'icône ajoutée à l'écran d'accueil rouvre un onglet Safari
normal ; avec elles, l'app s'ouvre en plein écran comme une vraie app.

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

Ajout sûr et réversible (deux balises `<meta>`, aucun impact sur le reste
du site) — à déployer avec votre prochain `wrangler deploy` quand vous
voulez.

## Mettre à jour l'app plus tard

- **Contenu de gestion** (nouvel écran, nouvelle fonctionnalité) : rien à
  faire ici, ça se déploie comme avant avec `wrangler deploy`, visible
  immédiatement dans l'app.
- **La coque elle-même** (icône, nom, plugins natifs...) : modifiez les
  fichiers dans `android/` ou `capacitor.config.ts`, commit + push — la CI
  reconstruit et republie automatiquement.

## Rendu mobile : ce qui a été amélioré

Quatre ajustements pour que la coque se comporte comme une vraie app native
plutôt qu'un onglet de navigateur, sans toucher au site distant :

- **Barres système (Android 16)** : `targetSdkVersion` est à 36, et sur
  Android 16 l'edge-to-edge est désormais imposé par le système — les
  anciennes options `StatusBar.overlaysWebView` / `backgroundColor` n'ont
  plus aucun effet (limite du système, pas un bug de config). Sans
  correctif, le contenu du site passerait sous la barre de statut et la
  barre de navigation. Le plugin `@capawesome/capacitor-android-edge-to-edge-support`
  (voir `capacitor.config.ts`, bloc `EdgeToEdge`) restaure le comportement
  traditionnel en appliquant les marges de sécurité directement à la
  webview — rien à changer côté site.
- **Splash → contenu** : le splash se masque désormais quand la page a
  réellement fini de charger (`SplashScreen.hide()`, déclenché depuis
  `MainActivity.java`), plutôt qu'après un minuteur fixe de 800ms qui
  pouvait découvrir une page à moitié chargée sur une connexion lente.
- **Page hors-ligne** (`www/offline.html`) : si le chargement de
  `gestion.americanfullfightingbons.fr` échoue (pas de réseau, serveur
  injoignable), l'app affiche une page locale sobre avec un bouton
  "Réessayer", à la place de la page d'erreur brute de Chrome.
- **Bouton retour Android** : auparavant, un appui sur retour à l'écran
  d'accueil de l'app ne faisait rien (comportement par défaut, trompeur,
  du plugin `@capacitor/app`). Il navigue maintenant dans l'historique de
  la webview entre les modules, et met l'app en arrière-plan (pas
  `finish()`, pour garder la session) une fois à la racine.

**À tester en priorité sur le premier APK reconstruit avec ces
changements** (comme pour le pont d'export, ça n'a pas pu être vérifié sur
un appareil réel faute d'environnement de test ici) : barres système sur
un téléphone Android 15/16, écran hors-ligne en coupant le réseau, et
bouton retour à la racine puis dans un module.

La mise en page interne des écrans (espacement, taille des zones
tactiles, tableaux) dépend du CSS du site `gestion.americanfullfightingbons.fr`
lui-même, pas de cette coque — un chantier séparé, côté Worker.

## Limites connues

- Pas de notifications push pour l'instant (possible plus tard, demande
  un peu de backend en plus côté Worker).
- Pas de mode hors-ligne : comme l'app charge le site en direct, pas de
  réseau = pas d'accès (comme sur le site web aujourd'hui).
- Le pont d'export a été écrit et vérifié ligne à ligne contre le code
  source réel de Capacitor, mais pas exécuté sur un appareil réel faute
  d'environnement de test ici — à essayer en priorité après le premier
  APK signé.
