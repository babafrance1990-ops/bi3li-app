// Onglet Favoris (remplace Recherche dans la barre du bas) : annonces favorites et recherches enregistrées, comme sur le site
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Favoris from '../favoris';
import Alertes from '../alertes';
import { useAuth } from '../../src/auth';
import { useAlertCount } from '../../src/alerts';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

const T = {
  fr: { ads: 'Annonces favorites', searches: 'Recherches sauvées' },
  ar: { ads: 'الإعلانات المفضلة', searches: 'عمليات البحث' },
};

export default function MesFavoris() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const [tab, setTab] = useState('ads');
  const t = (k) => T[lang][k];
  const nFavs = user?.favs?.length || 0;
  const nNew = useAlertCount(); // nouvelles annonces trouvées par mes alertes
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.seg, row]}>
        {['ads', 'searches'].map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.segBtn, tab === k && s.segOn]}>
            <Text style={[s.segTxt, tab === k && s.segTxtOn]}>
              {t(k) + (k === 'ads' && nFavs ? ' (' + nFavs + ')' : '')}
            </Text>
            {k === 'searches' && nNew > 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{nNew > 99 ? '99+' : nNew}</Text></View>
            )}
          </Pressable>
        ))}
      </View>
      {tab === 'ads' ? <Favoris embedded /> : <Alertes embedded />}
    </View>
  );
}

const s = StyleSheet.create({
  seg: { margin: 10, padding: 4, backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.m, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  segOn: { backgroundColor: colors.primary },
  segTxt: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  segTxtOn: { color: '#fff' },
});
