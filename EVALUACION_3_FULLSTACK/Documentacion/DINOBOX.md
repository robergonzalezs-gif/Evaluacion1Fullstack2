# Dinobox · Evaluación Formativa 3

## Ejecución local

Instala Java 17 o superior, Maven 3.6.3 o superior, Node.js 22.12 o superior y MySQL 8. Abre PowerShell en la raíz del proyecto. Las variables de entorno deben configurarse en la terminal que ejecuta cada proceso.

**Base de datos.** Si ya tienes MySQL, crea el esquema y una cuenta de aplicación desde una sesión administrativa. Sustituye la clave de ejemplo antes de ejecutar.

```sql
CREATE DATABASE dinobox CHARACTER SET utf8mb4;
CREATE USER 'dinobox'@'localhost' IDENTIFIED BY 'TU_CLAVE';
GRANT ALL PRIVILEGES ON dinobox.* TO 'dinobox'@'localhost';
```

También puedes iniciar MySQL con Docker Compose desde la raíz. Define `DB_PASSWORD` y `MYSQL_ROOT_PASSWORD` en esa terminal y ejecuta `docker compose up -d mysql`. El volumen conserva los datos entre reinicios. Utiliza una sola instancia en el puerto 3306.

**Backend.** Configura la misma contraseña y ejecuta:

```powershell
$env:DB_PASSWORD='TU_CLAVE'
cd backend
mvn clean package
java -jar target/vet-api-3.0.0.jar
```

La configuración predeterminada usa `jdbc:mysql://127.0.0.1:3306/dinobox`, el usuario `dinobox` y el puerto HTTP 8080. Para cambiar la conexión configura `DB_URL` y `DB_USER`. Si MySQL local exige recuperar la clave pública con TLS desactivado, para la demostración local puedes usar `jdbc:mysql://127.0.0.1:3306/dinobox?allowPublicKeyRetrieval=true&useSSL=false`. El backend crea las tablas al iniciar mediante Hibernate. H2 se utiliza en las pruebas aisladas del catálogo anterior.

**Frontend.** En otra terminal, desde la raíz:

```powershell
npm ci
npm run dev
```

Abre [Dinobox](http://localhost:3000/#/dinobox). La API interactiva está en [Swagger](http://localhost:8080/swagger-ui.html), grupo Dinobox. En Swagger, inicia sesión con `POST /api/v1/auth/login` y pega el `accessToken` en **Authorize** para probar operaciones administrativas. Consulta [Autenticación EP3](AUTENTICACION-EP3.md). La cuenta local de demostración es `admin@gmail.com`, contraseña `admin123`. La variable `ADMIN_PASSWORD` define la clave al crear la cuenta inicial; no reemplaza la de una cuenta ya persistida.

## Uso y diseño de las vistas

1. En **Encomiendas Dinobox → Solicitar envío**, ingresa comuna de origen, destino y contenido. Al registrar se muestra el código y la etapa En Recepción.
2. En **Rastrear**, ingresa el código para consultar sin iniciar sesión. Las cuatro tarjetas distinguen etapas completadas, actual y pendientes. El historial muestra fecha y ubicación de cada evento.
3. Inicia sesión como administrador y abre **Encomiendas Dinobox → Gestionar envíos**. La tabla muestra todas las solicitudes. **Actualizar** permite registrar la ubicación de la siguiente etapa. **Eliminar** pide confirmación y elimina también el historial.

## Modelo para revisión del cliente

| Tabla | Campos y reglas |
| --- | --- |
| encomienda | codigo (PK), origen, destino, descripcion. El servidor genera un código DB- de 16 dígitos hexadecimales aleatorios. |
| evento_encomienda | codigo (FK a encomienda), secuencia, estado, ubicacion, fecha. La clave compuesta (codigo, secuencia) ordena los eventos de cada guía. |

Una encomienda tiene uno o más eventos. Cada creación registra la recepción en la comuna de origen. El último evento determina el estado actual. Los estados siguen el orden En Recepción → En Despacho → En Tránsito → Entregado. La actualización y su evento comparten una transacción y un bloqueo por encomienda para evitar avances concurrentes incompatibles.

**Validación del modelo con el cliente (IE3.1.1).** Presentar estas dos tablas y una guía con cuatro eventos. Confirmar con el cliente los campos del formulario, la consulta pública por código, el orden de los estados y los permisos de eliminación. Registrar nombre, fecha, observaciones y decisión después de la revisión. La aprobación del cliente está pendiente.

## API v1

| Método y ruta | Acceso | Resultado |
| --- | --- | --- |
| POST /api/v1/encomienda | Público | 201, código, estado inicial, historial y cabecera Location |
| GET /api/v1/encomienda/{codigo} | Público | 200 con estado e historial o 404 |
| GET /api/v1/encomienda | Administrador | 200 con solicitudes |
| PUT /api/v1/encomienda/{codigo} | Administrador | 200 con el estado actualizado |
| DELETE /api/v1/encomienda/{codigo} | Administrador | 204 y eliminación del historial |

Para crear, envía `{"origen":"Rancagua","destino":"Providencia","descripcion":"Alimento para mascotas"}`. Para avanzar desde recepción, envía `{"estado":"DESPACHO","ubicacion":"Centro de despacho"}`. Los siguientes valores son `TRANSITO` y `ENTREGADO`. Los errores de validación devuelven 400, las operaciones privadas sin credenciales devuelven 401 y las transiciones inválidas devuelven 409.

## Correspondencia con la pauta

| Criterio | Evidencia para la revisión |
| --- | --- |
| IE3.1.1 | Modelo anterior, MySQL 8, claves y tablas creadas con JPA. La conformidad del cliente se recoge en la revisión. |
| IE3.1.2 e IE3.2.1 | Paquete Java `cl.sanmarcos.vet.encomiendas`. Servicio transaccional, CRUD versionado y código aleatorio. |
| IE3.2.2 | Swagger, formulario React y Bootstrap, Fetch, consulta pública e historial y gestión administrativa. |
| Demostración | Video del flujo real en `docs/evidencias/dinobox.mp4` y respuestas HTTP en `docs/evidencias/dinobox-http.json`. |

## Despliegue

Compila React con `npm run build` después de fijar `VITE_API_URL` a la URL HTTPS pública de Spring Boot. Sirve `dist/` mediante un servidor de archivos estáticos. En el servidor Java configura `DB_URL`, `DB_USER`, `DB_PASSWORD`, `ADMIN_PASSWORD` y `CORS_ORIGINS` con el origen HTTPS exacto del frontend. Despliega el JAR detrás de un proxy HTTPS y usa una conexión TLS a MySQL. Los datos residen en MySQL. El sitio mantiene las rutas por hash, incluido `/#/dinobox`.

