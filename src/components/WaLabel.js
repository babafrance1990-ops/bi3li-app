// Texte d'un bouton WhatsApp : le logo WhatsApp à la place de l'émoji
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function WaLabel({ children, style, color = '#fff', size = 18 }) {
  return (
    <View style={s.row}>
      <Ionicons name="logo-whatsapp" size={size} color={color} />
      <Text style={style}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
