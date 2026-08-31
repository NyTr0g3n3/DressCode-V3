import { useCallback, useState } from 'react';

const DEFAULT_TOAST_DURATION_MS = 2000;
// Doit correspondre à la duration de la transition de sortie appliquée
// côté rendu (App.tsx) — laisse le temps au fondu de sortie de jouer
// avant de démonter le toast pour de bon.
export const TOAST_EXIT_MS = 300;

/**
 * Toast de notification léger (auto-dismiss). Centralise le pattern
 * setToast(...) + setTimeout(() => setToast(null), ...) répété partout
 * dans App.tsx — et garantit que chaque toast se referme bien tout seul
 * (un appel oublié à ce setTimeout laissait un toast affiché indéfiniment).
 *
 * `visible` bascule à false un peu AVANT que `toast` soit vidé, pour
 * laisser le temps à une transition CSS de sortie (fondu) de jouer plutôt
 * que de faire disparaître le toast d'un coup au démontage.
 */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((message: string, duration: number = DEFAULT_TOAST_DURATION_MS) => {
    setToast(message);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
    setTimeout(() => setToast(null), duration + TOAST_EXIT_MS);
  }, []);

  return { toast, visible, showToast };
}
