// Bouton Accueil : ramène à l'accueil depuis n'importe quelle page
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function HomeButton() {
  return (
    <Pressable
      onPress={() => { router.dismissAll(); router.replace('/(tabs)'); }}
      hitSlop={12}
      style={{ paddingHorizontal: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Accueil"
    >
      <Ionicons name="home-outline" size={24} color={colors.primaryDark} />
    </Pressable>
  );
}
