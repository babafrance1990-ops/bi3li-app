// Boutiques : vérifier ou retirer la vérification ; les boutiques non vérifiées sont en premier
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { adminT, runAdmin } from '../../src/adminShared';
import AdminGate from '../../src/components/AdminGate';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

export default function Shops() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = adminT(lang);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const [shops, setShops] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.adminShops();
    setShops(r.shops || []);
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

  const sorted = (shops || []).slice().sort((x, y) => Number(!!x.shop?.verified) - Number(!!y.shop?.verified));

  return (
    <AdminGate title={t('shops')}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {!!msg && <Text style={[s.msg, al]}>{msg}</Text>}
        {!shops && <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />}
        {shops && shops.length === 0 && <Text style={[s.muted, al]}>{t('noShop')}</Text>}
        {sorted.map((x) => (
          <View key={x.id} style={s.card}>
            <Text style={[s.b, al]}>{x.shop?.name}</Text>
            <Text style={[s.muted, al]} dir="ltr">{x.name} · +222 {x.phone} · {x.ads || 0}</Text>
            <View style={[s.btns, row]}>
              <Pressable disabled={busy} style={[s.btn, !x.shop?.verified && s.on]} onPress={() => act(() => api.adminShopVerify(x.id, !x.shop?.verified))}>
                <Text style={[s.btnTxt, !x.shop?.verified && s.onTxt]}>{x.shop?.verified ? t('shopUnverify') : t('shopVerify')}</Text>
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
  card: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 },
  btns: { flexWrap: 'wrap', gap: 8, marginTop: 4 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  onTxt: { color: '#fff' },
});
