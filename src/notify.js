// Message à l'utilisateur, sur téléphone (Alert) comme dans le navigateur (Alert ne fait rien sur le web)
import { Alert, Platform } from 'react-native';

// buttons : [{ text, onPress }] — sur le web, seul le dernier bouton avec onPress est proposé (OK / Annuler)
export function notify(message, buttons) {
  if (Platform.OS !== 'web') return Alert.alert('', message, buttons);
  const action = (buttons || []).filter((b) => b.onPress).pop();
  if (action) { if (window.confirm(message + '\n\n→ ' + action.text)) action.onPress(); }
  else window.alert(message);
}
