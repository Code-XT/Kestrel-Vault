import React, { useState } from 'react';
import { View, Image, Pressable, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing, shadow } from '@/theme/theme';

interface Props {
  frontImageUri?: string;
  backImageUri?: string;
  photosRevealed: boolean;
  onToggleReveal: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.md * 2;
const CARD_HEIGHT = CARD_WIDTH * 0.63; // standard card aspect ratio

export default function CardFlip({ frontImageUri, backImageUri, photosRevealed, onToggleReveal }: Props) {
  const [showingBack, setShowingBack] = useState(false);
  const rotation = useSharedValue(0);

  const flip = () => {
    const target = showingBack ? 0 : 180;
    rotation.value = withTiming(target, { duration: 500, easing: Easing.inOut(Easing.cubic) });
    setShowingBack((s) => !s);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(rotation.value, [0, 180], [0, 180])}deg`;
    return {
      transform: [{ perspective: 1200 }, { rotateY }],
      opacity: rotation.value > 90 ? 0 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(rotation.value, [0, 180], [180, 360])}deg`;
    return {
      transform: [{ perspective: 1200 }, { rotateY }],
      opacity: rotation.value > 90 ? 1 : 0,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardStack}>
        <Animated.View style={[styles.face, shadow.card, frontAnimatedStyle]}>
          <CardFace uri={frontImageUri} revealed={photosRevealed} label="Front" />
        </Animated.View>
        <Animated.View style={[styles.face, styles.faceBack, shadow.card, backAnimatedStyle]}>
          <CardFace uri={backImageUri} revealed={photosRevealed} label="Back" />
        </Animated.View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.controlButton} onPress={flip}>
          <Feather name="repeat" size={16} color={colors.background} />
          <Text style={styles.controlLabel}>Flip</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.controlButtonGhost]} onPress={onToggleReveal}>
          <Feather
            name={photosRevealed ? 'eye-off' : 'eye'}
            size={16}
            color={colors.textPrimary}
          />
          <Text style={[styles.controlLabel, styles.controlLabelGhost]}>
            {photosRevealed ? 'Hide Photos' : 'Reveal Photos'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CardFace({ uri, revealed, label }: { uri?: string; revealed: boolean; label: string }) {
  if (!uri) {
    return (
      <View style={[styles.placeholder]}>
        <Feather name="image" size={28} color={colors.textMuted} />
        <Text style={styles.placeholderText}>No {label.toLowerCase()} image</Text>
      </View>
    );
  }
  if (!revealed) {
    return (
      <View style={styles.placeholder}>
        <Feather name="eye-off" size={28} color={colors.textMuted} />
        <Text style={styles.placeholderText}>Tap "Reveal Photos" to view</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.image} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.md },
  cardStack: { width: CARD_WIDTH, height: CARD_HEIGHT },
  face: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    backfaceVisibility: 'hidden',
  },
  faceBack: {},
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: { color: colors.textMuted, fontSize: 12 },
  controlsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
  },
  controlButtonGhost: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlLabel: { color: colors.background, fontWeight: '700', fontSize: 13 },
  controlLabelGhost: { color: colors.textPrimary },
});
