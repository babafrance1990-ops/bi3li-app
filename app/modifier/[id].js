// Modifier une de mes annonces : même formulaire en 3 étapes que le dépôt, déjà rempli
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { adCache } from '../../src/api';
import AdForm from '../../src/components/AdForm';
import { useLang } from '../../src/i18n';
import { getAllAds } from '../../src/store';
import { colors } from '../../src/theme';

export default function Modifier() {
  const { id } = useLocalSearchParams();
  const { lang, t } = useLang();
  const [ad, setAd] = useState(() => adCache.get(id));
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (ad) return;
    getAllAds().then((all) => { const a = all.find((x) => x.id === id); if (a) setAd(a); else setMissing(true); }).catch(() => setMissing(true));
  }, [id]);

  return (
    <>
      <Stack.Screen options={{ title: lang === 'ar' ? 'تعديل الإعلان' : 'Modifier l’annonce' }} />
      {ad ? <AdForm editAd={ad} /> : missing ? <Text style={{ padding: 20 }}>{t('netErr')}</Text> : <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
    </>
  );
}
