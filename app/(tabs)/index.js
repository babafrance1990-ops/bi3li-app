// Accueil : catégories qui défilent + toutes les annonces, chargées par pages de 40
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/api';
import AdCard from '../../src/components/AdCard';
import CategoryBar from '../../src/components/CategoryBar';
import VerifyBanner from '../../src/components/VerifyBanner';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';

export default function Home() {
  const { t } = useLang();
  const [ads, setAds] = useState([]);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [cat, setCat] = useState(null);

  const load = useCallback(async (reset) => {
    if (loading) return;
    setLoading(true); setError(false);
    try {
      const before = reset ? undefined : ads[ads.length - 1]?.t;
      const r = await api.ads({ limit: 40, before });
      const online = r.ads.filter((a) => a.status !== 'deleted');
      setAds((old) => (reset ? online : [...old, ...online]));
      setMore(r.more);
    } catch {
      setError(true);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [ads, loading]);

  useEffect(() => { load(true); }, []);

  const shown = useMemo(() => (cat ? ads.filter((a) => a.cat === cat) : ads), [ads, cat]);

  return (
    <FlatList
      data={shown}
      numColumns={2}
      keyExtractor={(a) => a.id}
      renderItem={({ item }) => <AdCard ad={item} />}
      contentContainerStyle={{ padding: 5, paddingBottom: 30 }}
      ListHeaderComponent={<><VerifyBanner style={{ marginHorizontal: 5, marginTop: 6 }} /><CategoryBar value={cat} onChange={setCat} /></>}
      onEndReached={() => more && !error && load(false)}
      onEndReachedThreshold={0.6}
      refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} onRefresh={() => { setRefreshing(true); load(true); }} />}
      ListFooterComponent={
        loading ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> :
        error ? (
          <View style={s.center}>
            <Text style={s.muted}>{t('netErr')}</Text>
            <Pressable style={s.btn} onPress={() => load(ads.length === 0)}><Text style={s.btnTxt}>{t('retry')}</Text></Pressable>
          </View>
        ) : null
      }
    />
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', padding: 24, gap: 12 },
  muted: { color: colors.muted, fontSize: 15 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
