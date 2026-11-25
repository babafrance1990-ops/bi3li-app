// Signalements : supprimer l'annonce signalée ou ignorer le signalement
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { adminT, runAdmin } from '../../src/adminShared';
import AdminGate from '../../src/components/AdminGate';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

export default function Reports() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = adminT(lang);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const [reports, setReports] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const o = await api.adminOverview();
    setReports(o.reports || []);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!user?.admin) return;
    load().catch(() => setMsg(t('err')));
  }, [user?.admin, load]));

  async function act(fn) {
    setBusy(true); setMsg('');
    setMsg(await runAdmin(fn, load, t('err')));
    setBusy(false);
  }

  return (
    <AdminGate title={t('reports')}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {!!msg && <Text style={[s.msg, al]}>{msg}</Text>}
        {!reports && <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />}
        {reports && reports.length === 0 && <Text style={[s.muted, al]}>{t('noReports')}</Text>}
        {(reports || []).map((r) => (
          <View key={r.adId} style={s.card}>
            <Text style={[s.b, al]}>{r.title}</Text>
            <Text style={[s.red, al]}>{t('repN', { n: r.n })}</Text>
            {!!r.reasons && <Text style={[s.muted, al]}>{r.reasons}</Text>}
            <Text style={[s.muted, al]} dir="ltr">{r.ownerName} · +222 {r.ownerPhone}</Text>
            <View style={[s.btns, row]}>
              <Pressable disabled={busy} style={[s.btn, s.danger]} onPress={() => Alert.alert(t('confirmDel'), '', [
                { text: t('cancel'), style: 'cancel' },
                { text: 'OK', style: 'destructive', onPress: () => act(() => api.deleteAd(r.adId)) },
              ])}>
                <Text style={s.btnTxtW}>{t('delAd')}</Text>
              </Pressable>
              <Pressable disabled={busy} style={s.btn} onPress={() => act(() => api.adminDismissReport(r.adId))}>
                <Text style={s.btnTxt}>{t('ignore')}</Text>
              </Pressable>
            </View>
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
  red: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 },
  btns: { flexWrap: 'wrap', gap: 8, marginTop: 4 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  btnTxtW: { fontSize: 13, fontWeight: '700', color: '#fff' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
});
