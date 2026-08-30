# DressCode — Dress Me Up!

Assistant garde-robe piloté par IA. Prends en photo tes vêtements, laisse l'IA
les analyser (catégorie, couleur, matière), puis génère des tenues sur-mesure
selon le contexte (météo, occasion, voyage), avec un chat styliste et un suivi
des tenues déjà portées pour éviter les répétitions.

## Stack technique

- **Frontend** : React 19 + TypeScript, Vite, Tailwind CSS (via CDN, config
  inline dans `index.html`), Framer Motion.
- **Backend** : Firebase (Auth, Firestore, Storage) + Cloud Functions
  (`functions/`) qui exposent les appels vers l'API Gemini (`@google/genai`)
  et Replicate — la clé API Gemini reste côté serveur et n'est jamais
  exposée au client.
- **Déploiement** : le frontend est publié sur GitHub Pages (domaine custom
  `dressmeup.be`, voir `CNAME`), les Cloud Functions sont déployées sur
  Firebase (projet `dresscode-ai-32c50`). Les deux se font via GitHub
  Actions, voir `.github/workflows/`.

## Structure du projet

```
src/
  components/     Composants React (galerie, générateur de tenues, modales…)
  contexts/       Contexte global de la garde-robe (WardrobeContext)
  services/       Appels Firebase / Cloud Functions (geminiService,
                  firestoreService, storageService)
  utils/          Utilitaires (classification des sous-catégories)
functions/
  src/index.ts    Cloud Functions (proxy sécurisé vers Gemini / Replicate)
```

## Lancer le projet en local

**Prérequis** : Node.js, un projet Firebase configuré (Auth + Firestore +
Storage + Functions activés).

1. Installer les dépendances :
   ```
   npm install
   ```
2. Créer un fichier `.env.local` à la racine avec la config de ton projet
   Firebase et les clés API tierces utilisées côté client :
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_OPENWEATHER_API_KEY=
   VITE_HUGGINGFACE_API_KEY=
   ```
3. Lancer le serveur de dev :
   ```
   npm run dev
   ```

### Vérifications

```
npm run lint       # ESLint
npm run typecheck  # TypeScript (tsc --noEmit)
npm run test       # Tests unitaires (Vitest) — validation d'IDs, classification
```

### Cloud Functions

La génération de tenues, l'analyse de vêtements et le chat styliste passent
par les Cloud Functions dans `functions/`. Pour les lancer en local :

```
cd functions
npm install
echo "GEMINI_API_KEY=xxx" > .env
echo "REPLICATE_API_TOKEN=xxx" >> .env
npm run serve   # émulateur Firebase Functions
```

## Déploiement

- **Frontend → GitHub Pages** : automatique sur push vers `main`
  (`.github/workflows/deploy.yml`), via les secrets GitHub du repo.
- **Functions → Firebase** : automatique sur push vers `main` touchant
  `functions/**` (`.github/workflows/firebase-deploy.yml`).
