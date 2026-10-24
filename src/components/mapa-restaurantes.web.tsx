import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MAPA_HTML, zoomParaRaio, type EstadoMapa } from '@/components/mapa-html';
import type { MapaRestaurantesProps } from '@/components/mapa-restaurantes';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { formatarDistancia } from '@/lib/location';
import { formatarFaixaPreco, formatarNota } from '@/lib/restaurantes';

type Mensagem = { tipo: 'pronto' } | { tipo: 'selecionar'; id: string } | { tipo: 'limpar' };

/** No web a mesma página Leaflet roda num iframe; a ponte usa postMessage em vez da WebView. */
export function MapaRestaurantes({ centro, raioMetros, restaurantes, onSelecionar }: MapaRestaurantesProps) {
  const theme = useTheme();
  const escuro = useColorScheme() === 'dark';
  const iframe = useRef<HTMLIFrameElement>(null);
  const [pronto, setPronto] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const selecionado = restaurantes.find((r) => r.id === selecionadoId) ?? null;
  const zoom = zoomParaRaio(raioMetros);

  useEffect(() => {
    function aoReceber(evento: MessageEvent) {
      if (evento.source !== iframe.current?.contentWindow) return;
      let msg: Mensagem;
      try {
        msg = JSON.parse(String(evento.data)) as Mensagem;
      } catch {
        return;
      }
      if (msg.tipo === 'pronto') setPronto(true);
      else if (msg.tipo === 'selecionar') setSelecionadoId(msg.id);
      else if (msg.tipo === 'limpar') setSelecionadoId(null);
    }
    window.addEventListener('message', aoReceber);
    return () => window.removeEventListener('message', aoReceber);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    const estado: EstadoMapa = {
      centro,
      zoom,
      escuro,
      selecionadoId,
      restaurantes: restaurantes.map((r) => ({
        id: r.id,
        nome: r.nome,
        latitude: r.latitude,
        longitude: r.longitude,
        nota: formatarNota(r.media_geral),
      })),
    };
    const janela = iframe.current?.contentWindow as (Window & { atualizar?: (e: EstadoMapa) => void }) | null;
    janela?.atualizar?.(estado);
  }, [pronto, centro, zoom, escuro, selecionadoId, restaurantes]);

  // No iframe, `ReactNativeWebView` não existe: a página fala com o pai por postMessage.
  const html = MAPA_HTML.replace(
    'function enviar(msg) {',
    'function enviar(msg) { if (window.parent !== window) { window.parent.postMessage(JSON.stringify(msg), "*"); return; }',
  );

  return (
    <View style={styles.container}>
      <iframe ref={iframe} srcDoc={html} title="Mapa de restaurantes" style={{ border: 0, width: '100%', height: '100%' }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centralizar na minha posição"
        onPress={() => {
          const janela = iframe.current?.contentWindow as (Window & { centralizar?: (a: number, b: number, c: number) => void }) | null;
          janela?.centralizar?.(centro.latitude, centro.longitude, zoom);
        }}
        style={[styles.botaoCentro, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
        <Ionicons name="locate" size={22} color={theme.primaryDark} />
      </Pressable>
      {selecionado ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelecionar?.(selecionado)}
          style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
          <View style={styles.cardTexto}>
            <ThemedText type="bold" numberOfLines={1}>
              {selecionado.nome}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {[selecionado.categoria, formatarFaixaPreco(selecionado.faixa_preco), formatarDistancia(selecionado.distancia_m)]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          </View>
          <Ionicons name="arrow-forward" size={20} color={theme.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  botaoCentro: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  cardTexto: {
    flex: 1,
    gap: Spacing.half,
  },
});
