import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { colors, radii, spacing, typography } from '@/theme/theme';
import type { VaultField, VaultItemCategory } from '@/types';

interface Props {
  category: VaultItemCategory;
  title: string;
  subtitle?: string;
  accentColor: string;
  fields: VaultField[];
  barcodeValue?: string;
}

/**
 * The "dynamic skeleton preview" from the spec: as the user types into the
 * add-ticket form, this renders live onto a stylized ticket layout with
 * cutout side notches and a barcode/QR area.
 */
export default function TicketPreview({ category, title, subtitle, accentColor, fields, barcodeValue }: Props) {
  const primaryFields = fields.slice(0, 4);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[accentColor, shade(accentColor)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ticket}
      >
        <View style={styles.headerRow}>
          <Text style={styles.category}>{category.replace('_', ' ').toUpperCase()}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title || 'Untitled'}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.fieldGrid}>
          {primaryFields.length === 0 ? (
            <Text style={styles.placeholder}>Fill in the details below…</Text>
          ) : (
            primaryFields.map((f) => (
              <View key={f.id} style={styles.fieldCell}>
                <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {f.value || '—'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.barcodeArea}>
          {barcodeValue ? (
            <QRCode value={barcodeValue} size={64} backgroundColor="transparent" color="#0B0B0F" />
          ) : (
            <View style={styles.barcodePlaceholder} />
          )}
        </View>

        {/* Side notches for the ticket-stub look */}
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={[styles.notch, styles.notchRight]} />
      </LinearGradient>
    </View>
  );
}

function shade(hex: string): string {
  // Simple darken for gradient end color
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - 40);
  const g = Math.max(0, ((n >> 8) & 0xff) - 40);
  const b = Math.max(0, (n & 0xff) - 40);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  ticket: {
    borderRadius: radii.lg,
    padding: spacing.md,
    overflow: 'hidden',
    minHeight: 200,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  category: { color: 'rgba(11,11,15,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#0B0B0F', marginTop: spacing.xs },
  subtitle: { fontSize: 13, fontWeight: '600', color: 'rgba(11,11,15,0.65)', marginTop: 2 },
  divider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(11,11,15,0.25)',
    marginVertical: spacing.md,
  },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  fieldCell: { minWidth: '40%' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(11,11,15,0.55)', letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, fontWeight: '700', color: '#0B0B0F', marginTop: 2 },
  placeholder: { color: 'rgba(11,11,15,0.5)', fontSize: 13, fontStyle: 'italic' },
  barcodeArea: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  barcodePlaceholder: {
    width: 140,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(11,11,15,0.15)',
  },
  notch: {
    position: 'absolute',
    top: '52%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  notchLeft: { left: -10 },
  notchRight: { right: -10 },
});
