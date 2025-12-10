# 📱 Guide de Conversion iOS - DressCode

Votre application web DressCode a été convertie avec succès en application iOS native ! 🎉

## ✅ Ce qui a été fait

1. **Installation de Capacitor** - Framework de conversion web-to-native
2. **Configuration iOS** - Projet Xcode créé avec toutes les dépendances
3. **Intégration Caméra Native** - Utilisation de l'API Camera iOS au lieu de l'input file HTML
4. **Retour Haptique Natif** - Vibrations optimisées pour iOS
5. **Safe Areas** - Support du notch iPhone et des zones sûres
6. **Permissions** - Configuration des permissions caméra et photos
7. **Scripts NPM** - Commandes pour faciliter le développement

## 🚀 Comment tester l'application iOS

### Prérequis

- **macOS** (requis pour développer sur iOS)
- **Xcode 14+** installé depuis l'App Store
- **Compte développeur Apple** (gratuit pour tester sur simulateur, payant pour déployer sur device réel)

### Étapes

1. **Ouvrir le projet dans Xcode**
   ```bash
   npm run ios:open
   ```

   Ou manuellement : ouvrez `ios/App/App.xcworkspace` dans Xcode

2. **Sélectionner un simulateur**
   - Dans Xcode, cliquez sur le menu déroulant en haut à gauche
   - Choisissez un iPhone (ex: iPhone 15 Pro)

3. **Lancer l'application**
   - Cliquez sur le bouton Play ▶️ dans Xcode
   - L'application se lance dans le simulateur

## 📝 Scripts disponibles

```bash
# Développement
npm run dev                 # Lance le serveur de dev web

# iOS
npm run ios:build          # Build web + sync avec iOS
npm run ios:sync           # Synchronise les changements avec iOS
npm run ios:open           # Ouvre Xcode
npm run ios:run            # Build + Sync + Open Xcode

# Assets (Icônes & Splash Screens)
npm run assets:generate    # Génère les icônes iOS (nécessite resources/icon.png)
```

## 🎨 Personnaliser les icônes et splash screens

1. Créez une icône `resources/icon.png` (1024x1024 px minimum)
2. Créez un splash screen `resources/splash.png` (2732x2732 px minimum)
3. Exécutez : `npm run assets:generate`

Les icônes seront automatiquement générées dans toutes les tailles requises pour iOS.

## 🔄 Workflow de développement

### Après avoir modifié le code web

```bash
# 1. Build l'application web
npm run build

# 2. Synchroniser avec iOS
npm run ios:sync

# 3. Relancer dans Xcode (ou hot reload si déjà lancé)
```

### Développement en temps réel

Pour un développement plus rapide, vous pouvez :

1. Lancer le serveur de dev : `npm run dev`
2. Modifier `capacitor.config.ts` pour pointer vers votre serveur local :
   ```typescript
   server: {
     url: 'http://localhost:5173',
     cleartext: true
   }
   ```
3. Relancer l'app dans Xcode

## 📦 Fonctionnalités natives ajoutées

### Caméra Native
- Le FAB mobile utilise maintenant la caméra native iOS
- Meilleure performance et UX
- Support du mode portrait/paysage

### Retour Haptique
- Vibrations optimisées pour iOS
- Différents types : léger, moyen, succès, erreur
- Améliore l'expérience utilisateur

### Safe Areas
- Support complet du notch iPhone
- Zones sûres respectées pour tous les éléments UI
- Compatible avec tous les modèles d'iPhone

## 🚢 Déploiement sur l'App Store

### 1. Configuration du projet

Dans Xcode :
- Sélectionnez le projet "App" dans le navigateur
- Onglet "Signing & Capabilities"
- Sélectionnez votre équipe (nécessite un compte développeur Apple)
- Xcode générera automatiquement un provisioning profile

### 2. Préparer pour production

```bash
# 1. Mettre à jour la version
# Dans ios/App/App.xcodeproj, incrémenter CFBundleShortVersionString

# 2. Build en mode Release
npm run build

# 3. Sync avec iOS
npm run ios:sync
```

### 3. Archive et Upload

Dans Xcode :
1. Menu : Product > Archive
2. Une fois l'archive créée, cliquez sur "Distribute App"
3. Suivez les étapes pour uploader sur App Store Connect

## 🐛 Dépannage

### L'app ne se lance pas dans Xcode
- Vérifiez que vous ouvrez bien le fichier `.xcworkspace` et non `.xcodeproj`
- Nettoyez le build : Product > Clean Build Folder

### Les permissions caméra ne fonctionnent pas
- Vérifiez que `Info.plist` contient bien les clés NSCameraUsageDescription et NSPhotoLibraryUsageDescription
- Réinstallez l'app dans le simulateur

### Erreur "No provisioning profile"
- Dans Xcode, sélectionnez votre équipe dans "Signing & Capabilities"
- Si vous n'avez pas de compte développeur, utilisez un compte Apple gratuit

### L'app affiche une page blanche
- Vérifiez que `npm run build` s'est bien exécuté
- Vérifiez que le dossier `dist` existe et contient les fichiers
- Relancez `npm run ios:sync`

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation iOS](https://capacitorjs.com/docs/ios)
- [API Camera](https://capacitorjs.com/docs/apis/camera)
- [Guide App Store](https://developer.apple.com/app-store/submissions/)

## 🎯 Prochaines étapes

- [ ] Créer des icônes personnalisées
- [ ] Tester sur un device iOS réel
- [ ] Configurer Firebase pour iOS (si nécessaire)
- [ ] Optimiser les performances
- [ ] Préparer les captures d'écran pour l'App Store
- [ ] Configurer les métadonnées App Store Connect

Bonne chance avec votre application iOS ! 🚀
