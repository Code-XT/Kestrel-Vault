import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createEncryptedBackup, restoreFromBackup, type BackupPayload } from './backup';

/**
 * Cloud backup transport. Uses the `drive.appdata` OAuth scope, which grants
 * access ONLY to a hidden per-app folder that isn't visible in the user's
 * normal Drive UI and can't see any of their other files — the closest thing
 * Drive offers to a private app-storage bucket. Combined with the
 * client-side encryption in backup.ts, Google stores only ciphertext and
 * never has the passphrase or derived key, satisfying the spec's
 * "server/cloud has zero knowledge of payload contents" requirement.
 *
 * Requires a custom Dev/Prod build (Google Sign-In ships native code, so it
 * won't run in Expo Go) and a Google Cloud OAuth client — see README.
 */

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_FILENAME = 'kestrel-vault-backup.json';

/** Call once at app startup (e.g. in App.tsx) with your Google Cloud web client ID. */
export function configureGoogleSignIn(webClientId: string, iosClientId?: string) {
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: false,
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });
}

export async function signInToGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  return GoogleSignin.signIn();
}

export async function signOutOfGoogle() {
  await GoogleSignin.signOut();
}

export async function isSignedInToGoogle(): Promise<boolean> {
  return GoogleSignin.hasPreviousSignIn();
}

async function getAccessToken(): Promise<string> {
  const { accessToken } = await GoogleSignin.getTokens();
  return accessToken;
}

async function findBackupFileId(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${BACKUP_FILENAME}'`);
  const res = await fetch(
    `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Google Drive lookup failed: ${res.status}`);
  const json = await res.json();
  return json.files?.[0]?.id ?? null;
}

/** Encrypts the current vault with `passphrase` and uploads it to the app's hidden Drive folder. */
export async function backupToGoogleDrive(passphrase: string): Promise<void> {
  const token = await getAccessToken();
  const payload = await createEncryptedBackup(passphrase);
  const existingId = await findBackupFileId(token);

  const metadata = existingId
    ? { name: BACKUP_FILENAME }
    : { name: BACKUP_FILENAME, parents: ['appDataFolder'] };

  const boundary = 'kestrel_vault_backup_boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const url = existingId
    ? `${DRIVE_UPLOAD_URL}/${existingId}?uploadType=multipart`
    : `${DRIVE_UPLOAD_URL}?uploadType=multipart`;

  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Google Drive backup failed: ${res.status} ${await res.text()}`);
  }
}

/** Returns the number of items restored, or null if no backup was found in Drive. */
export async function restoreFromGoogleDrive(passphrase: string): Promise<number | null> {
  const token = await getAccessToken();
  const fileId = await findBackupFileId(token);
  if (!fileId) return null;

  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Drive download failed: ${res.status}`);

  const payload = (await res.json()) as BackupPayload;
  return restoreFromBackup(payload, passphrase);
}
