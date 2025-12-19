import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis, ChatMessage, ChatResponse, OutfitItem } from '../types';
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
    throw new Error("Erreur lors de l'analyse des vêtements.");
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
    anchorItemOrSet?: ClothingItem | ClothingSet
): Promise<OutfitSuggestion[]> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    // Filtrer les items exclus ET ceux qui sont dans des ensembles
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id) && !item.isExcluded);

    const individualItemsFormatted = individualItems.map(item =>
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Matière: ${item.material})`
    ).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

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
${anchorInstruction}
Vêtements disponibles :
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

**COULEURS** :
- Maximum 3 couleurs par tenue
- 1 seul motif maximum (si haut à motifs → bas uni)
- Évite contrastes trop proches (bleu marine + noir)

**VARIÉTÉ** :
- 3 looks visuellement différents
- Évite de répéter le même pantalon 3 fois si possible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ ACCESSOIRES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**OBLIGATOIRES** :
- Montre : TOUJOURS inclure si disponible dans les accessoires

**OPTIONNELS** :
- Bracelet : Peut être ajouté EN PLUS de la montre si disponible
- Ceinture : Pour pantalon classique
- Écharpe : Si < 10°C

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
        throw new Error("Erreur lors de la génération des tenues.");
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
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

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

**CONTEXTE** : ${context}

Vêtements disponibles :
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

**COULEURS** :
- Maximum 3 couleurs par tenue
- 1 seul motif maximum (si haut à motifs → bas uni)
- Évite contrastes trop proches (bleu marine + noir)

**VARIÉTÉ** :
- 3 alternatives DIFFÉRENTES pour remplacer la pièce désignée
- Garde l'harmonie avec les pièces conservées

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ ACCESSOIRES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**OBLIGATOIRES** :
- Montre : TOUJOURS inclure si disponible dans les accessoires

**OPTIONNELS** :
- Bracelet : Peut être ajouté EN PLUS de la montre si disponible
- Ceinture : Pour pantalon classique
- Écharpe : Si < 10°C

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

        // Validation et correction des IDs
        const validatedOutfits = validateAndFixOutfitIds(data.tenues, individualItems, sets);

        return validatedOutfits;
    } catch (error) {
        console.error("Erreur génération variantes:", error);
        throw new Error("Erreur lors de la génération des variantes.");
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
        throw new Error("Erreur lors de la génération de la réponse.");
    }
}

// Cloud Function pour l'analyse de garde-robe
const analyzeWardrobeGapsFunctionCall = httpsCallable(functions, 'analyzeWardrobeGapsFunction');

// --- ANALYSE DE GARDE-ROBE & SUGGESTIONS D'ACHATS ---
export async function analyzeWardrobeGaps(
  clothingItems: ClothingItem[],
  clothingSets: ClothingSet[]
): Promise<WardrobeAnalysis> {
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
    return result.data as WardrobeAnalysis;
  } catch (error) {
    console.error("Erreur analyse garde-robe:", error);
    throw new Error("Erreur lors de l'analyse de la garde-robe.");
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
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const weightInstruction = maxWeight
        ? `\n**CONTRAINTE POIDS** : Le poids total NE DOIT PAS dépasser ${maxWeight} kg. Estime le poids moyen selon ces références réalistes :
- T-shirt : ~150g
- Chemise : ~200g
- Jean/Denim : ~900g
- Pantalon coton/chino : ~500g
- Jogging/Pantalon léger : ~350g
- Pull laine : ~700g
- Sweat : ~400g
- Veste légère : ~500g
- Manteau/Doudoune : ~1kg
- Chaussures (par paire) : ~1kg
- Baskets (par paire) : ~1kg
- Chaussures de ville cuir : ~1,2kg
- Sous-vêtements : ~50g
- Chaussettes : ~50g`
        : '';

    const prompt = `Tu es un expert en préparation de valise. Crée une **CAPSULE WARDROBE** optimisée pour ${days} jours.

**DESTINATION & CONTEXTE** : ${context}

**PRINCIPE CAPSULE WARDROBE** : Sélectionner peu de pièces qui se combinent TOUTES entre elles pour créer un maximum de tenues différentes.

**RÈGLES CRITIQUES** :

1. **LOGIQUE THERMIQUE (PRIORITÉ ABSOLUE)** :

   | Température | Vêtements adaptés |
   |-------------|-------------------|
   | **> 30°C (TRÈS CHAUD)** | T-shirts légers, shorts, robes, sandales. INTERDITS : jeans, pulls, vestes |
   | **25-30°C (CHAUD)** | T-shirts, pantalons légers, une chemise, baskets légères |
   | **15-25°C (DOUX)** | Mix léger + 1 pull fin ou veste légère |
   | **10-15°C (FRAIS)** | Pulls, pantalons, veste, chaussures fermées |
   | **< 10°C (FROID)** | Layering complet : sous-couche + pull + manteau chaud |

2. **INTERDICTIONS ABSOLUES** :
   - ❌ Doudoune/veste ski/polaire épaisse si > 20°C
   - ❌ Shorts si < 15°C
   - ❌ Sandales si < 18°C
   - ❌ Pulls en laine si > 25°C
   - ❌ Jeans épais si > 32°C

3. **MATIÈRES ADAPTÉES** :
   - **Climat chaud** : Coton léger, lin, matières respirantes uniquement
   - **Climat froid** : Laine, polaire, matières isolantes
   - **Voyage** : Privilégier matières qui ne se froissent pas

4. **HARMONIE CAPSULE (pour que tout se combine)** :
   - **Palette de couleurs** : Maximum 4-5 couleurs qui vont ensemble (ex: bleu marine, blanc, beige, une couleur d'accent)
   - **Motifs** : Maximum 2 pièces à motifs dans toute la valise, le reste UNI
   - **Neutralité** : Au moins 50% de pièces en couleurs neutres (noir, blanc, gris, beige, marine)

5. **QUANTITÉS RECOMMANDÉES pour ${days} jours** :
   - Hauts : ${Math.min(days + 1, 7)} pièces max (on peut reporter un t-shirt)
   - Bas : ${Math.min(Math.ceil(days / 2) + 1, 4)} pièces max
   - Chaussures : 2-3 paires max
   - Accessoires : selon besoin

6. **LAYERING INTELLIGENT (si climat variable)** :
   - Prévoir des couches qui s'empilent : t-shirt → chemise/pull léger → veste
   - Chaque couche doit être portable seule ET en combinaison

${weightInstruction}

**VÊTEMENTS DISPONIBLES** :
${availableClothes}

**SORTIE** :
- Un titre accrocheur pour cette valise
- Un résumé expliquant tes choix (météo, style, combinaisons possibles)
- La liste des articles avec leur ID exact`;

    try {
        const result = await generateVacationPlanFunctionCall({ prompt });
        return result.data as VacationPlan;
    } catch (error) {
        console.error("Erreur génération plan vacances:", error);
        throw new Error("Erreur lors de la génération du plan vacances.");
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
