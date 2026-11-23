// Cœur ♥ « ajouter aux favoris » (pas connecté → écran de connexion)
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../auth';

export default function FavButton({ adId, size = 20, style }) {
  const { user, toggleFav } = useAuth();
  const on = !!user?.favs?.includes(adId);
  return (
    <Pressable hitSlop={10} style={[s.btn, { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 }, style]}
      onPress={(e) => { e?.stopPropagation?.(); if (!user) router.push('/connexion'); else toggleFav(adId); }}
      accessibilityLabel={on ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
      <Text style={{ fontSize: size, color: on ? '#e11d48' : '#374151', lineHeight: size + 4 }}>{on ? '♥' : '♡'}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
});
