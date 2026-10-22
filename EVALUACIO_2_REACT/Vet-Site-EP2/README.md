# Vet-Site EP2 · React + Bootstrap

Aplicación de tienda frontend preparada para la Evaluación Parcial 2 de DSY1104. Incluye catálogo, carrito, solicitudes de órdenes locales, formularios, navegación React, roles de usuario, panel administrativo, Jasmine/Karma y documentación de requisitos y cobertura.

## Requisitos locales

- Node.js 20.19+ (el proyecto fue compilado con Node 24).
- pnpm 11 o npm reciente.
- Chrome para correr Karma en un navegador real, si se cambia `browsers` en `karma.conf.cjs` a `ChromeHeadless`. La configuración incluida ejecuta Karma en jsdom.

## Ejecutar

```bash
pnpm install
pnpm dev
```

Abrir la URL local que imprime Vite. Para compilar y probar:

```bash
pnpm build
pnpm test
pnpm run test:coverage
```

Los reportes de cobertura se guardan en `coverage/` (HTML y LCOV). El resumen medido está documentado en [`docs/COVERAGE.md`](docs/COVERAGE.md).

## Perfiles de demostración

- Administrador: `admin@gmail.com` / `admin123`
- Vendedor: `vendedor@gmail.com` / `venta123`
- Cliente: registrarse desde la tienda.

Las cuentas y datos se almacenan solo en el navegador. No uses estas credenciales como autenticación real.

## Estructura

- `src/App.jsx`: navegación, estado compartido y almacenamiento.
- `src/components/`: catálogo, tarjeta, carrito, formularios, navegación, pie y panel.
- `src/utils/`: validaciones y operaciones puras del carrito.
- `test/`: 29 pruebas Jasmine con Karma, incluidas pruebas de componentes y DOM.
- `docs/ERS-EP2.md`: propuesta ERS actualizada.
- `docs/COVERAGE.md`: configuración, matriz y resumen de cobertura.
- `docs/PRESENTACION.md`: guion de exposición individual.

## Límites de esta fase

Frontend sin backend ni base de datos. El checkout solo crea solicitudes de demostración en el navegador, sin procesar pagos. La autenticación es demostrativa y guarda contraseñas en el navegador; no es segura para producción.

## Publicación en GitHub

El requisito de la evaluación pide un repositorio público. El ZIP contiene el proyecto completo listo para subir. La publicación necesita una cuenta/repositorio GitHub del equipo; agrega su URL en el informe y la presentación una vez creado.
