// En-tête de l'accueil, comme sur le site : logo + nom, choix de la ville, zone de recherche
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cityName } from '../places';
import { useLang } from '../i18n';
import LangPill from './LangPill';
import { colors } from '../theme';

const GOLD = '#F2B632';

export default function HomeHeader({ city, onCity }) {
  const { lang, rtl } = useLang();
  const insets = useSafeAreaInsets();
  const row = [s.row, rtl && { flexDirection: 'row-reverse' }];
  const cityLabel = city ? cityName(city, lang) : (lang === 'ar' ? 'كل المدن' : 'Toutes les villes');

  return (
    <View style={[s.head, { paddingTop: insets.top + 6 }]}>
      {/* Ligne 1 : logo + nom, ville, langue */}
      <View style={row}>
        <View style={[s.brand, rtl && { flexDirection: 'row-reverse' }]}>
          <Image source={require('../../assets/site-icon.png')} style={s.logo} />
          <Text style={s.name}>
            {rtl ? 'بيع' : 'Bi3'}<Text style={{ color: GOLD }}>{rtl ? 'لي' : 'li'}</Text>
          </Text>
        </View>
        <Pressable onPress={onCity} style={[s.city, rtl && { flexDirection: 'row-reverse' }]} accessibilityRole="button">
          <Ionicons name="location-outline" size={18} color="#fff" />
          <Text style={s.cityTxt} numberOfLines={1}>{cityLabel}</Text>
          <Ionicons name="chevron-expand-outline" size={16} color="#fff" />
        </Pressable>
        <LangPill onDark />
      </View>

      {/* Ligne 2 : zone de recherche (ouvre l'onglet Recherche) */}
      <Pressable onPress={() => router.navigate('/(tabs)/recherche')} style={[s.search, rtl && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="search-outline" size={22} color={colors.muted} />
        <TextInput
          style={[s.input, rtl && { textAlign: 'right' }]}
          placeholder={lang === 'ar' ? 'عمّا تبحث؟' : 'Que recherchez-vous ?'}
          placeholderTextColor={colors.muted}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  head: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingBottom: 16, gap: 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  city: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)' },
  cityTxt: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 16, borderRadius: 25, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 16, color: colors.text, padding: 0 },
});
