import type { VaultField } from '@/types';

/** 5129 •••• •••• 0764 style masking, preserving the last 4 digits. */
export function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const last4 = digits.slice(-4);
  const first4 = digits.slice(0, 4);
  const groupsCount = Math.max(0, Math.ceil(digits.length / 4) - 2);
  const middle = Array.from({ length: groupsCount }, () => '••••').join(' ');
  return [first4, middle, last4].filter(Boolean).join(' ');
}

export function maskCvv(value: string): string {
  return '•'.repeat(Math.max(3, value.length));
}

export function maskGeneric(value: string): string {
  if (value.length <= 2) return '••';
  return `${value[0]}${'•'.repeat(Math.max(3, value.length - 2))}${value[value.length - 1]}`;
}

/** Applies the correct masking strategy based on the field's declared format. */
export function maskFieldValue(field: VaultField): string {
  if (!field.sensitive) return field.value;
  switch (field.format) {
    case 'card_number':
      return maskCardNumber(field.value);
    case 'cvv':
      return maskCvv(field.value);
    case 'expiry':
      return field.value; // expiry is not typically masked
    default:
      return maskGeneric(field.value);
  }
}

/** Pretty-prints a raw card number with spacing for the unmasked view: 5129 8842 1190 0764 */
export function formatCardNumberSpaced(value: string): string {
  return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}
