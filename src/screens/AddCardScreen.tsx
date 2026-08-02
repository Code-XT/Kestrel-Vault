import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '@/theme/theme';
import CategoryPills from '@/components/CategoryPills';
import DynamicFieldRow from '@/components/DynamicFieldRow';
import { CARD_CATEGORIES, type VaultField, type VaultItem, type VaultItemCategory } from '@/types';
import { runCardOcr } from '@/services/ocr';
import { useAppStore } from '@/store/useAppStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCard'>;

let fieldIdCounter = 0;
const nextId = () => `f_${Date.now()}_${fieldIdCounter++}`;

export default function AddCardScreen({ navigation }: Props) {
  const saveItem = useAppStore((s) => s.saveItem);

  const [category, setCategory] = useState<VaultItemCategory>('payment_card');
  const [title, setTitle] = useState('');
  const [frontUri, setFrontUri] = useState<string | undefined>();
  const [backUri, setBackUri] = useState<string | undefined>();
  const [fields, setFields] = useState<VaultField[]>([]);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async (side: 'front' | 'back', source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', `Please allow ${source} access to add a photo.`);
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true, aspect: [16, 10] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: true, aspect: [16, 10] });

    if (result.canceled) return;

    // Straighten/compress pass (spec: "Crop & Straighten View" — allowsEditing above gives
    // manual crop handles; this manipulation step normalizes size and compresses for storage).
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    if (side === 'front') setFrontUri(manipulated.uri);
    else setBackUri(manipulated.uri);

    if (side === 'front') {
      setOcrRunning(true);
      try {
        const { suggestedFields } = await runCardOcr(manipulated.uri);
        if (suggestedFields.length) {
          setFields((prev) => [...prev, ...suggestedFields]);
        }
      } catch (e) {
        // OCR native module unavailable (e.g. running in Expo Go) — fail silently to manual entry.
        console.warn('OCR unavailable, falling back to manual entry:', e);
      } finally {
        setOcrRunning(false);
      }
    }
  };

  const addField = () => {
    setFields((prev) => [...prev, { id: nextId(), label: '', value: '', sensitive: false, format: 'generic' }]);
  };

  const updateField = (id: string, next: VaultField) => {
    setFields((prev) => prev.map((f) => (f.id === id ? next : f)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this card a name before saving.');
      return;
    }
    setSaving(true);
    const now = Date.now();
    const item: VaultItem = {
      id: `${now}_${Math.random().toString(36).slice(2, 8)}`,
      category,
      title: title.trim(),
      createdAt: now,
      updatedAt: now,
      frontImageUri: frontUri,
      backImageUri: backUri,
      fields,
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
        <Text style={typography.h2}>Add Card / ID</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <CategoryPills options={CARD_CATEGORIES} selected={category} onSelect={setCategory} />

        <Text style={typography.label}>TITLE</Text>
        <TextInputLike value={title} onChangeText={setTitle} placeholder="e.g. Chase Sapphire, Driver's License" />

        <View style={styles.imageRow}>
          <ImageSlot label="Front" uri={frontUri} onCamera={() => pickImage('front', 'camera')} onGallery={() => pickImage('front', 'gallery')} />
          <ImageSlot label="Back (optional)" uri={backUri} onCamera={() => pickImage('back', 'camera')} onGallery={() => pickImage('back', 'gallery')} />
        </View>

        {ocrRunning && (
          <View style={styles.ocrRow}>
            <ActivityIndicator color={colors.accentBlue} />
            <Text style={styles.ocrText}>Extracting text with OCR…</Text>
          </View>
        )}

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

function ImageSlot({ label, uri, onCamera, onGallery }: { label: string; uri?: string; onCamera: () => void; onGallery: () => void }) {
  return (
    <View style={styles.slot}>
      {uri ? (
        <Image source={{ uri }} style={styles.slotImage} />
      ) : (
        <View style={styles.slotPlaceholder}>
          <Feather name="camera" size={20} color={colors.textMuted} />
        </View>
      )}
      <Text style={styles.slotLabel}>{label}</Text>
      <View style={styles.slotActions}>
        <Pressable style={styles.slotAction} onPress={onCamera}>
          <Feather name="camera" size={13} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.slotAction} onPress={onGallery}>
          <Feather name="image" size={13} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

// Lightweight styled text input to avoid importing TextInput repeatedly with inline styles.
function TextInputLike(props: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const { TextInput } = require('react-native');
  return (
    <TextInput
      style={styles.titleInput}
      value={props.value}
      onChangeText={props.onChangeText}
      placeholder={props.placeholder}
      placeholderTextColor={colors.textMuted}
    />
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
  scroll: { padding: spacing.md, paddingBottom: 140 },
  titleInput: {
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
  imageRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  slot: { flex: 1, alignItems: 'center' },
  slotImage: { width: '100%', aspectRatio: 1.586, borderRadius: radii.md, backgroundColor: colors.surfaceElevated },
  slotPlaceholder: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  slotActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  slotAction: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  ocrText: { color: colors.textSecondary, fontSize: 12 },
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
