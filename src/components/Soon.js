// Écran provisoire pour les parties pas encore faites
import { StyleSheet, Text, View } from 'react-native';
import { useLang } from '../i18n';
import { colors } from '../theme';

export default function Soon({ icon }) {
  const { t } = useLang();
  return (
    <View style={s.wrap}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={s.txt}>{t('soon')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  txt: { fontSize: 17, color: colors.muted, fontWeight: '600' },
});
