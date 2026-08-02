import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme/theme';
import { maskFieldValue, formatCardNumberSpaced } from '@/utils/masking';
import { copyFieldValue } from '@/services/clipboard';
import type { VaultField } from '@/types';

interface Props {
  field: VaultField;
  onCopied?: (label: string) => void;
}

export default function MaskedField({ field, onCopied }: Props) {
  const [revealed, setRevealed] = useState(false);

  const displayValue = revealed
    ? field.format === 'card_number'
      ? formatCardNumberSpaced(field.value)
      : field.value
    : maskFieldValue(field);

  const handleLongPress = async () => {
    await copyFieldValue(field.value);
    onCopied?.(field.label);
  };

  return (
    <Pressable style={styles.row} onLongPress={handleLongPress} delayLongPress={350}>
      <View style={styles.textCol}>
        <Text style={typography.label}>{field.label.toUpperCase()}</Text>
        <Text style={[typography.value, styles.valueText]} numberOfLines={1}>
          {displayValue}
        </Text>
      </View>
      {field.sensitive && (
        <Pressable
          hitSlop={10}
          onPress={() => setRevealed((r) => !r)}
          style={styles.eyeButton}
          accessibilityLabel={revealed ? `Hide ${field.label}` : `Reveal ${field.label}`}
        >
          <Feather name={revealed ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  textCol: { flex: 1, marginRight: spacing.sm },
  valueText: { marginTop: 2 },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
