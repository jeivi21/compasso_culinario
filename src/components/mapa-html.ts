/**
 * Página HTML do mapa (Leaflet + tiles do OpenStreetMap), carregada numa WebView.
 * Não depende de chave de API nenhuma, por isso funciona no Expo Go.
 *
 * Protocolo com o app:
 *  - app → página: `window.atualizar({ centro, zoom, restaurantes, selecionadoId, escuro })`
 *    e `window.centralizar(lat, lng, zoom)` via injectJavaScript.
 *  - página → app: `ReactNativeWebView.postMessage(JSON.stringify({ tipo, ... }))`
 *    com tipo 'pronto' | 'selecionar' (id) | 'limpar'.
 */

export type RestauranteMapa = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  nota: string;
};

export type EstadoMapa = {
  centro: { latitude: number; longitude: number };
  zoom: number;
  restaurantes: RestauranteMapa[];
  selecionadoId: string | null;
  escuro: boolean;
};

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

export const MAPA_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${LEAFLET_CSS}">
<style>
  html, body, #mapa { margin: 0; padding: 0; width: 100%; height: 100%; background: #0E2E2B; }
  .leaflet-control-attribution { font-size: 10px; background: rgba(255,255,255,0.7); }
  .pino { display: flex; flex-direction: column; align-items: center; transform: translateY(-4px); }
  .pino-corpo {
    display: flex; align-items: center; gap: 3px; padding: 4px 8px; border-radius: 999px;
    background: #2EC4B6; color: #0E2E2B; border: 2px solid #FFFFFF;
    font: 700 12px/14px -apple-system, Roboto, "Segoe UI", sans-serif; white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25); transition: transform .15s;
  }
  .pino-ponta { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #2EC4B6; margin-top: -1px; }
  .pino.ativo .pino-corpo { background: #0B7A70; color: #F3FBF9; transform: scale(1.15); }
  .pino.ativo .pino-ponta { border-top-color: #0B7A70; }
  .escuro .pino-corpo { border-color: #0E2E2B; }
  .escuro .leaflet-tile-pane { filter: invert(1) hue-rotate(185deg) brightness(0.9) contrast(0.9) saturate(0.7); }
  .escuro .leaflet-control-attribution { background: rgba(14,46,43,0.7); color: #CDE9E4; }
  .eu { width: 18px; height: 18px; border-radius: 50%; background: #2EC4B6; border: 3px solid #FFFFFF; box-shadow: 0 0 0 6px rgba(46,196,182,0.3); }
</style>
</head>
<body>
<div id="mapa"></div>
<script src="${LEAFLET_JS}"></script>
<script>
(function () {
  // Tiles padrão do OpenStreetMap: gratuitos e sem chave. No modo escuro, um filtro CSS
  // inverte as cores dos tiles (os pinos ficam fora do filtro).
  var TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var ATRIBUICAO = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  function enviar(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  var mapa = L.map('mapa', { zoomControl: false, attributionControl: true });
  var camada = null;
  var marcadores = {};
  var eu = null;
  var estadoAtual = null;

  mapa.on('click', function () { enviar({ tipo: 'limpar' }); });

  function trocarTiles(escuro) {
    if (camada) mapa.removeLayer(camada);
    camada = L.tileLayer(TILES, { maxZoom: 19, attribution: ATRIBUICAO });
    camada.addTo(mapa);
    document.body.className = escuro ? 'escuro' : '';
  }

  function icone(r, ativo) {
    return L.divIcon({
      className: '',
      html: '<div class="pino' + (ativo ? ' ativo' : '') + '"><div class="pino-corpo">★ ' + r.nota + '</div><div class="pino-ponta"></div></div>',
      iconSize: [60, 34],
      iconAnchor: [30, 34]
    });
  }

  window.atualizar = function (estado) {
    var primeiro = estadoAtual === null;
    if (primeiro || estadoAtual.escuro !== estado.escuro) trocarTiles(estado.escuro);
    if (primeiro) mapa.setView([estado.centro.latitude, estado.centro.longitude], estado.zoom);

    if (!eu) eu = L.marker([estado.centro.latitude, estado.centro.longitude], { icon: L.divIcon({ className: '', html: '<div class="eu"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, zIndexOffset: -100 }).addTo(mapa);
    else eu.setLatLng([estado.centro.latitude, estado.centro.longitude]);

    var vistos = {};
    estado.restaurantes.forEach(function (r) {
      vistos[r.id] = true;
      var ativo = r.id === estado.selecionadoId;
      if (marcadores[r.id]) {
        marcadores[r.id].setIcon(icone(r, ativo));
        marcadores[r.id].setZIndexOffset(ativo ? 1000 : 0);
      } else {
        var m = L.marker([r.latitude, r.longitude], { icon: icone(r, ativo), zIndexOffset: ativo ? 1000 : 0 });
        m.on('click', function (e) { L.DomEvent.stopPropagation(e); enviar({ tipo: 'selecionar', id: r.id }); });
        m.addTo(mapa);
        marcadores[r.id] = m;
      }
    });
    Object.keys(marcadores).forEach(function (id) {
      if (!vistos[id]) { mapa.removeLayer(marcadores[id]); delete marcadores[id]; }
    });
    estadoAtual = estado;
  };

  window.centralizar = function (lat, lng, zoom) {
    mapa.flyTo([lat, lng], zoom, { duration: 0.4 });
  };

  enviar({ tipo: 'pronto' });
})();
</script>
</body>
</html>`;

/** Zoom do Leaflet que mostra um raio em metros numa tela de celular. */
export function zoomParaRaio(raioMetros: number): number {
  if (raioMetros <= 1000) return 15;
  if (raioMetros <= 2000) return 14;
  if (raioMetros <= 5000) return 13;
  return 12;
}
