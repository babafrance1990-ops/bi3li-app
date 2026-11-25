// Vérifier mon numéro par WhatsApp (comme la page « توثيق رقمي » du site).
// Sans vérification : 3 annonces en ligne au maximum. Après : badge « رقم مؤكَّد ✓ » et plus de limite.
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { invalidateAds } from '../src/store';
import { colors, radius } from '../src/theme';
import { useWaJob } from '../src/wa';
import WaLabel from '../src/components/WaLabel';

const T = {
  fr: {
    title: 'Vérifier mon numéro', intro: 'Un seul message WhatsApp suffit. Les acheteurs font plus confiance aux numéros vérifiés.',
    limit: 'Sans vérification, vous pouvez avoir 3 annonces en ligne au maximum.',
    s1: 'Appuyez sur le bouton vert. WhatsApp s’ouvre avec un message prêt.', s2: 'Envoyez ce message sans le modifier. Il contient votre code de vérification.',
    s3: 'Revenez sur Bi3li : votre numéro apparaît comme vérifié.', btn: 'Vérifier par WhatsApp',
    wait: 'En attente de votre message WhatsApp…', from: 'Envoyez le message depuis le WhatsApp du numéro {p}', code: 'Votre code : {c}',
    again: 'Ouvrir WhatsApp à nouveau', cancel: 'Annuler', expired: 'Le code a expiré. Recommencez.', retry: 'Recommencer',
    done: 'Votre numéro est vérifié. Merci !', back: 'Retour', login: 'Connectez-vous pour vérifier votre numéro.',
    e_too_many: 'Trop de demandes. Réessayez dans une heure.', e_wa_off: 'La vérification WhatsApp est momentanément indisponible.', e_net: 'Connexion impossible. Réessayez.',
  },
  ar: {
    title: 'توثيق رقمي', intro: 'رسالة واتساب واحدة تكفي. يثق المشترون أكثر في الأرقام المؤكَّدة.',
    limit: 'بدون توثيق، يمكنك نشر 3 إعلانات كحد أقصى.',
    s1: 'اضغط الزر الأخضر. يفتح واتساب برسالة جاهزة.', s2: 'أرسل الرسالة كما هي دون تعديل. تحتوي على رمز التأكيد.',
    s3: 'ارجع إلى بيعلي: سيظهر رقمك كموثّق.', btn: 'التأكيد عبر واتساب',
    wait: 'في انتظار رسالتك على واتساب…', from: 'أرسل الرسالة من واتساب الرقم {p}', code: 'رمزك: {c}',
    again: 'فتح واتساب مرة أخرى', cancel: 'إلغاء', expired: 'انتهت صلاحية الرمز. أعد المحاولة.', retry: 'إعادة المحاولة',
    done: 'تم توثيق رقمك. شكراً!', back: 'رجوع', login: 'سجّل الدخول لتوثيق رقمك.',
    e_too_many: 'طلبات كثيرة. أعد المحاولة بعد ساعة.', e_wa_off: 'التوثيق عبر واتساب غير متاح حالياً.', e_net: 'تعذّر الاتصال. أعد المحاولة.',
  },
};

export default function Verifier() {
  const { user, reloadUser } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const al = rtl ? { textAlign: 'right' } : null;
  const wa = useWaJob(lang, async () => { await reloadUser(); invalidateAds(); });

  if (!user) return <View style={s.wrap}><Text style={s.p}>{t('login')}</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: t('title') }} />
      <Text style={{ fontSize: 54, textAlign: 'center' }}>{user.verified ? '✅' : '📱'}</Text>

      {user.verified ? (
        <>
          <Text style={[s.h, { textAlign: 'center' }]}>{t('done')}</Text>
          <Text style={[s.badge]}>✓ {lang === 'ar' ? 'رقم مؤكَّد' : 'Numéro vérifié'} · +222 {user.phone}</Text>
          <Pressable style={s.btnLight} onPress={() => router.back()}><Text style={s.btnLightTxt}>{t('back')}</Text></Pressable>
        </>
      ) : wa.job ? (
        <View style={s.card}>
          {wa.job.expired ? (
            <>
              <Text style={[s.p, { textAlign: 'center' }]}>⌛ {t('expired')}</Text>
              <Pressable style={s.btnWa} onPress={() => wa.start('verify')}><Text style={s.btnTxt}>{t('retry')}</Text></Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.whatsapp} size="large" />
              <Text style={[s.h, { textAlign: 'center' }]}>{t('wait')}</Text>
              <Text style={[s.p, { textAlign: 'center' }]}>{t('from', { p: '⁦+222 ' + user.phone + '⁩' })}</Text>
              <Text style={s.code}>{t('code', { c: wa.job.code })}</Text>
              <Pressable style={s.btnWa} onPress={wa.reopen}><WaLabel style={s.btnTxt}>{t('again')}</WaLabel></Pressable>
              <Pressable onPress={wa.cancel}><Text style={s.link}>{t('cancel')}</Text></Pressable>
            </>
          )}
        </View>
      ) : (
        <>
          <Text style={[s.h, al]}>{t('intro')}</Text>
          <Text style={[s.warn, al]}>⚠️ {t('limit')}</Text>
          <View style={s.card}>
            {['s1', 's2', 's3'].map((k, i) => (
              <View key={k} style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={s.num}>{i + 1}</Text>
                <Text style={[s.p, al, { flex: 1 }]}>{t(k)}</Text>
              </View>
            ))}
          </View>
          {!!wa.error && <Text style={[s.err, al]}>{t('e_' + wa.error) !== 'e_' + wa.error ? t('e_' + wa.error) : t('e_net')}</Text>}
          <Pressable style={s.btnWa} onPress={() => wa.start('verify')}><WaLabel style={s.btnTxt}>{t('btn')}</WaLabel></Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40 },
  h: { fontSize: 18, fontWeight: '800', color: colors.text, lineHeight: 26 },
  p: { fontSize: 15, color: colors.text, lineHeight: 23 },
  warn: { fontSize: 14, color: '#8A5A00', backgroundColor: '#FDF3DC', borderRadius: radius.m, padding: 12, overflow: 'hidden' },
  card: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.whatsapp, color: '#fff', textAlign: 'center', lineHeight: 26, fontWeight: '800', overflow: 'hidden' },
  code: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 3, color: colors.text },
  btnWa: { backgroundColor: colors.whatsapp, borderRadius: radius.m, paddingVertical: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnLight: { backgroundColor: '#EEF5F0', borderRadius: radius.m, paddingVertical: 14, alignItems: 'center' },
  btnLightTxt: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  badge: { alignSelf: 'center', backgroundColor: '#EEF5F0', color: colors.primaryDark, fontWeight: '800', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: 'hidden' },
  link: { color: colors.muted, textAlign: 'center', textDecorationLine: 'underline' },
  err: { color: colors.danger, fontWeight: '600' },
});
