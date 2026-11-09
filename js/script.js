// Variables globales para las instancias de los mapas interactivos
let mapGeneral;
let mapFiltered;

// Capas de marcadores (LayerGroups) para gestionar los puntos de forma limpia
let generalMarkersLayer = L.layerGroup();
let filteredMarkersLayer = L.layerGroup();

// URL del endpoint base de la USGS para ambos mapas (sismos con magnitud >= 2.5)
const API_GENERAL_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5';

/*
Función auxiliar basada en Promesas para simular tiempo de carga 
controlado (retardo de 3 segundos), permitiendo mostrar el spinner del loader.
 */
const esperarTresSegundos = () => new Promise(resolve => setTimeout(resolve, 3000));

/*
Inicializa ambos mapas de Leaflet asignando coordenadas globales por defecto,
nivel de zoom y añadiendo las capas de teselas (Tiles) de OpenStreetMap.
 */
function initMaps() {
    const initialCoords = [20, 0];
    const initialZoom = 2;
    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // Inicialización del Mapa General
    mapGeneral = L.map('map-general').setView(initialCoords, initialZoom);
    L.tileLayer(tileLayerUrl, { attribution: tileAttribution }).addTo(mapGeneral);
    generalMarkersLayer.addTo(mapGeneral);

    // Inicialización del Mapa con Filtro
    mapFiltered = L.map('map-filtered').setView(initialCoords, initialZoom);
    L.tileLayer(tileLayerUrl, { attribution: tileAttribution }).addTo(mapFiltered);
    filteredMarkersLayer.addTo(mapFiltered);
}

// Forzamos a Leaflet a recalcular el tamaño tras la carga inicial del DOM 
// para evitar el error visual de contenedores grises.
setTimeout(() => {
    if (mapGeneral) mapGeneral.invalidateSize();
    if (mapFiltered) mapFiltered.invalidateSize();
}, 200);

/**
 * Procesa la colección de sismos y dibuja círculos huecos proporcionales en la capa indicada.
 * @param {Array} terremotos - Array de elementos (features) devueltos por la API de la USGS.
 * @param {L.LayerGroup} capa - Capa de Leaflet donde se renderizarán los marcadores.
 */
function getColorByMagnitude(mag) {
    if (mag >= 7) return '#ff00ff'; // Magenta (Muy severo)
    if (mag >= 6) return '#ff0000'; // Rojo
    if (mag >= 5) return '#ffa500'; // Naranja
    if (mag >= 4) return '#ffd700'; // Amarillo anaranjado
    if (mag >= 3) return '#ffff00'; // Amarillo
    if (mag >= 2) return '#808000'; // Verde oliva
    return '#008000';               // Verde (Leve)
}

function dibujarMarcadores(terremotos, capa) {
    // Limpiamos los marcadores previos para evitar acumulación de datos
    capa.clearLayers();

    terremotos.forEach(terremoto => {
        const [longitud, latitud] = terremoto.geometry.coordinates;
        const propiedades = terremoto.properties;
        const colorMag = getColorByMagnitude(propiedades.mag);

        // Utilizamos L.circleMarker para que el radio se mida en píxeles de pantalla 
        // y mantenga proporciones constantes sin importar el nivel de zoom.
        const marcador = L.circleMarker([latitud, longitud], {
            radius: Math.max(propiedades.mag * 2, 5),
            fillColor: colorMag,
            color: colorMag,          // El borde adopta el color de la escala sísmica
            weight: 2,                // Grosor de la línea del anillo
            opacity: 1,               // Opacidad completa del borde
            fillOpacity: 0            // Centro totalmente transparente (vacío)
        });

        // Formateamos la fecha del evento a la localización de España (es-ES)
        const fecha = new Date(propiedades.time).toLocaleString('es-ES');
        
        // Estructura interna de la ventana emergente (Popup)
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


//Realiza la petición asíncrona (Fetch) para obtener y pintar los sismos generales.
//Utiliza async/await y un bloque try/catch robusto para la gestión de errores.

async function cargarTerremotosGenerales() {
    const loader = document.getElementById('loader-general');
    try {
        // Mostramos el indicador visual de carga
        if (loader) loader.classList.remove('hidden');
        
        // Ejecutamos la petición HTTP y la espera simulada de 3 segundos de manera concurrente
        const [response] = await Promise.all([
            fetch(API_GENERAL_URL),
            esperarTresSegundos()
        ]);

        if (!response.ok) throw new Error('Error al conectar con la API de la USGS');
        const data = await response.json();
        
        dibujarMarcadores(data.features, generalMarkersLayer);
    } catch (error) {
        console.error('Error en datos generales:', error);
        alert('No se pudieron cargar los datos generales.');
    } finally {
        // Ocultamos siempre el loader al finalizar (éxito o fallo)
        if (loader) loader.classList.add('hidden');
    }
}


//Captura los filtros del formulario (magnitudes mín/máx y rangos de fechas),
//construye la URL de forma dinámica y actualiza el segundo mapa.
 
async function cargarTerremotosFiltrados() {
    const loader = document.getElementById('loader-filtered');
    
    // Captura y saneamiento de entradas numéricas (reemplazo de comas por puntos)
    let minMag = document.getElementById('min-magnitude').value;
    if (minMag) minMag = minMag.replace(',', '.');

    let maxMag = document.getElementById('max-magnitude').value;
    if (maxMag) maxMag = maxMag.replace(',', '.');

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    // Validaciones de errores situacionales
    if (minMag && maxMag && parseFloat(minMag) > parseFloat(maxMag)) {
        alert('La magnitud mínima no puede ser mayor a la magnitud máxima.');
        return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
        return;
    }

    // Ensambla dinámicamente los parámetros de filtrado en la URL base.
    let url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson';
    if (minMag) url += `&minmagnitude=${minMag}`;
    if (maxMag) url += `&maxmagnitude=${maxMag}`;
    if (startDate) url += `&starttime=${startDate}`;
    if (endDate) url += `&endtime=${endDate}`;

    try {
        if (loader) loader.classList.remove('hidden');

        // Petición asíncrona combinada con la pausa de 3 segundos del loader
        const [response] = await Promise.all([
            fetch(url),
            esperarTresSegundos()
        ]);

        if (!response.ok) throw new Error('Error en la petición de filtros');
        const data = await response.json();

        dibujarMarcadores(data.features, filteredMarkersLayer);
        
        // Esto fuerza el reajuste del tamaño del mapa filtrado
        if (mapFiltered) mapFiltered.invalidateSize();

        if (data.features.length === 0) {
            alert('No se encontraron terremotos con los filtros seleccionados.');
        }
    } catch (error) {
        console.error('Error en filtrado:', error);
        alert('Ocurrió un error al aplicar los filtros.');
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

// Event listener principal al cargar el DOM del navegador
document.addEventListener('DOMContentLoaded', () => {
    initMaps();
    cargarTerremotosGenerales();

    // Enlace del evento click del botón de filtrado con su función lógica
    const btnFiltrar = document.getElementById('apply-filters-btn');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', cargarTerremotosFiltrados);
    }
});