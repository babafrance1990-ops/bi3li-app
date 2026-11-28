// Point de départ de l'application : langue, compte, navigation
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackButton from '../src/components/BackButton';
import HomeButton from '../src/components/HomeButton';
import { AuthProvider } from '../src/auth';
import { LangProvider, useLang } from '../src/i18n';
import { usePushNavigation } from '../src/push';
import { colors } from '../src/theme';

// Navigation : en arabe, retour à droite (flèche vers la droite), accueil à gauche
// Le retour en glissant est celui du système (depuis le bord gauche) : la page suit le doigt
// et la page précédente apparaît dessous, comme WhatsApp
function Nav() {
  const { rtl } = useLang();
  const headerExtra = rtl
    ? { headerLeft: () => <HomeButton />, headerRight: () => <BackButton /> }
    : { headerRight: () => <HomeButton /> };
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{
        headerShown: true,
        headerTransparent: false, // en-tête opaque : le contenu commence sous l'en-tête (pas sous la barre d'état)
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primaryDark,
        headerBackButtonDisplayMode: 'minimal', // seulement la flèche, sans le nom de l'écran précédent « (tabs) »
        contentStyle: { backgroundColor: colors.bg },
        ...headerExtra,
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="connexion" options={{ headerShown: false }} />
        <Stack.Screen name="annonce/[id]" options={{ title: '' }} />
        <Stack.Screen name="conversation/[id]" options={{ title: '' }} />
        <Stack.Screen name="mes-annonces" options={{ title: '' }} />
        <Stack.Screen name="alertes" options={{ title: '' }} />
        <Stack.Screen name="favoris" options={{ title: '' }} />
        <Stack.Screen name="vendeur/[id]" options={{ title: '' }} />
        <Stack.Screen name="profil" options={{ title: '' }} />
        <Stack.Screen name="verifier" options={{ title: '' }} />
        <Stack.Screen name="boutique" options={{ title: '' }} />
        <Stack.Screen name="modifier/[id]" options={{ title: '' }} />
        <Stack.Screen name="admin" options={{ title: '' }} />
        <Stack.Screen name="admin/reports" options={{ title: '' }} />
        <Stack.Screen name="admin/users" options={{ title: '' }} />
        <Stack.Screen name="admin/shops" options={{ title: '' }} />
        <Stack.Screen name="admin/recruit" options={{ title: '' }} />
        <Stack.Screen name="admin/publish" options={{ title: '' }} />
        <Stack.Screen name="vus" options={{ title: '' }} />
        <Stack.Screen name="rechercher" options={{ title: '' }} />
        <Stack.Screen name="boutiques" options={{ title: '' }} />
        <Stack.Screen name="about" options={{ title: '' }} />
        <Stack.Screen name="choisir-categorie" options={{ title: '' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  usePushNavigation(); // toucher une notification ouvre le bon écran
  return (
    <SafeAreaProvider>
      <LangProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Nav />
        </AuthProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
