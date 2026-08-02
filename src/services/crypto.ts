import crypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';
import { getOrCreateVaultKey } from './keystore';

/**
 * Zero-knowledge local encryption layer, backed by react-native-quick-crypto —
 * a native C++/JSI binding of Node's `crypto` module. All AES work runs off
 * the JS thread on a native thread pool, using real AES-256-GCM (authenticated
 * encryption), rather than a JS-only cipher with a bolted-on HMAC.
 *
 * NOTE: react-native-quick-crypto ships native code and is NOT available in
 * Expo Go. Run via an EAS Development Build or `expo prebuild` (the app's
 * config plugin for it is already registered in app.json).
 *
 * Design:
 * - A 256-bit vault key is generated once on-device with a CSPRNG and stored
 *   ONLY inside the platform secure enclave (Keychain on iOS, Android
 *   Keystore/StrongBox-backed on Android) via expo-secure-store.
 * - The key never leaves the device and is never transmitted, including to
 *   any backup destination — cloud backups upload only ciphertext encrypted
 *   under a separate, passphrase-derived key (see backup.ts).
 * - Every write encrypts the full JSON payload with AES-256-GCM using a
 *   fresh random 96-bit IV per record; the 128-bit auth tag is appended to
 *   the ciphertext and verified automatically on decrypt (decipher.final()
 *   throws if the tag doesn't match, i.e. the record was tampered with or
 *   decrypted with the wrong key).
 */

const IV_BYTES = 12; // 96-bit IV, standard for GCM
const AUTH_TAG_BYTES = 16; // 128-bit GCM auth tag

export async function encryptJson(payload: unknown): Promise<{ cipherText: string; iv: string }> {
  const keyHex = await getOrCreateVaultKey();
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_BYTES);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: Buffer.from(iv).toString('hex'),
  };
}

export async function decryptJson<T>(cipherText: string, ivHex: string): Promise<T> {
  const keyHex = await getOrCreateVaultKey();
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');

  const raw = Buffer.from(cipherText, 'base64');
  const authTag = raw.subarray(raw.length - AUTH_TAG_BYTES);
  const encrypted = raw.subarray(0, raw.length - AUTH_TAG_BYTES);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  // Throws if the auth tag doesn't verify — i.e. wrong key or tampered ciphertext.
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}

/** Derives a passphrase-based key for encrypted export/backup payloads (separate from the device vault key). */
export function deriveBackupKey(passphrase: string, saltHex: string): string {
  const salt = Buffer.from(saltHex, 'hex');
  const key = crypto.pbkdf2Sync(passphrase, salt, 210_000, 32, 'sha256');
  return Buffer.from(key).toString('hex');
}

export function newSaltHex(): string {
  return Buffer.from(crypto.randomBytes(16)).toString('hex');
}
