import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.inspectos.inspector',
  appName: 'InspectOS Inspector',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
