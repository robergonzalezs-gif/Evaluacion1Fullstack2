# Guion breve para la presentación individual

1. **Arquitectura:** mostrar `src/App.jsx` como componente raíz; explicar el catálogo, formularios y panel como componentes reutilizables.
2. **Props y estado:** abrir `ProductCard.jsx` para explicar `product` y `onAdd`; abrir `ProductCatalog.jsx` para mostrar estado de búsqueda/categoría; abrir `App.jsx` para mostrar estado compartido del carrito y sincronización con `localStorage`.
3. **Bootstrap:** enseñar clases `container`, `row`, `col-*`, `navbar`, `card`, `form-control` y tabs; comparar la grilla de productos en móvil y escritorio.
4. **Validaciones:** explicar dominios de correo, cálculo del dígito RUN, dependencias región/comuna y validación de productos.
5. **Pruebas:** mostrar `karma.conf.cjs`, `test/unit.spec.jsx`, ejecutar `npm test` y revisar los artefactos de cobertura. Explicar mocks/spies, DOM de prueba, aislamiento, fallos y cobertura real.
6. **Limitaciones:** destacar que es frontend sin API, las sesiones son demostrativas y no se procesan pagos.

La evaluación de la presentación es individual: cada estudiante debe poder explicar y defender cada decisión y cada prueba mostrada.
