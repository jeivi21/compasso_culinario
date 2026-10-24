import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
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

/** Se o mapa não avisar que carregou até aqui, mostramos uma dica em vez de uma tela preta. */
const TEMPO_LIMITE_CARGA_MS = 8_000;

/**
 * Tiles do CARTO (dados OpenStreetMap), gratuitos e sem chave de API. O mapa base do
 * Google fica desligado (mapType none): no Expo Go não há chave do Google Maps e os
 * tiles dele vêm pretos. Os estilos "light/dark" do CARTO combinam com a paleta do app.
 */
const TILES_CLARO = 'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png';
const TILES_CLARO_ROTULOS = 'https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png';
const TILES_ESCURO = 'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png';
const TILES_ESCURO_ROTULOS = 'https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png';

/**
 * Mapa nativo estilizado na paleta do app, com um pino arredondado por restaurante
 * mostrando a nota. Tocar num pino destaca-o e abre um card resumido; o card leva
 * aos detalhes. A versão web está em mapa-restaurantes.web.tsx.
 */
export function MapaRestaurantes({ centro, raioMetros, restaurantes, onSelecionar }: MapaRestaurantesProps) {
  const theme = useTheme();
  const escuro = useColorScheme() === 'dark';
  const mapa = useRef<MapView>(null);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [carregou, setCarregou] = useState(false);
  const [demorou, setDemorou] = useState(false);
  const selecionado = restaurantes.find((r) => r.id === selecionadoId) ?? null;

  useEffect(() => {
    if (carregou) return;
    const id = setTimeout(() => setDemorou(true), TEMPO_LIMITE_CARGA_MS);
    return () => clearTimeout(id);
  }, [carregou]);

  // 1 grau de latitude ≈ 111 km; o delta cobre o diâmetro do raio com folga.
  const delta = (raioMetros * 2.4) / 111_000;

  function selecionar(r: RestauranteProximo) {
    setSelecionadoId(r.id);
    mapa.current?.animateToRegion(
      { latitude: r.latitude, longitude: r.longitude, latitudeDelta: delta / 3, longitudeDelta: delta / 3 },
      350,
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapa}
        style={styles.mapa}
        // O renderizador novo do Google Maps deixa o mapa preto em alguns Androids; o legado é estável.
        googleRenderer="LEGACY"
        mapType="none"
        initialRegion={{
          latitude: centro.latitude,
          longitude: centro.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        loadingEnabled
        loadingIndicatorColor={theme.primary}
        loadingBackgroundColor={theme.background}
        onMapLoaded={() => setCarregou(true)}
        onMapReady={() => setCarregou(true)}
        onPress={() => setSelecionadoId(null)}>
        <UrlTile urlTemplate={escuro ? TILES_ESCURO : TILES_CLARO} maximumZ={19} tileSize={256} zIndex={-2} />
        <UrlTile urlTemplate={escuro ? TILES_ESCURO_ROTULOS : TILES_CLARO_ROTULOS} maximumZ={19} tileSize={256} zIndex={-1} />
        {restaurantes.map((r) => {
          const ativo = r.id === selecionadoId;
          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              anchor={{ x: 0.5, y: 1 }}
              // Só re-renderiza a imagem do pino quando o estado de seleção muda (desempenho).
              tracksViewChanges={ativo}
              zIndex={ativo ? 10 : 1}
              onPress={(e) => {
                e.stopPropagation();
                selecionar(r);
              }}>
              <View style={styles.pino}>
                <View
                  style={[
                    styles.pinoCorpo,
                    {
                      backgroundColor: ativo ? theme.primaryDark : theme.primary,
                      borderColor: escuro ? '#0E2E2B' : '#FFFFFF',
                      transform: [{ scale: ativo ? 1.15 : 1 }],
                    },
                  ]}>
                  <Ionicons name="star" size={11} color={ativo ? '#F3FBF9' : '#0E2E2B'} />
                  <ThemedText style={[styles.pinoTexto, { color: ativo ? '#F3FBF9' : '#0E2E2B' }]}>
                    {formatarNota(r.media_geral)}
                  </ThemedText>
                </View>
                <View style={[styles.pinoPonta, { borderTopColor: ativo ? theme.primaryDark : theme.primary }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {!carregou ? (
        <View style={[styles.carregando, { backgroundColor: theme.background }]} pointerEvents="none">
          <ActivityIndicator color={theme.primary} size="large" />
          <ThemedText themeColor="textSecondary" style={styles.carregandoTexto}>
            {demorou
              ? 'O mapa está demorando. Verifique a conexão ou use a lista; no Expo Go o mapa funciona só no Android.'
              : 'Carregando mapa…'}
          </ThemedText>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centralizar na minha posição"
        onPress={() =>
          mapa.current?.animateToRegion(
            { latitude: centro.latitude, longitude: centro.longitude, latitudeDelta: delta, longitudeDelta: delta },
            350,
          )
        }
        style={[styles.botaoCentro, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
        <Ionicons name="locate" size={22} color={theme.primaryDark} />
      </Pressable>

      <ThemedText style={[styles.atribuicao, { color: escuro ? '#CDE9E4' : '#3F5F5B' }]}>© OpenStreetMap · © CARTO</ThemedText>

      {selecionado ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelecionar?.(selecionado)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
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
    // No Android, recortar o MapView (overflow hidden + borderRadius) pode deixá-lo preto.
    ...(Platform.OS === 'ios' ? { borderRadius: Radius.medium, overflow: 'hidden' as const } : null),
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
  pino: {
    alignItems: 'center',
  },
  pinoCorpo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  pinoTexto: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    lineHeight: 14,
  },
  pinoPonta: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
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
  atribuicao: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.one,
    fontSize: 10,
    lineHeight: 12,
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
