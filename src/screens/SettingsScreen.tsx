import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme/theme';
import { useAppStore } from '@/store/useAppStore';
import { destroyVaultKey } from '@/services/keystore';
import {
  backupToGoogleDrive,
  restoreFromGoogleDrive,
  signInToGoogle,
  signOutOfGoogle,
  isSignedInToGoogle,
} from '@/services/googleDrive';

export default function SettingsScreen() {
  const biometricsAvailable = useAppStore((s) => s.biometricsAvailable);
  const wipeVault = useAppStore((s) => s.wipeVault);
  const lock = useAppStore((s) => s.lock);
  const refreshIndex = useAppStore((s) => s.refreshIndex);

  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState<'backup' | 'restore' | 'connect' | null>(null);

  React.useEffect(() => {
    isSignedInToGoogle().then(setGoogleConnected).catch(() => setGoogleConnected(false));
  }, []);

  const requirePassphrase = () => {
    if (passphrase.trim().length < 8) {
      Alert.alert('Choose a stronger passphrase', 'Use at least 8 characters. This passphrase encrypts your backup — Kestrel Vault and Google never see it, and it cannot be recovered if lost.');
      return false;
    }
    return true;
  };

  const handleConnectGoogle = async () => {
    setBusy('connect');
    try {
      await signInToGoogle();
      setGoogleConnected(true);
    } catch (e) {
      Alert.alert('Couldn\u2019t connect', 'Google Sign-In was cancelled or failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOutOfGoogle();
    setGoogleConnected(false);
  };

  const handleBackup = async () => {
    if (!requirePassphrase()) return;
    setBusy('backup');
    try {
      await backupToGoogleDrive(passphrase);
      Alert.alert('Backup complete', 'Your encrypted vault has been uploaded to Google Drive.');
    } catch (e: any) {
      Alert.alert('Backup failed', e?.message ?? 'Something went wrong while uploading your backup.');
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (!requirePassphrase()) return;
    Alert.alert(
      'Restore from Google Drive',
      'This merges the backed-up items into your current vault. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setBusy('restore');
            try {
              const count = await restoreFromGoogleDrive(passphrase);
              if (count == null) {
                Alert.alert('No backup found', 'There\u2019s no Kestrel Vault backup in this Google account yet.');
              } else {
                await refreshIndex();
                Alert.alert('Restore complete', `Restored ${count} item${count === 1 ? '' : 's'} from your backup.`);
              }
            } catch (e: any) {
              Alert.alert('Restore failed', e?.message ?? 'That passphrase may be incorrect, or the backup is corrupted.');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  const confirmWipe = () => {
    Alert.alert(
      'Erase Vault',
      'This permanently deletes all cards, IDs, and tickets, and destroys the on-device encryption key. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: async () => {
            await wipeVault();
            await destroyVaultKey();
            lock();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={[typography.h1, { paddingHorizontal: spacing.md }]}>Settings</Text>

      <View style={styles.section}>
        <Text style={typography.label}>SECURITY</Text>
        <Row icon="shield" label="Biometric unlock" value={biometricsAvailable ? 'Available' : 'Not enrolled'} />
        <Row icon="hard-drive" label="Encryption" value="AES-256-GCM, on-device key" />
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>GOOGLE DRIVE BACKUP</Text>
        <Row
          icon="cloud"
          label="Google account"
          value={googleConnected == null ? 'Checking\u2026' : googleConnected ? 'Connected' : 'Not connected'}
        />

        {googleConnected ? (
          <>
            <Text style={[typography.caption, styles.hint]}>
              Enter a backup passphrase. It encrypts your data before upload — Google only ever
              stores ciphertext in a hidden app-only folder it can't read.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Backup passphrase"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={passphrase}
              onChangeText={setPassphrase}
              autoCapitalize="none"
            />
            <View style={styles.buttonRow}>
              <Pressable style={styles.actionButton} onPress={handleBackup} disabled={busy !== null}>
                {busy === 'backup' ? <ActivityIndicator color={colors.background} /> : (
                  <>
                    <Feather name="upload-cloud" size={14} color={colors.background} />
                    <Text style={styles.actionLabel}>Back Up Now</Text>
                  </>
                )}
              </Pressable>
              <Pressable style={[styles.actionButton, styles.actionButtonGhost]} onPress={handleRestore} disabled={busy !== null}>
                {busy === 'restore' ? <ActivityIndicator color={colors.textPrimary} /> : (
                  <>
                    <Feather name="download-cloud" size={14} color={colors.textPrimary} />
                    <Text style={[styles.actionLabel, styles.actionLabelGhost]}>Restore</Text>
                  </>
                )}
              </Pressable>
            </View>
            <Pressable onPress={handleDisconnectGoogle} style={{ marginTop: spacing.sm }}>
              <Text style={styles.disconnectLabel}>Disconnect Google account</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.actionButton} onPress={handleConnectGoogle} disabled={busy !== null}>
            {busy === 'connect' ? <ActivityIndicator color={colors.background} /> : (
              <>
                <Feather name="log-in" size={14} color={colors.background} />
                <Text style={styles.actionLabel}>Connect Google Drive</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>DANGER ZONE</Text>
        <Pressable style={styles.dangerRow} onPress={confirmWipe}>
          <Feather name="trash-2" size={16} color={colors.danger} />
          <Text style={styles.dangerLabel}>Erase Vault</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={16} color={colors.textSecondary} />
      <Text style={[typography.body, { flex: 1, marginLeft: spacing.sm }]}>{label}</Text>
      <Text style={typography.caption}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  hint: { marginTop: spacing.sm, lineHeight: 16 },
  input: {
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.pill,
    paddingVertical: 12,
  },
  actionButtonGhost: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: { color: colors.background, fontWeight: '700', fontSize: 13 },
  actionLabelGhost: { color: colors.textPrimary },
  disconnectLabel: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  dangerLabel: { color: colors.danger, fontWeight: '700' },
});
