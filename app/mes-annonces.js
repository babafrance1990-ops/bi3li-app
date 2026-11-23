// Mes annonces : en ligne / vendues, vues et contacts, et les actions du vendeur
// (modifier, marquer comme vendu, remonter en tête de liste une fois par semaine, partager, supprimer).
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect } from 'expo-router';
import { adCache, api, mediaUrl, priceText } from '../src/api';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { notify } from '../src/notify';
import { cityName } from '../src/places';
import { getAllAds, invalidateAds } from '../src/store';
import { colors, radius } from '../src/theme';

const T = {
  fr: {
    title: 'Mes annonces', online: 'En ligne ({n})', sold: 'Vendues ({n})', empty: 'Vous n’avez pas encore d’annonce.', post: 'Déposer une annonce',
    soldTag: 'Vendu', views: 'vues', contacts: 'contacts', edit: 'Modifier', markSold: 'Vendu', bump: 'Remonter', share: 'Partager', del: 'Supprimer',
    cancel: 'Annuler', confirmSold: 'Marquer cette annonce comme vendue ? Elle ne sera plus proposée aux acheteurs.',
    confirmDel: 'Supprimer définitivement cette annonce et ses photos ?', bumped: 'Votre annonce est remontée en tête de liste.',
    tooSoon: 'Vous pourrez la remonter à partir du {d}.', err: 'Action impossible. Vérifiez votre connexion.', login: 'Connectez-vous pour voir vos annonces.',
  },
  ar: {
    title: 'إعلاناتي', online: 'منشورة ({n})', sold: 'مباعة ({n})', empty: 'ليس لديك إعلانات بعد.', post: 'أضف إعلاناً',
    soldTag: 'تم البيع', views: 'مشاهدة', contacts: 'تواصل', edit: 'تعديل', markSold: 'تم البيع', bump: 'رفع', share: 'مشاركة', del: 'حذف',
    cancel: 'إلغاء', confirmSold: 'هل تريد وضع علامة «تم البيع» على هذا الإعلان؟ لن يظهر للمشترين بعد الآن.',
    confirmDel: 'حذف هذا الإعلان وصوره نهائياً؟', bumped: 'تم رفع إعلانك إلى أعلى القائمة.',
    tooSoon: 'يمكنك رفعه ابتداءً من {d}.', err: 'تعذّر تنفيذ العملية. تحقق من الاتصال.', login: 'سجّل الدخول لرؤية إعلاناتك.',
  },
};

export default function MesAnnonces() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const [ads, setAds] = useState(null);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('online');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState('');
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  const load = useCallback(async (force) => {
    if (!user) return;
    try {
      const all = await getAllAds({ force });
      const mine = all.filter((a) => a.owner === user.id).sort((x, y) => y.t - x.t);
      setAds(mine);
      // vues et contacts de chaque annonce (en parallèle)
      Promise.all(mine.slice(0, 40).map((a) => api.adStats(a.id).then((r) => [a.id, r]).catch(() => null)))
        .then((list) => setStats(Object.fromEntries(list.filter(Boolean))));
    } catch { setAds((x) => x || []); notify(t('err')); } finally { setRefreshing(false); }
  }, [user?.id]);

  // rechargé à chaque retour sur l'écran (après une modification par exemple)
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  if (!user) return <View style={s.center}><Text style={s.muted}>{t('login')}</Text></View>;

  const online = (ads || []).filter((a) => a.status !== 'sold');
  const sold = (ads || []).filter((a) => a.status === 'sold');
  const shown = tab === 'online' ? online : sold;

  async function act(a, kind) {
    const run = async () => {
      setBusy(a.id + kind);
      try {
        if (kind === 'sold') { await api.soldAd(a.id); a.status = 'sold'; }
        if (kind === 'del') { await api.deleteAd(a.id); adCache.delete(a.id); setAds((l) => l.filter((x) => x.id !== a.id)); }
        if (kind === 'bump') {
          try { const r = await api.bumpAd(a.id); Object.assign(a, r.ad); notify(t('bumped')); } catch (e) {
            if (e.code === 'too_soon') { notify(t('tooSoon', { d: new Date(e.data.next).toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR') })); return; }
            throw e;
          }
        }
        invalidateAds();
        setAds((l) => [...l]);
      } catch { notify(t('err')); } finally { setBusy(''); }
    };
    if (kind === 'sold') notify(t('confirmSold'), [{ text: t('cancel'), style: 'cancel' }, { text: t('markSold'), onPress: run }]);
    else if (kind === 'del') notify(t('confirmDel'), [{ text: t('cancel'), style: 'cancel' }, { text: t('del'), style: 'destructive', onPress: run }]);
    else run();
  }

  const share = (a) => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(a.title + '\n' + priceText(a, lang) + '\nhttps://bi3li.net/?annonce=' + a.id));

  const Btn = ({ a, kind, label, color }) => (
    <Pressable style={[s.btn, color && { borderColor: color }]} disabled={!!busy} onPress={() => act(a, kind)}>
      {busy === a.id + kind ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[s.btnTxt, color && { color }]}>{label}</Text>}
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('title') }} />
      <View style={[s.tabs, row]}>
        {[['online', t('online', { n: online.length })], ['sold', t('sold', { n: sold.length })]].map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]}>
            <Text style={[s.tabTxt, tab === k && { color: colors.primaryDark }]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {!ads ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={shown}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 10, gap: 10, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} onRefresh={() => { setRefreshing(true); load(true); }} />}
          ListEmptyComponent={(
            <View style={s.center}>
              <Text style={{ fontSize: 44 }}>📭</Text>
              <Text style={s.muted}>{t('empty')}</Text>
              {tab === 'online' && <Pressable style={s.main} onPress={() => router.push('/deposer')}><Text style={s.mainTxt}>➕ {t('post')}</Text></Pressable>}
            </View>
          )}
          renderItem={({ item: a }) => {
            const st = stats[a.id];
            return (
              <View style={s.card}>
                <Pressable style={[row, { gap: 10 }]} onPress={() => { adCache.set(a.id, a); router.push('/annonce/' + a.id); }}>
                  <View>
                    {a.photos?.[0] ? <Image source={mediaUrl(a.photos[0])} style={s.img} contentFit="cover" /> : <View style={[s.img, s.noImg]}><Text>📷</Text></View>}
                    {a.status === 'sold' && <Text style={s.soldTag}>{t('soldTag')}</Text>}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[s.title, al]} numberOfLines={2}>{a.title}</Text>
                    <Text style={[s.price, al]}>{priceText(a, lang)}</Text>
                    <Text style={[s.muted, al, { fontSize: 12 }]}>📍 {[a.hood, cityName(a.city, lang)].filter(Boolean).join(' · ')} · {new Date(a.t).toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR')}</Text>
                    <Text style={[s.stats, al]}>👁 {st ? st.views : '…'} {t('views')}   ·   💬 {st ? st.contacts : '…'} {t('contacts')}</Text>
                  </View>
                </Pressable>
                <View style={[s.actions, row]}>
                  <Pressable style={s.btn} onPress={() => router.push('/modifier/' + a.id)}><Text style={s.btnTxt}>✏️ {t('edit')}</Text></Pressable>
                  {a.status !== 'sold' && <Btn a={a} kind="sold" label={'✅ ' + t('markSold')} />}
                  {a.status !== 'sold' && <Btn a={a} kind="bump" label={'⬆️ ' + t('bump')} />}
                  {a.status !== 'sold' && <Pressable style={s.btn} onPress={() => share(a)}><Text style={s.btnTxt}>🟢 {t('share')}</Text></Pressable>}
                  <Btn a={a} kind="del" label={'🗑 ' + t('del')} color={colors.danger} />
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tabs: { backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 3, borderColor: 'transparent' },
  tabOn: { borderColor: colors.primary },
  tabTxt: { fontSize: 15, fontWeight: '700', color: colors.muted },
  card: { backgroundColor: colors.white, borderRadius: radius.m, padding: 10, gap: 10, borderWidth: 1, borderColor: colors.border },
  img: { width: 92, height: 92, borderRadius: 10 },
  noImg: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  soldTag: { position: 'absolute', top: 4, left: 4, backgroundColor: colors.danger, color: '#fff', fontSize: 11, fontWeight: '800', paddingHorizontal: 6, borderRadius: 5 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  price: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  stats: { fontSize: 13, color: colors.text, fontWeight: '600' },
  actions: { flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 },
  btn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border, minWidth: 60, alignItems: 'center' },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  center: { alignItems: 'center', padding: 30, gap: 12, marginTop: 30 },
  muted: { color: colors.muted, textAlign: 'center' },
  main: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 13, paddingHorizontal: 20 },
  mainTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
