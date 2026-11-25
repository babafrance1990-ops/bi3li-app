// Recruter des vendeurs : on note les vendeurs trouvés sur les réseaux, on leur écrit sur WhatsApp,
// puis on publie leur annonce dans leur compte (avec leur accord).
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, cleanPhone } from '../../src/api';
import { adminT } from '../../src/adminShared';
import AdForm from '../../src/components/AdForm';
import AdminGate from '../../src/components/AdminGate';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

const SRC = { fb: ['Facebook', 'فيسبوك'], wa: ['WhatsApp', 'واتساب'], tt: ['TikTok', 'تيك توك'], ig: ['Instagram', 'إنستغرام'], other: ['Autre', 'آخر'] };
const STATUS = {
  new: ['À contacter', 'للتواصل'], relance: ['À relancer', 'للتذكير'], contacted: ['Contacté', 'تم التواصل'],
  accepted: ['D’accord', 'موافق'], refused: ['Refusé', 'رفض'], published: ['Publié', 'تم النشر'],
};
const MSG1 = {
  fr: 'Bonjour{n},\nJ’ai vu votre annonce « {t} » sur {s}.\nNous sommes Bi3li, un nouveau site mauritanien de petites annonces, gratuit : https://bi3li.net\nNous pouvons publier votre annonce gratuitement, vous n’avez rien à faire.\nVous êtes d’accord ?',
  ar: 'السلام عليكم{n}،\nشفت إعلانك «{t}» على {s}.\nنحن موقع بيعلي، موقع موريتاني جديد ومجاني للإعلانات: https://bi3li.net\nنقدر ننشر إعلانك مجاناً، وما تحتاج تدير شي.\nتوافق؟',
};
const MSG2 = {
  fr: 'Bonjour{n}, je reviens vers vous pour votre annonce « {t} ».\nL’offre tient toujours : nous la publions gratuitement pour vous sur Bi3li.\nSi cela ne vous intéresse pas, dites-le-moi simplement et je ne vous dérangerai plus.',
  ar: 'السلام عليكم{n}، أعود إليك بخصوص إعلانك «{t}».\nما زال العرض قائماً: ننشره لك مجاناً في بيعلي.\nإذا لم تكن مهتماً، أخبرني فقط ولن أزعجك مرة أخرى.',
};

const isAr = (x) => /[؀-ۿ]/.test(x || '');
const fill = (tpl, p, L) => tpl
  .replace('{n}', p.name ? (L === 'ar' ? ' ' : ' ') + p.name : '')
  .replace('{t}', (p.item && p.item.title) || (L === 'ar' ? 'منتجك' : 'votre article'))
  .replace('{s}', (SRC[p.src || 'fb'] || SRC.fb)[L === 'ar' ? 1 : 0]);

export default function Recruit() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = adminT(lang);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const lab = (x) => (lang === 'ar' ? x[1] : x[0]);
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ phone: '', name: '', src: 'fb', note: '' });
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.adminProspects();
    setList(r.prospects || []);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!user?.admin) return;
    load().catch(() => setMsg(t('err')));
  }, [user?.admin, load]));

  async function act(fn) {
    setBusy(true); setMsg('');
    try { await fn(); await load(); }
    catch { setMsg(t('err')); }
    finally { setBusy(false); }
  }

  // Messages envoyés aujourd'hui (le site limite à 30 par jour pour protéger le numéro WhatsApp)
  const today = (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d.getTime(); })();
  const sentToday = (list || []).filter((p) => p.contacted >= today).length;

  function save() {
    if (!/^[234]\d{7}$/.test(cleanPhone(form.phone))) { setMsg('Numéro invalide (8 chiffres, commence par 2, 3 ou 4).'); return; }
    if (!form.name.trim()) { setMsg('Indiquez le nom du vendeur.'); return; }
    act(async () => {
      await api.adminAddProspect({ phone: cleanPhone(form.phone), name: form.name.trim(), src: form.src, note: form.note.trim() });
      setForm({ phone: '', name: '', src: 'fb', note: '' });
      setShowForm(false);
    });
  }

  function sendMessage(p, tpl) {
    const L = isAr(p.name + ' ' + (p.item?.title || '')) ? 'ar' : 'fr';
    const body = fill(tpl[L], p, L);
    Linking.openURL('https://wa.me/222' + cleanPhone(p.phone) + '?text=' + encodeURIComponent(body)).catch(() => {});
    act(() => api.adminUpdateProspect(p.id, { contacted: true }));
  }

  if (target) {
    return (
      <AdminGate title={t('title')}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={[s.topBar, row]}>
            <Text style={[s.b, { flex: 1 }, al]} numberOfLines={1}>{target.name} · +222 {target.phone}</Text>
            <Pressable onPress={() => setTarget(null)}><Text style={s.link}>{lab(['Annuler', 'إلغاء'])}</Text></Pressable>
          </View>
          <AdForm adminTarget={target} />
        </View>
      </AdminGate>
    );
  }

  return (
    <AdminGate title={t('title')}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[s.muted, al]}>{lab(['Trouvez une annonce sur Facebook, WhatsApp ou TikTok, notez le vendeur ici, puis publiez son annonce avec son accord.', 'ابحث عن إعلان على فيسبوك أو واتساب أو تيك توك، سجّل البائع هنا، ثم انشر إعلانه بموافقته.'])}</Text>
        <Text style={[s.muted, al]}>{lab(['Messages envoyés aujourd’hui : ' + sentToday + ' / 30', 'الرسائل المرسلة اليوم: ' + sentToday + ' / 30'])}</Text>

        <Pressable style={s.btn} onPress={() => setShowForm(!showForm)}>
          <Text style={s.btnTxt}>{showForm ? '✕' : '+'} {lab(['Nouveau vendeur', 'بائع جديد'])}</Text>
        </Pressable>

        {showForm && (
          <View style={s.card}>
            <Text style={[s.label, al]}>{lab(['Numéro du vendeur (8 chiffres)', 'رقم البائع (8 أرقام)'])}</Text>
            <TextInput value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v.replace(/\D/g, '').slice(0, 8) })} keyboardType="number-pad" maxLength={8} style={[s.input, al]} />
            <Text style={[s.label, al]}>{lab(['Nom du vendeur', 'اسم البائع'])}</Text>
            <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} maxLength={30} style={[s.input, al]} />
            <Text style={[s.label, al]}>{lab(['Trouvé sur', 'وجدته على'])}</Text>
            <View style={[s.btns, row]}>
              {Object.keys(SRC).map((k) => (
                <Pressable key={k} style={[s.btn, form.src === k && s.on]} onPress={() => setForm({ ...form, src: k })}>
                  <Text style={[s.btnTxt, form.src === k && s.onTxt]}>{lab(SRC[k])}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[s.label, al]}>{lab(['Note (groupe, lien…)', 'ملاحظة (المجموعة، الرابط…)'])}</Text>
            <TextInput value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} style={[s.input, al]} />
            <Pressable disabled={busy} style={[s.btn, s.on, { alignSelf: rtl ? 'flex-end' : 'flex-start' }]} onPress={save}>
              <Text style={s.onTxt}>{lab(['Enregistrer le vendeur', 'حفظ البائع'])}</Text>
            </Pressable>
          </View>
        )}

        {!!msg && <Text style={[s.msg, al]}>{msg}</Text>}
        {!list && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
        {list && list.length === 0 && <Text style={[s.muted, al]}>{lab(['Aucun vendeur pour l’instant.', 'لا يوجد بائعون بعد.'])}</Text>}

        {(list || []).map((p) => {
          const st = p.status || 'new';
          const L = isAr(p.name + ' ' + (p.item?.title || '')) ? 1 : 0;
          return (
            <View key={p.id} style={s.card}>
              <View style={[s.between, row]}>
                <Text style={[s.b, { flexShrink: 1 }, al]}>{p.name}</Text>
                <Text style={s.badge}>{STATUS[st] ? STATUS[st][L] : st}</Text>
              </View>
              <Text style={[s.muted, al]} dir="ltr">+222 {p.phone} · {(SRC[p.src] || SRC.other)[L]}{p.tries ? ' · ' + p.tries + ' msg' : ''}</Text>
              {!!p.note && <Text style={[s.muted, al]}>{p.note}</Text>}
              <View style={[s.btns, row]}>
                <Pressable disabled={busy} style={[s.btn, s.on]} onPress={() => sendMessage(p, p.tries ? MSG2 : MSG1)}>
                  <Text style={s.onTxt}>{p.tries ? lab(['Relancer', 'تذكير']) : lab(['Envoyer le 1er message', 'إرسال الرسالة الأولى'])}</Text>
                </Pressable>
                <Pressable disabled={busy} style={s.btn} onPress={() => act(() => api.adminUpdateProspect(p.id, { status: 'accepted' }))}>
                  <Text style={s.btnTxt}>{lab(['Il est d’accord', 'وافق'])}</Text>
                </Pressable>
                <Pressable disabled={busy} style={s.btn} onPress={() => act(() => api.adminUpdateProspect(p.id, { status: 'refused' }))}>
                  <Text style={s.btnTxt}>{lab(['Il refuse', 'رفض'])}</Text>
                </Pressable>
                {!p.verified && (
                  <Pressable disabled={busy} style={s.btn} onPress={() => act(() => api.adminVerifyProspect(p.id))}>
                    <Text style={s.btnTxt}>{lab(['Valider son numéro', 'توثيق رقمه'])}</Text>
                  </Pressable>
                )}
                <Pressable disabled={busy} style={[s.btn, s.on]} onPress={() => setTarget({
                  kind: 'prospect', id: p.id, phone: p.phone, name: p.name,
                  onDone: () => { setTarget(null); setMsg(lab(['Annonce publiée ✓', 'تم نشر الإعلان ✓'])); load(); },
                })}>
                  <Text style={s.onTxt}>{lab(['Préparer et publier l’annonce', 'تجهيز الإعلان ونشره'])}</Text>
                </Pressable>
                <Pressable disabled={busy} style={s.btn} onPress={() => Alert.alert(lab(['Retirer de la liste ?', 'حذف من القائمة؟']), '', [
                  { text: lab(['Annuler', 'إلغاء']), style: 'cancel' },
                  { text: 'OK', style: 'destructive', onPress: () => act(() => api.adminDeleteProspect(p.id)) },
                ])}>
                  <Text style={s.btnTxt}>{lab(['Retirer', 'حذف'])}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {busy && <ActivityIndicator color={colors.primary} />}
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
  badge: { fontSize: 12, fontWeight: '800', color: colors.primary, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  topBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border },
  card: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 },
  between: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  btns: { flexWrap: 'wrap', gap: 8, marginTop: 4 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  onTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
});
