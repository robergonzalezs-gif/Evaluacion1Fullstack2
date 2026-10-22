# Plan y cobertura de pruebas unitarias

## Configuración

- Runner: Karma con DOM de navegador simulado (jsdom); se puede cambiar a Chrome Headless si Chrome está instalado.
- Framework: Jasmine.
- Transformación JSX para pruebas: Babel y `karma-webpack`.
- Instrumentación: `babel-plugin-istanbul`.
- Reportes: `coverage/karma/index.html`, `coverage/karma/lcov.info` y resumen en consola.

Comandos desde la carpeta del proyecto:

```bash
npm install
npm test
npm run test:coverage
```

## Matriz de casos

| N° | Unidad | Caso cubierto |
|---:|---|---|
| 1 | `isAllowedEmail` | Acepta los tres dominios autorizados. |
| 2 | `isAllowedEmail` | Rechaza correo mal formado y dominio no permitido. |
| 3 | `isValidRun` | Acepta y rechaza RUN según el dígito verificador. |
| 4 | `validateLogin` | Revisa dominio, correo y longitud de contraseña. |
| 5 | `validateRegistration` | Exige datos y acepta registro completo válido. |
| 6 | `validateProduct` | Admite producto gratuito; rechaza stock decimal y código duplicado. |
| 7 | `formatPrice` | Formatea `FREE` y moneda CLP. |
| 8 | `addItem` | Inserta un producto nuevo con cantidad uno. |
| 9 | `addItem` | Incrementa cantidad y limita por stock. |
| 10 | `changeQuantity` / `cartSummary` | Elimina al bajar a cero y calcula cantidad y total. |
| 11 | `createDemoOrder` | Crea una solicitud local con detalle/total y rechaza carrito vacío. |
| 12 | `ProductCard` | Renderiza contenido configurado por `props`. |
| 13 | `ProductCard` | Dispara callback y deshabilita compra sin stock. |
| 14 | `ProductCard` | Renderiza imagen cuando el producto trae URL. |
| 15 | `ProductCatalog` | Filtra tarjetas por categoría. |
| 16 | `LoginForm` | Muestra errores al enviar credenciales vacías. |
| 17 | `RegisterForm` | Habilita comunas según la región elegida. |
| 18 | `AdminPanel` | Deniega acceso al rol Cliente. |
| 19 | `ContactForm` | Muestra error accesible si faltan datos o correo válido. |
| 20 | `AdminPanel` | Crea un producto y agrega el registro al estado del catálogo. |
| 21 | `AdminPanel` | Rechaza un código demasiado corto y no guarda el producto. |
| 22 | `AdminPanel` | Edita un producto existente sin crear otra fila. |
| 23 | `AdminPanel` | Elimina el producto elegido y conserva los demás. |
| 24 | `AdminPanel` | Permite al vendedor consultar productos sin controles de edición. |
| 25 | `AdminPanel` | Permite al vendedor abrir el detalle de una orden. |
| 26 | `AdminPanel` | Cambia el rol de un usuario desde la tabla administrativa. |
| 27 | `AdminPanel` | Elimina un usuario desde la tabla administrativa. |
| 28 | `ProductCatalog` | Busca productos por texto incluido en la descripción. |
| 29 | `ProductCatalog` | Muestra un mensaje cuando la búsqueda no encuentra productos. |

## Mocks y aislamiento

Las pruebas de reglas y carrito usan datos en memoria, sin acceder a `localStorage`, red ni servicios externos. Las pruebas de componentes montan React en un nodo DOM temporal y usan spies de Jasmine para observar callbacks y actualizadores de estado. Cada spec desmonta la raíz React y elimina el nodo para evitar contaminación entre casos. No hay API externa en esta versión que requiera simular.

## Resultado de ejecución

Ejecución local de Karma el 20 de octubre de 2026: **29 specs aprobados, 0 fallidos**. Cobertura Istanbul del bundle probado: **84.50% statements, 79.56% branches, 85.52% functions y 90.64% lines**. La medición incluye los módulos de utilidad y componentes cargados por la suite; no representa cobertura total de toda la aplicación. Los artefactos HTML y LCOV se encuentran en `coverage/karma/` y se regeneran con `pnpm run test:coverage`.

La suite cubre el guardado de un producto nuevo en `AdminPanel`, además de su edición, validación y eliminación. Este test verifica que el actualizador de estado añada el nuevo registro; no sustituye una prueba de extremo a extremo que recorra toda la aplicación y el navegador.
