import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dresscode.app',
  appName: 'DressCode',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1A1A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#D4AF37'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1A1A1A'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.dresscode.com'
  }
};

export default config;
