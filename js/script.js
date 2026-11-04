let mapGeneral;
let mapFiltered;

// 1. Declaramos las capas y la URL que faltaban
let generalMarkersLayer = L.layerGroup();
let filteredMarkersLayer = L.layerGroup();
const API_GENERAL_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5';

function initMaps() {
    const initialCoords = [20, 0];
    const initialZoom = 2;
    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // Este inicializa el mapa general:
    mapGeneral = L.map('map-general').setView(initialCoords, initialZoom);
    L.tileLayer(tileLayerUrl, { attribution: tileAttribution}).addTo(mapGeneral);
    generalMarkersLayer.addTo(mapGeneral); // <-- Añadido

    // Esto inicializa el mapa con filtros:
    mapFiltered = L.map('map-filtered').setView(initialCoords, initialZoom);
    L.tileLayer(tileLayerUrl, { attribution: tileAttribution}).addTo(mapFiltered);
    filteredMarkersLayer.addTo(mapFiltered); // <-- Añadido
}

// Forzamos a Leaflet a recalcular el tamaño para que carguen las losetas de ambos mapas:
setTimeout(() => {
        if (mapGeneral) mapGeneral.invalidateSize();
        if (mapFiltered) mapFiltered.invalidateSize();
    }, 200);

// Escala de colores según la magnitud
function getColorByMagnitude(mag) {
    if (mag >= 7) return '#ff00ff'; // Magenta
    if (mag >= 6) return '#ff0000'; // Rojo
    if (mag >= 5) return '#ffa500'; // Naranja
    if (mag >= 4) return '#ffd700'; // Amarillo anaranjado
    if (mag >= 3) return '#ffff00'; // Amarillo
    if (mag >= 2) return '#808000'; // Verde oliva
    return '#008000';               // Verde
}

// Dibujar marcadores dinámicos con circleMarker
function dibujarMarcadores(terremotos, capa) {
    capa.clearLayers();

    terremotos.forEach(terremoto => {
        const [longitud, latitud] = terremoto.geometry.coordinates;
        const propiedades = terremoto.properties;
        const colorMag = getColorByMagnitude(propiedades.mag);

        const marcador = L.circleMarker([latitud, longitud], {
            radius: Math.max(propiedades.mag * 2, 5),
            fillColor: colorMag,
            color: colorMag,          // El borde toma el color de la magnitud
            weight: 2,                // Grosor de la línea del anillo
            opacity: 1,               // Opacidad completa del borde
            fillOpacity: 0            // ¡Centro completamente vacío!
        });

        const fecha = new Date(propiedades.time).toLocaleString('es-ES');
        const popupContent = `
            <div style="font-size: 0.9rem;">
                <h4 style="margin-bottom: 5px; color: #1a365d;">${propiedades.title}</h4>
                <p><strong>Ubicación:</strong> ${propiedades.place || 'No disponible'}</p>
                <p><strong>Magnitud:</strong> <span style="color: ${colorMag}; font-weight: bold;">${propiedades.mag}</span></p>
                <p><strong>Fecha:</strong> ${fecha}</p>
            </div>
        `;

        marcador.bindPopup(popupContent);
        capa.addLayer(marcador);
    });
}

// Cargar terremotos generales en el primer mapa
async function cargarTerremotosGenerales() {
    const loader = document.getElementById('loader');
    try {
        if (loader) loader.classList.remove('hidden');
        const response = await fetch(API_GENERAL_URL);
        if (!response.ok) throw new Error('Error al conectar con la API');
        const data = await response.json();
        dibujarMarcadores(data.features, generalMarkersLayer);
    } catch (error) {
        console.error(error);
        alert('No se pudieron cargar los datos generales.');
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

// Cargar terremotos filtrados en el segundo mapa
async function cargarTerremotosFiltrados() {
    const loader = document.getElementById('loader');
    let minMag = document.getElementById('min-magnitude').value;
    if (minMag) minMag = minMag.replace(',', '.');

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson';
    if (minMag) url += `&minmagnitude=${minMag}`;
    if (startDate) url += `&starttime=${startDate}`;
    if (endDate) url += `&endtime=${endDate}`;

    try {
        if (loader) loader.classList.remove('hidden');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición filtrada');
        const data = await response.json();

        dibujarMarcadores(data.features, filteredMarkersLayer);
        if (mapFiltered) mapFiltered.invalidateSize();

        if (data.features.length === 0) {
            alert('No se encontraron terremotos con los filtros seleccionados.');
        }
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al aplicar los filtros.');
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMaps();
    cargarTerremotosGenerales();

    const btnFiltrar = document.getElementById('apply-filters-btn');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', cargarTerremotosFiltrados);
    }
});