// Mon compte : connexion, informations du compte, changement de langue, déconnexion
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { mediaUrl } from '../../src/api';
import { cityName } from '../../src/places';
import { useAlertCount } from '../../src/alerts';
import VerifyBanner from '../../src/components/VerifyBanner';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

export default function Compte() {
  const { user, ready, logout } = useAuth();
  const { t, lang, setLang, rtl } = useLang();
  const align = rtl ? { textAlign: 'right' } : null;
  const fresh = useAlertCount();
  const nAlerts = (user?.searches || []).length;

  return (
    <View style={s.wrap}>
      {!ready ? null : user ? (
        <View style={s.card}>
          {user.avatar ? <Image source={mediaUrl(user.avatar)} style={[s.avatar, { alignSelf: rtl ? 'flex-end' : 'flex-start' }]} /> : null}
          <Text style={[s.name, align]}>{user.name}</Text>
          <Text style={[s.line, align]}>📞 {user.phone}</Text>
          <Text style={[s.line, align, { color: user.verified ? colors.primaryDark : colors.muted }]}>
            {user.verified ? t('verifiedNum') : t('notVerified')}
          </Text>
          {user.shop?.name && <Text style={[s.line, align]}>🏪 {user.shop.name}</Text>}
          {!!user.city && <Text style={[s.line, align]}>📍 {cityName(user.city, lang)}</Text>}
          <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 14, marginTop: 6 }}>
            <Pressable onPress={() => router.push('/profil')}><Text style={s.link}>✏️ {lang === 'ar' ? 'تعديل ملفي' : 'Modifier mon profil'}</Text></Pressable>
            <Pressable onPress={() => router.push('/vendeur/' + user.id)}><Text style={s.link}>👁 {lang === 'ar' ? 'صفحتي كما يراها المشترون' : 'Ma page vendeur'}</Text></Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={s.btn} onPress={() => router.push('/connexion')}>
          <Text style={s.btnTxt}>{t('login')}</Text>
        </Pressable>
      )}

      <VerifyBanner />

      {user && (
        <Pressable style={[s.light, s.big]} onPress={() => router.push('/boutique')}>
          <Text style={[s.lightTxt, { fontSize: 17 }]}>
            🏪 {user.shop ? (lang === 'ar' ? 'متجري: ' : 'Ma boutique : ') + user.shop.name : (lang === 'ar' ? 'افتح متجري (مجاناً)' : 'Ouvrir ma boutique (gratuit)')}
          </Text>
        </Pressable>
      )}

      {user && (
        <Pressable style={[s.light, s.big]} onPress={() => router.push('/mes-annonces')}>
          <Text style={[s.lightTxt, { fontSize: 17 }]}>📋 {lang === 'ar' ? 'إعلاناتي' : 'Mes annonces'}</Text>
        </Pressable>
      )}

      {user && (
        <Pressable style={[s.light, s.big]} onPress={() => router.push('/favoris')}>
          <Text style={[s.lightTxt, { fontSize: 17 }]}>♥ {lang === 'ar' ? 'المفضلة' : 'Mes favoris'}{user.favs?.length ? ' (' + user.favs.length + ')' : ''}</Text>
        </Pressable>
      )}

      {user && (
        <Pressable style={[s.light, s.big]} onPress={() => router.push('/alertes')}>
          <Text style={[s.lightTxt, { fontSize: 17 }]}>
            🔔 {lang === 'ar' ? 'تنبيهاتي' : 'Mes alertes'}{nAlerts ? ' (' + nAlerts + ')' : ''}
            {fresh > 0 ? (lang === 'ar' ? '  ·  🆕 جديد: ' : '  ·  🆕 ') + (fresh > 50 ? '50+' : fresh) + (lang === 'ar' ? '' : ' nouvelle(s)') : ''}
          </Text>
        </Pressable>
      )}

      <Pressable style={s.light} onPress={() => setLang(lang === 'ar' ? 'fr' : 'ar')}>
        <Text style={s.lightTxt}>🌐 {t('lang')}</Text>
      </Pressable>

      {user && (
        <Pressable style={s.light} onPress={logout}>
          <Text style={[s.lightTxt, { color: colors.danger }]}>{t('logout')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: radius.l, padding: 18, gap: 6, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  line: { fontSize: 15, color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, padding: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  light: { backgroundColor: colors.white, borderRadius: radius.m, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  link: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 4 },
  big: { paddingVertical: 18, borderColor: colors.primary },
  lightTxt: { fontSize: 16, fontWeight: '600', color: colors.primaryDark },
});
