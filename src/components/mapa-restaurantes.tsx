import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Button } from '@/components/button';
import { MAPA_HTML, zoomParaRaio, type EstadoMapa } from '@/components/mapa-html';
import { ThemedText } from '@/components/themed-text';
import { PressedOpacity, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { formatarDistancia, type Coordenadas } from '@/lib/location';
import { formatarFaixaPreco, formatarNota, type RestauranteProximo } from '@/lib/restaurantes';

export type MapaRestaurantesProps = {
  centro: Coordenadas;
  raioMetros: number;
  restaurantes: RestauranteProximo[];
  onSelecionar?: (restaurante: RestauranteProximo) => void;
};

type Mensagem = { tipo: 'pronto' } | { tipo: 'selecionar'; id: string } | { tipo: 'limpar' };

/**
 * Mapa em WebView (Leaflet + tiles do OpenStreetMap): não depende de chave do
 * Google Maps, então funciona no Expo Go. Um pino arredondado por restaurante com a
 * nota; tocar destaca e abre um card que leva aos detalhes.
 * A versão web está em mapa-restaurantes.web.tsx.
 */
export function MapaRestaurantes({ centro, raioMetros, restaurantes, onSelecionar }: MapaRestaurantesProps) {
  const theme = useTheme();
  const escuro = useColorScheme() === 'dark';
  const webview = useRef<WebView>(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const selecionado = restaurantes.find((r) => r.id === selecionadoId) ?? null;
  const zoom = zoomParaRaio(raioMetros);

  // Reenvia o estado para a página sempre que algo muda (e assim que ela avisa que está pronta).
  useEffect(() => {
    if (!pronto) return;
    const estado: EstadoMapa = {
      centro,
      zoom,
      escuro,
      selecionadoId,
      restaurantes: restaurantes.map((r) => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        nota: formatarNota(r.media_geral),
      })),
    };
    webview.current?.injectJavaScript(`window.atualizar(${JSON.stringify(estado)}); true;`);
  }, [pronto, centro, zoom, escuro, selecionadoId, restaurantes]);

  function aoReceber(evento: WebViewMessageEvent) {
    let msg: Mensagem;
    try {
      msg = JSON.parse(evento.nativeEvent.data) as Mensagem;
    } catch {
      return;
    }
    if (msg.tipo === 'pronto') setPronto(true);
    else if (msg.tipo === 'selecionar') {
      const r = restaurantes.find((x) => x.id === msg.id);
      if (r) {
        setSelecionadoId(r.id);
        webview.current?.injectJavaScript(`window.centralizar(${r.latitude}, ${r.longitude}, ${zoom + 2}); true;`);
      }
    } else if (msg.tipo === 'limpar') setSelecionadoId(null);
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webview}
        originWhitelist={['https://*']}
        source={{ html: MAPA_HTML, baseUrl: 'https://localhost/' }}
        onMessage={aoReceber}
        onError={() => setErro(true)}
        // Só a própria página carrega dentro do mapa; links (atribuição do OSM) abrem no navegador.
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith('https://localhost')) return true;
          if (req.url.startsWith('https://')) Linking.openURL(req.url).catch(() => {});
          return false;
        }}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        style={[styles.mapa, { backgroundColor: theme.background }]}
      />

      {!pronto ? (
        <View
          style={[styles.carregando, { backgroundColor: theme.background }]}
          pointerEvents={erro ? 'auto' : 'none'}>
          {erro ? (
            <>
              <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
              <ThemedText themeColor="textSecondary" style={styles.carregandoTexto} accessibilityRole="alert">
                O mapa não carregou. Verifique sua conexão ou use a lista.
              </ThemedText>
              <Button
                title="Tentar de novo"
                variant="secondary"
                onPress={() => {
                  setErro(false);
                  webview.current?.reload();
                }}
              />
            </>
          ) : (
            <>
              <ActivityIndicator color={theme.primary} size="large" />
              <ThemedText themeColor="textSecondary">Carregando mapa…</ThemedText>
            </>
          )}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centralizar na minha posição"
        onPress={() => webview.current?.injectJavaScript(`window.centralizar(${centro.latitude}, ${centro.longitude}, ${zoom}); true;`)}
        style={({ pressed }) => [
          styles.botaoCentro,
          { backgroundColor: theme.backgroundCard, borderColor: theme.borderStrong, opacity: pressed ? PressedOpacity : 1 },
        ]}>
        <Ionicons name="locate" size={22} color={theme.primaryDark} />
      </Pressable>

      {selecionado ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selecionado.nome}. ${[
            selecionado.categoria,
            formatarDistancia(selecionado.distancia_m),
            selecionado.total_avaliacoes === 0 ? 'sem avaliações' : `nota ${formatarNota(selecionado.media_geral)}`,
          ]
            .filter(Boolean)
            .join(', ')}`}
          accessibilityHint="Abre os detalhes do restaurante"
          onPress={() => onSelecionar?.(selecionado)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? PressedOpacity : 1 },
          ]}>
          <View style={styles.cardTexto}>
            <ThemedText type="bold" numberOfLines={1}>
              {selecionado.nome}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {[selecionado.categoria, formatarFaixaPreco(selecionado.faixa_preco), formatarDistancia(selecionado.distancia_m)]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              {selecionado.total_avaliacoes === 0
                ? 'Sem avaliações'
                : `★ ${formatarNota(selecionado.media_geral)} · ${selecionado.total_avaliacoes} ${selecionado.total_avaliacoes > 1 ? 'avaliações' : 'avaliação'}`}
            </ThemedText>
          </View>
          <View style={[styles.cardSeta, { backgroundColor: theme.primary }]}>
            <Ionicons name="arrow-forward" size={20} color={theme.onPrimary} />
          </View>
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
  mapa: {
    flex: 1,
  },
  carregando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  carregandoTexto: {
    textAlign: 'center',
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
  cardSeta: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
