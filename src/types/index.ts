export type VaultItemCategory =
  | 'payment_card'
  | 'identity_card'
  | 'loyalty_card'
  | 'flight'
  | 'train'
  | 'bus'
  | 'movie'
  | 'concert'
  | 'sports'
  | 'other';

export const CARD_CATEGORIES: { key: VaultItemCategory; label: string; icon: string }[] = [
  { key: 'payment_card', label: 'Payment Card', icon: 'credit-card' },
  { key: 'identity_card', label: 'Identity Card', icon: 'id-card' },
  { key: 'loyalty_card', label: 'Loyalty Card', icon: 'star' },
];

export const TICKET_CATEGORIES: { key: VaultItemCategory; label: string; icon: string; accent: string }[] = [
  { key: 'flight', label: 'Flight', icon: 'plane', accent: '#4C82FB' },
  { key: 'train', label: 'Train', icon: 'train', accent: '#4C82FB' },
  { key: 'bus', label: 'Bus', icon: 'bus', accent: '#4C82FB' },
  { key: 'movie', label: 'Movie', icon: 'film', accent: '#9B6BFF' },
  { key: 'concert', label: 'Concert', icon: 'music', accent: '#9B6BFF' },
  { key: 'sports', label: 'Sports', icon: 'trophy', accent: '#FF9F4C' },
];

/** A single dynamic key/value metadata field attached to a vault item. */
export interface VaultField {
  id: string;
  label: string;
  value: string;
  /** Sensitive fields are masked by default in the UI (card numbers, CVV, national IDs, etc). */
  sensitive: boolean;
  /** Optional formatting hint used by the masking utility. */
  format?: 'card_number' | 'expiry' | 'cvv' | 'generic';
}

/** The unencrypted, in-memory shape of a vault item. Only ever persisted in encrypted form. */
export interface VaultItem {
  id: string;
  category: VaultItemCategory;
  title: string;
  subtitle?: string;
  createdAt: number;
  updatedAt: number;

  /** Local URIs to the (encrypted-at-rest) front/back images, if this item came from a scan. */
  frontImageUri?: string;
  backImageUri?: string;

  /** Dynamic metadata fields, e.g. Card Number, Expiry, CVV, PNR, Seat, Gate. */
  fields: VaultField[];

  /** Optional barcode/QR payload for tickets. */
  barcodeValue?: string;
  barcodeType?: 'qr' | 'barcode';

  /** Visual accent used for ticket rendering (category-driven, user-overridable). */
  accentColor?: string;

  /** Issuer / network branding shown in the detail footer (e.g. "Chase", "Visa"). */
  issuer?: string;
  network?: string;
}

/** Row shape as stored in SQLite: everything except non-sensitive indexing columns is an encrypted blob. */
export interface EncryptedVaultRow {
  id: string;
  category: VaultItemCategory;
  title: string;
  createdAt: number;
  updatedAt: number;
  cipherText: string; // AES-GCM ciphertext of the JSON-serialized VaultItem
  iv: string;
}

export interface AppLockState {
  isUnlocked: boolean;
  hasVaultKey: boolean;
  biometricsAvailable: boolean;
  biometricsEnrolled: boolean;
}
