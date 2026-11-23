// Barre d'onglets en bas : Accueil, Recherche, Déposer, Messages, Mon compte
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAlertCount } from '../../src/alerts';
import { useConvs } from '../../src/chat';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';

const icon = (e) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{e}</Text>;

export default function TabsLayout() {
  const { t } = useLang();
  const { unread } = useConvs(20000); // pastille rouge sur « Messages »
  const fresh = useAlertCount();       // pastille sur « Mon compte » : nouvelles annonces de mes alertes
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerTitleAlign: 'center' }}>
      <Tabs.Screen name="index" options={{ title: t('home'), headerTitle: 'بيعلي – Bi3li', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="recherche" options={{ title: t('search'), tabBarIcon: icon('🔍') }} />
      <Tabs.Screen name="deposer" options={{ title: t('post'), tabBarIcon: icon('➕') }} />
      <Tabs.Screen name="messages" options={{ title: t('messages'), tabBarIcon: icon('💬'), tabBarBadge: unread > 0 ? unread : undefined }} />
      <Tabs.Screen name="compte" options={{ title: t('account'), tabBarIcon: icon('👤'), tabBarBadge: fresh > 0 ? (fresh > 50 ? '50+' : fresh) : undefined, tabBarBadgeStyle: { backgroundColor: '#16a34a' } }} />
    </Tabs>
  );
}
