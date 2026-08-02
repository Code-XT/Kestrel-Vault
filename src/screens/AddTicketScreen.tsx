import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '@/theme/theme';
import CategoryPills from '@/components/CategoryPills';
import TicketPreview from '@/components/TicketPreview';
import DynamicFieldRow from '@/components/DynamicFieldRow';
import { TICKET_CATEGORIES, type VaultField, type VaultItem, type VaultItemCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTicket'>;

let fieldIdCounter = 0;
const nextId = () => `f_${Date.now()}_${fieldIdCounter++}`;

const DEFAULT_FIELDS_BY_CATEGORY: Record<string, Omit<VaultField, 'id'>[]> = {
  flight: [
    { label: 'PNR', value: '', sensitive: false, format: 'generic' },
    { label: 'Seat', value: '', sensitive: false, format: 'generic' },
    { label: 'Gate', value: '', sensitive: false, format: 'generic' },
    { label: 'Departure', value: '', sensitive: false, format: 'generic' },
  ],
  train: [
    { label: 'PNR', value: '', sensitive: false, format: 'generic' },
    { label: 'Coach', value: '', sensitive: false, format: 'generic' },
    { label: 'Seat', value: '', sensitive: false, format: 'generic' },
  ],
  bus: [
    { label: 'Seat', value: '', sensitive: false, format: 'generic' },
    { label: 'Departure', value: '', sensitive: false, format: 'generic' },
  ],
  movie: [
    { label: 'Screen', value: '', sensitive: false, format: 'generic' },
    { label: 'Seat', value: '', sensitive: false, format: 'generic' },
    { label: 'Showtime', value: '', sensitive: false, format: 'generic' },
  ],
  concert: [
    { label: 'Section', value: '', sensitive: false, format: 'generic' },
    { label: 'Row', value: '', sensitive: false, format: 'generic' },
    { label: 'Seat', value: '', sensitive: false, format: 'generic' },
  ],
  sports: [
    { label: 'Section', value: '', sensitive: false, format: 'generic' },
    { label: 'Seat', value: '', sensitive: false, format: 'generic' },
  ],
};

export default function AddTicketScreen({ navigation }: Props) {
  const saveItem = useAppStore((s) => s.saveItem);
  const [category, setCategory] = useState<VaultItemCategory>('flight');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [fields, setFields] = useState<VaultField[]>(() => seedFields('flight'));
  const [saving, setSaving] = useState(false);

  function seedFields(cat: VaultItemCategory): VaultField[] {
    const defaults = DEFAULT_FIELDS_BY_CATEGORY[cat] ?? [];
    return defaults.map((f) => ({ ...f, id: nextId() }));
  }

  const handleCategoryChange = (cat: VaultItemCategory) => {
    setCategory(cat);
    setFields(seedFields(cat));
  };

  const addField = () => setFields((prev) => [...prev, { id: nextId(), label: '', value: '', sensitive: false, format: 'generic' }]);
  const updateField = (id: string, next: VaultField) => setFields((prev) => prev.map((f) => (f.id === id ? next : f)));
  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const accentColor = TICKET_CATEGORIES.find((c) => c.key === category)?.accent ?? colors.accentBlue;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this ticket a name before saving.');
      return;
    }
    setSaving(true);
    const now = Date.now();
    const item: VaultItem = {
      id: `${now}_${Math.random().toString(36).slice(2, 8)}`,
      category,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      fields,
      barcodeValue: barcodeValue.trim() || undefined,
      barcodeType: barcodeValue.trim() ? 'qr' : undefined,
      accentColor,
    };
    try {
      await saveItem(item);
      navigation.replace('Detail', { id: item.id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={typography.h2}>Add Ticket / Pass</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Live skeleton preview */}
        <TicketPreview
          category={category}
          title={title}
          subtitle={subtitle}
          accentColor={accentColor}
          fields={fields}
          barcodeValue={barcodeValue || undefined}
        />

        <View style={{ paddingHorizontal: spacing.md }}>
          <CategoryPills options={TICKET_CATEGORIES} selected={category} onSelect={handleCategoryChange} />

          <Text style={typography.label}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. SFO → JFK, Coldplay World Tour"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={typography.label}>SUBTITLE (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Terminal 2 · Aug 14"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={typography.label}>BARCODE / QR VALUE (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={barcodeValue}
            onChangeText={setBarcodeValue}
            placeholder="Confirmation code or scan payload"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
          />

          <View style={styles.fieldsHeader}>
            <Text style={typography.label}>DETAILS</Text>
            <Pressable onPress={addField} style={styles.addFieldBtn}>
              <Feather name="plus" size={14} color={colors.accentBlue} />
              <Text style={styles.addFieldLabel}>Add field</Text>
            </Pressable>
          </View>

          {fields.map((f) => (
            <DynamicFieldRow key={f.id} field={f} onChange={(next) => updateField(f.id, next)} onRemove={() => removeField(f.id)} />
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.background} /> : (
          <>
            <Feather name="lock" size={16} color={colors.background} />
            <Text style={styles.saveLabel}>Save to Vault</Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
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
  scroll: { paddingTop: spacing.sm, paddingBottom: 140 },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  fieldsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addFieldBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addFieldLabel: { color: colors.accentBlue, fontSize: 12, fontWeight: '600' },
  saveButton: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.pill,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveLabel: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
