# Despliegue AWS para la presentación

El paquete ejecuta React y Spring Boot desde un mismo dominio. MySQL reside en un volumen Docker persistente. Caddy sirve HTTPS. Solo se publican 80 y 443; MySQL y el puerto interno 8080 no se exponen.

## Preparación de EC2

Usar una instancia Linux x86_64 con Docker y Docker Compose v2, al menos 4 GB de RAM y espacio para las imágenes y datos. Revisar disponibilidad, permisos y crédito en AWS Academy antes de crearla. No se ha creado ninguna instancia desde este proyecto.

Permitir TCP 80 y 443 para la demostración pública. Restringir SSH 22 a la IP de quien administra. No abrir 3306 ni 8080. Configurar un nombre DNS que apunte a la IPv4 pública y comprobar la resolución antes de iniciar HTTPS.

## Paquete y arranque

`release/vet-aws.zip` contiene el JAR con React ya compilado, Compose, el proxy y su Dockerfile de ejecución. No contiene bases de datos, sesiones, archivos `.env` ni contraseñas del equipo local. La base nueva se inicializa con el catálogo y la cuenta administradora cuya clave se define antes del primer arranque.

Descomprimir el ZIP en una carpeta de EC2. Copiar `deploy/.env.example` a `deploy/.env` y completar `SITE_ADDRESS`, `PUBLIC_ORIGIN` (HTTPS y sin barra final), contraseña de administrador y contraseñas MySQL. Generar `JWT_SECRET` con `openssl rand -base64 32`. Utilizar claves nuevas y mantener `deploy/.env` privado (`chmod 600 deploy/.env`).

```sh
docker compose --env-file deploy/.env -f compose.deploy.yaml config --quiet
docker compose --env-file deploy/.env -f compose.deploy.yaml up -d --build
docker compose --env-file deploy/.env -f compose.deploy.yaml ps
docker compose --env-file deploy/.env -f compose.deploy.yaml logs --tail=80 app web
```

`APP_DOCKERFILE=deploy/Dockerfile.runtime` usa el JAR precompilado y evita compilar Java y React en EC2. Para reconstruir desde el código fuente completo, usar `APP_DOCKERFILE=Dockerfile`.

## Comprobación para presentar

Abrir el enlace HTTPS desde otro equipo o teléfono. Verificar catálogo, registro, inicio de sesión, compra, Mis órdenes después de recargar, panel con administrador, cancelación con devolución de stock y seguimiento Dinobox. El proceso no está terminado hasta comprobar estas operaciones en la URL pública.

No usar `docker compose down -v`: elimina el volumen de la base. Reiniciar contenedores conserva los datos. Cambiar `ADMIN_PASSWORD` después del primer arranque no modifica una cuenta ya creada.

## AWS Academy

Iniciar Learner Lab antes de presentar y verificar que la instancia esté encendida. La sesión del laboratorio puede detener EC2. Al detener e iniciar una instancia, su IP pública puede cambiar; comprobar DNS y enlace antes de la presentación. No pulsar Reset Lab. Mantener disponible la versión local mediante `Iniciar-Dinobox.ps1` como respaldo.

Referencias: [Docker en Amazon Linux](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-docker.html), [parada e inicio de EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Stop_Start.html), [HTTPS de Caddy](https://caddyserver.com/docs/quick-starts/https).
