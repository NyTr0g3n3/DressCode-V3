import type { ClothingItem, ClothingSet, OutfitSuggestion, VacationPlan, OutfitItem } from '../types';

// Gemini renvoie parfois des IDs légèrement altérés (tronqués, reformatés,
// ou carrément une description à la place de l'ID). Ces fonctions vérifient
// chaque ID renvoyé contre la garde-robe réelle et tentent une correction
// par correspondance de description avant d'abandonner.

// Fonction de validation et correction des IDs
export function validateAndFixOutfitIds(
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

            // Si l'ID est valide, on le garde (nettoyé des espaces superflus)
            if (allValidIds.has(cleanId)) {
                return cleanId === vetement.id ? vetement : { ...vetement, id: cleanId };
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
export function validateAndFixVacationPlanIds(
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

            // Si l'ID est valide (item individuel OU set), on le garde (nettoyé des espaces superflus)
            if (allValidIds.has(cleanId)) {
                // Si c'est un set, marquer comme traité
                if (sets.some(s => s.id === cleanId)) {
                    processedSetIds.add(cleanId);
                }
                return cleanId === item.id ? item : { ...item, id: cleanId };
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
