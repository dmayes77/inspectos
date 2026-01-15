/**
 * Biometrics stub
 * Replace with a real plugin (e.g., capacitor-native-biometric) when available.
 */

export type BiometricStatus = "available" | "unavailable";

export async function checkBiometrics(): Promise<BiometricStatus> {
  // TODO: implement with a real biometric plugin
  return "unavailable";
}

export async function requestBiometricAuth(reason = "Unlock"): Promise<boolean> {
  // TODO: implement with a real biometric plugin
  console.warn("Biometric auth not implemented. Returning false.");
  return false;
}
