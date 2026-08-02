import crypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';
import * as storage from './storage';
import { deriveBackupKey, newSaltHex } from './crypto';
import type { VaultItem } from '@/types';

/**
 * Encrypted export/import payload shape uploaded to Google Drive.
 *
 * This is intentionally a SEPARATE encryption layer from the on-device vault
 * key (crypto.ts): the backup key is derived from a user-chosen passphrase
 * via PBKDF2, so the payload can be decrypted on a different device (or after
 * reinstalling the app) without ever needing the original device's secure
 * enclave. Google never sees the passphrase or the derived key — only this
 * ciphertext — so the backup destination has zero knowledge of the contents.
 */
export interface BackupPayload {
  version: 1;
  createdAt: number;
  itemCount: number;
  salt: string; // hex, PBKDF2 salt
  iv: string; // hex, AES-GCM IV
  cipherText: string; // base64, AES-256-GCM(JSON({ items }))
}

const AUTH_TAG_BYTES = 16;

export async function createEncryptedBackup(passphrase: string): Promise<BackupPayload> {
  const items = await storage.getAllVaultItemsDecrypted();
  const salt = newSaltHex();
  const keyHex = deriveBackupKey(passphrase, salt);
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify({ items }), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    createdAt: Date.now(),
    itemCount: items.length,
    salt,
    iv: Buffer.from(iv).toString('hex'),
    cipherText: Buffer.concat([encrypted, authTag]).toString('base64'),
  };
}

/** Decrypts and re-imports every item from a backup payload into the local encrypted vault. */
export async function restoreFromBackup(payload: BackupPayload, passphrase: string): Promise<number> {
  const keyHex = deriveBackupKey(passphrase, payload.salt);
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(payload.iv, 'hex');

  const raw = Buffer.from(payload.cipherText, 'base64');
  const authTag = raw.subarray(raw.length - AUTH_TAG_BYTES);
  const encrypted = raw.subarray(0, raw.length - AUTH_TAG_BYTES);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  // Throws on a wrong passphrase (auth tag mismatch) rather than silently
  // producing garbage — surface that to the caller as a normal rejection.
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  const { items } = JSON.parse(decrypted.toString('utf8')) as { items: VaultItem[] };
  for (const item of items) {
    await storage.saveVaultItem(item);
  }
  return items.length;
}
