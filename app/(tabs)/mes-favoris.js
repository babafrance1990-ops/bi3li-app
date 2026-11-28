// Onglet Favoris (remplace Recherche dans la barre du bas) : annonces favorites et recherches enregistrées, comme sur le site
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Favoris from '../favoris';
import Alertes from '../alertes';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

const T = {
  fr: { ads: 'Annonces', searches: 'Recherches' },
  ar: { ads: 'الإعلانات', searches: 'عمليات البحث' },
};

export default function MesFavoris() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const [tab, setTab] = useState('ads');
  const t = (k) => T[lang][k];
  const nFavs = user?.favs?.length || 0;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.seg, row]}>
        {['ads', 'searches'].map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.segBtn, tab === k && s.segOn]}>
            <Text style={[s.segTxt, tab === k && s.segTxtOn]}>
              {t(k) + (k === 'ads' && nFavs ? ' (' + nFavs + ')' : '')}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'ads' ? <Favoris embedded /> : <Alertes embedded />}
    </View>
  );
}

const s = StyleSheet.create({
  seg: { margin: 10, padding: 4, backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.m, alignItems: 'center' },
  segOn: { backgroundColor: colors.primary },
  segTxt: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  segTxtOn: { color: '#fff' },
});
