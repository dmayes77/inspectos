import { App, AppState } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardInfo } from "@capacitor/keyboard";

// =============================================================================
// APP LIFECYCLE
// =============================================================================

type AppStateCallback = (state: { isActive: boolean }) => void;
const appStateListeners: Set<AppStateCallback> = new Set();
let appStateHandle: (() => void) | null = null;

export function addAppStateListener(callback: AppStateCallback): () => void {
  appStateListeners.add(callback);

  if (appStateListeners.size === 1) {
    setupAppStateListener();
  }

  return () => {
    appStateListeners.delete(callback);
    if (appStateListeners.size === 0 && appStateHandle) {
      appStateHandle();
      appStateHandle = null;
    }
  };
}

async function setupAppStateListener(): Promise<void> {
  try {
    const handle = await App.addListener("appStateChange", (state: AppState) => {
      appStateListeners.forEach((cb) => cb({ isActive: state.isActive }));
    });
    appStateHandle = () => handle.remove();
  } catch {
    // Not available on web
  }
}

export async function getAppInfo(): Promise<{
  name: string;
  id: string;
  version: string;
  build: string;
} | null> {
  try {
    const info = await App.getInfo();
    return {
      name: info.name,
      id: info.id,
      version: info.version,
      build: info.build,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// BACK BUTTON HANDLING (Android)
// =============================================================================

type BackButtonCallback = () => boolean; // Return true to prevent default
const backButtonListeners: Set<BackButtonCallback> = new Set();
let backButtonHandle: (() => void) | null = null;

export function addBackButtonListener(callback: BackButtonCallback): () => void {
  backButtonListeners.add(callback);

  if (backButtonListeners.size === 1) {
    setupBackButtonListener();
  }

  return () => {
    backButtonListeners.delete(callback);
    if (backButtonListeners.size === 0 && backButtonHandle) {
      backButtonHandle();
      backButtonHandle = null;
    }
  };
}

async function setupBackButtonListener(): Promise<void> {
  try {
    const handle = await App.addListener("backButton", () => {
      // Call listeners in reverse order (most recent first)
      const listeners = Array.from(backButtonListeners).reverse();
      for (const cb of listeners) {
        if (cb()) return; // Stop if handler returns true
      }
    });
    backButtonHandle = () => handle.remove();
  } catch {
    // Not available on web
  }
}

// =============================================================================
// URL OPEN (Deep Links)
// =============================================================================

type UrlOpenCallback = (url: string) => void;

export function addUrlOpenListener(callback: UrlOpenCallback): () => void {
  let handle: (() => void) | null = null;

  App.addListener("appUrlOpen", ({ url }) => {
    callback(url);
  }).then((h) => {
    handle = () => h.remove();
  });

  return () => {
    if (handle) handle();
  };
}

// =============================================================================
// STATUS BAR
// =============================================================================

export async function setStatusBarStyle(style: "dark" | "light"): Promise<void> {
  try {
    await StatusBar.setStyle({
      style: style === "dark" ? Style.Dark : Style.Light,
    });
  } catch {
    // Not available on web
  }
}

export async function hideStatusBar(): Promise<void> {
  try {
    await StatusBar.hide();
  } catch {
    // Not available on web
  }
}

export async function showStatusBar(): Promise<void> {
  try {
    await StatusBar.show();
  } catch {
    // Not available on web
  }
}

export async function setStatusBarColor(color: string): Promise<void> {
  try {
    await StatusBar.setBackgroundColor({ color });
  } catch {
    // Not available on web or iOS
  }
}

// =============================================================================
// SPLASH SCREEN
// =============================================================================

export async function hideSplashScreen(): Promise<void> {
  try {
    await SplashScreen.hide();
  } catch {
    // Not available on web
  }
}

export async function showSplashScreen(): Promise<void> {
  try {
    await SplashScreen.show({
      autoHide: false,
    });
  } catch {
    // Not available on web
  }
}

// =============================================================================
// KEYBOARD
// =============================================================================

type KeyboardCallback = (info: { height: number; isVisible: boolean }) => void;
const keyboardListeners: Set<KeyboardCallback> = new Set();
let keyboardShowHandle: (() => void) | null = null;
let keyboardHideHandle: (() => void) | null = null;

export function addKeyboardListener(callback: KeyboardCallback): () => void {
  keyboardListeners.add(callback);

  if (keyboardListeners.size === 1) {
    setupKeyboardListeners();
  }

  return () => {
    keyboardListeners.delete(callback);
    if (keyboardListeners.size === 0) {
      if (keyboardShowHandle) {
        keyboardShowHandle();
        keyboardShowHandle = null;
      }
      if (keyboardHideHandle) {
        keyboardHideHandle();
        keyboardHideHandle = null;
      }
    }
  };
}

async function setupKeyboardListeners(): Promise<void> {
  try {
    const showHandle = await Keyboard.addListener("keyboardWillShow", (info: KeyboardInfo) => {
      keyboardListeners.forEach((cb) =>
        cb({ height: info.keyboardHeight, isVisible: true })
      );
    });
    keyboardShowHandle = () => showHandle.remove();

    const hideHandle = await Keyboard.addListener("keyboardWillHide", () => {
      keyboardListeners.forEach((cb) => cb({ height: 0, isVisible: false }));
    });
    keyboardHideHandle = () => hideHandle.remove();
  } catch {
    // Not available on web
  }
}

export async function hideKeyboard(): Promise<void> {
  try {
    await Keyboard.hide();
  } catch {
    // Not available on web
  }
}

export async function showKeyboard(): Promise<void> {
  try {
    await Keyboard.show();
  } catch {
    // Not available on web
  }
}
