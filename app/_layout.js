// Point de départ de l'application : langue, compte, navigation
import { useRef } from 'react';
import { Animated, Dimensions, PanResponder, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../src/components/BackButton';
import HomeButton from '../src/components/HomeButton';
import { AuthProvider } from '../src/auth';
import { LangProvider, useLang } from '../src/i18n';
import { usePushNavigation } from '../src/push';
import { colors } from '../src/theme';

const W = Dimensions.get('window').width;

// En arabe, le retour se fait en glissant depuis le bord droit : la page suit le doigt
function EdgeBack({ x }) {
  const insets = useSafeAreaInsets();
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => { if (g.dx < 0) x.setValue(Math.max(g.dx, -W)); },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -60 && router.canGoBack()) {
        Animated.timing(x, { toValue: -W, duration: 150, useNativeDriver: true }).start(() => { router.back(); x.setValue(0); });
      } else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  })).current;
  return (
    <View {...pan.panHandlers} pointerEvents="box-only"
      style={{ position: 'absolute', right: 0, top: insets.top + 50, bottom: 0, width: 26 }} />
  );
}

// Navigation : en arabe, retour à droite (flèche vers la droite), accueil à gauche
function Nav() {
  const { rtl } = useLang();
  const x = useRef(new Animated.Value(0)).current; // position de l'écran pendant le glissement
  const headerExtra = rtl
    ? { headerLeft: () => <HomeButton />, headerRight: () => <BackButton /> }
    : { headerRight: () => <HomeButton /> };
  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: x }] }}>
      <Stack screenOptions={{
        headerShown: true,
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
      </Stack>
      </Animated.View>
      {rtl && <EdgeBack x={x} />}
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
