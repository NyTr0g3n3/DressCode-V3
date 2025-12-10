# 📱 Comment installer DressCode sur votre iPhone

## Méthode 1 : Installation Directe via Xcode (Tests & Développement)

### Configuration initiale (à faire une seule fois)

1. **Connecter votre iPhone au Mac**
   - Utilisez un câble USB
   - Sur l'iPhone : Faire confiance à l'ordinateur si demandé

2. **Ouvrir le projet dans Xcode**
   ```bash
   npm run ios:open
   ```

3. **Configurer le Signing dans Xcode**

   a. Dans Xcode, sélectionnez le projet "App" dans le navigateur de gauche

   b. Sélectionnez la cible "App" sous TARGETS

   c. Allez dans l'onglet "Signing & Capabilities"

   d. Cochez "Automatically manage signing"

   e. Dans "Team" :
      - Si vous n'avez pas de compte développeur Apple :
        * Cliquez sur "Add Account..."
        * Connectez-vous avec votre Apple ID (gratuit)
        * Sélectionnez votre compte dans le menu Team

      - Si vous avez un compte développeur Apple (99$/an) :
        * Sélectionnez votre équipe

   f. Xcode va automatiquement créer un provisioning profile

4. **Sélectionner votre iPhone comme destination**
   - En haut à gauche de Xcode, cliquez sur le menu déroulant (à côté de "App")
   - Sélectionnez votre iPhone dans la liste des devices
   - Si votre iPhone n'apparaît pas, débranchez et rebranchez le câble

5. **Faire confiance au certificat (première fois uniquement)**
   - Cliquez sur le bouton Play ▶️ dans Xcode
   - L'app va essayer de s'installer mais échouera avec une erreur de confiance
   - Sur votre iPhone :
     * Allez dans Réglages → Général → Gestion des appareils
     * Vous verrez votre Apple ID ou profil développeur
     * Appuyez dessus → "Faire confiance à [votre compte]"

6. **Installer l'app**
   - Dans Xcode, cliquez à nouveau sur Play ▶️
   - L'app s'installe et se lance sur votre iPhone ! 🎉

### Mises à jour après modifications du code

Chaque fois que vous modifiez le code :

```bash
# 1. Build l'app web
npm run build

# 2. Sync avec iOS
npm run ios:sync

# 3. Dans Xcode, cliquez sur Play ▶️
```

L'app se met à jour automatiquement sur votre iPhone.

### ⚠️ Limitations du compte Apple gratuit

- **7 jours** : L'app expire après 7 jours, il faut la réinstaller
- **3 apps max** : Vous pouvez avoir 3 apps installées simultanément
- **Pas de distribution** : Vous seul pouvez l'installer sur votre iPhone

Pour lever ces limitations : inscrivez-vous au Apple Developer Program (99$/an)

---

## Méthode 2 : TestFlight (Bêta Testing)

TestFlight permet de distribuer l'app à des testeurs (jusqu'à 10 000) sans passer par l'App Store.

**Prérequis :**
- Compte Apple Developer (99$/an)
- App Store Connect configuré

### Étapes :

1. **Créer l'app dans App Store Connect**
   - Allez sur [App Store Connect](https://appstoreconnect.apple.com)
   - My Apps → ➕ → New App
   - Remplissez les informations :
     * Platform : iOS
     * Name : DressCode
     * Primary Language : French
     * Bundle ID : com.dresscode.app (sélectionnez celui créé par Xcode)
     * SKU : dresscode-ios (identifiant unique)

2. **Archiver l'app dans Xcode**
   ```bash
   # 1. Build production
   npm run ios:build

   # 2. Ouvrir Xcode
   npm run ios:open
   ```

   Dans Xcode :
   - Menu : Product → Scheme → Edit Scheme
   - Build Configuration : Release
   - Menu : Product → Archive
   - Attendre la fin de l'archive (quelques minutes)

3. **Uploader sur App Store Connect**
   - Quand l'archive est prête, la fenêtre Organizer s'ouvre
   - Sélectionnez l'archive → "Distribute App"
   - Choisissez "App Store Connect"
   - Cochez "Upload" → Next
   - Laissez les options par défaut → Upload
   - Attendre la fin de l'upload (5-15 minutes)

4. **Ajouter des testeurs dans TestFlight**
   - Dans App Store Connect → My Apps → DressCode
   - Onglet TestFlight
   - Attendez que le build apparaisse (jusqu'à 1 heure)
   - Une fois le build disponible :
     * Section "Internal Testing" ou "External Testing"
     * Ajoutez des testeurs par email
     * Les testeurs reçoivent un email avec un lien

5. **Installer via TestFlight**
   - Sur iPhone : Installer l'app TestFlight (App Store)
   - Cliquer sur le lien reçu par email
   - TestFlight s'ouvre → Installer DressCode
   - L'app est installée ! 🎉

### Avantages de TestFlight

- ✅ Pas d'expiration 7 jours (builds valables 90 jours)
- ✅ Distribution à plusieurs testeurs (jusqu'à 10 000)
- ✅ Pas besoin de câble USB
- ✅ Mises à jour OTA (Over The Air)
- ✅ Feedback intégré

---

## Méthode 3 : App Store (Production)

Pour distribuer l'app au grand public via l'App Store.

**Prérequis :**
- Compte Apple Developer (99$/an)
- App prête pour production
- Assets (icônes, captures d'écran)
- Métadonnées (description, mots-clés)

### Préparation

1. **Créer les assets requis**

   a. Icône de l'app (déjà configurée)
   ```bash
   # Si vous n'avez pas encore créé d'icône personnalisée :
   # 1. Placez icon.png (1024x1024) dans resources/
   npm run assets:generate
   ```

   b. Captures d'écran (obligatoires)
   - iPhone 6.7" (iPhone 15 Pro Max) : 1290 × 2796 pixels
   - iPhone 6.5" (iPhone 11 Pro Max) : 1242 × 2688 pixels
   - À créer dans le simulateur ou sur device réel

2. **Remplir les métadonnées dans App Store Connect**
   - Nom : DressCode
   - Sous-titre : Assistant IA pour votre garde-robe
   - Description : [Texte détaillé de l'app]
   - Mots-clés : garde-robe, vêtements, mode, IA, style
   - URL assistance : [Votre site web]
   - Catégorie : Lifestyle ou Shopping
   - Âge minimum : 4+
   - Prix : Gratuit

3. **Configurer App Privacy**
   - Dans App Store Connect → App Privacy
   - Déclarer les données collectées :
     * Photos (pour l'analyse de vêtements)
     * Localisation (pour la météo)
     * Données utilisateur Firebase

### Soumission

1. **Archiver et uploader** (même que TestFlight)
   ```bash
   npm run ios:build
   npm run ios:open
   # Product → Archive → Upload
   ```

2. **Créer la version dans App Store Connect**
   - My Apps → DressCode
   - Versions → iOS → ➕
   - Sélectionnez le build uploadé
   - Remplissez :
     * What's New in This Version (notes de version)
     * Build (sélectionnez le build uploadé)
     * Captures d'écran (glissez-déposez)

3. **Soumettre pour review**
   - Vérifiez que tout est rempli (✅ verts)
   - Bouton "Submit for Review"
   - Répondez aux questions :
     * Contient des cryptographie ? → Non (sauf si vous ajoutez HTTPS personnalisé)
     * Contient de la pub ? → Non (ou Oui selon votre app)
   - Soumettez

4. **Attendre la review Apple**
   - Délai : 1-3 jours en moyenne
   - Vous recevez un email à chaque étape :
     * "In Review" : Apple teste votre app
     * "Pending Developer Release" : Approuvé, prêt à publier
     * "Ready for Sale" : Live sur l'App Store ! 🎉

5. **Publier**
   - Si statut = "Pending Developer Release" :
     * Cliquez sur "Release This Version"
   - L'app apparaît sur l'App Store en quelques heures

### Après publication

- **Mises à jour** : Répétez le processus (archive → upload → review)
- **Statistiques** : Consultez les téléchargements dans App Store Connect
- **Reviews** : Répondez aux avis utilisateurs

---

## 🔄 Comparaison des méthodes

| Méthode | Compte requis | Coût | Installation | Expiration | Idéal pour |
|---------|---------------|------|--------------|------------|------------|
| **Xcode Direct** | Apple ID gratuit | Gratuit | Câble USB | 7 jours | Tests personnels |
| **TestFlight** | Developer (99$/an) | 99$/an | Lien email | 90 jours | Bêta testing |
| **App Store** | Developer (99$/an) | 99$/an | App Store | Permanente | Grand public |

---

## 💡 Recommandation

**Pour commencer :**
1. Utilisez **Xcode Direct** pour tester sur votre iPhone (gratuit)
2. Si l'app fonctionne bien, passez à **TestFlight** pour partager avec des proches
3. Quand vous êtes prêt, publiez sur l'**App Store**

---

## 🐛 Dépannage

### "Untrusted Developer" sur iPhone
→ Réglages → Général → Gestion des appareils → Faire confiance

### "Failed to code sign"
→ Vérifiez que vous avez sélectionné une Team dans Signing & Capabilities

### iPhone non détecté par Xcode
→ Débranchez, redémarrez l'iPhone, rebranchez, faites confiance à l'ordinateur

### "App installation failed"
→ Supprimez l'ancienne version de l'app de votre iPhone, réessayez

### Build expire après 7 jours
→ Normal avec compte gratuit. Réinstallez via Xcode ou passez à Developer Program

---

## 📚 Ressources

- [Documentation Xcode](https://developer.apple.com/xcode/)
- [Guide TestFlight](https://developer.apple.com/testflight/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect](https://appstoreconnect.apple.com/)

Bonne chance avec votre app iOS ! 🚀
