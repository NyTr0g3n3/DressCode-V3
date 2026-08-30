import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis, ChatMessage, ChatResponse, OutfitItem, OutfitWearHistory } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Les appels Gemini passent maintenant par des Cloud Functions sécurisées
// La clé API reste côté serveur et n'est jamais exposée au client

type AnalysisResult = Omit<ClothingItem, 'id' | 'imageSrc'>;

// Cloud Function pour l'analyse des vêtements
const analyzeClothingImagesFunction = httpsCallable(functions, 'analyzeClothingImages');

// --- ANALYSE DES VÊTEMENTS ---
export async function analyzeClothingImages(base64Images: string[]): Promise<AnalysisResult[]> {
  try {
    const result = await analyzeClothingImagesFunction({ base64Images });
    const data = result.data as { items: AnalysisResult[] };
    return data.items || [];
  } catch (error) {
    console.error("Erreur lors de l'analyse des vêtements:", error);
    throw new Error("Erreur lors de l'analyse des vêtements.", { cause: error });
  }
}

// Cloud Function pour la génération de tenues
const generateOutfitsFunctionCall = httpsCallable(functions, 'generateOutfitsFunction');

// Cloud Function pour la génération de variantes de tenues (remplacement d'une pièce)
const generateOutfitVariantsFunctionCall = httpsCallable(functions, 'generateOutfitsFunction');

// Cloud Function pour le chatbot styliste
const generateChatResponseFunctionCall = httpsCallable(functions, 'generateChatResponseFunction');

// --- GÉNÉRATION DE TENUES ---
export async function generateOutfits(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    context: string,
    anchorItemOrSet?: ClothingItem | ClothingSet,
    wornOutfits?: OutfitWearHistory[]
): Promise<OutfitSuggestion[]> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    // Filtrer les items exclus ET ceux qui sont dans des ensembles
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id) && !item.isExcluded);

    const individualItemsFormatted = individualItems.map(item =>
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Matière: ${item.material})`
    ).join('\n');
    const setsFormatted = sets.map(set => {
        const itemDetails = set.itemIds.map(id => {
            const item = clothingList.find(ci => ci.id === id);
            return item ? `${item.analysis} (Cat: ${item.category}, Matière: ${item.material})` : '';
        }).filter(Boolean).join(' + ');
        return `- ${set.name} [Contient: ${itemDetails}] (Ensemble, ID: ${set.id})`;
    }).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    // Extraire les hauts portés récemment (règle uniquement pour les Hauts)
    let recentlyWornInstruction = '';
    if (wornOutfits && wornOutfits.length > 0) {
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        // Extraire les IDs portés dans les 7 derniers jours
        const itemsWornLast7Days = new Set<string>();
        wornOutfits.forEach(outfit => {
            if (outfit.wornAt >= sevenDaysAgo) {
                outfit.itemIds.forEach(id => itemsWornLast7Days.add(id));
            }
        });

        // Identifier UNIQUEMENT les hauts (catégorie "Hauts") portés récemment
        const topsToAvoid: string[] = [];
        clothingList.forEach(item => {
            if (item.category === 'Hauts' && itemsWornLast7Days.has(item.id)) {
                topsToAvoid.push(`${item.analysis} (ID: ${item.id})`);
            }
        });

        if (topsToAvoid.length > 0) {
            recentlyWornInstruction = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 VARIÉTÉ DES HAUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **Hauts portés dans les 7 derniers jours** (si possible, privilégie d'autres options) :
${topsToAvoid.map(item => `- ${item}`).join('\n')}

⚠️ **NOTE IMPORTANTE** :
- Essaie de varier les hauts pour éviter la monotonie
- MAIS cette règle est flexible : si aucune autre option ne convient au style/météo/occasion, tu peux utiliser un de ces hauts
- **PRIORITÉ ABSOLUE** : Cohérence stylistique + Respect des règles thermiques > Variété des hauts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        }
    }

    const anchorInstruction = anchorItemOrSet
        ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴🔴 PRIORITÉ 0 - ARTICLE OBLIGATOIRE (RÈGLE ABSOLUE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **CONTRAINTE NON NÉGOCIABLE** :
CHACUNE DES 3 TENUES DOIT ABSOLUMENT INCLURE :
✅ "${('name' in anchorItemOrSet ? anchorItemOrSet.name : anchorItemOrSet.analysis)}" (ID: ${anchorItemOrSet.id})

Cette pièce doit apparaître dans TOUTES les tenues générées sans exception.
Si une tenue n'inclut pas cet article, elle est INVALIDE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
        : '';

    const prompt = `Tu es un styliste expert. Crée 3 tenues complètes et harmonieuses pour : "${context}".
${anchorInstruction}${recentlyWornInstruction}
Vêtements disponibles :
${availableClothes}

⚠️ **NOTE IMPORTANTE SUR LES ENSEMBLES** :
Les articles marqués "(Ensemble)" avec "[Contient: ...]" sont des tenues pré-composées dont les pièces doivent être utilisées ENSEMBLE (jamais séparément).
Avant de sélectionner un ensemble, vérifie que TOUTES ses pièces respectent les règles de température. Si un ensemble contient un short et qu'il fait < 22°C, cet ensemble est INTERDIT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 INSTRUCTION CRITIQUE : EXPLORATION DE LA GARDE-ROBE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **RÈGLE FONDAMENTALE** :
L'utilisateur possède une garde-robe COMPLÈTE avec de nombreuses pièces différentes.
Tu DOIS explorer et utiliser la DIVERSITÉ de sa garde-robe, pas toujours les mêmes basiques !

❌ **ERREUR À ÉVITER** :
Ne te limite PAS aux pièces "safe" évidentes (t-shirt blanc, chemise blanche, jean bleu basique).
L'utilisateur veut voir TOUTES ses pièces utilisées, pas seulement les plus neutres.

✅ **APPROCHE CORRECTE** :
- Lis attentivement TOUTE la liste des vêtements disponibles
- Utilise des pièces VARIÉES : couleurs différentes, styles différents, matières différentes
- Explore les hauts colorés, à motifs, originaux (pas uniquement les neutres)
- Chaque tenue doit mettre en valeur une combinaison UNIQUE de la garde-robe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 PRIORITÉ 1 - TEMPÉRATURE (RÈGLE ABSOLUE)
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

**COULEURS & HARMONIES (RÈGLES STRICTES)** :

🎨 **RÈGLE FONDAMENTALE** : Une tenue = 1 couleur neutre dominante + 1-2 couleurs d'accent MAXIMUM

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

🔴 **ASSOCIATIONS À ÉVITER** (Fautes de goût classiques) :
- Noir + Marine (trop proches, confusion visuelle)
- Noir + Marron (incompatibilité classique du stylisme)
- Marine + Marron foncé (confusion des tons sombres)
- Bleu royal vif + Noir (contraste trop brutal)
- Plus de 1 couleur vive par tenue (surcharge visuelle)
- Denim bleu moyen + Pull/Veste bleu similaire (effet total-look raté)

📍 **RÈGLES CRITIQUES PAR PIÈCE** :

**CHAUSSURES avec BAS** (CRUCIAL - source principale des fautes) :
- ✅ Chaussures NOIRES : Excellent avec pantalon noir, gris foncé, jean noir/brut foncé, chino anthracite
- ⚠️ Chaussures NOIRES : ACCEPTABLE avec jean bleu foncé/brut (si jean très foncé)
- ❌ Chaussures NOIRES : ÉVITER avec jean bleu clair/moyen, chino beige clair (préférer marron/beige/blanc)
- ✅ Chaussures MARRON/BEIGES : Parfait avec jean bleu (toutes nuances), chino beige/kaki/camel, pantalon marron/terre
- ❌ Chaussures MARRON : JAMAIS avec pantalon noir (faute majeure de stylisme)
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
- Rayures fines discrètes = considéré comme uni

**VARIÉTÉ & DIVERSIFICATION (RÈGLE CRITIQUE)** :

🔴 **PRIORITÉ ABSOLUE : VARIER LES HAUTS**
L'utilisateur possède de nombreux hauts différents. Tu DOIS explorer toute la garde-robe !

⚠️ **INTERDICTIONS STRICTES** :
- ❌ JAMAIS utiliser 2 fois le même haut dans les 3 tenues
- ❌ JAMAIS se limiter aux basiques "safe" (t-shirt blanc, chemise blanche, etc.)
- ❌ JAMAIS répéter la même couleur de haut 3 fois
- ❌ JAMAIS répéter le même style de haut 3 fois (ex: 3 t-shirts unis)

✅ **OBLIGATION DE DIVERSITÉ** :
- Chaque tenue DOIT avoir un haut DIFFÉRENT (nom, couleur, style)
- Varier les TYPES de hauts : Mix t-shirt + chemise + pull, ou t-shirt + sweat + polo, etc.
- Varier les COULEURS de hauts : Si tenue 1 = haut blanc, alors tenue 2 et 3 = autres couleurs
- Varier les STYLES : Alterner entre casual (t-shirt, sweat) et smart-casual (chemise, pull structuré)
- Utiliser des pièces MOINS ÉVIDENTES : Explorer les hauts colorés, à motifs, originaux (pas toujours les neutres basiques)

🎯 **STRATÉGIE DE SÉLECTION DES HAUTS** :
1. **Tenue 1** : Choisir un haut (ex: chemise bleue)
2. **Tenue 2** : Choisir un haut COMPLÈTEMENT différent en type ET couleur (ex: t-shirt noir)
3. **Tenue 3** : Choisir encore un autre haut, différent des 2 premiers (ex: pull beige)

📊 **PANTALONS** :
- Si l'utilisateur a peu de pantalons (2-3), c'est NORMAL de les répéter
- Focus la variété sur les HAUTS et CHAUSSURES
- Si possible, ne pas utiliser 3 fois le même pantalon, mais c'est acceptable si contraintes de couleur/météo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴🔴 RÈGLE CRITIQUE - UTILISATION DES IDs (NON NÉGOCIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **INTERDICTION ABSOLUE** :
- ❌ JAMAIS inventer ou modifier un ID
- ❌ JAMAIS utiliser un ID qui n'est pas dans la liste ci-dessus
- ❌ JAMAIS tronquer, raccourcir ou modifier un ID

✅ **OBLIGATION** :
- Tu DOIS copier-coller les IDs EXACTEMENT comme fournis
- Chaque ID est unique et doit être utilisé TEL QUEL (avec tirets, chiffres, lettres)
- Si un ID ressemble à "abc-123-def-456", tu DOIS utiliser "abc-123-def-456"

📝 **EXEMPLE DE FORMAT ATTENDU** :
Si la liste contient : "Pull bleu marine col V (ID: a1b2c3d4-e5f6-7890)"
Dans ta réponse JSON, tu DOIS mettre :
{
  "id": "a1b2c3d4-e5f6-7890",
  "description": "Pull bleu marine col V"
}

🚨 **VÉRIFICATION AVANT ENVOI** :
Avant de finaliser ta réponse, vérifie que CHAQUE ID dans ta réponse JSON existe EXACTEMENT dans la liste des vêtements disponibles ci-dessus.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${anchorItemOrSet ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ RAPPEL FINAL - ARTICLE OBLIGATOIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VÉRIFIE que CHACUNE des 3 tenues inclut bien :
✅ "${('name' in anchorItemOrSet ? anchorItemOrSet.name : anchorItemOrSet.analysis)}" (ID: ${anchorItemOrSet.id})
Et que tu utilises EXACTEMENT cet ID : ${anchorItemOrSet.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}`;

    try {
        const result = await generateOutfitsFunctionCall({ prompt });
        const data = result.data as { tenues: OutfitSuggestion[] };

        // Validation et correction des IDs
        const validatedOutfits = validateAndFixOutfitIds(data.tenues, individualItems, sets);

        return validatedOutfits;
    } catch (error) {
        console.error("Erreur génération tenues:", error);
        throw new Error("Erreur lors de la génération des tenues.", { cause: error });
    }
}

// Fonction de validation et correction des IDs
function validateAndFixOutfitIds(
    outfits: OutfitSuggestion[],
    items: ClothingItem[],
    sets: ClothingSet[]
): OutfitSuggestion[] {
    const allValidIds = new Set([
        ...items.map(item => item.id),
        ...sets.map(set => set.id)
    ]);

    const allItemsAndSets = [...items, ...sets];

    return outfits.map(outfit => ({
        ...outfit,
        vetements: outfit.vetements.map(vetement => {
            const cleanId = vetement.id.trim();

            // Si l'ID est valide, on le garde
            if (allValidIds.has(cleanId)) {
                return vetement;
            }

            // Sinon, on cherche le bon ID par fuzzy matching
            console.warn(`⚠️ ID invalide détecté: "${cleanId}" pour "${vetement.description}"`);

            // 1. Recherche par description exacte
            let found = allItemsAndSets.find(item => {
                const itemDesc = 'name' in item ? item.name : item.analysis;
                return itemDesc.toLowerCase() === vetement.description.toLowerCase();
            });

            // 2. Recherche par description partielle
            if (!found) {
                found = allItemsAndSets.find(item => {
                    const itemDesc = 'name' in item ? item.name : item.analysis;
                    const desc = vetement.description.toLowerCase();
                    return itemDesc.toLowerCase().includes(desc) || desc.includes(itemDesc.toLowerCase());
                });
            }

            if (found) {
                console.log(`✅ ID corrigé: "${cleanId}" → "${found.id}" pour "${vetement.description}"`);
                return {
                    ...vetement,
                    id: found.id
                };
            }

            // Si vraiment aucun match, on garde l'ID invalide (sera affiché comme "?")
            console.error(`❌ Aucun match trouvé pour: "${vetement.description}" (ID: ${cleanId})`);
            return vetement;
        })
    }));
}

// Validation spécifique pour le planificateur de valise
function validateAndFixVacationPlanIds(
    plan: VacationPlan,
    items: ClothingItem[],
    sets: ClothingSet[]
): VacationPlan {
    const allValidIds = new Set([
        ...items.map(item => item.id),
        ...sets.map(set => set.id)
    ]);

    const allItemsAndSets = [...items, ...sets];

    // Map pour savoir à quel set appartient chaque item
    const itemIdToSetId = new Map<string, string>();
    sets.forEach(set => {
        set.itemIds.forEach(itemId => {
            itemIdToSetId.set(itemId, set.id);
        });
    });

    const processedSetIds = new Set<string>(); // Pour éviter les doublons d'ensembles

    return {
        ...plan,
        valise: plan.valise.map(item => {
            const cleanId = item.id.trim();

            // 🔴 RÈGLE CRITIQUE : Si c'est un item individuel qui fait partie d'un set
            if (itemIdToSetId.has(cleanId)) {
                const setId = itemIdToSetId.get(cleanId)!;
                const set = sets.find(s => s.id === setId)!;

                // Si on a déjà traité cet ensemble, on skip (évite les doublons)
                if (processedSetIds.has(setId)) {
                    console.warn(`⚠️ [VALISE] Item "${item.description}" fait partie du set "${set.name}" déjà inclus, ignoré`);
                    return null; // Sera filtré après
                }

                processedSetIds.add(setId);

                console.warn(`🔄 [VALISE] Item individuel "${item.description}" (${cleanId}) fait partie du set "${set.name}"`);
                console.log(`✅ [VALISE] Remplacement par l'ensemble complet (ID: ${setId})`);

                return {
                    id: setId,
                    description: set.name
                };
            }

            // Si l'ID est valide (item individuel OU set), on le garde
            if (allValidIds.has(cleanId)) {
                // Si c'est un set, marquer comme traité
                if (sets.some(s => s.id === cleanId)) {
                    processedSetIds.add(cleanId);
                }
                return item;
            }

            // Sinon, on cherche le bon ID par fuzzy matching
            console.warn(`⚠️ [VALISE] ID invalide détecté: "${cleanId}" pour "${item.description}"`);

            // 1. Recherche par description exacte
            let found = allItemsAndSets.find(existingItem => {
                const itemDesc = 'name' in existingItem ? existingItem.name : existingItem.analysis;
                return itemDesc.toLowerCase() === item.description.toLowerCase();
            });

            // 2. Recherche par description partielle
            if (!found) {
                found = allItemsAndSets.find(existingItem => {
                    const itemDesc = 'name' in existingItem ? existingItem.name : existingItem.analysis;
                    const desc = item.description.toLowerCase();
                    return itemDesc.toLowerCase().includes(desc) || desc.includes(itemDesc.toLowerCase());
                });
            }

            if (found) {
                // Si l'item trouvé fait partie d'un set, utiliser le set complet
                if ('analysis' in found && itemIdToSetId.has(found.id)) {
                    const setId = itemIdToSetId.get(found.id)!;
                    const set = sets.find(s => s.id === setId)!;

                    if (!processedSetIds.has(setId)) {
                        processedSetIds.add(setId);
                        console.log(`✅ [VALISE] ID corrigé: "${cleanId}" → Ensemble "${set.name}" (${setId})`);
                        return {
                            id: setId,
                            description: set.name
                        };
                    } else {
                        return null; // Set déjà ajouté
                    }
                }

                console.log(`✅ [VALISE] ID corrigé: "${cleanId}" → "${found.id}" pour "${item.description}"`);
                return {
                    ...item,
                    id: found.id
                };
            }

            // Si vraiment aucun match, on garde l'ID invalide (sera affiché comme "?")
            console.error(`❌ [VALISE] Aucun match trouvé pour: "${item.description}" (ID: ${cleanId})`);
            return item;
        }).filter((item): item is OutfitItem => item !== null) // Retirer les doublons
    };
}

// --- GÉNÉRATION DE VARIANTES (REMPLACEMENT D'UNE PIÈCE) ---
export async function generateOutfitVariants(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    context: string,
    outfitToModify: OutfitSuggestion,
    itemToReplace: OutfitItem
): Promise<OutfitSuggestion[]> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    // Filtrer les items exclus ET ceux qui sont dans des ensembles
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id) && !item.isExcluded);

    const individualItemsFormatted = individualItems.map(item =>
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Matière: ${item.material})`
    ).join('\n');
    // Pas de sets dans les variantes : on remplace 1 pièce par 1 pièce individuelle uniquement
    const availableClothes = individualItemsFormatted;

    // Construire la liste des items à garder (tous sauf celui à remplacer)
    const itemsToKeep = outfitToModify.vetements.filter(item => item.id !== itemToReplace.id);
    const keepInstruction = itemsToKeep.map(item =>
        `  ✅ GARDER : "${item.description}" (ID: ${item.id})`
    ).join('\n');

    const replaceInstruction = `  ❌ REMPLACER : "${itemToReplace.description}" (ID: ${itemToReplace.id})`;

    const prompt = `Tu es un styliste expert. L'utilisateur aime cette tenue mais veut remplacer UNE SEULE pièce.

**TENUE ACTUELLE** : "${outfitToModify.titre}"
${outfitToModify.description}

**INSTRUCTIONS DE MODIFICATION** :
${keepInstruction}
${replaceInstruction}

⚠️ **RÈGLE ABSOLUE** : Tu DOIS inclure EXACTEMENT les mêmes articles marqués "✅ GARDER" avec leurs IDs exacts dans chacune des 3 tenues.
Tu dois UNIQUEMENT remplacer l'article marqué "❌ REMPLACER" par une alternative différente parmi les vêtements disponibles.
Tu ne peux remplacer qu'avec une PIÈCE INDIVIDUELLE (pas un ensemble/set). Choisis uniquement parmi les articles listés ci-dessous.

**CONTEXTE** : ${context}

Vêtements disponibles (pièces individuelles uniquement) :
${availableClothes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 PRIORITÉ 1 - TEMPÉRATURE (RÈGLE ABSOLUE)
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

**COULEURS & HARMONIES (RÈGLES STRICTES)** :

🎨 **RÈGLE FONDAMENTALE** : Une tenue = 1 couleur neutre dominante + 1-2 couleurs d'accent MAXIMUM

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

🔴 **ASSOCIATIONS À ÉVITER** (Fautes de goût classiques) :
- Noir + Marine (trop proches, confusion visuelle)
- Noir + Marron (incompatibilité classique du stylisme)
- Marine + Marron foncé (confusion des tons sombres)
- Bleu royal vif + Noir (contraste trop brutal)
- Plus de 1 couleur vive par tenue (surcharge visuelle)
- Denim bleu moyen + Pull/Veste bleu similaire (effet total-look raté)

📍 **RÈGLES CRITIQUES PAR PIÈCE** :

**CHAUSSURES avec BAS** (CRUCIAL - source principale des fautes) :
- ✅ Chaussures NOIRES : Excellent avec pantalon noir, gris foncé, jean noir/brut foncé, chino anthracite
- ⚠️ Chaussures NOIRES : ACCEPTABLE avec jean bleu foncé/brut (si jean très foncé)
- ❌ Chaussures NOIRES : ÉVITER avec jean bleu clair/moyen, chino beige clair (préférer marron/beige/blanc)
- ✅ Chaussures MARRON/BEIGES : Parfait avec jean bleu (toutes nuances), chino beige/kaki/camel, pantalon marron/terre
- ❌ Chaussures MARRON : JAMAIS avec pantalon noir (faute majeure de stylisme)
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
- Rayures fines discrètes = considéré comme uni

**VARIÉTÉ & DIVERSIFICATION DES ALTERNATIVES** :

🔴 **OBLIGATION : 3 ALTERNATIVES VRAIMENT DIFFÉRENTES**

⚠️ **SI REMPLACEMENT D'UN HAUT** :
- ❌ JAMAIS proposer 3 hauts de la même couleur
- ❌ JAMAIS proposer 3 hauts du même type (ex: 3 t-shirts, 3 chemises)
- ✅ VARIER les couleurs : Alternative 1 = blanc, Alternative 2 = noir, Alternative 3 = couleur vive
- ✅ VARIER les styles : Mix t-shirt + chemise + pull, ou casual + smart-casual + formel
- ✅ Explorer des options MOINS ÉVIDENTES (pas toujours les basiques neutres)

⚠️ **SI REMPLACEMENT D'UN BAS** :
- Varier les couleurs/nuances si plusieurs options disponibles
- Alterner entre casual et formel si la garde-robe le permet

⚠️ **SI REMPLACEMENT DE CHAUSSURES** :
- Proposer différents styles : sneakers, boots, mocassins, etc.
- Varier les couleurs selon compatibilité avec le pantalon conservé

✅ **HARMONIE** :
- Chaque alternative DOIT respecter les règles de couleurs avec les pièces conservées
- Maintenir la cohérence de style (ne pas passer de formel à streetwear)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴🔴 RÈGLE CRITIQUE - UTILISATION DES IDs (NON NÉGOCIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **INTERDICTION ABSOLUE** :
- ❌ JAMAIS inventer ou modifier un ID
- ❌ JAMAIS utiliser un ID qui n'est pas dans la liste ci-dessus
- ❌ JAMAIS tronquer, raccourcir ou modifier un ID

✅ **OBLIGATION** :
- Tu DOIS copier-coller les IDs EXACTEMENT comme fournis
- Pour les articles à GARDER (✅), tu DOIS utiliser EXACTEMENT les mêmes IDs
- Chaque ID est unique et doit être utilisé TEL QUEL (avec tirets, chiffres, lettres)

📝 **EXEMPLE DE FORMAT ATTENDU** :
Si un article à garder a l'ID "a1b2c3d4-e5f6-7890", dans ta réponse JSON tu DOIS mettre :
{
  "id": "a1b2c3d4-e5f6-7890",
  "description": "Description de l'article"
}

🚨 **VÉRIFICATION AVANT ENVOI** :
1. Vérifie que les articles marqués "✅ GARDER" ont EXACTEMENT les mêmes IDs
2. Vérifie que l'article de remplacement a un ID qui existe dans la liste disponible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Génère 3 variantes qui respectent TOUTES les règles ci-dessus.`;

    try {
        const result = await generateOutfitVariantsFunctionCall({ prompt });
        const data = result.data as { tenues: OutfitSuggestion[] };

        // Validation et correction des IDs (pas de sets en mode variantes)
        const validatedOutfits = validateAndFixOutfitIds(data.tenues, individualItems, []);

        return validatedOutfits;
    } catch (error) {
        console.error("Erreur génération variantes:", error);
        throw new Error("Erreur lors de la génération des variantes.", { cause: error });
    }
}

// --- CHATBOT STYLISTE (CONSEILS UNIQUEMENT) ---
export async function generateChatResponse(
    outfit: OutfitSuggestion,
    userMessage: string,
    conversationHistory: ChatMessage[],
    wardrobeItems: ClothingItem[],
    wardrobeSets: ClothingSet[]
): Promise<ChatResponse> {
    const itemIdsInSets = new Set((wardrobeSets || []).flatMap(s => s.itemIds));
    const individualItems = wardrobeItems.filter(item => !itemIdsInSets.has(item.id) && !item.isExcluded);

    // Formater la garde-robe par catégorie
    const wardrobeByCategory = {
        Hauts: individualItems.filter(i => i.category === 'Hauts'),
        Bas: individualItems.filter(i => i.category === 'Bas'),
        Chaussures: individualItems.filter(i => i.category === 'Chaussures'),
        Accessoires: individualItems.filter(i => i.category === 'Accessoires')
    };

    const wardrobeFormatted = Object.entries(wardrobeByCategory)
        .map(([cat, items]) => {
            if (items.length === 0) return '';
            const itemsList = items.map(i => `  - ${i.analysis} (ID: ${i.id}, Matière: ${i.material})`).join('\n');
            return `**${cat}** (${items.length}) :\n${itemsList}`;
        })
        .filter(Boolean)
        .join('\n\n');

    const setsFormatted = wardrobeSets.length > 0
        ? `\n**Ensembles** (${wardrobeSets.length}) :\n${wardrobeSets.map(s => `  - ${s.name} (ID: ${s.id})`).join('\n')}`
        : '';

    // Formater l'historique de conversation
    const historyFormatted = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    // Formater la tenue actuelle
    const outfitFormatted = outfit.vetements
        .map(item => `  - ${item.description} (ID: ${item.id})`)
        .join('\n');

    const prompt = `Tu es un ASSISTANT STYLISTE SPÉCIALISÉ pour l'application DressCode.

🚫 **RÈGLES ABSOLUES** :
1. Tu REFUSES CATÉGORIQUEMENT toute question hors mode/style/vêtements
2. Si demande hors-sujet → Réponds: "Je suis ton styliste IA 👔 Je ne peux parler que de mode, tenues et style. Comment puis-je t'aider avec tes vêtements ?"
3. PAS de recettes, code, math, histoire, etc.
4. UNIQUEMENT : conseils de style, tenues, accessoires, couleurs, matières

🔐 **RÈGLE CRITIQUE - SUGGESTIONS UNIQUEMENT DEPUIS LA GARDE-ROBE** :

✅ TU DOIS :
- TOUJOURS suggérer des pièces qui existent dans sa garde-robe
- Décrire les items de manière naturelle SANS mentionner leur ID (ex: "Ta veste bomber noire Burberry" au lieu de "ID: 12345")
- Expliquer POURQUOI cette pièce spécifique irait mieux
- Si aucune alternative n'existe, le dire clairement

❌ TU NE DOIS JAMAIS :
- Suggérer d'acheter quoi que ce soit
- Inventer des pièces qu'il ne possède pas
- Donner des conseils génériques sans référencer ses items réels
- Afficher les IDs techniques dans tes réponses (ils sont moches et inutiles pour l'utilisateur)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **TENUE ACTUELLE** : "${outfit.titre}"
${outfit.description}

Pièces composant cette tenue :
${outfitFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👔 **GARDE-ROBE COMPLÈTE DE L'UTILISATEUR** :

${wardrobeFormatted}${setsFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 **HISTORIQUE DE CONVERSATION** :
${historyFormatted || '(Pas d\'historique)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📨 **NOUVEAU MESSAGE** :
${userMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **INSTRUCTIONS DE RÉPONSE** :
- Réponds en français, de manière concise et amicale (2-4 phrases max)
- Si tu suggères une alternative, décris-la naturellement (sans ID) et explique pourquoi
- Si l'utilisateur n'a pas d'alternative, sois honnête
- Reste focus sur cette tenue spécifique
- Pas d'actions (génération) pour le moment, uniquement des conseils

🔒 **FORMAT DE RÉPONSE JSON** :
{
  "message": "Ta réponse textuelle ici",
  "isRejected": true/false
}

⚠️ Mets "isRejected": true UNIQUEMENT si la question est TOTALEMENT hors-sujet mode/style (recette, code, math, histoire, etc.)
✅ Mets "isRejected": false pour toute question liée à la mode, même vaguement`;

    try {
        const result = await generateChatResponseFunctionCall({ prompt });
        const data = result.data as ChatResponse;

        return {
            message: data.message,
            isRejected: data.isRejected
        };
    } catch (error) {
        console.error("Erreur génération chat:", error);
        throw new Error("Erreur lors de la génération de la réponse.", { cause: error });
    }
}

// Cloud Function pour l'analyse de garde-robe
const analyzeWardrobeGapsFunctionCall = httpsCallable(functions, 'analyzeWardrobeGapsFunction');

// --- ANALYSE DE GARDE-ROBE & SUGGESTIONS D'ACHATS ---
export async function analyzeWardrobeGaps(
  clothingItems: ClothingItem[],
  clothingSets: ClothingSet[],
  signal?: AbortSignal
): Promise<WardrobeAnalysis> {
  // Vérifier si l'analyse a été annulée avant de commencer
  if (signal?.aborted) {
    throw new DOMException('Analyse annulée', 'AbortError');
  }
  // Structurer l'inventaire par catégorie avec détails
  const categoryBreakdown = {
    Hauts: clothingItems.filter(i => i.category === 'Hauts'),
    Bas: clothingItems.filter(i => i.category === 'Bas'),
    Chaussures: clothingItems.filter(i => i.category === 'Chaussures'),
    Accessoires: clothingItems.filter(i => i.category === 'Accessoires')
  };

  const inventoryDescription = Object.entries(categoryBreakdown)
    .map(([cat, items]) => `**${cat}** (${items.length}) :\n${items.map(i => `  - ${i.analysis} (${i.color}, ${i.material})`).join('\n')}`)
    .join('\n\n');

  const totalItems = clothingItems.length;
  const hasEnsembles = clothingSets.length > 0;

  const prompt = `Tu es un expert styliste et conseiller en garde-robe avec 20 ans d'expérience. Ta mission : analyser cette garde-robe et suggérer des achats stratégiques pour maximiser la polyvalence.

📊 **INVENTAIRE ACTUEL** (${totalItems} pièces${hasEnsembles ? `, ${clothingSets.length} ensembles` : ''}) :

${inventoryDescription}

---

🎯 **OBJECTIF DE L'ANALYSE** :
Identifier les **pièces manquantes clés** qui permettront de créer le maximum de tenues différentes avec l'existant.

📋 **MÉTHODOLOGIE** :

1. **ANALYSE STRATÉGIQUE** :
   - Équilibre entre catégories (ratio Hauts/Bas/Chaussures)
   - Diversité des couleurs (neutres vs. vives)
   - Polyvalence des pièces existantes
   - Occasions couvertes (casual, formel, sport, etc.)
   - Saisons couvertes

2. **IDENTIFICATION DES GAPS CRITIQUES** :
   - Pièces basiques manquantes (ex: chemise blanche, jean brut)
   - Couleurs absentes pour compléter les palettes
   - Styles/occasions non couverts
   - Opportunités de layering (superposition)

3. **PRIORISATION** :
   - **HIGH** : Pièce essentielle manquante qui débloque 5+ nouvelles tenues
   - **MEDIUM** : Pièce utile qui ajoute de la variété (3-5 tenues)
   - **LOW** : Pièce "nice-to-have" pour occasions spécifiques

4. **SUGGESTIONS D'ACHATS** (4-6 pièces maximum) :
   - Focus sur la **POLYVALENCE** : chaque suggestion doit se marier avec plusieurs pièces existantes
   - Inclure des **pièces basiques intemporelles** avant les tendances
   - Équilibrer les priorités (au moins 1-2 high priority)
   - Pour chaque suggestion, fournis :
     * Une description précise (ex: "Chemise oxford bleu clair en coton")
     * La raison stratégique (ex: "Se marie avec vos 3 pantalons et crée une base smart-casual")
     * Un prix estimé réaliste en €
     * Une requête de recherche optimisée (mots-clés pour Zalando/autres boutiques)

---

⚠️ **RÈGLES CRITIQUES** :

- NE suggère PAS de pièces similaires à l'existant
- Favorise les neutres (blanc, noir, beige, navy) pour maximiser les combinaisons
- Évite les pièces très spécifiques/occasionnelles (sauf si totalement absentes)
- Sois concis mais précis dans les descriptions
- Le champ \`searchQuery\` doit contenir des mots-clés optimisés pour recherche en ligne (ex: "chemise oxford homme coton bleu clair" ou "pull col V mérinos noir homme")

Retourne ton analyse au format JSON.`;

  try {
    const result = await analyzeWardrobeGapsFunctionCall({ prompt });

    // Vérifier si l'analyse a été annulée pendant l'appel API
    if (signal?.aborted) {
      throw new DOMException('Analyse annulée', 'AbortError');
    }

    return result.data as WardrobeAnalysis;
  } catch (error) {
    // Re-throw les erreurs d'annulation
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    console.error("Erreur analyse garde-robe:", error);
    throw new Error("Erreur lors de l'analyse de la garde-robe.", { cause: error });
  }
}


// Cloud Function pour le planificateur de valise
const generateVacationPlanFunctionCall = httpsCallable(functions, 'generateVacationPlanFunction');

// --- PLANIFICATEUR DE VALISE ---
export async function generateVacationPlan(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    days: number,
    context: string,
    maxWeight?: number
): Promise<VacationPlan> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    // Filtrer les items exclus ET ceux qui sont dans des ensembles
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id) && !item.isExcluded);

    const individualItemsFormatted = individualItems.map(item =>
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Couleur: ${item.color}, Matière: ${item.material})`
    ).join('\n');

    // Formatter les sets avec TOUS leurs items détaillés
    const setsFormatted = sets.map(set => {
        const setItems = set.itemIds
            .map(itemId => clothingList.find(item => item.id === itemId))
            .filter((item): item is ClothingItem => item !== undefined);

        const itemsDetail = setItems.map(item =>
            `    • ${item.analysis} (Cat: ${item.category}, Couleur: ${item.color}, Matière: ${item.material})`
        ).join('\n');

        return `- **ENSEMBLE "${set.name}"** (ID Ensemble: ${set.id}) - ⚠️ INDIVISIBLE (utiliser tous les items ou aucun) :\n${itemsDetail}`;
    }).join('\n\n');

    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n\n');

    const weightInstruction = maxWeight
        ? `\n**CONTRAINTE POIDS** : Le poids total DOIT être proche de ${maxWeight} kg (marge : ${maxWeight - 0.5} - ${maxWeight} kg). Utilise bien la capacité disponible !

**Poids de référence réalistes** :
- T-shirt : ~150g
- Chemise : ~200g
- Jean/Denim : ~650g
- Pantalon coton/chino : ~500g
- Jogging/Pantalon léger : ~350g
- Pull laine : ~350g
- Sweat : ~400g
- Veste légère : ~500g
- Manteau/Doudoune : ~1kg
- Chaussures (par paire) : ~1kg
- Baskets (par paire) : ~1kg
- Chaussures de ville cuir : ~1,2kg
- Sous-vêtements : ~50g
- Chaussettes : ~50g
- Accessoires (lunettes, casquette, etc.) : ~100g`
        : '';

    const prompt = `Tu es un expert en préparation de valise. Crée une **CAPSULE WARDROBE** optimisée pour ${days} jours.

**DESTINATION & CONTEXTE** : ${context}

**PRINCIPE CAPSULE WARDROBE** : Sélectionner des pièces polyvalentes qui se combinent entre elles pour créer un maximum de tenues différentes.

**RÈGLES CRITIQUES** :

1. **LOGIQUE THERMIQUE (PRIORITÉ ABSOLUE)** :

   | Température | Vêtements adaptés |
   |-------------|-------------------|
   | **> 30°C (TRÈS CHAUD)** | T-shirts légers, shorts, robes, sandales. INTERDITS : jeans, pulls, vestes |
   | **25-30°C (CHAUD)** | T-shirts, pantalons légers, une chemise, baskets légères |
   | **15-25°C (DOUX)** | Mix léger + 1 pull fin ou veste légère |
   | **10-15°C (FRAIS)** | Pulls, pantalons, veste, chaussures fermées |
   | **< 10°C (FROID)** | Layering complet : sous-couche + pull + manteau chaud |

2. **INTERDICTIONS ABSOLUES** (NON NÉGOCIABLE) :
   - ❌ **TOUTE veste/blouson/manteau si > 25°C** (veste légère, suède, cuir, toile - TOUTES interdites)
   - ❌ Doudoune/veste ski/polaire si > 20°C
   - ❌ Shorts si < 15°C
   - ❌ Sandales si < 18°C
   - ❌ Pulls en laine si > 25°C
   - ❌ Jeans épais si > 32°C

   **EXEMPLES D'INTERDICTIONS** :
   - Destination : Espagne 35°C → INTERDIT : veste suède, veste légère, blouson, pull, jean épais
   - Destination : Ski -5°C → INTERDIT : shorts, t-shirts seuls, sandales

3. **MATIÈRES ADAPTÉES** :
   - **Climat chaud** : Coton léger, lin, matières respirantes uniquement
   - **Climat froid** : Laine, polaire, matières isolantes
   - **Voyage** : Privilégier matières qui ne se froissent pas

4. **HARMONIE CAPSULE (pour que tout se combine)** :
   - **Palette de couleurs** : Maximum 4-5 couleurs qui vont ensemble (ex: bleu marine, blanc, beige, une couleur d'accent)
   - **Motifs** : Maximum 2 pièces à motifs dans toute la valise, le reste UNI
   - **Neutralité** : Au moins 50% de pièces en couleurs neutres (noir, blanc, gris, beige, marine)

5. **QUANTITÉS ADAPTÉES pour ${days} jours** :
   - **Hauts** : ${Math.max(Math.ceil(days / 2), 5)}-${Math.max(Math.ceil(days / 1.5), 8)} pièces (mix t-shirts/chemises)
   - **Bas** : ${Math.max(Math.ceil(days / 3), 3)}-${Math.max(Math.ceil(days / 2.5), 5)} pièces
   - **Chaussures** : 2-3 paires (confort + sport/ville + option soirée)
   - **Sous-vêtements** : ${Math.min(days + 2, 10)} pièces minimum
   - **Chaussettes** : ${Math.min(days + 2, 10)} paires minimum
   ${days > 7 ? `   - Pour un séjour de ${days} jours, prévoir SUFFISAMMENT de vêtements pour éviter les lessives fréquentes` : ''}

6. **ACCESSOIRES ESSENTIELS** (OBLIGATOIRE) :
   - **Soleil/Chaleur** (si > 25°C ou destination ensoleillée) : Lunettes de soleil, casquette/chapeau
   - **Froid** (si < 15°C) : Écharpe, bonnet, gants
   - **Voyage** : Ceinture si pantalons formels
   - Privilégier les accessoires disponibles dans la garde-robe

7. **LAYERING INTELLIGENT (si climat variable)** :
   - Prévoir des couches qui s'empilent : t-shirt → chemise/pull léger → veste
   - Chaque couche doit être portable seule ET en combinaison

8. **🔴 RÈGLE CRITIQUE SUR LES ENSEMBLES** :
   - Les ENSEMBLES sont INDIVISIBLES : tu DOIS inclure TOUS les items d'un ensemble ou AUCUN
   - ❌ INTERDIT : Prendre seulement le t-shirt d'un ensemble sans son short
   - ✅ CORRECT : Prendre l'ensemble complet OU ne pas le prendre du tout
   - Dans ta réponse JSON, utilise l'ID de l'ENSEMBLE (pas les IDs individuels des items)
   - Si un ensemble ne respecte pas le climat, NE PAS le prendre du tout

${weightInstruction}

**VÊTEMENTS DISPONIBLES** :
${availableClothes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴🔴 RÈGLE CRITIQUE - UTILISATION DES IDs (NON NÉGOCIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **INTERDICTION ABSOLUE** :
- ❌ JAMAIS inventer ou modifier un ID
- ❌ JAMAIS utiliser un ID qui n'est pas dans la liste ci-dessus
- ❌ JAMAIS tronquer, raccourcir ou modifier un ID

✅ **OBLIGATION** :
- Tu DOIS copier-coller les IDs EXACTEMENT comme fournis dans la liste
- Chaque article de la valise DOIT avoir un ID présent dans "VÊTEMENTS DISPONIBLES"

📝 **EXEMPLE DE FORMAT ATTENDU** :
Si la liste contient : "T-shirt blanc en coton (ID: a1b2c3d4-e5f6-7890)"
Dans ta réponse JSON, tu DOIS mettre :
{
  "id": "a1b2c3d4-e5f6-7890",
  "description": "T-shirt blanc en coton"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**INSTRUCTIONS FINALES** :
- Crée une valise COMPLÈTE et PERTINENTE pour ${days} jours
- Si contrainte de poids : MAXIMISE l'utilisation (proche de ${maxWeight}kg)
- N'oublie PAS les accessoires essentiels selon le climat
- Pour les longs séjours (> 14 jours), prévoir PLUS de vêtements

**SORTIE** :
- Un titre accrocheur pour cette valise
- Un résumé expliquant tes choix (météo, style, combinaisons possibles)
- La liste COMPLÈTE des articles avec leur ID EXACT copié-collé`;

    try {
        const result = await generateVacationPlanFunctionCall({ prompt });
        const rawPlan = result.data as VacationPlan;

        // ✅ Validation et correction automatique des IDs
        const validatedPlan = validateAndFixVacationPlanIds(rawPlan, clothingList, sets);

        return validatedPlan;
    } catch (error) {
        console.error("Erreur génération plan vacances:", error);
        throw new Error("Erreur lors de la génération du plan vacances.", { cause: error });
    }
}


// --- GÉNÉRATION VISUELLE (VIRTUAL TRY-ON) ---
const generateVisualFunction = httpsCallable(functions, 'generateVisualOutfit');

export async function generateVisualOutfit(
    items: ClothingItem[],
    context: string, // <--- Ceci contient l'URL de l'image utilisateur
): Promise<string> {
    
    console.log("🚀 Préparation du Virtual Try-On...");

    const mainItem = items[0];

    if (!mainItem || !mainItem.imageSrc) {
        throw new Error("Aucun vêtement valide trouvé pour l'essayage.");
    }

    try {
        // C'EST ICI QUE C'ÉTAIT CASSÉ : On n'envoyait pas 'humanImageUrl'
        const result = await generateVisualFunction({ 
            garmentUrl: mainItem.imageSrc, 
            category: mainItem.category,   
            description: mainItem.analysis,
            humanImageUrl: context // <--- CORRECTION: On passe l'image de l'utilisateur au serveur !
        });
        
        const data = result.data as { imageUrl: string };
        
        if (!data || !data.imageUrl) {
            throw new Error("Pas d'image retournée par le serveur.");
        }

        console.log("✅ Image reçue de Replicate !");
        return data.imageUrl;
        
    } catch (error) {
        console.error("❌ Erreur lors de l'appel Cloud Function :", error);
        throw error;
    }
}
