// Règles de style partagées entre la génération de tenues (generateOutfits)
// et la génération de variantes (generateOutfitVariants). Ces blocs étaient
// dupliqués mot pour mot dans geminiService.ts — les centraliser ici évite
// que les deux copies divergent silencieusement quand une règle est ajustée.

export const STYLE_RULES = `🔴 PRIORITÉ 1 - TEMPÉRATURE (RÈGLE ABSOLUE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyse la météo dans le contexte et applique :

| Température | Règle stricte |
|-------------|---------------|
| **< 15°C** | Layering OBLIGATOIRE : Base (t-shirt/chemise) + Pull/Sweat + Manteau |
| **15-20°C** | Pull, sweat, ou veste légère suffisent |
| **20-25°C** | 1 seule couche (t-shirt OU chemise légère) |
| **> 25°C** | Vêtements TRÈS légers uniquement. INTERDITS : jeans épais, pulls, vestes |

⚠️ **INTERDICTIONS THERMIQUES** :
- Doudoune/manteau si > 15°C
- Short si < 22°C
- Pull laine si > 15°C
- Sandales si < 25°C

🔒 Ces règles thermiques sont NON NÉGOCIABLES et sont aussi vérifiées
automatiquement après ta réponse : toute tenue qui les enfreint sera
écartée avant d'être montrée à l'utilisateur. Respecte-les à la lettre.
Les règles de couleurs et de style plus bas dans ce document, en
revanche, sont des GUIDES de goût, pas des lois absolues — voir la note
à leur sujet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 PRIORITÉ 2 - LAYERING (SUPERPOSITION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**RÈGLES DE SUPERPOSITION VALIDES** :

✅ **Pull col V** → TOUJOURS avec chemise dessous (sinon négligé)
✅ **Pull col zippé/camionneur** → TOUJOURS avec t-shirt ou chemise dessous
✅ **Pull col rond (classique)** → UNIQUEMENT avec t-shirt uni dessous, JAMAIS avec chemise
✅ **Sweat/Pull sportif** → UNIQUEMENT avec t-shirt, JAMAIS avec chemise
✅ **Veste/Blazer** → Sur t-shirt, chemise, pull fin, ou col roulé
✅ **Manteau** → Sur pull, sweat, ou veste (si très froid)
✅ **Col roulé** → JAMAIS avec chemise !

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

🔴 **RÈGLE ABSOLUE : UNE MONTRE PAR TENUE**
Si l'utilisateur possède des montres dans sa garde-robe, tu DOIS en inclure UNE dans chaque tenue.
La montre n'est PAS optionnelle si disponible !

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

🔄 **VARIÉTÉ DES MONTRES** :
Si l'utilisateur possède plusieurs montres, VARIE les montres entre les 3 tenues selon les styles !

📿 **AUTRES ACCESSOIRES** :

**Bracelets** :
- Peuvent être ajoutés EN PLUS de la montre (au poignet opposé)
- Style casual/décontracté uniquement
- Éviter avec tenues très formelles

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
