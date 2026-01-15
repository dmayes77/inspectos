import { PushNotifications } from "@capacitor/push-notifications";

export type PushPermissionState = "granted" | "denied" | "prompt";

export interface PushRegistration {
  token: string;
  platform: "ios" | "android" | "web";
}

export async function checkPushPermission(): Promise<PushPermissionState> {
  const status = await PushNotifications.checkPermissions();
  return status.receive as PushPermissionState;
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  const status = await PushNotifications.requestPermissions();
  return status.receive as PushPermissionState;
}

export async function registerForPush(): Promise<PushRegistration | null> {
  const permission = await checkPushPermission();
  if (permission === "denied") {
    return null;
  }

  if (permission === "prompt") {
    const requested = await requestPushPermission();
    if (requested !== "granted") return null;
  }

  const registration = await new Promise<PushRegistration | null>((resolve) => {
    const onRegister = (token: { value: string }) => {
      cleanup();
      resolve({
        token: token.value,
        platform: getPlatform(),
      });
    };

    const onError = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      PushNotifications.removeListener("registration", onRegister);
      PushNotifications.removeListener("registrationError", onError);
    };

    PushNotifications.addListener("registration", onRegister);
    PushNotifications.addListener("registrationError", onError);
    PushNotifications.register();
  });

  return registration;
}

export async function addPushListeners(options: {
  onNotification?: (notification: any) => void;
  onAction?: (notification: any) => void;
  onError?: (error: any) => void;
}) {
  if (options.onNotification) {
    await PushNotifications.addListener("pushNotificationReceived", options.onNotification);
  }
  if (options.onAction) {
    await PushNotifications.addListener("pushNotificationActionPerformed", options.onAction);
  }
  if (options.onError) {
    await PushNotifications.addListener("registrationError", options.onError);
  }
}

function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  return "web";
}
