// Utilisateurs : recherche par numéro, vérification, recruteur, code à 4 chiffres, blocage
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { adminT, runAdmin } from '../../src/adminShared';
import AdminGate from '../../src/components/AdminGate';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

export default function Users() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = adminT(lang);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [pwFor, setPwFor] = useState(null);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  const load = useCallback(async (text) => {
    const r = await api.adminUsers(text);
    setUsers(r.users || []);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!user?.admin) return;
    load(q).catch(() => setMsg(t('err')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.admin, load]));

  // La recherche attend une courte pause pendant la frappe
  function typeSearch(v) {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(v).catch(() => setMsg(t('err'))), 300);
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  async function act(fn) {
    setBusy(true); setMsg('');
    setMsg(await runAdmin(fn, () => load(q), t('err')));
    setBusy(false);
  }

  return (
    <AdminGate title={t('users')}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <TextInput value={q} onChangeText={typeSearch} placeholder={t('search')} placeholderTextColor={colors.muted} keyboardType="number-pad"
          style={[s.input, al]} />
        {!!msg && <Text style={[s.msg, al]}>{msg}</Text>}
        {!users && <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />}
        {users && users.length === 0 && <Text style={[s.muted, al]}>{t('noUser')}</Text>}
        {(users || []).map((u) => (
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
                <Pressable disabled={busy} style={[s.btn, !u.blocked && s.danger]} onPress={() => Alert.alert(t('confirmBlock'), '', [
                  { text: t('cancel'), style: 'cancel' },
                  { text: 'OK', style: 'destructive', onPress: () => act(() => api.adminBlock(u.id, !u.blocked)) },
                ])}>
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
                  act(async () => { await api.adminPassword(u.id, pw); setPwFor(null); setPw(''); });
                }}>
                  <Text style={s.onTxt}>{t('pwSave')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </AdminGate>
  );
}

const s = StyleSheet.create({
  msg: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  muted: { color: colors.muted, fontSize: 14 },
  b: { fontSize: 15, fontWeight: '700', color: colors.text },
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
