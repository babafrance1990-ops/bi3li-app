// Bouton retour en arabe : à droite, flèche vers la droite (sens de lecture arabe)
import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme';

export default function BackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
      hitSlop={12}
      style={{ paddingHorizontal: 10 }}
      accessibilityRole="button"
      accessibilityLabel="رجوع"
    >
      <Text style={{ fontSize: 32, lineHeight: 34, color: colors.primaryDark, fontWeight: '600' }}>›</Text>
    </Pressable>
  );
}
