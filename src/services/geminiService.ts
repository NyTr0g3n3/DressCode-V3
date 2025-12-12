import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis } from '../types';
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
        ? `\n**RÈGLE D'ANCRAGE : La tenue DOIT inclure : "${('name' in anchorItemOrSet ? anchorItemOrSet.name : anchorItemOrSet.analysis)} (ID: ${anchorItemOrSet.id})".**\n`
        : '';

    const prompt = `Tu es un styliste expert. Crée 3 tenues complètes et harmonieuses pour : "${context}".

Vêtements disponibles :
${availableClothes}
${anchorInstruction}

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
✅ **Veste/Blazer** → Sur t-shirt, chemise, pull fin, ou col roulé
✅ **Manteau** → Sur pull, sweat, ou veste (si très froid)
✅ **Col roulé** → JAMAIS avec chemise !

❌ **INTERDICTIONS ABSOLUES DE LAYERING** :
- JAMAIS chemise avec col roulé (aberration stylistique)
- JAMAIS col V sans rien dessous en contexte formel
- JAMAIS pull épais sous veste ajustée (volume excessif)
- JAMAIS 2 cols montants ensemble (col roulé + col montant)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 PRIORITÉ 3 - COHÉRENCE & HARMONIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STRUCTURE** : Chaque tenue = Haut + Bas + Chaussures (minimum)

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

**IMPORTANT** : Utilise les IDs EXACTS des articles. Sois créatif dans les limites.`;

    try {
        const result = await generateOutfitsFunctionCall({ prompt });
        const data = result.data as { tenues: OutfitSuggestion[] };
        return data.tenues;
    } catch (error) {
        console.error("Erreur génération tenues:", error);
        throw new Error("Erreur lors de la génération des tenues.");
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
        ? `\n**CONTRAINTE POIDS** : Le poids total NE DOIT PAS dépasser ${maxWeight} kg. Estime le poids moyen (t-shirt ~150g, jean ~600g, pull ~400g, chaussures ~800g).`
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
