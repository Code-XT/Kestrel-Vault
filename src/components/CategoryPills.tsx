import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/theme/theme';
import type { VaultItemCategory } from '@/types';

interface PillOption {
  key: VaultItemCategory;
  label: string;
  icon: string;
}

interface Props {
  options: PillOption[];
  selected: VaultItemCategory;
  onSelect: (key: VaultItemCategory) => void;
}

export default function CategoryPills({ options, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Feather
              name={(opt.icon as any) ?? 'circle'}
              size={14}
              color={active ? colors.background : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  labelActive: { color: colors.background },
});
