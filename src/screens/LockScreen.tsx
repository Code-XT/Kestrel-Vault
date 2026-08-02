import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '@/theme/theme';
import { useAppStore } from '@/store/useAppStore';

export default function LockScreen() {
  const unlock = useAppStore((s) => s.unlock);
  const biometricsAvailable = useAppStore((s) => s.biometricsAvailable);

  useEffect(() => {
    // Prompt automatically on mount for a fast unlock flow.
    unlock();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Feather name="lock" size={32} color={colors.accentBlue} />
        </View>
        <Text style={[typography.h1, styles.title]}>Kestrel Vault</Text>
        <Text style={[typography.caption, styles.subtitle]}>
          {biometricsAvailable
            ? 'Unlock with Face ID, Touch ID, or your device passcode.'
            : 'Enable a device passcode or biometrics in Settings to unlock.'}
        </Text>

        <Pressable style={styles.unlockButton} onPress={unlock}>
          <Feather name="unlock" size={16} color={colors.background} />
          <Text style={styles.unlockLabel}>Unlock Vault</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.sm },
  subtitle: { textAlign: 'center', marginBottom: spacing.xl },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentBlue,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
  },
  unlockLabel: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
