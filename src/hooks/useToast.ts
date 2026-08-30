import { useCallback, useState } from 'react';

const DEFAULT_TOAST_DURATION_MS = 2000;

/**
 * Toast de notification léger (auto-dismiss). Centralise le pattern
 * setToast(...) + setTimeout(() => setToast(null), ...) répété partout
 * dans App.tsx — et garantit que chaque toast se referme bien tout seul
 * (un appel oublié à ce setTimeout laissait un toast affiché indéfiniment).
 */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string, duration: number = DEFAULT_TOAST_DURATION_MS) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, showToast };
}
