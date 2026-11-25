// Bouton de langue (FR / العربية), comme sur le site : petite pastille
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLang } from '../i18n';

export default function LangPill({ onDark = false }) {
  const { lang, setLang } = useLang();
  return (
    <Pressable
      onPress={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
      hitSlop={10}
      style={[s.pill, onDark && s.dark]}
      accessibilityRole="button"
      accessibilityLabel={lang === 'ar' ? 'Passer en français' : 'التحويل إلى العربية'}
    >
      <Text style={[s.txt, onDark && { color: '#fff' }]}>{lang === 'ar' ? 'FR' : 'ع'}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { minWidth: 46, height: 40, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#E6DFCF', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  dark: { borderColor: 'rgba(255,255,255,0.7)' },
  txt: { fontSize: 15, fontWeight: '800', color: '#0B3D22' },
});
