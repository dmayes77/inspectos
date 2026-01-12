import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "app.inspectos",
  appName: "InspectOS",
  webDir: "out",
  server: {
    // For development on physical device, use your Mac's IP address
    // Run `npm run dev` first, then rebuild the iOS app
    // To find your IP: the dev server shows it as "Network: http://x.x.x.x:3000"
    // Comment out 'url' for production builds
    url: "http://192.168.1.141:3000",
    cleartext: true,
  },
  plugins: {
    Camera: {
      presentationStyle: "fullscreen",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: "#09090b",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#09090b",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    Geolocation: {
      // No special config needed
    },
  },
  ios: {
    contentInset: "always",
    scheme: "InspectOS",
    backgroundColor: "#09090b",
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#09090b",
  },
};

export default config;
