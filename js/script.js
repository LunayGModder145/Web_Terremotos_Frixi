let mapGeneral;
let mapFiltered;

function initMaps() {
    const initialCoords = [20, 0];
    const initialZoom = 2;
    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Inicializamos el mapa general:
mapGeneral = L.map('map-general').setView(initialCoords, initialZoom)
L.tileLayer(tileLayerUrl, { attribution: tileAttribution}).addTo(mapGeneral);

// Inicializamos el mapa filtrado:
mapFiltered = L.map('map-filtered').setView(initialCoords, initialZoom)
L.tileLayer(tileLayerUrl, { attribution: tileAttribution}).addTo(mapFiltered);
}

// Forzamos a Leaflet a recalcular el tamaño para que carguen las losetas de ambos mapas
setTimeout(() => {
        if (mapGeneral) mapGeneral.invalidateSize();
        if (mapFiltered) mapFiltered.invalidateSize();
    }, 200);

document.addEventListener('DOMContentLoaded', () => {
    initMaps();
});