VETERINARIA SAN MARCOS + DINOBOX - ENTREGA 23-11-2026

EJECUCIÓN RECOMENDADA (Windows con Docker Desktop, contenedores Linux)
1. Abra PowerShell dentro de Proyecto.
2. Ejecute: powershell -ExecutionPolicy Bypass -File .\Iniciar-Entrega.ps1
3. Espere el inicio de Java y abra http://localhost:8080
4. Swagger: http://localhost:8080/swagger-ui/index.html
5. La cuenta admin@gmail.com utiliza la clave generada en ACCESO-LOCAL.txt.
El script genera claves nuevas por instalación; no contiene claves de AWS.
Docker descarga MySQL y Java: necesita Internet la primera vez.

EJECUCIÓN MANUAL (cualquier sistema con Docker Compose v2)
Copie .env.entrega.example a .env.entrega y complete claves nuevas.
JWT_SECRET: 32 bytes aleatorios en Base64, por ejemplo openssl rand -base64 32.
docker compose --env-file .env.entrega -f compose.entrega.yaml up -d --build
docker compose --env-file .env.entrega -f compose.entrega.yaml logs --tail=60 app
Detener sin borrar datos: docker compose --env-file .env.entrega -f compose.entrega.yaml down
No añadir -v: eliminaría los datos del volumen.

SQL Y DATOS
sql/01-esquema.sql: estructura de las nueve tablas, exportada de AWS sin datos.
sql/02-catalogo-demo.sql: roles y seis productos académicos del código fuente.
sql/03-consultas.sql: consultas de comprobación.
MySQL ejecuta estos scripts al crear un volumen vacío. En volúmenes existentes no se repiten.
Para importar manualmente use MySQL Workbench: ejecutar 01 y después 02 sobre una base nueva.
La aplicación crea el administrador con BCrypt al arrancar, usando ADMIN_PASSWORD.
No se incluyen usuarios, compras ni sesiones reales. La base nueva es independiente de AWS.

COMPILACIÓN DESDE CÓDIGO
El arranque rápido usa el JAR incluido (React está integrado).
Para reconstruir todo con Docker cambie APP_DOCKERFILE=Dockerfile en .env.entrega.
Luego: docker compose --env-file .env.entrega -f compose.entrega.yaml up -d --build
Sin Docker: Node 22.12+, Java 17+, Maven y MySQL 8.
Frontend: npm ci; npm run dev (http://localhost:3000).
Backend: configure DB_URL, DB_USER, DB_PASSWORD; ejecute mvn clean package desde backend y java -jar target/vet-api-3.0.0.jar.
Pruebas: npm test; desde backend, mvn test. Las pruebas Java usan H2 aislado.

AWS
Página: https://sanmarcos-34-227-71-217.sslip.io/
Swagger: https://sanmarcos-34-227-71-217.sslip.io/swagger-ui/index.html
Dinobox: https://sanmarcos-34-227-71-217.sslip.io/#/dinobox
Mantener activo AWS Academy y EC2. Si cambia la IP, actualizar SITE_ADDRESS y PUBLIC_ORIGIN.
compose.deploy.yaml y deploy/Caddyfile conservan el despliegue HTTPS.
Copie deploy/.env.example a deploy/.env y configure su dominio y claves propias.
docker compose --env-file deploy/.env -f compose.deploy.yaml up -d --build

ALCANCE
React, Bootstrap, Spring Boot, MySQL, JWT, roles, productos, categorías, órdenes y encomiendas.
El carrito confirma órdenes y descuenta stock; cancelar lo restituye una sola vez.
No procesa pagos ni emite boletas. Contacto no envía correos.
