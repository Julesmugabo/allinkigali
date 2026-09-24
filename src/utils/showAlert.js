/**
 * showAlert.js — A drop-in for Alert.alert that also works on the web.
 *
 * React Native's Alert.alert does nothing on react-native-web, which silently
 * broke every confirmation (sign out, delete ...) and every info popup on the
 * web build. On phones this is exactly Alert.alert; on the web a confirm-style
 * alert (a cancel button plus an action button) becomes window.confirm and
 * runs the action button's onPress on OK, and anything else becomes
 * window.alert.
 */
import { Alert, Platform } from 'react-native';

export function showAlert(title, message, buttons) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const actions = buttons || [];
  const action = actions.find((b) => b.style !== 'cancel' && b.onPress);
  const hasCancel = actions.some((b) => b.style === 'cancel');

  if (hasCancel && action) {
    if (window.confirm(text)) action.onPress();
    return;
  }

  window.alert(text);
  if (actions.length === 1 && actions[0].onPress) actions[0].onPress();
}

export default showAlert;
