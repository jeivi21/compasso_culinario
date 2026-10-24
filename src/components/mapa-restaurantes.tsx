import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { MAP_STYLE_CLARO, MAP_STYLE_ESCURO } from '@/constants/map-style';
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
  const selecionado = restaurantes.find((r) => r.id === selecionadoId) ?? null;

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
        provider={PROVIDER_GOOGLE}
        style={styles.mapa}
        customMapStyle={escuro ? MAP_STYLE_ESCURO : MAP_STYLE_CLARO}
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
        onPress={() => setSelecionadoId(null)}>
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
                <View
                  style={[
                    styles.pinoPonta,
                    { borderTopColor: ativo ? theme.primaryDark : theme.primary },
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

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
                : `★ ${formatarNota(selecionado.media_geral)} · ${selecionado.total_avaliacoes} avaliaç${selecionado.total_avaliacoes > 1 ? 'ões' : 'ão'}`}
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
