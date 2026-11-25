// Bandeau « Numéro non vérifié » (comme sur le site) : seulement pour un compte connecté non vérifié
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../auth';
import { useLang } from '../i18n';

export default function VerifyBanner({ style }) {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  if (!user || user.verified || user.admin || user.recruiter || user.shop?.verified) return null;
  return (
    <Pressable style={[s.box, { flexDirection: rtl ? 'row-reverse' : 'row' }, style]} onPress={() => router.push('/verifier')}>
      <Text style={s.txt}>⚠️ {lang === 'ar' ? 'رقمك غير موثّق' : 'Numéro non vérifié'}</Text>
      <Text style={s.btn}>{lang === 'ar' ? 'وثّق الآن' : 'Vérifier'}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#FDF3DC', borderWidth: 1.5, borderColor: '#8A5A00', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  txt: { color: '#8A5A00', fontWeight: '800', fontSize: 15, flexShrink: 1 },
  btn: { color: '#fff', backgroundColor: '#1E7A45', fontWeight: '800', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, overflow: 'hidden' },
});
