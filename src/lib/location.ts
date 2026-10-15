import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type Coordenadas = { latitude: number; longitude: number };

/** Centro de Paulo Afonso/BA, usado quando a localização não está disponível. */
export const LOCALIZACAO_PADRAO: Coordenadas = { latitude: -9.4064, longitude: -38.2154 };

export type EstadoLocalizacao = 'carregando' | 'ok' | 'negado' | 'erro';

const TEMPO_LIMITE_MS = 10_000;

type Leitura = { coords: Coordenadas; estado: Exclude<EstadoLocalizacao, 'carregando'> };

/** Pede permissão e lê a posição. Nunca lança: devolve a localização padrão com o motivo. */
async function lerPosicao(): Promise<Leitura> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return { coords: LOCALIZACAO_PADRAO, estado: 'negado' };
    }
    // GPS frio no Android pode demorar; depois de 10 s usa a última posição conhecida.
    const posicao = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TEMPO_LIMITE_MS)),
    ]);
    const final = posicao ?? (await Location.getLastKnownPositionAsync());
    if (!final) return { coords: LOCALIZACAO_PADRAO, estado: 'erro' };
    return {
      coords: { latitude: final.coords.latitude, longitude: final.coords.longitude },
      estado: 'ok',
    };
  } catch {
    return { coords: LOCALIZACAO_PADRAO, estado: 'erro' };
  }
}

/**
 * Localização atual do dispositivo. Se a permissão for negada ou der erro,
 * devolve a localização padrão e o estado correspondente para a tela avisar.
 */
export function useLocalizacao() {
  const [coords, setCoords] = useState<Coordenadas>(LOCALIZACAO_PADRAO);
  const [estado, setEstado] = useState<EstadoLocalizacao>('carregando');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    lerPosicao().then((leitura) => {
      if (!ativo) return;
      setCoords(leitura.coords);
      setEstado(leitura.estado);
    });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  /** Tenta de novo (botão da tela). */
  const localizar = useCallback(() => {
    setEstado('carregando');
    setTentativa((t) => t + 1);
  }, []);

  return { coords, estado, localizar };
}

export { formatarDistancia } from '@/lib/formatacao';
