import AsyncStorage from '@react-native-async-storage/async-storage';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Armazenamento da sessão do Supabase no celular.
 *
 * O SecureStore (Keychain no iOS, Keystore no Android) não aceita valores grandes de forma
 * confiável, e a sessão (JWT + refresh token + usuário) passa de 2 KB. Por isso:
 *  - uma chave AES-256 por entrada fica no SecureStore;
 *  - o valor, cifrado com AES-GCM, fica no AsyncStorage (em base64).
 * Sem a chave do SecureStore o conteúdo do AsyncStorage é inútil.
 */

const PREFIXO_CHAVE = 'cc.chave.';

/** SecureStore só aceita letras, números, ".", "-" e "_" nas chaves. */
function nomeChave(chave: string): string {
  return PREFIXO_CHAVE + chave.replace(/[^A-Za-z0-9._-]/g, '_');
}

function textoParaBytes(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

/** Decodifica UTF-8 sem depender de `TextDecoder` (ausente em algumas versões do Hermes). */
function bytesParaTexto(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  let texto = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let codigo: number;
    if (b < 0x80) {
      codigo = b;
      i += 1;
    } else if (b < 0xe0) {
      codigo = ((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else if (b < 0xf0) {
      codigo = ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
      i += 3;
    } else {
      codigo =
        ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      i += 4;
    }
    texto += String.fromCodePoint(codigo);
  }
  return texto;
}

async function lerChave(chave: string): Promise<AESEncryptionKey | null> {
  const codificada = await SecureStore.getItemAsync(nomeChave(chave));
  if (!codificada) return null;
  return (await AESEncryptionKey.import(codificada, 'base64')) as AESEncryptionKey;
}

async function criarChave(chave: string): Promise<AESEncryptionKey> {
  const nova = (await AESEncryptionKey.generate()) as AESEncryptionKey;
  await SecureStore.setItemAsync(nomeChave(chave), await nova.encoded('base64'), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return nova;
}

/**
 * Cópia em memória da sessão. O supabase-js relê o `storage` a cada requisição; se o
 * SecureStore/AES falhar no aparelho (ex.: Android sem Keystore funcional, como o Waydroid),
 * sem esta cópia o cliente perderia a sessão e passaria a chamar a API como `anon`.
 * Nada é gravado em texto puro: no pior caso a sessão só não sobrevive a reiniciar o app.
 */
const memoria = new Map<string, string>();

/** Adaptador com a interface que `createClient({ auth: { storage } })` espera. */
export const armazenamentoSeguro = {
  async getItem(chave: string): Promise<string | null> {
    const emMemoria = memoria.get(chave);
    if (emMemoria !== undefined) return emMemoria;
    const valor = await lerDoDisco(chave);
    if (valor !== null) memoria.set(chave, valor);
    return valor;
  },

  async setItem(chave: string, valor: string): Promise<void> {
    memoria.set(chave, valor);
    try {
      const chaveAes = (await lerChave(chave)) ?? (await criarChave(chave));
      const selado = await aesEncryptAsync(textoParaBytes(valor), chaveAes);
      await AsyncStorage.setItem(chave, (await selado.combined('base64')) as string);
    } catch (e) {
      if (__DEV__) console.warn('[armazenamento-seguro] não foi possível salvar a sessão cifrada:', e);
    }
  },

  async removeItem(chave: string): Promise<void> {
    memoria.delete(chave);
    await Promise.allSettled([AsyncStorage.removeItem(chave), SecureStore.deleteItemAsync(nomeChave(chave))]);
  },
};

/** Lê e decifra a sessão salva; descarta o valor se não der para decifrar. */
async function lerDoDisco(chave: string): Promise<string | null> {
  const cifrado = await AsyncStorage.getItem(chave);
  if (!cifrado) return null;
  try {
    const chaveAes = await lerChave(chave);
    if (!chaveAes) throw new Error('chave ausente');
    const bytes = (await aesDecryptAsync(AESSealedData.fromCombined(cifrado), chaveAes)) as Uint8Array;
    return bytesParaTexto(bytes);
  } catch {
    // Chave perdida ou valor antigo em texto puro (versão anterior do app): descarta a
    // sessão salva e o usuário entra de novo.
    await AsyncStorage.removeItem(chave);
    return null;
  }
}
