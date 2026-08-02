import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

/**
 * Long-press-to-copy handler used across detail screens.
 * Copies the raw (unmasked) value regardless of the field's current mask
 * state, since the user has already authenticated into the vault.
 */
export async function copyFieldValue(value: string): Promise<void> {
  await Clipboard.setStringAsync(value);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
