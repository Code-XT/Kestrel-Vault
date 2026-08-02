import React from 'react';
import { View, TextInput, Pressable, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/theme/theme';
import type { VaultField } from '@/types';

interface Props {
  field: VaultField;
  onChange: (next: VaultField) => void;
  onRemove: () => void;
}

export default function DynamicFieldRow({ field, onChange, onRemove }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inputsRow}>
        <TextInput
          style={[styles.input, styles.labelInput]}
          placeholder="Field label"
          placeholderTextColor={colors.textMuted}
          value={field.label}
          onChangeText={(t) => onChange({ ...field, label: t })}
        />
        <TextInput
          style={[styles.input, styles.valueInput]}
          placeholder="Value"
          placeholderTextColor={colors.textMuted}
          value={field.value}
          onChangeText={(t) => onChange({ ...field, value: t })}
        />
        <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
          <Feather name="x" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.sensitiveRow}>
        <Feather name="lock" size={12} color={colors.textSecondary} />
        <View style={{ flex: 1 }} />
        <Switch
          value={field.sensitive}
          onValueChange={(v) => onChange({ ...field, sensitive: v })}
          trackColor={{ true: colors.accentBlue, false: colors.border }}
          thumbColor={colors.textPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelInput: { flex: 0.4 },
  valueInput: { flex: 0.6 },
  removeBtn: { padding: 4 },
  sensitiveRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
});
