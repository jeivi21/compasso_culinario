import { Alert, Platform } from 'react-native';

/**
 * Pede confirmação antes de uma ação destrutiva.
 * Funciona no web, onde `Alert.alert` não mostra botões.
 */
export function confirmar(titulo: string, mensagem: string, rotuloConfirmar: string, aoConfirmar: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: rotuloConfirmar, style: 'destructive', onPress: aoConfirmar },
  ]);
}

/** Mostra um aviso simples. No web usa `window.alert`. */
export function alertar(titulo: string, mensagem: string) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}
