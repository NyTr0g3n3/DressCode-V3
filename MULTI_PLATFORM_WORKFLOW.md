# Workflow Multi-Plateforme DressCode

## Vue d'ensemble

Votre projet DressCode maintient maintenant **2 versions à partir d'une seule codebase** :
- ✅ Application Web (Firebase Hosting)
- ✅ Application iOS (App Store)

## 🎯 Principe de fonctionnement

### Code Source Unique
```
src/
├── components/     # Partagé entre web et iOS
├── services/       # Partagé entre web et iOS
├── utils/
│   ├── haptics.ts          # Détecte la plateforme automatiquement
│   └── capacitorCamera.ts  # Détecte la plateforme automatiquement
```

### Détection Automatique de Plateforme

Les modules utilisent la détection automatique :

```typescript
// Dans haptics.ts
const isNative = Capacitor.isNativePlatform();
if (isNative) {
  // Utilise API native iOS
} else {
  // Utilise API web
}

// Dans MobileFAB.tsx
if (isNativeApp()) {
  // Utilise Camera native iOS
} else {
  // Utilise input file HTML
}
```

**Résultat** : Le même code s'adapte automatiquement !

## 🌐 Développement Web

### Développement local
```bash
npm run dev
# → http://localhost:5173
# → Tous les changements sont en hot-reload
# → Utilise les APIs web standard
```

### Build production web
```bash
npm run build
# → Génère dist/ avec le bundle optimisé
```

### Déploiement web (Firebase)
```bash
firebase deploy
# → Déploie sur dresscode-v3.web.app
# → Accessible depuis n'importe quel navigateur
```

**La version web fonctionne toujours normalement !**

## 📱 Développement iOS

### Option 1 : Workflow complet (après chaque modification)
```bash
# 1. Modifier le code dans src/
# 2. Build + sync + open Xcode
npm run ios:run
```

### Option 2 : Workflow optimisé (développement actif iOS)

**Première fois :**
```bash
# 1. Lancer le serveur de dev
npm run dev
# → Serveur sur http://localhost:5173

# 2. Modifier capacitor.config.ts temporairement :
```

```typescript
const config: CapacitorConfig = {
  appId: 'com.dresscode.app',
  appName: 'DressCode',
  webDir: 'dist',
  server: {
    url: 'http://localhost:5173',  // Pointer vers le serveur local
    cleartext: true                 // Autoriser HTTP en dev
  },
  // ... reste de la config
};
```

```bash
# 3. Sync et ouvrir
npm run ios:sync
npm run ios:open

# 4. L'app iOS se connecte maintenant au serveur local
# → Hot reload automatique ! Les changements apparaissent instantanément
```

**⚠️ Important** : Avant le build de production iOS, retirer la section `server.url` !

### Build production iOS
```bash
# 1. Retirer server.url de capacitor.config.ts
# 2. Build final
npm run ios:build

# 3. Dans Xcode : Archive → Distribute → App Store
```

## 🔀 Cas d'usage pratiques

### Cas 1 : Corriger un bug dans le code

```bash
# 1. Identifier le bug (web ou iOS ou les deux)
# 2. Corriger dans src/
# 3. Tester web :
npm run dev
# → Ouvrir http://localhost:5173

# 4. Tester iOS :
npm run ios:run
# → Test dans le simulateur

# 5. Si OK, déployer :
npm run build && firebase deploy        # Pour le web
npm run ios:build && ouvrir Xcode       # Pour iOS
```

### Cas 2 : Ajouter une nouvelle fonctionnalité

```bash
# 1. Développer la feature dans src/
npm run dev  # Test web en temps réel

# 2. Si besoin d'une API native (ex: partage), ajouter le plugin
npm install @capacitor/share --legacy-peer-deps

# 3. Dans le code, détecter la plateforme :
if (Capacitor.isNativePlatform()) {
  // Utiliser API native
} else {
  // Fallback web
}

# 4. Tester iOS
npm run ios:run

# 5. Déployer les deux versions
```

### Cas 3 : Déployer une mise à jour

```bash
# Web (instantané)
npm run build
firebase deploy
# → Les utilisateurs web ont la MAJ immédiatement

# iOS (processus App Store)
npm run ios:build
# → Ouvrir Xcode
# → Archive → Upload App Store
# → Review Apple (1-3 jours)
# → Les utilisateurs iOS reçoivent la MAJ
```

## 📊 Comparaison des versions

| Fonctionnalité | Web | iOS |
|----------------|-----|-----|
| **Upload photos** | Input file HTML | Camera native iOS |
| **Retour haptique** | Vibration API | Haptics natif iOS |
| **Installation** | Non (PWA possible) | Oui (App Store) |
| **Mise à jour** | Instantanée | Via App Store |
| **Distribution** | URL | TestFlight / App Store |
| **Notifications** | Web Push | Push natif (avec config) |
| **Offline** | Service Worker | Natif (meilleur) |
| **Performance** | Bonne | Excellente |

## 🎯 Workflow recommandé

### Pour le développement quotidien

1. **Développer sur web** (plus rapide)
   ```bash
   npm run dev
   ```

2. **Tester régulièrement sur iOS** (une fois par jour/semaine)
   ```bash
   npm run ios:run
   ```

3. **Déployer web fréquemment** (chaque feature)
   ```bash
   npm run build && firebase deploy
   ```

4. **Déployer iOS moins souvent** (versions majeures)
   ```bash
   npm run ios:build
   # → Submit via Xcode
   ```

### Pour une release majeure

```bash
# 1. Finaliser le code
git commit -m "Release v1.2.0"

# 2. Déployer web
npm run build
firebase deploy

# 3. Build iOS
npm run ios:build
# → Dans Xcode, incrémenter version (CFBundleShortVersionString)
# → Archive → Upload

# 4. Créer release notes
# 5. Attendre validation Apple (web déjà live)
```

## 🔧 Maintenance

### Mettre à jour les dépendances

```bash
# Capacitor
npm update @capacitor/core @capacitor/ios @capacitor/camera

# Après update, sync iOS
npm run ios:sync
```

### Nettoyer le projet

```bash
# Nettoyer le build web
rm -rf dist/

# Nettoyer le cache iOS (si problème)
rm -rf ios/App/App/public/
npm run ios:sync
```

## 📝 Checklist avant déploiement

### Web
- [ ] `npm run build` réussit
- [ ] Tester dans plusieurs navigateurs
- [ ] Vérifier Firebase Hosting config
- [ ] `firebase deploy`

### iOS
- [ ] `npm run ios:build` réussit
- [ ] Tester sur simulateur
- [ ] Tester sur device réel (recommandé)
- [ ] Incrémenter version dans Xcode
- [ ] Vérifier permissions Info.plist
- [ ] Archive → Upload → Submit Review

## 💡 Astuces

1. **Icône différente en dev** : Utilisez des assets différents pour distinguer dev/prod iOS
2. **Variables d'environnement** : Utilisez `.env` pour différencier web/iOS si nécessaire
3. **Analytics** : Trackez séparément web vs iOS pour comprendre l'usage
4. **Logs** : `console.log` fonctionne dans Xcode pour debug iOS

## ❓ FAQ

**Q: Si je modifie le code, je dois redéployer les deux ?**
A: Non ! Les modifications web sont déployées indépendamment. iOS nécessite un build séparé.

**Q: Puis-je avoir des features différentes sur web vs iOS ?**
A: Oui ! Utilisez `Capacitor.isNativePlatform()` pour conditionner le code.

**Q: La version web utilise-t-elle Capacitor ?**
A: Non. Sur le web, Capacitor n'est pas chargé. Le code utilise les APIs web standard.

**Q: Dois-je payer Apple pour la version web ?**
A: Non ! La version web est gratuite. Seule la publication iOS nécessite 99$/an.

**Q: Puis-je tester l'app iOS sans Mac ?**
A: Non. Xcode nécessite macOS. Mais la version web fonctionne sur tous les OS !

---

**En résumé** : Vous avez maintenant le meilleur des deux mondes ! Une seule codebase, deux plateformes. La version web reste votre vitrine accessible à tous, et l'app iOS offre une expérience premium pour les utilisateurs Apple. 🚀
