# Kestrel Vault

Kestrel Vault is an Expo + React Native vault app for securely storing cards, IDs, loyalty passes, tickets and other private items on-device. It combines local biometric locking, per-record AES-256-GCM encryption, and optional encrypted Google Drive backups so your vault contents stay protected even when synced.

## Features

- Secure vault for:
  - payment cards
  - identity cards
  - loyalty cards
  - flights, trains, buses, concerts, sports, and other passes
- Biometric unlock with Face ID / Touch ID / Android biometrics and device passcode fallback
- Per-item AES-256-GCM encryption
- Device-bound master key stored in OS secure enclave / Keystore via `expo-secure-store`
- Encrypted SQLite-backed vault index with only metadata stored in the clear
- Scan or import card images and auto-suggest fields with OCR
- Custom dynamic fields with sensitive masking
- Reveal/hide sensitive values and long-press copy
- Google Drive encrypted backup/restore using the hidden `appDataFolder`
- "Erase Vault" action that clears vault data and destroys the local encryption key

## Security and architecture

Kestrel Vault is designed with a zero-knowledge security model for both local storage and cloud backup:

- `src/services/keystore.ts`
  - Generates a 256-bit vault key once per device
  - Stores the key only inside `expo-secure-store` using secure OS storage
  - The raw key never leaves the device

- `src/services/crypto.ts`
  - Uses `react-native-quick-crypto` for native AES-256-GCM encryption
  - Encrypts each vault item payload independently
  - Uses a fresh random IV per record and authenticates ciphertext with GCM auth tags

- `src/services/storage.ts`
  - Persists vault items in `expo-sqlite`
  - Stores only non-sensitive index fields (`id`, `category`, `title`, `updatedAt`) in the clear
  - Keeps all sensitive payload data encrypted at rest

- `src/services/backup.ts`
  - Creates encrypted backups by deriving a separate backup key from a user passphrase
  - Uploads only ciphertext to Google Drive
  - Allows restore on another device without requiring the original device key

- `src/services/googleDrive.ts`
  - Uses Google Drive `drive.appdata` scope for private app-only storage
  - Keeps cloud storage zero-knowledge by encrypting before upload

## Getting started

```bash
npm install
npm run start
```

### Run locally

- `npm run android`
- `npm run ios`

### Build requirements

Some native features require a custom development build or prebuild:
- `react-native-quick-crypto`
- `@react-native-google-signin/google-signin`
- `@react-native-ml-kit/text-recognition`
- `expo-local-authentication`

These do not work in plain Expo Go. Use `expo prebuild` or EAS build for full functionality.

## Google Drive backup setup

The app includes Google Drive backup support, but it requires proper Google OAuth configuration:

- Provide a Google Cloud OAuth client ID in `App.tsx`
  - `GOOGLE_WEB_CLIENT_ID`
  - `GOOGLE_IOS_CLIENT_ID`
- Configure `app.json` and platform-specific Google services files
- The app uploads backups to the hidden Drive app data folder
- Backup payloads are encrypted locally with a passphrase before upload

## Project structure

- `App.tsx` — bootstrap + Google Sign-In configuration
- `src/navigation/RootNavigator.tsx` — lock-aware navigation flow
- `src/store/useAppStore.ts` — app state, unlock flow, vault CRUD
- `src/screens/` — UI screens for lock, vault list, item details, adding cards/tickets, and settings
- `src/services/` — encryption, storage, secure key management, biometrics, OCR, clipboard and backup transport
- `src/components/` — reusable UI components like masked fields, ticket previews, card flip, and dynamic form rows
- `src/types/` — typed vault item definitions and categories

## Notes

- Sensitive fields can be marked as such and are masked by default in the UI
- Long-pressing a field copies the raw value after authentication
- The vault key is destroyed on "Erase Vault" to make existing ciphertext unrecoverable

## Future improvements

- Add export/import via local files
- Add password/passphrase-based vault unlock as an alternative to biometrics
- Add full item edit flow
- Add stronger backup UX and passphrase recovery guidance
```
