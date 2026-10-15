import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Coordenadas } from '@/lib/location';
import type { RestauranteProximo } from '@/lib/restaurantes';

export type MapaRestaurantesProps = {
  centro: Coordenadas;
  raioMetros: number;
  restaurantes: RestauranteProximo[];
  onSelecionar?: (restaurante: RestauranteProximo) => void;
};

/** Mapa nativo com um marcador por restaurante. A versão web está em mapa-restaurantes.web.tsx. */
export function MapaRestaurantes({ centro, raioMetros, restaurantes, onSelecionar }: MapaRestaurantesProps) {
  // 1 grau de latitude ≈ 111 km; o delta cobre o diâmetro do raio com folga.
  const delta = (raioMetros * 2.4) / 111_000;

  return (
    <MapView
      style={styles.mapa}
      initialRegion={{
        latitude: centro.latitude,
        longitude: centro.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
      showsUserLocation
      showsMyLocationButton>
      {restaurantes.map((r) => (
        <Marker
          key={r.id}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.nome}
          description={[r.categoria, r.media_geral != null ? `★ ${Number(r.media_geral).toFixed(1)}` : null]
            .filter(Boolean)
            .join(' · ')}
          pinColor="#2EC4B6"
          onCalloutPress={() => onSelecionar?.(r)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
