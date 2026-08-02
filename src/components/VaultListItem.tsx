import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme/theme';
import type { VaultItemCategory } from '@/types';

const CATEGORY_ICON: Record<VaultItemCategory, string> = {
  payment_card: 'credit-card',
  identity_card: 'user',
  loyalty_card: 'star',
  flight: 'send',
  train: 'align-justify',
  bus: 'truck',
  movie: 'film',
  concert: 'music',
  sports: 'award',
  other: 'archive',
};

interface Props {
  title: string;
  category: VaultItemCategory;
  updatedAt: number;
  onPress: () => void;
}

export default function VaultListItem({ title, category, updatedAt, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Feather name={(CATEGORY_ICON[category] as any) ?? 'archive'} size={18} color={colors.accentBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={typography.body} numberOfLines={1}>{title}</Text>
        <Text style={typography.caption}>{formatCategory(category)} · {formatDate(updatedAt)}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function formatCategory(c: VaultItemCategory) {
  return c.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
