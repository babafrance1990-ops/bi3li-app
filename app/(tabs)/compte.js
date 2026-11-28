// Mon compte : identité, puis les accès regroupés par thème (annonces, activité, découvrir, aide), déconnexion
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { t, lang, rtl } = useLang(); // la langue se change sur l'accueil (en haut)
  const align = rtl ? { textAlign: 'right' } : null;
  const fresh = useAlertCount();
  const nAlerts = (user?.searches || []).length;
  const ar = lang === 'ar';

  // Un accès = un bouton ; un bloc = un titre et ses accès (les blocs vides ne s'affichent pas)
  const Item = ({ icon, label, onPress, color }) => (
    <Pressable style={s.item} onPress={onPress}>
      <Text style={[s.itemTxt, rtl && { textAlign: 'right' }, color && { color }]}>{icon}  {label}</Text>
      <Text style={s.chev}>{rtl ? '‹' : '›'}</Text>
    </Pressable>
  );
  const Block = ({ title, children }) => (
    <View style={s.block}>
      <Text style={[s.blockTitle, align]}>{title}</Text>
      <View style={s.blockBox}>{children}</View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScrollView contentContainerStyle={[s.wrap, { paddingBottom: 60 }, !user && { justifyContent: 'center', flexGrow: 1 }]}>
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
            <Pressable onPress={() => router.push('/profil')}><Text style={s.link}>✏️ {ar ? 'تعديل ملفي' : 'Modifier mon profil'}</Text></Pressable>
            <Pressable onPress={() => router.push('/vendeur/' + user.id)}><Text style={s.link}>👁 {ar ? 'صفحتي كما يراها المشترون' : 'Ma page vendeur'}</Text></Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={s.btn} onPress={() => router.push('/connexion')}>
          <Text style={s.btnTxt}>{t('login')}</Text>
        </Pressable>
      )}

      <VerifyBanner />

      {user && (
        <Block title={ar ? 'إعلاناتي ومتجري' : 'Mes annonces et ma boutique'}>
          <Item icon="📋" label={ar ? 'إعلاناتي' : 'Mes annonces'} onPress={() => router.push('/mes-annonces')} />
          <Item icon="🏪" label={user.shop ? (ar ? 'متجري: ' : 'Ma boutique : ') + user.shop.name : (ar ? 'افتح متجري (مجاناً)' : 'Ouvrir ma boutique (gratuit)')} onPress={() => router.push('/boutique')} />
        </Block>
      )}

      {user && (
        <Block title={ar ? 'نشاطي' : 'Mon activité'}>
          <Item icon="♥" label={(ar ? 'المفضلة' : 'Mes favoris') + (user.favs?.length ? ' (' + user.favs.length + ')' : '')} onPress={() => router.push('/favoris')} />
          <Item icon="🔔" label={(ar ? 'تنبيهاتي' : 'Mes alertes') + (nAlerts ? ' (' + nAlerts + ')' : '') + (fresh > 0 ? '  ·  🆕 ' + (fresh > 50 ? '50+' : fresh) : '')} onPress={() => router.push('/alertes')} />
          <Item icon="👁" label={ar ? 'شاهدتها مؤخراً' : 'Vus récemment'} onPress={() => router.push('/vus')} />
        </Block>
      )}

      <Block title={ar ? 'اكتشف' : 'Découvrir'}>
        <Item icon="🏬" label={ar ? 'المتاجر' : 'Boutiques'} onPress={() => router.push('/boutiques')} />
      </Block>

      <Block title={ar ? 'المساعدة والتواصل' : 'Aide et contact'}>
        <Item icon="ℹ️" label={ar ? 'عن بيعلي' : 'À propos de Bi3li'} onPress={() => router.push('/about')} />
      </Block>

      {user?.admin && (
        <Block title={ar ? 'الإدارة' : 'Administration'}>
          <Item icon="🛡️" label={ar ? 'لوحة الإدارة' : 'Tableau de bord'} onPress={() => router.push('/admin')} />
        </Block>
      )}

      {user && (
        <Pressable style={[s.item, s.logout]} onPress={logout}>
          <Text style={[s.itemTxt, { color: colors.danger, textAlign: 'center', flex: 1 }]}>{t('logout')}</Text>
        </Pressable>
      )}
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 14 },
  card: { backgroundColor: colors.white, borderRadius: radius.l, padding: 18, gap: 6, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  line: { fontSize: 15, color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, padding: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  link: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 4 },
  block: { gap: 6 },
  blockTitle: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', marginStart: 4 },
  blockBox: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTxt: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  chev: { fontSize: 22, color: colors.muted, marginStart: 8 },
  logout: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, borderBottomWidth: 1, marginTop: 4 },
});
