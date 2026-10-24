/**
 * Estilos do Google Maps na identidade verde-água do app.
 * Formato: https://developers.google.com/maps/documentation/javascript/style-reference
 */

type MapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Record<string, string | number>[];
}[];

export const MAP_STYLE_CLARO: MapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#eef7f4' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3f5f5b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f3fbf9' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#a8d5ce' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e4f3ee' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#eef7f4' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#ddf2ee' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#cfeae2' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d6ebe6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#bfe3dd' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#a8d5ce' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#557571' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#9fdfd6' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0b7a70' }] },
];

export const MAP_STYLE_ESCURO: MapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#133835' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#cde9e4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e2e2b' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a5c57' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#133835' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#173f3b' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1c4945' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f524d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#133835' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a6b64' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8fb5af' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b4a45' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7fe0d4' }] },
];
