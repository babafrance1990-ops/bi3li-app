// Bouton « Publier » de la barre du bas : grand rond jaune à bordure verte, qui dépasse, comme sur le site
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLang } from '../i18n';
import { colors } from '../theme';

export default function AddTabButton({ onPress, onLongPress, accessibilityState, style }) {
  const { lang } = useLang();
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={[style, s.wrap]}
      accessibilityRole="button" accessibilityState={accessibilityState}
      accessibilityLabel={lang === 'ar' ? 'أضف إعلان' : 'Déposer une annonce'}>
      <View style={s.circle}>
        <Ionicons name="add" size={36} color={colors.primaryDark} />
      </View>
      <Text style={s.label} numberOfLines={2}>{lang === 'ar' ? 'انشر إعلانك مجاناً' : 'Publiez gratuitement'}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  circle: { width: 62, height: 62, borderRadius: 31, marginTop: -26, backgroundColor: '#F2B632', borderWidth: 4, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  label: { marginTop: 2, fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center', width: 96 },
});
