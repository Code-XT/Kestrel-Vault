/**
 * Central design tokens for Kestrel Vault.
 * Dark-mode-first, per the product spec: rounded containers, minimalist iconography,
 * light-blue / purple accents on near-black surfaces.
 */
export const colors = {
  background: '#0B0B0F',
  surface: '#151519',
  surfaceElevated: '#1E1E24',
  border: '#33333D',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A98A6',
  textMuted: '#6E6C79',
  accentBlue: '#A0C6FF',
  accentBluePressed: '#7FB0FF',
  accentPurple: '#9B6BFF',
  accentOrange: '#FF9F4C',
  danger: '#FF6B6B',
  success: '#5CE0A0',
  overlay: 'rgba(0,0,0,0.6)',
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, letterSpacing: 0.4 },
  value: { fontSize: 15, fontWeight: '700' as const, color: colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};
