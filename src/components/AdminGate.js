// Garde des pages d'administration : seul un compte administrateur voit le contenu
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../auth';
import { useLang } from '../i18n';
import { colors } from '../theme';
import { adminT } from '../adminShared';

export default function AdminGate({ title, children }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminT(lang);
  if (!user?.admin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ title: t('title') }} />
        <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>{t('notAdmin')}</Text>
      </View>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: title || t('title') }} />
      {children}
    </>
  );
}
