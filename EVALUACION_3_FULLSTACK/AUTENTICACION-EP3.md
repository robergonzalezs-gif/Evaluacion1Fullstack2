# Usuarios y autenticación de la Evaluación Parcial 3

Los pasos 1 a 4 están implementados: usuarios y roles persistidos, JWT, recuperación de sesión y permisos. Los pasos 5 y 6 están implementados: órdenes persistidas en MySQL, carrito conectado y autorización remota. Este documento sustituye las referencias históricas a usuarios locales y HTTP Basic para describir la autenticación actual.

## Datos y cuentas

`app_role` contiene Administrador, Vendedor y Cliente. `app_user` guarda el perfil, correo único normalizado, hash BCrypt y referencia al rol. La API devuelve un DTO sin contraseña ni hash. El registro valida campos obligatorios, dominio de correo, RUN y contraseña de 8 a 64 caracteres, con límite de 72 bytes UTF-8 de BCrypt.

`auth_session` vincula cada sesión a un usuario. Guarda el hash SHA-256 del token aleatorio de renovación y su vencimiento absoluto. Nunca guarda el token de renovación original. El modelo de productos y encomiendas se conserva.

Al iniciar se crea el administrador `admin@gmail.com` si todavía no existe. La contraseña inicial procede de `ADMIN_PASSWORD` y su valor de desarrollo es `admin123`. No se sobrescribe la contraseña de una cuenta existente al reiniciar. `SELLER_PASSWORD` es opcional y solo sirve para crear una cuenta inicial `vendedor@gmail.com`; se recomienda crear vendedores desde el panel. Utiliza contraseñas de al menos ocho caracteres para las cuentas iniciales.

Las cuentas guardadas en localStorage por EP2 no se migran: el frontend elimina `vet_users_v2` y `vet_session_v2` al iniciar. Deben registrarse nuevamente. El carrito y las órdenes locales no se eliminan.

## Sesiones

1. El inicio de sesión comprueba BCrypt y devuelve un JWT firmado HS256 de 15 minutos y el perfil público.
2. React conserva el JWT solo en memoria. La renovación utiliza una cookie `vet_refresh` HttpOnly, SameSite=Strict y limitada a `/api/v1/auth`.
3. Al recargar, React renueva la sesión antes de mostrar vistas protegidas. Rota el token de renovación y recupera el perfil desde el servidor. La sesión dura como máximo siete días desde el inicio de sesión.
4. Ante un JWT vencido, el servicio intenta renovar una vez y reintenta la solicitud. También comprueba la sesión al recuperar el foco y periódicamente mientras está abierta.
5. El cierre de sesión elimina la sesión del servidor y la cookie. Los JWT asociados quedan revocados inmediatamente porque cada petición autenticada comprueba la sesión en la base de datos.
6. Cambiar el rol o eliminar un usuario revoca sus sesiones. El propio administrador no puede eliminarse ni cambiar su propio rol.

El frontend agrupa renovaciones simultáneas y usa Web Locks, cuando está disponible, para coordinar la rotación entre pestañas. El cierre se comunica entre pestañas mediante BroadcastChannel. Si la red impide cerrar sesión, se muestra un error y se permite reintentar.

## Permisos

| Operación | Público o cliente | Vendedor | Administrador |
| --- | --- | --- | --- |
| Consultar productos | Sí | Sí | Sí |
| Crear, editar o eliminar productos por API | No | No | Sí |
| Gestionar usuarios y roles por API | No | No | Sí |
| Consultar productos y sus detalles en el panel | No | Sí | Sí |
| Consultar órdenes y sus detalles | Cliente: solo propias; público: no | Todas | Todas |
| Crear una orden | Cliente: sí; público: no | No | Sí |
| Entregar, cancelar o eliminar una orden cancelada | No | No | Sí |
| Gestionar encomiendas | No | No | Sí |

La solicitud y el seguimiento públicos de Dinobox se conservan. En la interfaz del vendedor se ocultan los demás menús y se restringe la navegación directa a otras vistas. El cliente no tiene enlace al panel y una navegación directa muestra acceso restringido. Las órdenes tienen endpoints protegidos; un cliente que intenta consultar el identificador de una orden ajena recibe 404.

## Endpoints

| Método | Ruta | Acceso y resultado |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Público, siempre crea Cliente; 201, 400 o 409 |
| POST | `/api/v1/auth/login` | Público; JWT y cookie; 200 o 401 |
| POST | `/api/v1/auth/refresh` | Cookie válida y origen confiable; 200 o 401 |
| POST | `/api/v1/auth/logout` | Revoca la sesión de la cookie; 204 |
| GET | `/api/v1/auth/me` | JWT válido; perfil; 200 o 401 |
| GET | `/api/session` | Alias compatible para consultar el perfil con JWT |
| GET | `/api/v1/users` | Administrador; lista de perfiles |
| POST | `/api/v1/users` | Administrador; crea usuario con rol; 201 |
| PUT | `/api/v1/users/{id}/role` | Administrador; cambia rol y revoca sesiones |
| DELETE | `/api/v1/users/{id}` | Administrador; elimina usuario y sesiones; 204 |

Las operaciones administrativas devuelven 401 sin autenticación y 403 para un rol sin permiso. HTTP Basic ya no se acepta. Swagger utiliza el esquema `bearerAuth`: iniciar sesión y pegar el valor `accessToken` en **Authorize**. La cookie de renovación no aparece en el cuerpo JSON.

Los POST de autenticación exigen un encabezado Origin incluido en la lista de confianza para impedir CSRF, incluso en login. Los clientes de pruebas o terminal deben enviarlo explícitamente. No se concede acceso solo por enviar Origin: las rutas protegidas también exigen el JWT y los permisos.

## Configuración

| Variable | Uso |
| --- | --- |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Conexión MySQL existente |
| `ADMIN_PASSWORD` | Contraseña del administrador únicamente al crear la cuenta inicial |
| `SELLER_PASSWORD` | Opcional, crea vendedor inicial si no existe |
| `JWT_SECRET` | Al menos 32 bytes aleatorios codificados en Base64; no subir a Git |
| `JWT_ACCESS_SECONDS` | Duración del JWT; 900 por defecto |
| `JWT_REFRESH_SECONDS` | Duración absoluta de sesión; 604800 por defecto |
| `AUTH_COOKIE_SECURE` | `true` en despliegues HTTPS; `false` para la demostración HTTP local |
| `CORS_ORIGINS` | Orígenes exactos del frontend autorizados para llamadas con credenciales |
| `AUTH_ORIGINS` | Orígenes permitidos en los POST de autenticación; por defecto incluye CORS y Swagger local en 8080 |
| `VITE_API_URL` | URL de API; vacío usa el mismo hostname del navegador y puerto 8080 |

Sin `JWT_SECRET` se genera una clave efímera al iniciar para desarrollo. Un reinicio invalida los JWT anteriores, pero una cookie de renovación todavía válida permite obtener otro JWT porque las sesiones residen en MySQL. En despliegues con varias instancias todas deben compartir la clave y base de datos. Usa HTTPS, cookie Secure y frontend/API bajo el mismo sitio para conservar SameSite=Strict. No mezcles `localhost` y `127.0.0.1` en una sesión local.

## Verificación

`mvn test` verifica registro sin elevación de privilegios, hashes BCrypt, JWT firmado, cookies, renovación y rechazo de reutilización, logout, vencimiento, roles, revocación por cambio de rol y eliminación, protección por origen, CRUD, Swagger y CORS. Usa H2 aislado.

`npm test` verifica solicitudes Bearer, recuperación de sesión, reintento tras 401, rechazo de 403, logout y validaciones y componentes existentes.

La comprobación de navegador usa Edge y MySQL locales: registra un cliente, comprueba la recarga y el logout, crea un vendedor desde el panel, verifica las restricciones, consulta productos y órdenes, cambia su rol y vuelve a iniciar sesión. Las cuentas temporales se eliminan al terminar. El resultado sin credenciales está en `evidencias/auth-browser.json` y la captura del vendedor en `evidencias/roles-vendedor.png`.

Referencia técnica: [JWT en Spring Security](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).

## Órdenes persistidas

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/v1/orders` | Órdenes propias para clientes; todas para vendedor/administrador |
| GET | `/api/v1/orders/{id}` | Detalle autorizado o 404 |
| POST | `/api/v1/orders` | 201; cliente o administrador; descuenta stock en una transacción |
| PUT | `/api/v1/orders/{id}` | Administrador; estado `CANCELADA` o `ENTREGADA` |
| DELETE | `/api/v1/orders/{id}` | Administrador; solo canceladas; 204 |

POST recibe `requestId` (UUID) e `items` con `id` de producto y `quantity` entera de 1 a 1000. No acepta el precio del navegador como autoridad: toma el precio vigente del catálogo y conserva una copia del nombre, precio y cantidad en `order_items`. `shop_orders` conserva cliente, fecha, total, estado y clave de reintento. Las relaciones impiden eliminar usuarios o productos con órdenes asociadas (409).

La clave de reintento se conserva tras un fallo de red. Reenviar el mismo carrito con esa clave devuelve la misma orden sin descontar stock otra vez; cambiar el contenido con la misma clave devuelve 409. Los bloqueos de productos y usuario evitan sobreventa y duplicados concurrentes. Una orden nace `CONFIRMADA`, puede pasar una sola vez a `ENTREGADA` o `CANCELADA`; la cancelación repone stock. Repetir el mismo estado no vuelve a reponerlo. No se procesan pagos.

El carrito y las órdenes locales históricas de EP2 no se convierten automáticamente en registros del servidor. La interfaz consulta únicamente órdenes remotas. El menú **Mis órdenes** permite al cliente recuperar sus compras tras recargar o iniciar sesión desde otro navegador.
