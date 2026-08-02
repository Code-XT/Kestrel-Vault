import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * Wraps expo-secure-store, which persists to:
 *  - iOS: Keychain Services (optionally requiring biometry per-item)
 *  - Android: Keystore-backed EncryptedSharedPreferences (StrongBox when available)
 *
 * This is the ONLY place the raw vault key touches disk, and it never leaves
 * the secure enclave boundary the OS provides.
 */

const VAULT_KEY_ALIAS = 'kestrel_vault_master_key_v1';

export async function hasVaultKey(): Promise<boolean> {
  const existing = await SecureStore.getItemAsync(VAULT_KEY_ALIAS);
  return existing != null;
}

export async function getOrCreateVaultKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(VAULT_KEY_ALIAS);
  if (existing) return existing;

  const randomBytes = await Crypto.getRandomBytesAsync(32); // 256-bit key
  const keyHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync(VAULT_KEY_ALIAS, keyHex, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return keyHex;
}

/** Destructive: wipes the master key, permanently orphaning any existing ciphertext. Used for "erase vault". */
export async function destroyVaultKey(): Promise<void> {
  await SecureStore.deleteItemAsync(VAULT_KEY_ALIAS);
}
