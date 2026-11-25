// Administration : tableau de bord et accès aux pages (signalements, utilisateurs, boutiques)
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { adminT } from '../../src/adminShared';
import AdminGate from '../../src/components/AdminGate';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

export default function Admin() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = adminT(lang);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  // Rechargé à chaque retour sur la page (les chiffres restent à jour)
  useFocusEffect(useCallback(() => {
    if (!user?.admin) return;
    let on = true;
    api.adminOverview().then((o) => { if (on) { setData(o); setErr(false); } }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [user?.admin]));

  const c = data?.counts || {};
  const stats = [[c.users, t('total')], [c.users24, t('new24')], [c.online, t('online')], [c.ads24, t('ads24')], [c.msgs24, t('msgs24')]];
  const nRep = data?.reports?.length || 0;

  const nav = [
    { label: t('reportsBtn') + (nRep ? ' (' + nRep + ')' : ''), path: '/admin/reports', icon: '🚩' },
    { label: t('usersBtn'), path: '/admin/users', icon: '👥' },
    { label: t('shopsBtn'), path: '/admin/shops', icon: '🏪' },
    { label: t('recruitBtn'), path: '/admin/recruit', icon: '🤝' },
    { label: t('publishBtn'), path: '/admin/publish', icon: '📝' },
  ];

  return (
    <AdminGate>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {err && <Text style={[s.msg, al]}>{t('err')}</Text>}

        {!data && !err ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : (
          <View style={s.statGrid}>
            {stats.map(([n, l]) => (
              <View key={l} style={s.stat}>
                <Text style={s.statN}>{(n || 0).toLocaleString('fr-FR')}</Text>
                <Text style={[s.statL, al]}>{l}</Text>
              </View>
            ))}
          </View>
        )}

        {nav.map((b) => (
          <Pressable key={b.path} style={[s.navBtn, row]} onPress={() => router.push(b.path)}>
            <Text style={s.navTxt}>{b.icon} {b.label}</Text>
            <Text style={s.navArrow}>{rtl ? '‹' : '›'}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </AdminGate>
  );
}

const s = StyleSheet.create({
  msg: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexBasis: '31%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'center' },
  statN: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statL: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  navBtn: { alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: radius.l, borderWidth: 1, borderColor: colors.border, paddingVertical: 18, paddingHorizontal: 18 },
  navTxt: { fontSize: 17, fontWeight: '700', color: colors.text },
  navArrow: { fontSize: 24, color: colors.muted },
});
