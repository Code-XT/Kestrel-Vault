import { maskCardNumber, maskCvv, maskFieldValue, formatCardNumberSpaced } from '../masking';
import type { VaultField } from '@/types';

describe('maskCardNumber', () => {
  it('keeps the last 4 digits visible and masks the rest', () => {
    expect(maskCardNumber('5129884211900764')).toBe('5129 •••• •••• 0764');
  });

  it('handles short/invalid input gracefully', () => {
    expect(maskCardNumber('12')).toBe('••••');
  });
});

describe('maskCvv', () => {
  it('masks all cvv digits', () => {
    expect(maskCvv('123')).toBe('•••');
  });
});

describe('maskFieldValue', () => {
  it('does not mask non-sensitive fields', () => {
    const field: VaultField = { id: '1', label: 'Name', value: 'Jane Doe', sensitive: false };
    expect(maskFieldValue(field)).toBe('Jane Doe');
  });

  it('masks sensitive card_number fields', () => {
    const field: VaultField = {
      id: '2',
      label: 'Card Number',
      value: '5129884211900764',
      sensitive: true,
      format: 'card_number',
    };
    expect(maskFieldValue(field)).toBe('5129 •••• •••• 0764');
  });
});

describe('formatCardNumberSpaced', () => {
  it('groups digits into 4s', () => {
    expect(formatCardNumberSpaced('5129884211900764')).toBe('5129 8842 1190 0764');
  });
});
