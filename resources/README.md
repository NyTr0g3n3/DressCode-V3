# DressCode iOS Icons & Splash Screens

Pour générer les icônes et splash screens iOS, vous devez :

1. Créer une icône `icon.png` (1024x1024 px minimum) dans ce dossier
2. Créer un splash screen `splash.png` (2732x2732 px minimum) dans ce dossier

Ensuite, exécutez :

```bash
npx @capacitor/assets generate --iconBackgroundColor '#D4AF37' --splashBackgroundColor '#1A1A1A'
```

Cela générera automatiquement toutes les tailles d'icônes et splash screens nécessaires pour iOS.

## Icône recommandée

L'icône doit :
- Être au format PNG
- Avoir une résolution minimale de 1024x1024 px
- Utiliser les couleurs de DressCode : Or (#D4AF37) et Noir (#1A1A1A)
- Être simple et reconnaissable à petite taille

## Splash Screen recommandé

Le splash screen doit :
- Être au format PNG
- Avoir une résolution de 2732x2732 px
- Utiliser le fond noir (#1A1A1A) de l'application
- Contenir le logo DressCode centré
