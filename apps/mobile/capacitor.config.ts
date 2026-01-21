import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspectos.app',
  appName: 'InspectOS',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'inspectos',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for InspectOS'
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for InspectOS'
      }
    }
  }
};

export default config;
