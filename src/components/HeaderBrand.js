// Logo et nom en haut de l'accueil, comme sur le site : icône + « بيع‹لي› » (la partie « لي » en vert)
import { Image, Text, View } from 'react-native';
import { useLang } from '../i18n';
import { colors } from '../theme';

export default function HeaderBrand() {
  const { rtl } = useLang();
  return (
    <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
      <Image source={require('../../assets/site-icon.png')} style={{ width: 30, height: 30, borderRadius: 7 }} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
        {rtl ? 'بيع' : 'Bi3'}<Text style={{ color: colors.primary }}>{rtl ? 'لي' : 'li'}</Text>
      </Text>
    </View>
  );
}
