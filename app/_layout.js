// Point de départ de l'application : langue, compte, navigation
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackButton from '../src/components/BackButton';
import { AuthProvider } from '../src/auth';
import { LangProvider, useLang } from '../src/i18n';
import { usePushNavigation } from '../src/push';
import { colors } from '../src/theme';

// Navigation : en arabe, le retour est à droite avec la flèche vers la droite (comme dans les applis arabes)
function Nav() {
  const { rtl } = useLang();
  const rtlHeader = rtl ? { headerLeft: () => null, headerRight: () => <BackButton /> } : {};
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerTintColor: colors.primaryDark,
      headerBackButtonDisplayMode: 'minimal', // seulement la flèche, sans le nom de l'écran précédent « (tabs) »
      contentStyle: { backgroundColor: colors.bg },
      ...rtlHeader,
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="connexion" options={{ title: 'بيعلي – Bi3li' }} />
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
    </Stack>
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
