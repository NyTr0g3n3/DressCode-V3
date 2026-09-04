// Règles de style partagées entre la génération de tenues (generateOutfits)
// et la génération de variantes (generateOutfitVariants). Ces blocs étaient
// dupliqués mot pour mot dans geminiService.ts — les centraliser ici évite
// que les deux copies divergent silencieusement quand une règle est ajustée.

export const STYLE_RULES = `🔴 PRIORITÉ 1 - TEMPÉRATURE (RÈGLE ABSOLUE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyse la météo dans le contexte et applique :

| Température | Règle stricte |
|-------------|---------------|
| **< 15°C** | Layering OBLIGATOIRE : Base (t-shirt/chemise/robe) + Pull/Sweat + Manteau |
| **15-20°C** | Pull, sweat, ou veste légère suffisent |
| **20-25°C** | 1 seule couche (t-shirt OU chemise légère) |
| **> 25°C** | Vêtements TRÈS légers uniquement. INTERDITS : jeans épais, pulls, vestes |

⚠️ **INTERDICTIONS THERMIQUES** :
- Doudoune/manteau si > 15°C
- Short si < 24°C
- Mini-jupe/jupe courte si < 24°C — même couverture limitée qu'un short (une jupe longue/mi-longue n'est PAS concernée, elle se porte très bien avec des collants par temps froid)
- Lin (chemise, pantalon...) si < 24°C — matière trop fine/fraîche en dessous
- Pull laine si > 15°C
- Sandales si < 25°C

🔒 Ces règles thermiques sont NON NÉGOCIABLES et sont aussi vérifiées
automatiquement après ta réponse : toute tenue qui les enfreint sera
écartée avant d'être montrée à l'utilisateur. Respecte-les à la lettre.
Les règles de couleurs et de style plus bas dans ce document, en
revanche, sont des GUIDES de goût, pas des lois absolues — voir la note
à leur sujet.

📈 **ÉCART DE TEMPÉRATURE DANS LA JOURNÉE**
Si le contexte météo précise une température prévue plus élevée plus
tard dans la journée (ex : "12°C actuellement... jusqu'à 24°C prévus
aujourd'hui"), base les règles thermiques ci-dessus sur la température
ACTUELLE — c'est elle qui compte pour s'habiller maintenant. La
prévision du jour sert uniquement à ajuster la couche extérieure vers
une option modulable (veste légère, gilet) qu'on peut retirer
confortablement plutôt qu'un pull épais qu'on garderait tout l'après-midi.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 PRIORITÉ 2 - LAYERING (SUPERPOSITION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**RÈGLES DE SUPERPOSITION VALIDES** :

✅ **Pull col V** → TOUJOURS avec chemise dessous (sinon négligé)
✅ **Pull col zippé/camionneur** → TOUJOURS avec t-shirt ou chemise dessous
✅ **Pull col rond (classique)** → UNIQUEMENT avec t-shirt uni dessous, JAMAIS avec chemise
✅ **Sweat/Pull sportif** → UNIQUEMENT avec t-shirt, JAMAIS avec chemise
✅ **Veste/Blazer** → Sur t-shirt, chemise, pull fin, col roulé, ou robe
✅ **Manteau** → Sur pull, sweat, veste, ou robe (si très froid)
✅ **Col roulé** → JAMAIS avec chemise !
✅ **Robe** → Se suffit à elle-même (voir exception structure ci-dessous), une veste/un cardigan par-dessus reste bienvenu selon la météo — ne cherche PAS à lui ajouter un pull dessous

❌ **INTERDICTIONS ABSOLUES DE LAYERING** :
- JAMAIS chemise avec col roulé (aberration stylistique)
- JAMAIS chemise avec pull col rond/ras-du-cou (trop formel + trop casual = clash)
- JAMAIS chemise avec sweat ou pull sportif (incompatibilité de style totale)
- JAMAIS col V sans rien dessous en contexte formel
- JAMAIS pull épais sous veste ajustée (volume excessif)
- JAMAIS 2 cols montants ensemble (col roulé + col montant)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 PRIORITÉ 3 - COHÉRENCE & HARMONIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STRUCTURE** : Chaque tenue = Haut + Bas + Chaussures (minimum)
⚠️ **EXCEPTION ROBE** : une robe (Hauts, sous-catégorie "Robes") couvre déjà
haut ET bas à elle seule — Robe + Chaussures est une tenue COMPLÈTE, ne lui
ajoute PAS de pantalon/jupe par réflexe pour "compléter" la structure. Une
veste, un gilet ou un cardigan par-dessus reste bienvenu selon la météo.

**COHÉRENCE DE STYLE (CRUCIAL)** :
- ❌ JAMAIS mélanger sportif et formel (ex: sweat délavé + chemise = NON)
- ❌ JAMAIS associer streetwear et business (ex: jogger + chemise = NON)
- ✅ Style cohérent : tout casual OU tout formel OU smart-casual équilibré
- ✅ Chemise = TOUJOURS avec pièces au moins smart-casual (chino, jean brut, blazer)
- ✅ Pull sportif/sweat = TOUJOURS avec pièces casual (jean délavé, jogger, sneakers)

**COULEURS & HARMONIES** :

📌 **CE SONT DES GUIDES DE GOÛT, PAS DES LOIS** : contrairement aux règles
de température ci-dessus (non négociables, vérifiées automatiquement),
ce qui suit reflète des associations qui fonctionnent GÉNÉRALEMENT bien.
Si le bloc "STYLE PERSONNEL DE L'UTILISATEUR" plus haut montre qu'il/elle
porte régulièrement une association listée ci-dessous comme "à éviter",
privilégie SON style plutôt que la règle générique — un vrai styliste
s'adapte à la personne, il n'applique pas un tableau figé.

🎨 **RÈGLE FONDAMENTALE** : Une tenue = 1 couleur neutre dominante + 1-2 couleurs d'accent MAXIMUM (par défaut, sauf style personnel différent)

✅ **COULEURS NEUTRES SAFE (Base de toute tenue)** :
- Noir, Blanc, Gris (clair/moyen/foncé), Beige, Camel, Marine, Kaki
- Ces couleurs vont entre elles ET avec toutes les autres

🟢 **ASSOCIATIONS EXCELLENTES** (Utiliser prioritairement) :
- Noir + Blanc (classique intemporel)
- Marine + Blanc (élégant et frais)
- Marine + Beige/Camel (chic et raffiné)
- Gris + Blanc (sobre et moderne)
- Gris + Marine (professionnel)
- Noir/Gris/Blanc + n'importe quelle couleur vive (la couleur vive devient l'accent)
- Beige + Marron (tons terreux naturels)
- Kaki + Blanc/Beige (style casual naturel)
- Denim bleu + Blanc/Beige/Marron (combinaison casual parfaite)

🟡 **ASSOCIATIONS ACCEPTABLES** (OK mais prudence) :
- Bleu clair + Marine (OK si tons suffisamment différents)
- Marron + Marine (OK mais éviter si trop similaires en luminosité)
- Vert olive + Marine/Noir (style militaire, fonctionne)
- Bordeaux/Burgundy + Noir/Gris (élégant si bien dosé)

🔴 **ASSOCIATIONS À ÉVITER PAR DÉFAUT** (fautes de goût classiques, sauf si ça correspond au style personnel de l'utilisateur) :
- Noir + Marine (trop proches, confusion visuelle)
- Noir + Marron (incompatibilité classique du stylisme)
- Marine + Marron foncé (confusion des tons sombres)
- Bleu royal vif + Noir (contraste trop brutal)
- Plus de 1 couleur vive par tenue (surcharge visuelle)
- Denim bleu moyen + Pull/Veste bleu similaire (effet total-look raté)

📍 **RÈGLES CRITIQUES PAR PIÈCE** :

**CHAUSSURES avec BAS** (guide par défaut — à adapter si le style personnel de l'utilisateur montre une autre préférence) :
- ✅ Chaussures NOIRES : Excellent avec pantalon noir, gris foncé, jean noir/brut foncé, chino anthracite
- ⚠️ Chaussures NOIRES : ACCEPTABLE avec jean bleu foncé/brut (si jean très foncé)
- ⚠️ Chaussures NOIRES : à éviter par défaut avec jean bleu clair/moyen, chino beige clair (préférer marron/beige/blanc)
- ✅ Chaussures MARRON/BEIGES : Parfait avec jean bleu (toutes nuances), chino beige/kaki/camel, pantalon marron/terre
- ⚠️ Chaussures MARRON : à éviter par défaut avec pantalon noir (association jugée classiquement fautive, mais certains styles l'assument très bien)
- ✅ Chaussures BLANCHES/CLAIRES : Universal casual, vont avec tout sauf tenues très formelles
- ✅ Chaussures MARINES : Excellent avec jean bleu, chino beige, pantalon gris

**HAUTS avec BAS** :
- Jean BLEU : Privilégier hauts blancs, gris, noirs, beiges, couleurs vives. Éviter autres bleus de nuance similaire
- Pantalon NOIR : Toutes couleurs acceptées, c'est la base la plus versatile
- Pantalon BEIGE/CHINO : Excellents avec marine, blanc, bleu ciel, vert olive, bordeaux
- Pantalon GRIS : Très polyvalent, accepte presque toutes couleurs

🎯 **STRATÉGIE GAGNANTE** :
1. Choisir d'abord le BAS (pantalon) en couleur neutre
2. Assortir les CHAUSSURES selon les règles strictes ci-dessus
3. Choisir le HAUT dans une couleur compatible avec le bas
4. Si ajout veste/accessoire : rester dans les neutres OU reprendre une couleur déjà présente

**MOTIFS & PATTERNS** :
- Maximum 1 motif visible par tenue
- Si haut à motifs → bas UNI obligatoire
- Si bas à motifs → haut UNI obligatoire
- Rayures fines discrètes = considéré comme uni`;

export const ACCESSORY_RULES = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ ACCESSOIRES & SÉLECTION INTELLIGENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 **RÈGLE ABSOLUE : UN ACCESSOIRE-ANCRE PAR TENUE**
Si l'utilisateur possède des montres, bijoux, ou sacs dans sa garde-robe,
tu DOIS en inclure AU MOINS UN dans chaque tenue — ce n'est PAS optionnel
si disponible ! Un collier, une bague, un bracelet fin ou un sac sont des
choix tout aussi valables qu'une montre : ne la privilégie PAS par défaut
simplement parce qu'elle est listée en premier ci-dessous.

⚠️ **"Montres & Bijoux" est UNE SEULE sous-catégorie** dans la garde-robe
(montres ET bijoux y sont mélangés sans distinction de champ) : lis la
description de chaque article pour savoir s'il s'agit d'une montre
(→ applique les règles de sélection par type de bracelet ci-dessous) ou
d'un autre bijou — collier, bague, bracelet fin (→ applique "AUTRES
BIJOUX (hors montre)" plus bas ; les règles de bracelet de MONTRE,
pensées pour un cadran assorti aux chaussures, ne s'y appliquent pas).

⌚ **SÉLECTION INTELLIGENTE DES MONTRES** (CRUCIAL - Ne pas choisir au hasard !)

**RÈGLES PAR TYPE DE MONTRE** :

📱 **Montres connectées/sportives** (Apple Watch, Samsung Galaxy Watch, montres sport) :
- ✅ Parfaites avec : tenues casual, sportswear, streetwear, tenues décontractées weekend
- ✅ Look moderne et tech-friendly
- ⚠️ ÉVITER avec : tenues formelles (costume, chemise habillée), occasions élégantes
- Exemples : t-shirt + jean + sneakers, sweat + jogger, polo + chino casual

🎖️ **Montres classiques bracelet CUIR MARRON/CAMEL** :
- ✅ Parfaites avec : tenues smart-casual, chinos beiges/kaki, chaussures marron/beige
- ✅ Style élégant décontracté, chaleureux
- ❌ JAMAIS avec : chaussures noires (clash de tons chauds/froids)
- ⚠️ ÉVITER avec : tenues très sportives ou streetwear
- Exemples : chemise + chino beige + mocassins marron, pull + jean + boots marron

⚫ **Montres classiques bracelet CUIR NOIR** :
- ✅ Parfaites avec : tenues formelles, business, smart-casual élégant, chaussures noires
- ✅ Style sophistiqué et professionnel
- ❌ JAMAIS avec : chaussures marron (incompatibilité marron/noir)
- Exemples : chemise + pantalon noir + chaussures noires, look monochromatique noir/gris

🔗 **Montres bracelet MÉTAL/ACIER** :
- ✅ Très polyvalentes, fonctionnent avec presque tout
- ✅ Style moderne, épuré, urbain
- ✅ Compatibles avec : casual chic, smart-casual, même formel selon le modèle
- ✅ Vont avec toutes couleurs de chaussures
- Exemples : chemise + jean + baskets blanches, t-shirt + chino + sneakers

✨ **Montres DORÉES/Or** :
- ✅ Pour tenues élégantes, soirées, occasions spéciales
- ⚠️ Style statement, à utiliser avec intention
- ✅ Fonctionnent bien avec : tons chauds (beige, camel, marron), blanc, noir
- ⚠️ ÉVITER avec : tenues très casual/sportives (effet too much)

🎨 **Montres à bracelet COULEUR/TISSU** (NATO, toile, silicone coloré) :
- ✅ Casual et fun, parfaites pour tenues décontractées
- ✅ Adapter la couleur du bracelet aux couleurs de la tenue
- ⚠️ ÉVITER avec : tenues formelles ou élégantes

🎯 **STRATÉGIE DE SÉLECTION** :
1. Identifier le niveau de formalité de la tenue (sportif → casual → smart-casual → formel)
2. Regarder la couleur des chaussures (noir → montre cuir noir ou acier, marron → montre cuir marron ou acier)
3. Choisir la montre qui correspond au style ET aux couleurs de la tenue
4. En cas de doute : montre acier = safe choice polyvalente

⚠️ **ERREURS À ÉVITER** :
- ❌ Montre connectée sportive avec costume/tenue formelle
- ❌ Montre cuir marron avec chaussures noires
- ❌ Montre cuir noir avec chaussures marron
- ❌ Montre dorée élégante avec sweat + jogger
- ❌ Choisir toujours la même montre pour les 3 tenues (sauf si une seule disponible)

💍 **AUTRES BIJOUX (hors montre)** — collier, bague, bracelet fin, boucles d'oreilles :
- **Or/doré** : Tons chauds (beige, camel, marron), blanc, noir — statement, à utiliser avec intention comme une montre dorée
- **Argent/acier** : Très polyvalent, va avec presque tout — safe choice équivalente à une montre acier
- ⚠️ ÉVITER de mélanger or et argent dans la même tenue (règle classique — sauf si le style personnel de l'utilisateur montre qu'il/elle l'assume, cf. note sur les guides de goût)
- Un collier ou des boucles d'oreilles fonctionnent aussi bien qu'une montre comme accessoire-ancre d'une tenue élégante ou construite autour d'une robe

🔄 **VARIÉTÉ DES ACCESSOIRES-ANCRES** :
Si l'utilisateur possède plusieurs montres/bijoux/sacs, VARIE-les entre les 3 tenues selon les styles — pas systématiquement la même pièce, ni systématiquement une montre s'il y a des bijoux ou sacs disponibles !

📿 **AUTRES ACCESSOIRES** :

**Bracelets** :
- Peuvent être LE bijou-ancre de la tenue (voir plus haut), ou ajoutés EN PLUS d'une montre déjà choisie (au poignet opposé) pour un effet superposé — dans ce dernier cas, style casual/décontracté uniquement, à éviter avec les tenues très formelles

**Sac** :
- Accessoire-ancre à part entière, au même titre qu'une montre ou un bijou — pas juste un détail pratique
- Coordonner sa couleur avec les chaussures ou la ceinture (même famille de couleur, ou contraste neutre volontaire)
- Format adapté à l'occasion : sac structuré pour smart-casual/formel, sac bandoulière/tote pour casual

**Ceinture** :
- OBLIGATOIRE avec pantalons classiques à passants (chino, pantalon habillé)
- Coordonner avec les chaussures : chaussures marron → ceinture marron, chaussures noires → ceinture noire
- PAS nécessaire avec jeans à taille élastique ou joggers

**Écharpe** :
- Si température < 10°C
- Coordonner avec la palette de couleurs de la tenue

**Casquette/Chapeau** :
- Selon le style et l'occasion
- Casual/streetwear : casquette snapback, dad cap
- Élégant : chapeau feutre, panama (selon saison)
`;
