// Publier pour un numéro : on tape le numéro du vendeur, l'annonce part dans son compte (créé si besoin)
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, cleanPhone } from '../../src/api';
import { adminT } from '../../src/adminShared';
import AdForm from '../../src/components/AdForm';
import AdminGate from '../../src/components/AdminGate';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

const T = {
  fr: { title: 'Publier pour un numéro', help: 'Tapez le numéro du vendeur : l’annonce sera publiée dans son compte. S’il n’a pas de compte, il sera créé.',
    phone: 'Numéro du vendeur (8 chiffres)', find: 'Chercher', noAcc: 'Aucun compte avec ce numéro. Écrivez son nom : le compte sera créé.',
    name: 'Nom du vendeur', verifyNew: 'J’ai parlé au vendeur sur ce numéro', verifyBtn: 'Valider son numéro', verified: '✓ Numéro vérifié',
    go: 'Préparer l’annonce', cancel: 'Annuler', done: 'Annonce publiée ✓', again: 'Publier une autre annonce', sendWa: 'Envoyer ses accès sur WhatsApp',
    errPhone: 'Numéro invalide (8 chiffres, commence par 2, 3 ou 4).', errName: 'Écrivez le nom du vendeur.', err: 'Action impossible. Vérifiez la connexion.',
    waMsg: 'Bonjour {n}, votre annonce est en ligne sur Bi3li. Pour entrer dans votre compte : numéro {p}, code secret {w}.' },
  ar: { title: 'النشر لرقم بائع', help: 'اكتب رقم البائع: سيُنشر الإعلان في حسابه. إذا لم يكن لديه حساب، سيُنشأ.',
    phone: 'رقم البائع (8 أرقام)', find: 'بحث', noAcc: 'لا يوجد حساب بهذا الرقم. اكتب اسمه: سيُنشأ الحساب.',
    name: 'اسم البائع', verifyNew: 'تحدثت مع البائع على هذا الرقم', verifyBtn: 'توثيق رقمه', verified: '✓ رقم موثّق',
    go: 'تجهيز الإعلان', cancel: 'إلغاء', done: 'تم نشر الإعلان ✓', again: 'نشر إعلان آخر', sendWa: 'أرسل له بيانات الدخول على واتساب',
    errPhone: 'رقم غير صحيح (8 أرقام، يبدأ بـ 2 أو 3 أو 4).', errName: 'اكتب اسم البائع.', err: 'تعذّر تنفيذ الإجراء. تحقق من الاتصال.',
    waMsg: 'السلام عليكم {n}، إعلانك منشور الآن في بيعلي. لدخول حسابك: الرقم {p}، الرقم السري {w}.' },
};

export default function Publish() {
  const { lang, rtl } = useLang();
  const t = (k) => T[lang][k];
  const at = adminT(lang);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState(null);   // { user } ou { user: null } après la recherche
  const [name, setName] = useState('');
  const [verify, setVerify] = useState(false);
  const [target, setTarget] = useState(null); // formulaire d'annonce en mode administrateur
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function find() {
    if (!/^[234]\d{7}$/.test(cleanPhone(phone))) { setMsg(t('errPhone')); return; }
    setBusy(true); setMsg(''); setResult(null);
    try { setFound(await api.adminLookup(phone)); setVerify(false); }
    catch { setMsg(t('err')); }
    finally { setBusy(false); }
  }

  async function verifyExisting() {
    setBusy(true); setMsg('');
    try {
      await api.adminVerify(found.user.id, true);
      setFound({ user: { ...found.user, verified: true } });
    } catch { setMsg(t('err')); }
    finally { setBusy(false); }
  }

  function start() {
    const who = found?.user ? found.user.name : name.trim();
    if (!who) { setMsg(t('errName')); return; }
    setMsg('');
    setTarget({
      kind: 'phone', phone: cleanPhone(phone), name: who, verify: !found?.user && verify,
      onDone: (r) => { setTarget(null); setResult(r); setFound(null); setPhone(''); setName(''); setVerify(false); },
    });
  }

  function sendCreds() {
    const body = t('waMsg').replace('{n}', result.name || '').replace('{p}', result.phone || '').replace('{w}', result.pass || '');
    Linking.openURL('https://wa.me/222' + cleanPhone(result.phone) + '?text=' + encodeURIComponent(body)).catch(() => {});
  }

  if (target) {
    return (
      <AdminGate title={t('title')}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={[s.topBar, row]}>
            <Text style={[s.b, { flex: 1 }, al]} numberOfLines={1}>{target.name} · +222 {target.phone}</Text>
            <Pressable onPress={() => setTarget(null)}><Text style={s.link}>{t('cancel')}</Text></Pressable>
          </View>
          <AdForm adminTarget={target} />
        </View>
      </AdminGate>
    );
  }

  return (
    <AdminGate title={t('title')}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[s.muted, al]}>{t('help')}</Text>

        <Text style={[s.label, al]}>{t('phone')}</Text>
        <View style={[row, { gap: 8 }]}>
          <TextInput value={phone} onChangeText={(v) => { setPhone(v.replace(/\D/g, '').slice(0, 8)); setFound(null); setResult(null); }}
            keyboardType="number-pad" maxLength={8} placeholder="XX XX XX XX" placeholderTextColor={colors.muted} style={[s.input, { flex: 1 }]} />
          <Pressable disabled={busy} style={[s.btn, s.on]} onPress={find}><Text style={s.onTxt}>{t('find')}</Text></Pressable>
        </View>

        {!!msg && <Text style={[s.msg, al]}>{msg}</Text>}
        {busy && <ActivityIndicator color={colors.primary} />}

        {result && (
          <View style={s.card}>
            <Text style={[s.b, al]}>{t('done')}</Text>
            {!!result.pass && <Pressable style={[s.btn, s.on, { alignSelf: rtl ? 'flex-end' : 'flex-start' }]} onPress={sendCreds}><Text style={s.onTxt}>{t('sendWa')}</Text></Pressable>}
            <Pressable style={[s.btn, { alignSelf: rtl ? 'flex-end' : 'flex-start' }]} onPress={() => setResult(null)}><Text style={s.btnTxt}>{t('again')}</Text></Pressable>
          </View>
        )}

        {found && (
          found.user ? (
            <View style={s.card}>
              <Text style={[s.b, al]}>{found.user.name}</Text>
              <Text style={[s.muted, al]} dir="ltr">+222 {found.user.phone}</Text>
              {found.user.blocked ? <Text style={[s.msg, al]}>{at('blocked')}</Text> : (
                <View style={[s.btns, row]}>
                  {!found.user.verified && <Pressable disabled={busy} style={s.btn} onPress={verifyExisting}><Text style={s.btnTxt}>{t('verifyBtn')}</Text></Pressable>}
                  <Pressable disabled={busy} style={[s.btn, s.on]} onPress={start}><Text style={s.onTxt}>{t('go')}</Text></Pressable>
                </View>
              )}
              {found.user.verified && <Text style={[s.muted, al]}>{t('verified')}</Text>}
            </View>
          ) : (
            <View style={s.card}>
              <Text style={[s.muted, al]}>{t('noAcc')}</Text>
              <Text style={[s.label, al]}>{t('name')}</Text>
              <TextInput value={name} onChangeText={setName} maxLength={30} style={[s.input, al]} />
              <Pressable style={[s.checkRow, row]} onPress={() => setVerify(!verify)}>
                <Text style={[s.b, { flex: 1 }, al]}>{verify ? '☑' : '☐'} {t('verifyNew')}</Text>
              </Pressable>
              <Pressable style={[s.btn, s.on, { alignSelf: rtl ? 'flex-end' : 'flex-start' }]} onPress={start}><Text style={s.onTxt}>{t('go')}</Text></Pressable>
            </View>
          )
        )}
      </ScrollView>
    </AdminGate>
  );
}

const s = StyleSheet.create({
  muted: { color: colors.muted, fontSize: 14 },
  msg: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  b: { fontSize: 15, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '700' },
  topBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border },
  card: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 },
  btns: { flexWrap: 'wrap', gap: 8, marginTop: 4 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  onTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkRow: { alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, backgroundColor: colors.bg, paddingVertical: 12, paddingHorizontal: 14 },
  input: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
});
