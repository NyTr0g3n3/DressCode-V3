import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis, ChatMessage, ChatResponse, OutfitItem, OutfitWearHistory, FavoriteOutfit } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { STYLE_RULES, ACCESSORY_RULES } from '../prompts/sharedStyleRules';
import { buildFavoritesInstruction } from '../prompts/personalization';
import { validateAndFixOutfitIds, validateAndFixVacationPlanIds } from '../utils/outfitValidation';
import { parseTemperatureCelsius, filterOutfitsByHardConstraints } from '../utils/outfitConstraints';

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
    wornOutfits?: OutfitWearHistory[],
    favoriteOutfits?: FavoriteOutfit[],
    weatherInfo?: string | null
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

    const favoritesInstruction = buildFavoritesInstruction(favoriteOutfits, clothingList, sets);

    const prompt = `Tu es un styliste expert. Crée 3 tenues complètes et harmonieuses pour : "${context}".
${anchorInstruction}${favoritesInstruction}${recentlyWornInstruction}
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
${STYLE_RULES}

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

${ACCESSORY_RULES}
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

    let validatedOutfits: OutfitSuggestion[];
    try {
        const result = await generateOutfitsFunctionCall({ prompt });
        const data = result.data as { tenues: OutfitSuggestion[] };

        // Validation et correction des IDs
        validatedOutfits = validateAndFixOutfitIds(data.tenues, individualItems, sets);
    } catch (error) {
        console.error("Erreur génération tenues:", error);
        throw new Error("Erreur lors de la génération des tenues.", { cause: error });
    }

    // Contraintes dures (structure, température, article ancré) :
    // vérifiées en code plutôt qu'espérées via le prompt, cf.
    // sharedStyleRules.ts pour la distinction dur/mou.
    const temperatureCelsius = parseTemperatureCelsius(weatherInfo);
    const filteredOutfits = filterOutfitsByHardConstraints(validatedOutfits, clothingList, sets, {
        temperatureCelsius,
        anchorId: anchorItemOrSet?.id,
    });

    // Si le filtre a tout écarté, ne pas renvoyer un tableau vide en
    // silence (le spinner s'arrêterait sans rien afficher, comme le
    // bug d'upload silencieux corrigé plus tôt) : on remonte une
    // erreur explicite pour que l'utilisateur puisse réessayer.
    if (filteredOutfits.length === 0 && validatedOutfits.length > 0) {
        throw new Error("Aucune des tenues proposées ne respectait les contraintes (météo, structure). Réessaie.");
    }

    return filteredOutfits;
}

// --- GÉNÉRATION DE VARIANTES (REMPLACEMENT D'UNE PIÈCE) ---
export async function generateOutfitVariants(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    context: string,
    outfitToModify: OutfitSuggestion,
    itemsToReplace: OutfitItem[],
    weatherInfo?: string | null
): Promise<OutfitSuggestion[]> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    // Filtrer les items exclus ET ceux qui sont dans des ensembles
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id) && !item.isExcluded);

    const individualItemsFormatted = individualItems.map(item =>
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Matière: ${item.material})`
    ).join('\n');
    // Pas de sets dans les variantes : on remplace 1 pièce par 1 pièce individuelle uniquement
    const availableClothes = individualItemsFormatted;

    // Construire la liste des items à garder (tous sauf ceux à remplacer)
    const replaceIds = new Set(itemsToReplace.map(item => item.id));
    const itemsToKeep = outfitToModify.vetements.filter(item => !replaceIds.has(item.id));
    const keepInstruction = itemsToKeep.map(item =>
        `  ✅ GARDER : "${item.description}" (ID: ${item.id})`
    ).join('\n');

    const replaceInstruction = itemsToReplace.map(item =>
        `  ❌ REMPLACER : "${item.description}" (ID: ${item.id})`
    ).join('\n');
    const multipleReplacements = itemsToReplace.length > 1;

    const prompt = `Tu es un styliste expert. L'utilisateur aime cette tenue mais veut remplacer ${multipleReplacements ? `${itemsToReplace.length} pièces` : 'UNE SEULE pièce'}.

**TENUE ACTUELLE** : "${outfitToModify.titre}"
${outfitToModify.description}

**INSTRUCTIONS DE MODIFICATION** :
${keepInstruction}
${replaceInstruction}

⚠️ **RÈGLE ABSOLUE** : Tu DOIS inclure EXACTEMENT les mêmes articles marqués "✅ GARDER" avec leurs IDs exacts dans chacune des 3 tenues.
Tu dois UNIQUEMENT remplacer ${multipleReplacements ? 'les articles marqués "❌ REMPLACER"' : 'l\'article marqué "❌ REMPLACER"'} par ${multipleReplacements ? 'des alternatives différentes' : 'une alternative différente'} parmi les vêtements disponibles.
Tu ne peux remplacer qu'avec des PIÈCES INDIVIDUELLES (pas un ensemble/set). Choisis uniquement parmi les articles listés ci-dessous.
${multipleReplacements ? '\n⚠️ Les nouvelles pièces doivent être cohérentes ENTRE ELLES, en plus d\'être cohérentes avec les pièces conservées (couleurs, style, occasion).' : ''}

**CONTEXTE** : ${context}

Vêtements disponibles (pièces individuelles uniquement) :
${availableClothes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${STYLE_RULES}

**VARIÉTÉ & DIVERSIFICATION DES ALTERNATIVES** :

🔴 **OBLIGATION : 3 ALTERNATIVES VRAIMENT DIFFÉRENTES**
${multipleReplacements ? 'Applique les règles ci-dessous à CHAQUE pièce remplacée, en fonction de sa catégorie.' : ''}

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

${ACCESSORY_RULES}
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
2. Vérifie que ${multipleReplacements ? 'chaque article de remplacement a' : "l'article de remplacement a"} un ID qui existe dans la liste disponible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Génère 3 variantes qui respectent TOUTES les règles ci-dessus.`;

    let validatedOutfits: OutfitSuggestion[];
    try {
        const result = await generateOutfitVariantsFunctionCall({ prompt });
        const data = result.data as { tenues: OutfitSuggestion[] };

        // Validation et correction des IDs (pas de sets en mode variantes)
        validatedOutfits = validateAndFixOutfitIds(data.tenues, individualItems, []);
    } catch (error) {
        console.error("Erreur génération variantes:", error);
        throw new Error("Erreur lors de la génération des variantes.", { cause: error });
    }

    // Mêmes contraintes dures que la génération initiale (structure,
    // météo, layering du pull col V/zippé) : une variante ne doit pas
    // pouvoir réintroduire une combinaison interdite, cf. outfitConstraints.ts.
    const temperatureCelsius = parseTemperatureCelsius(weatherInfo);
    const filteredOutfits = filterOutfitsByHardConstraints(validatedOutfits, clothingList, [], {
        temperatureCelsius,
    });

    if (filteredOutfits.length === 0 && validatedOutfits.length > 0) {
        throw new Error("Aucune des variantes proposées ne respectait les contraintes (météo, structure, layering). Réessaie.");
    }

    return filteredOutfits;
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
- Afficher les IDs techniques dans le texte de ta réponse (ils sont moches et inutiles pour l'utilisateur) — l'ID a sa place UNIQUEMENT dans le champ structuré suggestedReplacement, jamais dans "message"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 **QUAND PROPOSER UN REMPLACEMENT ACTIONNABLE (suggestedReplacement)** :

Si l'utilisateur demande EXPLICITEMENT de changer une pièce précise de la
tenue actuelle (pas juste "qu'est-ce que tu en penses ?" ou une question
générale), et que cette pièce fait partie de la liste "Pièces composant
cette tenue" ci-dessous, remplis le champ suggestedReplacement avec :
- itemId : l'ID EXACT de cette pièce (copié tel quel depuis la liste)
- itemDescription : sa description, pour l'affichage

✅ Exemples qui DOIVENT déclencher suggestedReplacement :
- "remplace le haut par quelque chose de plus habillé"
- "je n'aime pas ce pantalon, change-le"
- "propose autre chose à la place des baskets"

❌ Exemples qui NE DOIVENT PAS le déclencher (laisse null) :
- "qu'est-ce que tu penses de cette tenue ?"
- "comment je pourrais l'accessoiriser ?"
- toute question qui ne désigne pas une pièce précise à changer

Ne propose JAMAIS de nouvel article dans ce champ — c'est la régénération
qui choisira le remplacement parmi la garde-robe, en respectant les
mêmes règles de style et de température que la génération normale. Ton
rôle ici est seulement d'identifier QUELLE pièce l'utilisateur veut
changer, pas PAR QUOI.

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
- Si tu remplis suggestedReplacement, dis dans "message" que tu proposes de remplacer cette pièce (ex: "Je te propose de remplacer le pull par autre chose de plus habillé, clique sur le bouton ci-dessous pour voir les options")

🔒 **FORMAT DE RÉPONSE JSON** :
{
  "message": "Ta réponse textuelle ici",
  "isRejected": true/false,
  "suggestedReplacement": { "itemId": "...", "itemDescription": "..." } ou null
}

⚠️ Mets "isRejected": true UNIQUEMENT si la question est TOTALEMENT hors-sujet mode/style (recette, code, math, histoire, etc.)
✅ Mets "isRejected": false pour toute question liée à la mode, même vaguement`;

    try {
        const result = await generateChatResponseFunctionCall({ prompt });
        const data = result.data as ChatResponse;

        // Défense contre un ID halluciné : suggestedReplacement ne doit
        // désigner qu'une pièce qui fait RÉELLEMENT partie de la tenue en
        // cours de discussion, sinon le bouton "Appliquer" pointerait vers
        // un article inexistant dans cette tenue.
        const isValidReplacement = data.suggestedReplacement
            && outfit.vetements.some(item => item.id === data.suggestedReplacement!.itemId);

        return {
            message: data.message,
            isRejected: data.isRejected,
            suggestedReplacement: isValidReplacement ? data.suggestedReplacement : null
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
