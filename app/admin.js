// Administration (compte administrateur) : tableau de bord, signalements, utilisateurs, boutiques.
// Même fonctionnement que le site ; les actions sont confirmées avant d'être envoyées.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { api } from '../src/api';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { colors, radius } from '../src/theme';

const T = {
  fr: {
    title: 'Administration', users: 'Utilisateurs', total: 'Inscrits', new24: 'Nouveaux (24 h)', online: 'En ligne', ads24: 'Annonces (24 h)', msgs24: 'Messages (24 h)',
    reports: 'Signalements', noReports: 'Aucun signalement.', repN: '{n} signalement(s)', delAd: 'Supprimer l’annonce', ignore: 'Ignorer',
    confirmDel: 'Supprimer cette annonce ?', confirmBlock: 'Bloquer cet utilisateur ?', cancel: 'Annuler', block: 'Bloquer', unblock: 'Débloquer',
    search: 'Rechercher par numéro', verified: 'Vérifié', verify: 'Vérifier', unverify: 'Retirer la vérification', blocked: 'Bloqué',
    recruiter: 'Recruteur', recruiterOn: '✓ Recruteur (retirer)', recruiterSet: 'Mettre recruteur', pw: 'Nouveau code', pwSave: 'Enregistrer le code',
    pwHelp: 'Code à 4 chiffres', pwOk: 'Code modifié.', noUser: 'Aucun utilisateur.', adsN: '{n} annonce(s)',
    shops: 'Boutiques', noShop: 'Aucune boutique.', shopVerify: 'Vérifier la boutique', shopUnverify: 'Retirer la vérification',
    err: 'Action impossible. Vérifiez la connexion.', notAdmin: 'Cet espace est réservé à l’administrateur.', done: 'Fait.',
  },
  ar: {
    title: 'الإدارة', users: 'المستخدمون', total: 'المسجّلون', new24: 'جدد (24 ساعة)', online: 'متصلون', ads24: 'إعلانات (24 ساعة)', msgs24: 'رسائل (24 ساعة)',
    reports: 'البلاغات', noReports: 'لا توجد بلاغات.', repN: 'بلاغات: {n}', delAd: 'حذف الإعلان', ignore: 'تجاهل',
    confirmDel: 'حذف هذا الإعلان؟', confirmBlock: 'حظر هذا المستخدم؟', cancel: 'إلغاء', block: 'حظر', unblock: 'إلغاء الحظر',
    search: 'ابحث بالرقم', verified: 'موثّق', verify: 'توثيق', unverify: 'إلغاء التوثيق', blocked: 'محظور',
    recruiter: 'مندوب', recruiterOn: '✓ مندوب (إزالة)', recruiterSet: 'تعيين مندوب', pw: 'رمز جديد', pwSave: 'حفظ الرمز',
    pwHelp: 'رمز من 4 أرقام', pwOk: 'تم تغيير الرمز.', noUser: 'لا يوجد مستخدم.', adsN: 'إعلانات: {n}',
    shops: 'المتاجر', noShop: 'لا توجد متاجر.', shopVerify: 'توثيق المتجر', shopUnverify: 'إلغاء توثيق المتجر',
    err: 'تعذّر تنفيذ الإجراء. تحقق من الاتصال.', notAdmin: 'هذه الصفحة للمدير فقط.', done: 'تم.',
  },
};

export default function Admin() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  const [counts, setCounts] = useState({});
  const [reports, setReports] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [pwFor, setPwFor] = useState(null);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const timer = useRef(null);

  const loadOverview = useCallback(async () => {
    const [o, sh] = await Promise.all([api.adminOverview(), api.adminShops().catch(() => ({ shops: [] }))]);
    setCounts(o.counts || {});
    setReports(o.reports || []);
    setShops(sh.shops || []);
  }, []);

  const loadUsers = useCallback(async (text) => {
    const r = await api.adminUsers(text);
    setUsers(r.users || []);
  }, []);

  // Charge tout au début ; la recherche d'utilisateurs attend une courte pause pendant la frappe
  useEffect(() => {
    if (!user?.admin) return;
    loadOverview().then(() => setReady(true)).catch(() => setMsg(t('err')));
    loadUsers('').catch(() => {});
  }, [user?.admin]);

  function typeSearch(v) {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => loadUsers(v).catch(() => setMsg(t('err'))), 300);
  }

  // Exécute une action puis recharge les données
  async function act(fn) {
    setBusy(true); setMsg('');
    try {
      await fn();
      await Promise.all([loadOverview(), loadUsers(q)]);
    } catch {
      setMsg(t('err'));
    } finally {
      setBusy(false);
    }
  }

  function confirm(text, fn) {
    Alert.alert(text, '', [{ text: t('cancel'), style: 'cancel' }, { text: 'OK', style: 'destructive', onPress: fn }]);
  }

  if (!user?.admin) {
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: t('title') }} />
        <Text style={s.muted}>{t('notAdmin')}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: t('title') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const shopsSorted = shops.slice().sort((x, y) => Number(!!x.shop?.verified) - Number(!!y.shop?.verified));
  const stats = [
    [counts.users, t('total')], [counts.users24, t('new24')], [counts.online, t('online')], [counts.ads24, t('ads24')], [counts.msgs24, t('msgs24')],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: t('title') }} />

      {!!msg && <Text style={[s.msg, al]}>{msg}</Text>}

      {/* Tableau de bord */}
      <View style={[s.statGrid]}>
        {stats.map(([n, l]) => (
          <View key={l} style={s.stat}>
            <Text style={s.statN}>{(n || 0).toLocaleString('fr-FR')}</Text>
            <Text style={[s.statL, al]}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Signalements */}
      <Text style={[s.h, al]}>{t('reports')}</Text>
      {reports.length === 0 && <Text style={[s.muted, al]}>{t('noReports')}</Text>}
      {reports.map((r) => (
        <View key={r.adId} style={s.card}>
          <Text style={[s.b, al]}>{r.title}</Text>
          <Text style={[s.red, al]}>{t('repN', { n: r.n })}</Text>
          {!!r.reasons && <Text style={[s.muted, al]}>{r.reasons}</Text>}
          <Text style={[s.muted, al]} dir="ltr">{r.ownerName} · +222 {r.ownerPhone}</Text>
          <View style={[s.btns, row]}>
            <Pressable disabled={busy} style={[s.btn, s.danger]} onPress={() => confirm(t('confirmDel'), () => act(() => api.deleteAd(r.adId)))}>
              <Text style={s.btnTxtW}>{t('delAd')}</Text>
            </Pressable>
            <Pressable disabled={busy} style={s.btn} onPress={() => act(() => api.adminDismissReport(r.adId))}>
              <Text style={s.btnTxt}>{t('ignore')}</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* Utilisateurs */}
      <Text style={[s.h, al]}>{t('users')}</Text>
      <TextInput value={q} onChangeText={typeSearch} placeholder={t('search')} placeholderTextColor={colors.muted} keyboardType="number-pad"
        style={[s.input, al]} />
      {users.length === 0 && <Text style={[s.muted, al]}>{t('noUser')}</Text>}
      {users.map((u) => (
        <View key={u.id} style={s.card}>
          <View style={[s.between, row]}>
            <Text style={[s.b, { flexShrink: 1 }, al]}>{u.name}{u.blocked ? '  · ' + t('blocked') : ''}</Text>
            <Text style={s.muted} dir="ltr">+222 {u.phone}</Text>
          </View>
          <Text style={[s.muted, al]}>{t('adsN', { n: u.ads || 0 })}</Text>
          <View style={[s.btns, row]}>
            <Pressable disabled={busy} style={[s.btn, u.verified && s.on]} onPress={() => act(() => api.adminVerify(u.id, !u.verified))}>
              <Text style={[s.btnTxt, u.verified && s.onTxt]}>{u.verified ? '✓ ' + t('verified') + ' · ' + t('unverify') : t('verify')}</Text>
            </Pressable>
            {u.id !== user.id && (
              <Pressable disabled={busy} style={[s.btn, u.role === 'recruiter' && s.on]} onPress={() => act(() => api.adminRole(u.id, u.role === 'recruiter' ? '' : 'recruiter'))}>
                <Text style={[s.btnTxt, u.role === 'recruiter' && s.onTxt]}>{u.role === 'recruiter' ? t('recruiterOn') : t('recruiterSet')}</Text>
              </Pressable>
            )}
            <Pressable disabled={busy} style={s.btn} onPress={() => { setPwFor(pwFor === u.id ? null : u.id); setPw(''); }}>
              <Text style={s.btnTxt}>{t('pw')}</Text>
            </Pressable>
            {u.id !== user.id && (
              <Pressable disabled={busy} style={[s.btn, !u.blocked && s.danger]}
                onPress={() => confirm(t('confirmBlock'), () => act(() => api.adminBlock(u.id, !u.blocked)))}>
                <Text style={[s.btnTxt, !u.blocked && s.btnTxtW]}>{u.blocked ? t('unblock') : t('block')}</Text>
              </Pressable>
            )}
          </View>
          {pwFor === u.id && (
            <View style={[s.btns, row]}>
              <TextInput value={pw} onChangeText={(v) => setPw(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4}
                placeholder="0000" placeholderTextColor={colors.muted} style={[s.input, { flex: 1 }]} />
              <Pressable disabled={busy} style={[s.btn, s.on]} onPress={() => {
                if (!/^\d{4}$/.test(pw)) { setMsg(t('pwHelp')); return; }
                act(async () => { await api.adminPassword(u.id, pw); setPwFor(null); setPw(''); setMsg(t('pwOk')); });
              }}>
                <Text style={s.onTxt}>{t('pwSave')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}

      {/* Boutiques */}
      <Text style={[s.h, al]}>{t('shops')} ({shops.length})</Text>
      {shops.length === 0 && <Text style={[s.muted, al]}>{t('noShop')}</Text>}
      {shopsSorted.map((x) => (
        <View key={x.id} style={s.card}>
          <Text style={[s.b, al]}>{x.shop?.name}</Text>
          <Text style={[s.muted, al]} dir="ltr">{x.name} · +222 {x.phone} · {x.ads || 0}</Text>
          <View style={[s.btns, row]}>
            <Pressable disabled={busy} style={[s.btn, x.shop?.verified ? null : s.on]} onPress={() => act(() => api.adminShopVerify(x.id, !x.shop?.verified))}>
              <Text style={[s.btnTxt, !x.shop?.verified && s.onTxt]}>{x.shop?.verified ? t('shopUnverify') : t('shopVerify')}</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {busy && <ActivityIndicator color={colors.primary} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  muted: { color: colors.muted, fontSize: 14 },
  msg: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  h: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 8 },
  b: { fontSize: 15, fontWeight: '700', color: colors.text },
  red: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexBasis: '31%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'center' },
  statN: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statL: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 },
  between: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  btns: { flexWrap: 'wrap', gap: 8, marginTop: 4 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  btnTxtW: { fontSize: 13, fontWeight: '700', color: '#fff' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  onTxt: { color: '#fff' },
  input: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
});
