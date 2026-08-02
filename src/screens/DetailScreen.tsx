import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '@/theme/theme';
import CardFlip from '@/components/CardFlip';
import TicketPreview from '@/components/TicketPreview';
import MaskedField from '@/components/MaskedField';
import { useAppStore } from '@/store/useAppStore';
import type { VaultItem } from '@/types';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const CARD_CATEGORY_SET = new Set(['payment_card', 'identity_card', 'loyalty_card']);

export default function DetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const getItem = useAppStore((s) => s.getItem);
  const deleteItem = useAppStore((s) => s.deleteItem);
  const [item, setItem] = useState<VaultItem | null>(null);
  const [photosRevealed, setPhotosRevealed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getItem(id).then(setItem);
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xl }]}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const isCard = CARD_CATEGORY_SET.has(item.category);

  const handleDelete = () => {
    Alert.alert('Delete item', `Permanently remove "${item.title}" from your vault?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={typography.h2} numberOfLines={1}>
          {formatCategoryTitle(item.category)}
        </Text>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Feather name="trash-2" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isCard ? (
          <CardFlip
            frontImageUri={item.frontImageUri}
            backImageUri={item.backImageUri}
            photosRevealed={photosRevealed}
            onToggleReveal={() => setPhotosRevealed((r) => !r)}
          />
        ) : (
          <TicketPreview
            category={item.category}
            title={item.title}
            subtitle={item.subtitle}
            accentColor={item.accentColor ?? colors.accentBlue}
            fields={item.fields}
            barcodeValue={item.barcodeValue}
          />
        )}

        <View style={styles.metaSection}>
          <Text style={typography.h2}>{item.title}</Text>
          {!!item.subtitle && <Text style={typography.caption}>{item.subtitle}</Text>}
        </View>

        <View style={styles.fieldsSection}>
          {item.fields.map((f) => (
            <MaskedField key={f.id} field={f} onCopied={(label) => setToast(`${label} copied`)} />
          ))}
        </View>

        {(item.issuer || item.network) && (
          <View style={styles.footerBrand}>
            {!!item.issuer && <Text style={typography.caption}>{item.issuer}</Text>}
            {!!item.network && <Text style={typography.caption}>{item.network}</Text>}
          </View>
        )}
      </ScrollView>

      {toast && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function formatCategoryTitle(c: string) {
  return c.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  scroll: { paddingBottom: spacing.xl },
  metaSection: { paddingHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: spacing.md },
  fieldsSection: { paddingHorizontal: spacing.md },
  footerBrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toast: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  toastText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
});
