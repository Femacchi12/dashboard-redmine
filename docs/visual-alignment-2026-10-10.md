# Alineación visual FIBRAZO — Dashboard Redmine

**Cambio:** RM-CHG-2026-10-10-01  
**Fecha:** 2026-10-10  
**Alcance:** visual únicamente.

## Fuentes rectoras
- Identidad visual: https://docs.google.com/document/d/1vgYxAB-KhkhHMb-zd-eGJLk_UX6QcSjznZ2WnFRd9m8/edit
- Estándar de dashboards: https://docs.google.com/document/d/1prrIG6gikA7rfvadDz2xRF_PnnhtUtMZlJXOagflY_U/edit
- Gobierno documental: https://docs.google.com/document/d/1rH6nH6qsXolzkq04jCOmej8xeez0JJAJwnjiiiYS1Ps/edit

## Características que se conservan
- Repositorio y despliegue GitHub Pages existentes.
- Autenticación Firebase, cuentas autorizadas y acciones de sesión.
- Fuente de datos Google Sheets y pestañas consumidas por `app.js`.
- Refresco de datos cada 5 minutos.
- Filtro inicial de Área FZO = Growth.
- Filtros globales, buscador general y filtros por columna.
- KPI y gráficos existentes, sin cambiar fórmulas ni universos.
- Seguimiento de actualizaciones, propuestas pendientes y cambios manuales.
- Tabla detallada con 10 filas iniciales, VER MÁS/VER MENOS, desplazamiento interno, encabezado fijo, selector de columnas y ordenamiento.
- Links a Redmine y a la base fuente.
- Responsividad y ausencia de scroll horizontal de página; la tabla mantiene su scroll interno.

## Desalineaciones detectadas antes del cambio
- `index.html` cargaba Inter como tipografía principal.
- `layout-tuning.css` declaraba Inter explícitamente.
- Verde heredado en múltiples variantes (#14F195, #00EC9D, #00F29A, #00EFA5 y similares).
- Colores de estados/prioridades incluían azules y rojos fuera de la paleta compartida.
- Los tokens estaban distribuidos entre archivos CSS sin snapshot de marca versionado.
- Gráficos usaban esencialmente un único verde, sin aprovechar la paleta complementaria documentada.
- La superficie oscura seguía la referencia anterior de Impacto Social, no la nueva precedencia de marca.

## Implementación
- Snapshot versionado en `design/fibrazo-brand.tokens.json`.
- Capa final `brand-alignment.css`, cargada después de los CSS heredados.
- Montserrat para interfaz general y Poppins para tablas.
- Verde #43FFA5, negro #000000 y gris #58595B como base.
- Morado #E94CFF, amarillo #FFB600, fucsia #FF005C y naranja #FF5400 como acentos limitados para series, estados y prioridades.
- Estados/prioridades conservan diferencias semánticas mediante color + texto existente; el color no reemplaza las etiquetas.
- Gráficos: Redmine en verde, Operativo en morado, Prioridad en naranja.
- KPI: Total neutro/verde de marca, New amarillo, Otros morado, Resolved verde.
- Tabla: Poppins, encabezado verde sobre superficie oscura, scroll interno preservado.
- Login, header, controles, revisión de cambios y footer alineados al mismo sistema visual.
- Ajustes móviles limitados a layout; no se modifica JavaScript.

## Archivos deliberadamente no modificados
- `app.js`
- `auth.js`
- `styles.css`
- `layout-tuning.css`

La capa de alineación es reversible retirando su referencia de `index.html`.

## Verificación requerida
1. Confirmar diff sin cambios de lógica.
2. Confirmar carga de Montserrat/Poppins y `brand-alignment.css`.
3. Verificar página publicada en escritorio y móvil.
4. Verificar filtros, KPI, gráficos, seguimiento y tabla con una sesión autorizada.
5. Registrar resultado y evidencia en `Cambios_Dashboard`.
