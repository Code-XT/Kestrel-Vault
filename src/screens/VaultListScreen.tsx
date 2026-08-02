import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '@/theme/theme';
import { useAppStore } from '@/store/useAppStore';
import VaultListItem from '@/components/VaultListItem';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VaultList'>;

export default function VaultListScreen({ navigation }: Props) {
  const index = useAppStore((s) => s.index);
  const refreshIndex = useAppStore((s) => s.refreshIndex);
  const lock = useAppStore((s) => s.lock);
  const [query, setQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    refreshIndex();
  }, []);

  const filtered = useMemo(
    () => index.filter((i) => i.title.toLowerCase().includes(query.toLowerCase())),
    [index, query]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Vault</Text>
          <Text style={typography.caption}>{index.length} item{index.length === 1 ? '' : 's'} secured</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.lockButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          >
            <Feather name="settings" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.lockButton} onPress={lock} accessibilityLabel="Lock vault">
            <Feather name="lock" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vault…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Your vault is empty. Add a card or ticket to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <VaultListItem
            title={item.title}
            category={item.category}
            updatedAt={item.updatedAt}
            onPress={() => navigation.navigate('Detail', { id: item.id })}
          />
        )}
      />

      {fabOpen && (
        <View style={styles.fabMenu}>
          <Pressable
            style={styles.fabOption}
            onPress={() => {
              setFabOpen(false);
              navigation.navigate('AddCard');
            }}
          >
            <Feather name="credit-card" size={16} color={colors.textPrimary} />
            <Text style={styles.fabOptionLabel}>Scan Card / ID</Text>
          </Pressable>
          <Pressable
            style={styles.fabOption}
            onPress={() => {
              setFabOpen(false);
              navigation.navigate('AddTicket');
            }}
          >
            <Feather name="tag" size={16} color={colors.textPrimary} />
            <Text style={styles.fabOptionLabel}>Add Ticket / Pass</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.fab} onPress={() => setFabOpen((o) => !o)}>
        <Feather name={fabOpen ? 'x' : 'plus'} size={24} color={colors.background} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  lockButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  listContent: { padding: spacing.md, paddingBottom: 120 },
  empty: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabMenu: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + 68,
    gap: spacing.sm,
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  fabOptionLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
});
