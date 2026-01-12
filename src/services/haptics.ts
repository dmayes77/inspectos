import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

// =============================================================================
// HAPTIC FEEDBACK
// =============================================================================

export async function impactLight(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics not available on this device
  }
}

export async function impactMedium(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Haptics not available on this device
  }
}

export async function impactHeavy(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    // Haptics not available on this device
  }
}

export async function notificationSuccess(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics not available on this device
  }
}

export async function notificationWarning(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Haptics not available on this device
  }
}

export async function notificationError(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // Haptics not available on this device
  }
}

export async function vibrate(duration = 300): Promise<void> {
  try {
    await Haptics.vibrate({ duration });
  } catch {
    // Haptics not available on this device
  }
}

export async function selectionStart(): Promise<void> {
  try {
    await Haptics.selectionStart();
  } catch {
    // Haptics not available on this device
  }
}

export async function selectionChanged(): Promise<void> {
  try {
    await Haptics.selectionChanged();
  } catch {
    // Haptics not available on this device
  }
}

export async function selectionEnd(): Promise<void> {
  try {
    await Haptics.selectionEnd();
  } catch {
    // Haptics not available on this device
  }
}
