import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const hapticFeedback = {
  light: async () => {
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: async () => {
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  success: async () => {
    if (isNative) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: async () => {
    if (isNative) {
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  }
};
