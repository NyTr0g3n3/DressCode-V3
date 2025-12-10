# 🏗️ Compiler DressCode pour iOS sans Mac

## Le Problème

Xcode nécessite macOS. Sans Mac, vous ne pouvez pas compiler ou installer l'app iOS localement.

## Solutions

### ✅ Option 1 : Codemagic (Recommandé - Gratuit)

Codemagic est un service CI/CD qui compile votre app iOS dans le cloud.

**Avantages :**
- ✅ 500 minutes de build gratuites par mois
- ✅ Build automatique depuis GitHub
- ✅ Supporte Capacitor nativement
- ✅ Génère un .ipa installable
- ✅ Peut publier sur TestFlight automatiquement

#### Configuration

1. **Créer un compte**
   - Allez sur [codemagic.io](https://codemagic.io)
   - Connectez-vous avec GitHub

2. **Ajouter votre projet**
   - "Add application" → Sélectionnez votre repo DressCode-V3
   - Type : "Capacitor"

3. **Configurer le workflow**

   Créez `.codemagic.yaml` à la racine du projet :

   ```yaml
   workflows:
     ios-workflow:
       name: iOS Workflow
       max_build_duration: 60
       instance_type: mac_mini_m1
       environment:
         groups:
           - app_store_credentials
         vars:
           XCODE_WORKSPACE: "ios/App/App.xcworkspace"
           XCODE_SCHEME: "App"
         node: 18

       scripts:
         - name: Install npm dependencies
           script: |
             npm install --legacy-peer-deps

         - name: Build web app
           script: |
             npm run build

         - name: Sync Capacitor
           script: |
             npx cap sync ios

         - name: Install CocoaPods dependencies
           script: |
             cd ios/App && pod install

         - name: Build iOS app
           script: |
             xcode-project build-ipa \
               --workspace "$XCODE_WORKSPACE" \
               --scheme "$XCODE_SCHEME"

       artifacts:
         - build/ios/ipa/*.ipa
         - /tmp/xcodebuild_logs/*.log

       publishing:
         email:
           recipients:
             - votre-email@example.com
   ```

4. **Configurer les certificats (pour distribution)**

   Pour TestFlight/App Store, vous aurez besoin de :
   - Compte Apple Developer (99$/an)
   - Certificat de distribution
   - Provisioning profile

   Codemagic peut générer automatiquement ces certificats via "Automatic iOS code signing"

5. **Lancer le build**
   - Push sur GitHub
   - Codemagic détecte le push et lance le build
   - Après 10-15 minutes, vous recevez le fichier .ipa

6. **Installer le .ipa**
   - Avec TestFlight (si configuré)
   - Ou via des outils comme AltStore, Sideloadly

---

### Option 2 : GitHub Actions (Gratuit pour repos publics)

GitHub Actions permet aussi de compiler iOS dans le cloud.

#### Configuration

Créez `.github/workflows/ios-build.yml` :

```yaml
name: iOS Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: macos-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18

    - name: Install dependencies
      run: npm install --legacy-peer-deps

    - name: Build web app
      run: npm run build

    - name: Sync Capacitor
      run: npx cap sync ios

    - name: Install CocoaPods
      run: cd ios/App && pod install

    - name: Build iOS
      run: |
        xcodebuild -workspace ios/App/App.xcworkspace \
          -scheme App \
          -configuration Release \
          -archivePath build/App.xcarchive \
          archive

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: ios-build
        path: build/
```

**Limitation :** Pas de signature automatique, difficile d'installer sur iPhone.

---

### Option 3 : MacStadium / MacinCloud (Payant)

Louez un Mac virtuel accessible via VNC/RDP.

**Services :**
- [MacStadium](https://www.macstadium.com) - À partir de 69$/mois
- [MacinCloud](https://www.macincloud.com) - À partir de 30$/mois
- [AWS EC2 Mac](https://aws.amazon.com/ec2/instance-types/mac/) - À partir de 1.08$/heure

**Avantages :**
- ✅ Accès complet à macOS
- ✅ Peut utiliser Xcode normalement
- ✅ Installe sur iPhone via Xcode

**Inconvénients :**
- ❌ Coûteux
- ❌ Latence réseau
- ❌ Configuration technique

---

### Option 4 : Emprunter un Mac temporairement

**Où trouver un Mac :**
- Ami/collègue qui a un Mac
- Apple Store (ils ont parfois des Genius Bar avec Macs)
- Espace de coworking avec Macs
- Bibliothèque universitaire
- Cybercafé Mac

**Ce dont vous aurez besoin :**
- 1-2 heures sur le Mac
- Compte Apple (gratuit ou Developer 99$/an)
- Câble USB pour votre iPhone

**Processus :**
1. Cloner votre repo sur le Mac
2. Installer Xcode (environ 30 min)
3. Ouvrir le projet : `npm run ios:open`
4. Configurer le signing
5. Brancher votre iPhone
6. Build & Install

Une fois installée, l'app reste 7 jours (compte gratuit) ou indéfiniment (avec Developer account).

---

### Option 5 : Commencer avec Android

Capacitor supporte aussi Android, qui peut être développé sur **n'importe quel OS** (Windows, macOS, Linux).

```bash
# Ajouter la plateforme Android
npm install @capacitor/android --legacy-peer-deps
npx cap add android

# Ouvrir dans Android Studio
npx cap open android
```

**Avantages :**
- ✅ Fonctionne sur Windows/Linux/Mac
- ✅ Émulateur Android gratuit
- ✅ Pas de compte développeur requis (25$ unique pour Google Play)
- ✅ Processus plus simple

**Android Studio** est disponible gratuitement sur tous les OS.

---

## 🎯 Ma Recommandation

### Immédiat (sans Mac)

1. **Utilisez Codemagic** pour compiler dans le cloud
   - Gratuit pour commencer
   - Build automatique
   - Peut publier sur TestFlight

2. **OU développez la version Android**
   - Plus accessible sans Mac
   - Même codebase que iOS
   - Google Play plus simple que App Store

### À moyen terme

- **Investir dans un Mac Mini** (à partir de 699€)
  - Mac Mini M2 : parfait pour dev iOS
  - Accès permanent à Xcode
  - Peut aussi servir de serveur de build

---

## 📋 Comparaison des options

| Option | Coût | Difficulté | Accès iPhone | Idéal pour |
|--------|------|------------|--------------|------------|
| **Codemagic** | Gratuit (limité) | Moyen | Via TestFlight | CI/CD, builds automatiques |
| **GitHub Actions** | Gratuit | Difficile | Non | Open source, CI |
| **MacStadium** | 69$/mois | Facile | Oui (VNC) | Usage régulier |
| **Mac emprunté** | Gratuit | Facile | Oui | Test ponctuel |
| **Android first** | Gratuit | Facile | N/A | Alternative viable |
| **Mac Mini M2** | 699€ | Facile | Oui | Long terme |

---

## 🚀 Plan d'action recommandé

### Phase 1 : Test sans investissement
1. Configurer Codemagic pour compiler iOS dans le cloud
2. Publier sur TestFlight pour tester sur votre iPhone
3. OU développer d'abord la version Android (plus accessible)

### Phase 2 : Si l'app a du succès
1. Acheter un Mac Mini d'occasion (~400€) ou neuf (699€)
2. Développer confortablement en local
3. Publier sur App Store et Google Play

---

## 🛠️ Setup Codemagic (Pas à pas)

Comme c'est la solution la plus accessible, voici le guide détaillé :

1. **S'inscrire sur Codemagic**
   ```
   https://codemagic.io/signup
   → Connectez avec GitHub
   ```

2. **Ajouter votre repository**
   - "Add application"
   - Sélectionnez "GitHub"
   - Trouvez "DressCode-V3"
   - Type: "Capacitor"

3. **Configuration automatique**
   - Codemagic détecte automatiquement :
     * package.json
     * capacitor.config.ts
     * ios/

4. **Build de test**
   - Cliquez sur "Start new build"
   - Branch: votre branche
   - Attendez 10-15 minutes

5. **Récupérer le build**
   - Une fois terminé, téléchargez le .ipa
   - Installez via TestFlight (si configuré)

---

## 💰 Coûts récapitulatifs

| Élément | Coût | Obligatoire ? |
|---------|------|---------------|
| Compilation via Codemagic | Gratuit (500 min/mois) | Non, mais pratique |
| Compte Apple Developer | 99$/an | Oui pour App Store/TestFlight |
| Mac virtuel (MacStadium) | 69$/mois | Non |
| Mac Mini M2 neuf | 699€ | Non |
| Android Studio | Gratuit | Oui pour Android |
| Google Play Developer | 25$ (une fois) | Oui pour Android |

---

## ❓ FAQ

**Q: Puis-je tester sur mon iPhone sans Mac ?**
R: Oui, via TestFlight après avoir compilé avec Codemagic + compte Developer (99$/an)

**Q: Combien coûte au minimum pour publier sur App Store ?**
R: 99$/an pour le compte Apple Developer

**Q: C'est plus simple de faire Android d'abord ?**
R: Oui ! Android peut se développer sur n'importe quel OS et Google Play est plus simple/moins cher

**Q: Codemagic est vraiment gratuit ?**
R: Oui, 500 minutes de build/mois gratuites (suffisant pour débuter)

**Q: Je dois acheter un Mac ?**
R: Non obligatoire, mais fortement recommandé si vous comptez développer sérieusement pour iOS

---

Besoin d'aide pour configurer Codemagic ou Android ? N'hésitez pas ! 🚀
