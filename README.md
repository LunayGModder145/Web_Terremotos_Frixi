# Earthquake Tracker SPA 🌍🌋

Esta es una aplicación web interactiva de página única (SPA) desarrollada para visualizar y filtrar eventos sísmicos en tiempo real utilizando la API pública de la USGS (United States Geological Survey) y mapas interactivos renderizados usando Leaflet.js.

Proyecto desarrollado por **Leonardo Andrés Delgado Rodríguez** como parte del bootcamp en **The Bridge Digital School**.

## 🚀 Demo en Vivo

Puedes probar la aplicación desplegada en GitHub Pages:
👉 [**Ver Aplicación en GitHub Pages**](https://TU_USUARIO.github.io/NOMBRE_DE_TU_REPO/)

*(Recuerda reemplazar el enlace anterior con tu URL real de GitHub Pages)*

## 🛠️ Tecnologías Utilizadas

* **HTML5**: Estructura semántica de la aplicación.
* **CSS3**: Diseño responsive y estilos personalizados para tarjetas y contenedores.
* **JavaScript (ES6)**: Lógica de la aplicación, peticiones asíncronas (`fetch`) y manipulación del DOM.
* **Leaflet.js**: Librería para el renderizado de mapas interactivos.
* **USGS API**: Fuente de datos de terremotos en tiempo real.

## ✨ Características Principales

* **Visualización Dual**:
  * Mapa principal con terremotos recientes a nivel global.
  * Mapa secundario con filtrado personalizado.
* **Filtros Dinámicos**:
  * Rango de fechas (inicio y fin).
  * Rango de magnitud sísmica (mínima y máxima).
* **Indicadores de Carga**: Estado visual (*loader*) mientras se procesan las peticiones a la API.
* **Popups Informativos**: Ventanas emergentes con detalles de cada sismo (ubicación, magnitud y fecha).

