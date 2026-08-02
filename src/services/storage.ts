import * as SQLite from 'expo-sqlite';
import { decryptJson, encryptJson } from './crypto';
import type { EncryptedVaultRow, VaultItem } from '@/types';

/**
 * Local persistence layer.
 *
 * Only non-sensitive index columns (id, category, title, timestamps) are
 * stored in the clear so the vault list can be queried and sorted without
 * decrypting every record. All actual card/document data lives inside the
 * `cipherText` blob, encrypted with the device-bound key from keystore.ts.
 *
 * expo-sqlite (managed workflow) does not expose SQLCipher directly; this
 * app-layer AES-GCM-equivalent scheme achieves the same "encrypted at rest"
 * guarantee. For a bare/EAS build, swap this module for `sqflite_sqlcipher`
 * (Flutter) or a SQLCipher-linked `react-native-sqlite-storage` build to get
 * full-database-file encryption in addition to per-record encryption.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('kestrel_vault.db');
  }
  return dbPromise;
}

export async function initStorage(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS vault_items (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      cipherText TEXT NOT NULL,
      iv TEXT NOT NULL
    );
  `);
}

export async function saveVaultItem(item: VaultItem): Promise<void> {
  const db = await getDb();
  const { cipherText, iv } = await encryptJson(item);

  await db.runAsync(
    `INSERT INTO vault_items (id, category, title, createdAt, updatedAt, cipherText, iv)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       category=excluded.category,
       title=excluded.title,
       updatedAt=excluded.updatedAt,
       cipherText=excluded.cipherText,
       iv=excluded.iv;`,
    [item.id, item.category, item.title, item.createdAt, item.updatedAt, cipherText, iv]
  );
}

export async function deleteVaultItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM vault_items WHERE id = ?;`, [id]);
}

/** Returns index rows only (no decryption) — safe to render a list without unlocking every field. */
export async function listVaultIndex(): Promise<Pick<EncryptedVaultRow, 'id' | 'category' | 'title' | 'updatedAt'>[]> {
  const db = await getDb();
  return db.getAllAsync<Pick<EncryptedVaultRow, 'id' | 'category' | 'title' | 'updatedAt'>>(
    `SELECT id, category, title, updatedAt FROM vault_items ORDER BY updatedAt DESC;`
  );
}

export async function getVaultItem(id: string): Promise<VaultItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EncryptedVaultRow>(`SELECT * FROM vault_items WHERE id = ?;`, [id]);
  if (!row) return null;
  return decryptJson<VaultItem>(row.cipherText, row.iv);
}

export async function getAllVaultItemsDecrypted(): Promise<VaultItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EncryptedVaultRow>(`SELECT * FROM vault_items ORDER BY updatedAt DESC;`);
  return Promise.all(rows.map((r) => decryptJson<VaultItem>(r.cipherText, r.iv)));
}

/** Wipes all vault data. Paired with keystore.destroyVaultKey() for a full "erase device data" action. */
export async function clearAllVaultItems(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM vault_items;`);
}
