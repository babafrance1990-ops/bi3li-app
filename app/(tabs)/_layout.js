// Barre d'onglets en bas : Accueil, Favoris, Déposer, Messages, Mon compte (la recherche reste accessible depuis l'accueil)
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlertCount } from '../../src/alerts';
import { useConvs } from '../../src/chat';
import AddTabButton from '../../src/components/AddTabButton';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';

// Icônes en traits, comme sur le site (version pleine quand l'onglet est ouvert)
const icon = (name, outline) => ({ color, focused }) => <Ionicons name={focused ? name : outline} size={24} color={color} />;

export default function TabsLayout() {
  const { t, lang } = useLang();
  const { unread } = useConvs(20000); // pastille rouge sur « Messages »
  const fresh = useAlertCount();       // pastille sur « Mon compte » : nouvelles annonces de mes alertes
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerTitleAlign: 'center', sceneStyle: { backgroundColor: colors.bg }, headerTransparent: false, headerStyle: { backgroundColor: colors.white } }}>
      <Tabs.Screen name="index" options={{ title: t('home'), headerShown: false, tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="mes-favoris" options={{ title: lang === 'ar' ? 'المفضلة' : 'Favoris', tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen name="recherche" options={{ href: null }} />
      <Tabs.Screen name="deposer" options={{ title: t('post'), tabBarIcon: icon('add-circle', 'add-circle-outline'), tabBarButton: (props) => <AddTabButton {...props} /> }} />
      <Tabs.Screen name="messages" options={{ title: t('messages'), tabBarIcon: icon('chatbubble-ellipses', 'chatbubble-ellipses-outline'), tabBarBadge: unread > 0 ? unread : undefined }} />
      <Tabs.Screen name="compte" options={{ title: t('account'), tabBarIcon: icon('person-circle', 'person-circle-outline'), tabBarBadge: fresh > 0 ? (fresh > 50 ? '50+' : fresh) : undefined, tabBarBadgeStyle: { backgroundColor: '#0B6B3A' } }} />
    </Tabs>
  );
}
