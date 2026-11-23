// Ouvrir / modifier ma boutique (vitrine) — mêmes champs et mêmes textes que le site.
// Enregistrée dans le compte (PUT /api/me { shop }) : nom, marché, présentation, adresse, horaires, WhatsApp, livraison, agence.
// Le logo de la boutique = la photo du compte. Le serveur met à jour le nom de boutique sur toutes mes annonces.
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { api, mediaUrl } from '../src/api';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { notify } from '../src/notify';
import { pickPhotos, preparePhoto } from '../src/photos';
import { invalidateAds } from '../src/store';
import { colors, radius } from '../src/theme';

const T = {
  fr: {
    createT: 'Ouvrir ma boutique', editT: 'Ma boutique', free: 'Gratuit pendant le lancement.',
    intro: 'Une boutique regroupe toutes vos annonces sur une page à partager, avec votre adresse et vos horaires.',
    logo: 'Logo ou photo de la boutique', change: 'Changer', name: 'Nom de la boutique *', market: 'Marché ou lieu', marketPh: 'Ex. : marché Capitale',
    desc: 'Présentation', descPh: 'Ex. : Vente d’électroménager neuf, garantie 6 mois, livraison à Nouakchott.',
    addr: 'Adresse ou repère', addrPh: 'Ex. : Marché Capitale, en face de la BMCI', hours: 'Horaires', hoursPh: 'Ex. : Samedi–jeudi, 9 h – 21 h',
    wa: 'Numéro WhatsApp de la boutique', waHelp: 'Laissez vide pour utiliser le numéro de votre compte.',
    deliv: 'Nous livrons', delivNote: 'Conditions de livraison', delivPh: 'Ex. : Gratuite à Tevragh Zeina, 200 MRU ailleurs',
    agency: 'Je suis une agence immobilière', agencyHelp: 'Le badge « Agence vérifiée » apparaîtra après vérification par notre équipe.',
    verified: '✓ Boutique vérifiée', pending: 'Badge « Boutique vérifiée » : en attente de vérification par notre équipe.',
    rename: '⚠️ Changer le nom (ou le type agence) retire le badge « vérifiée » jusqu’à une nouvelle vérification.',
    create: 'Créer ma boutique', save: 'Enregistrer', created: 'Votre boutique est en ligne !', saved: 'Boutique enregistrée',
    see: 'Voir ma boutique', share: 'Partager ma boutique sur WhatsApp', close: 'Fermer ma boutique', cancel: 'Annuler',
    closeQ: 'Fermer votre boutique ? Vos annonces restent en ligne, à votre nom.', closed: 'Boutique fermée.',
    errName: 'Écrivez le nom de la boutique.', errWa: 'Le numéro WhatsApp doit avoir 8 chiffres.', err: 'Enregistrement impossible. Vérifiez votre connexion.',
    perm: 'Autorisez l’accès aux photos dans les réglages du téléphone.', login: 'Connectez-vous pour ouvrir une boutique.',
  },
  ar: {
    createT: 'افتح متجري', editT: 'متجري', free: 'مجاني خلال فترة الإطلاق.',
    intro: 'المتجر يجمع كل إعلاناتك في صفحة واحدة تشاركها، مع عنوانك وأوقات عملك.',
    logo: 'شعار أو صورة المتجر', change: 'تغيير', name: 'اسم المتجر *', market: 'السوق أو المكان', marketPh: 'مثال: سوق العاصمة',
    desc: 'تعريف بالمتجر', descPh: 'مثال: بيع أجهزة منزلية جديدة، ضمان 6 أشهر، توصيل في نواكشوط.',
    addr: 'العنوان أو علامة مميزة', addrPh: 'مثال: سوق العاصمة، مقابل BMCI', hours: 'أوقات العمل', hoursPh: 'مثال: من السبت إلى الخميس، 9 – 21',
    wa: 'رقم واتساب المتجر', waHelp: 'اتركه فارغاً لاستعمال رقم حسابك.',
    deliv: 'نوفر التوصيل', delivNote: 'شروط التوصيل', delivPh: 'مثال: مجاني في تفرغ زينة، 200 أوقية في غيرها',
    agency: 'أنا وكالة عقارية', agencyHelp: 'ستظهر شارة «وكالة موثّقة» بعد تحقق فريقنا.',
    verified: '✓ متجر موثّق', pending: 'شارة «متجر موثّق»: في انتظار تحقق فريقنا.',
    rename: '⚠️ تغيير الاسم (أو نوع الوكالة) يزيل شارة «موثّق» حتى يتحقق فريقنا من جديد.',
    create: 'أنشئ متجري', save: 'حفظ', created: 'متجرك على الإنترنت الآن!', saved: 'تم حفظ المتجر',
    see: 'عرض متجري', share: 'مشاركة متجري على واتساب', close: 'إغلاق متجري', cancel: 'إلغاء',
    closeQ: 'هل تريد إغلاق متجرك؟ تبقى إعلاناتك منشورة باسمك.', closed: 'تم إغلاق المتجر.',
    errName: 'اكتب اسم المتجر.', errWa: 'رقم واتساب يجب أن يكون 8 أرقام.', err: 'تعذّر الحفظ. تحقق من الاتصال.',
    perm: 'اسمح بالوصول إلى الصور من إعدادات الهاتف.', login: 'سجّل الدخول لفتح متجر.',
  },
};
const digits = (v) => String(v || '').replace(/\D/g, '');

export default function Boutique() {
  const { user, reloadUser } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k) => T[lang][k];
  const old = user?.shop || null;
  const [f, setF] = useState(() => ({
    name: old?.name || '', market: old?.market || '', desc: old?.desc || '', addr: old?.addr || '', hours: old?.hours || '',
    wa: old?.wa && digits(old.wa) !== digits(user?.phone) ? old.wa : '', deliv: !!old?.deliv, delivNote: old?.delivNote || '', agency: !!old?.agency,
  }));
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // 'created' | 'saved'
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  if (!user) return <View style={s.wrap}><Text>{t('login')}</Text></View>;

  const shop = user.shop;
  const renamed = old?.verified && (f.name.trim() !== old.name || f.agency !== !!old.agency);
  const link = shop?.slug ? 'https://bi3li.net/?b=' + shop.slug : null;
  const logo = photo?.uri || (user.avatar ? mediaUrl(user.avatar) : null);

  async function choose() {
    try { const [p] = await pickPhotos('library', 1); if (p) setPhoto(p); } catch (e) { if (e.message === 'permission') notify(t('perm')); }
  }

  async function save() {
    if (!f.name.trim()) { notify(t('errName')); return; }
    if (f.wa && digits(f.wa).length !== 8) { notify(t('errWa')); return; }
    setBusy(true);
    try {
      const body = { shop: { ...f, name: f.name.trim(), wa: digits(f.wa) || digits(user.phone), delivNote: f.deliv ? f.delivNote : '' } };
      if (photo) body.avatar = await preparePhoto(photo, 400, 0.8);
      await api.updateMe(body);
      await reloadUser();
      invalidateAds(); // le nom de boutique est recopié sur toutes mes annonces
      setPhoto(null);
      setDone(old ? 'saved' : 'created');
    } catch { notify(t('err')); } finally { setBusy(false); }
  }

  function closeShop() {
    notify(t('closeQ'), [{ text: t('cancel'), style: 'cancel' }, {
      text: t('close'), style: 'destructive', onPress: async () => {
        try { await api.updateMe({ shop: null }); await reloadUser(); invalidateAds(); notify(t('closed')); router.back(); } catch { notify(t('err')); }
      },
    }]);
  }

  // ---------- Boutique créée / enregistrée ----------
  if (done && shop) {
    return (
      <View style={[s.wrap, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        <Stack.Screen options={{ title: t('editT') }} />
        <Text style={{ fontSize: 56 }}>{done === 'created' ? '🎉' : '✅'}</Text>
        <Text style={[s.h, { textAlign: 'center' }]}>{done === 'created' ? t('created') : t('saved')}</Text>
        <Text style={[s.h, { textAlign: 'center', color: colors.primaryDark }]}>🏪 {shop.name}</Text>
        {link && (
          <Pressable style={[s.btn, { backgroundColor: colors.whatsapp, alignSelf: 'stretch' }]}
            onPress={() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent('🏪 ' + shop.name + '\n' + link))}>
            <Text style={s.btnTxt}>🟢 {t('share')}</Text>
          </Pressable>
        )}
        <Pressable style={[s.btnLight, { alignSelf: 'stretch' }]} onPress={() => router.replace('/vendeur/' + user.id)}>
          <Text style={s.btnLightTxt}>👁 {t('see')}</Text>
        </Pressable>
        <Pressable onPress={() => setDone(null)}><Text style={s.link}>✏️ {lang === 'ar' ? 'تعديل' : 'Modifier'}</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: old ? t('editT') : t('createT') }} />

      {!old && (
        <View style={s.intro}>
          <Text style={[s.p, al]}>🏪 {t('intro')}</Text>
          <Text style={[s.free, al]}>🎁 {t('free')}</Text>
        </View>
      )}
      {old && (old.verified
        ? <Text style={[s.badge, s.badgeOk]}>{t('verified')}</Text>
        : <Text style={[s.badge, al]}>⏳ {t('pending')}</Text>)}

      <Text style={[s.label, al]}>{t('logo')}</Text>
      <View style={[row, { alignItems: 'center', gap: 14 }]}>
        {logo ? <Image source={logo} style={s.logo} contentFit="cover" /> : <View style={[s.logo, s.logoEmpty]}><Text style={{ fontSize: 30 }}>🏪</Text></View>}
        <Pressable style={s.chip} onPress={choose}><Text style={s.chipTxt}>🖼️ {t('change')}</Text></Pressable>
      </View>

      <Text style={[s.label, al]}>{t('name')}</Text>
      <TextInput style={[s.input, al]} value={f.name} onChangeText={(v) => set({ name: v })} maxLength={60} />
      {renamed && <Text style={[s.warn, al]}>{t('rename')}</Text>}

      <Text style={[s.label, al]}>{t('market')}</Text>
      <TextInput style={[s.input, al]} value={f.market} onChangeText={(v) => set({ market: v })} placeholder={t('marketPh')} placeholderTextColor={colors.muted} maxLength={100} />

      <Text style={[s.label, al]}>{t('desc')}</Text>
      <TextInput style={[s.input, al, { minHeight: 90, textAlignVertical: 'top' }]} value={f.desc} onChangeText={(v) => set({ desc: v })} placeholder={t('descPh')} placeholderTextColor={colors.muted} multiline maxLength={400} />

      <Text style={[s.label, al]}>{t('addr')}</Text>
      <TextInput style={[s.input, al]} value={f.addr} onChangeText={(v) => set({ addr: v })} placeholder={t('addrPh')} placeholderTextColor={colors.muted} maxLength={160} />

      <Text style={[s.label, al]}>{t('hours')}</Text>
      <TextInput style={[s.input, al]} value={f.hours} onChangeText={(v) => set({ hours: v })} placeholder={t('hoursPh')} placeholderTextColor={colors.muted} maxLength={80} />

      <Text style={[s.label, al]}>{t('wa')}</Text>
      <TextInput style={[s.input, al]} value={f.wa} onChangeText={(v) => set({ wa: digits(v).slice(0, 8) })} placeholder={user.phone} placeholderTextColor={colors.muted} keyboardType="phone-pad" />
      <Text style={[s.help, al]}>{t('waHelp')}</Text>

      <View style={[s.toggle, row]}>
        <Text style={[s.toggleTxt, al]}>🚚 {t('deliv')}</Text>
        <Switch value={f.deliv} onValueChange={(v) => set({ deliv: v })} trackColor={{ true: colors.primary }} />
      </View>
      {f.deliv && (
        <TextInput style={[s.input, al]} value={f.delivNote} onChangeText={(v) => set({ delivNote: v })} placeholder={t('delivPh')} placeholderTextColor={colors.muted} maxLength={120} />
      )}

      <View style={[s.toggle, row]}>
        <Text style={[s.toggleTxt, al]}>🏠 {t('agency')}</Text>
        <Switch value={f.agency} onValueChange={(v) => set({ agency: v })} trackColor={{ true: colors.primary }} />
      </View>
      {f.agency && <Text style={[s.help, al]}>{t('agencyHelp')}</Text>}

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{old ? t('save') : '🏪 ' + t('create')}</Text>}
      </Pressable>

      {old && (
        <>
          <Pressable style={s.btnLight} onPress={() => router.push('/vendeur/' + user.id)}><Text style={s.btnLightTxt}>👁 {t('see')}</Text></Pressable>
          <Pressable onPress={closeShop}><Text style={[s.link, { color: colors.danger }]}>{t('close')}</Text></Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 8, paddingBottom: 50 },
  intro: { backgroundColor: '#f0fdf4', borderRadius: radius.m, padding: 14, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  p: { fontSize: 15, color: colors.text, lineHeight: 22 },
  free: { fontSize: 14, color: colors.primaryDark, fontWeight: '800' },
  h: { fontSize: 20, fontWeight: '800', color: colors.text },
  badge: { fontSize: 13, fontWeight: '700', color: '#8A5A00', backgroundColor: '#FFF4D6', borderRadius: 12, padding: 10, overflow: 'hidden' },
  badgeOk: { color: colors.primaryDark, backgroundColor: '#dcfce7', alignSelf: 'flex-start' },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  help: { fontSize: 13, color: colors.muted },
  warn: { fontSize: 13, color: '#8A5A00' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 13, fontSize: 16, backgroundColor: colors.white, color: colors.text },
  logo: { width: 76, height: 76, borderRadius: 14 },
  logoEmpty: { backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.white },
  chipTxt: { fontWeight: '700', color: colors.text },
  toggle: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginTop: 6 },
  toggleTxt: { fontSize: 15, color: colors.text, flex: 1, fontWeight: '600' },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnLight: { backgroundColor: '#e8f5ec', borderRadius: radius.m, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnLightTxt: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  link: { color: colors.primaryDark, fontWeight: '700', textAlign: 'center', padding: 12 },
});
