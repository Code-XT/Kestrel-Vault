import * as LocalAuthentication from 'expo-local-authentication';

export async function getBiometricCapabilities() {
  const available = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return { available, enrolled, types };
}

/**
 * Prompts Face ID / Touch ID / Android biometric or device-credential fallback.
 * Returns true only on a successful, non-cancelled authentication.
 */
export async function authenticateWithBiometrics(reason = 'Unlock your Kestrel Vault'): Promise<boolean> {
  const { available, enrolled } = await getBiometricCapabilities();
  if (!available || !enrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false, // allow passcode fallback per spec (device passcode)
  });

  return result.success;
}
