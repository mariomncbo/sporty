<div align="center">
  <img src="frontend/assets/img/logotipoSporty.png" alt="Sporty App" width="140" />
</div>
<br>
<div align="center">
  <p><b>Sporty</b> es una red social deportiva: comparte entrenamientos, crea y sigue rutinas, chatea con otros atletas y entrenadores y descubre gimnasios cerca de ti.  
Compuesta por frontend (HTML/CSS/JS) y backend (PHP).</p>
</div>

<!--
  VÍDEOS: GitHub solo reproduce un MP4 dentro del README si se sube desde el editor web.
  Para incrustarlos: edita este archivo en github.com, arrastra cada vídeo de docs/media/
  justo debajo de su marcador "▶ VÍDEO: ..." y borra la línea del enlace.
-->

<div align="center">

▶ VÍDEO: [docs/media/general.mp4](docs/media/general.mp4) — recorrido general (escritorio)

▶ VÍDEO: [docs/media/general-movil.mp4](docs/media/general-movil.mp4) — recorrido general (móvil)

</div>

---

## Estado actual

- En desarrollo activo.
- Autenticación con redirección automática según rol de usuario.
- Feed con publicaciones e historias, comentarios y publicaciones guardadas.
- Perfiles públicos y privados, seguidores y solicitudes de seguimiento.
- Rutinas con ejercicios, modo entrenamiento y rutinas sociales (likes y guardadas).
- Mensajería directa y notificaciones.
- Mapa de gimnasios cercanos.
- Panel de administración: métricas, usuarios, reportes y baneos.

---

## Funcionalidades

> Los vídeos usan usuarios, conversaciones y gimnasios ficticios.

### Inicio e historias
Feed con las publicaciones de la gente a la que sigues, historias que caducan a las 24 h, comentarios, publicaciones guardadas y subida de nuevos posts con foto.

▶ VÍDEO: [docs/media/feed.mp4](docs/media/feed.mp4)

### Explorar y perfiles
Busca atletas y entrenadores por nombre o por deporte, visita su perfil y síguelos.

▶ VÍDEO: [docs/media/explorar.mp4](docs/media/explorar.mp4)

### Rutinas y modo entrenamiento
Crea rutinas con series, repeticiones y peso, entrena con cronómetro y checklist, y dale like o guarda las rutinas de otros usuarios.

▶ VÍDEO: [docs/media/rutinas.mp4](docs/media/rutinas.mp4)

### Mensajes y notificaciones
Chat directo entre usuarios, con mensajes nuevos que llegan sin recargar, y notificaciones de seguidores, comentarios y mensajes.

▶ VÍDEO: [docs/media/mensajes.mp4](docs/media/mensajes.mp4)

### Mapa de gimnasios
Gimnasios cercanos a tu ubicación, con su estado (abierto o cerrado), la distancia, qué amigos lo siguen y la opción de seguirlo.

> En el vídeo, el mapa es una simulación (OpenStreetMap y gimnasios inventados), porque la API de Google Maps no está activada. La tarjeta del gimnasio y el botón de seguir son los de la app.

▶ VÍDEO: [docs/media/mapa.mp4](docs/media/mapa.mp4)

### Panel de administración
Métricas generales, gestión de reportes por estado y tipo, baneos permanentes o temporales y gestión de usuarios.

▶ VÍDEO: [docs/media/admin.mp4](docs/media/admin.mp4)

---

## Tecnologías utilizadas

- Frontend: HTML, JavaScript, Tailwind CDN
- Backend: PHP 8.2 (PDO)
- Base de datos: MySQL 8
- Entorno: Docker Compose + phpMyAdmin
- Despliegue en servidor: Nginx Proxy Manager (subdominios y certificados SSL)

---

## Estructura del repositorio

- `backend`: Código PHP y configuración de base de datos.
- `frontend`: Archivos HTML, vista administrador y usuario.
- `docs`: Documentación general.
- `tests`: Reservado para pruebas.
- `docker-compose.yml`: Orquestación de servicios.
- `.env.example`: Variables de entorno de referencia.

---

## Puesta en marcha en entorno local

**Requisitos previos:**
- Docker Desktop instalado y ejecutándose.

**Pasos:**
1. Clonar el repositorio.
2. Duplicar `.env.example` como `.env` y completar con las variables adecuadas.
3. Ejecutar:

```bash
docker compose up -d --build
```

**Servicios en local:**
- Aplicación: http://localhost:8080
- phpMyAdmin: http://localhost:8081

**Accesos directos:**
- Login: http://localhost:8080/frontend/auth/login.html
- Registro: http://localhost:8080/frontend/auth/signup.html
- Home: http://localhost:8080/frontend/index.html
- Panel admin: http://localhost:8080/frontend/admin/index.html

---

## Despliegue real en servidor

El despliegue final utiliza Nginx Proxy Manager para gestionar subdominios y SSL:

- Web: https://esporty.jcloudhosting.com
- phpMyAdmin: https://admin.esporty.jcloudhosting.com (protegido por Access List)

---

## Variables de entorno

Las credenciales y parámetros se gestionan mediante el archivo `.env`, que **no debe subirse al repositorio**.  
Ejemplo de contenido:

```
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=sporty_bd
DB_USERNAME=usuario
DB_PASSWORD=contraseña
MYSQL_ROOT_PASSWORD=contraseña_root

PHPMYADMIN_PORT=8081
```

---

## Inicialización y reseteo de la base de datos

La base de datos se crea automáticamente desde el SQL de la carpeta `/backend/database/`.  
Para reiniciar y eliminar todos los datos (recreando la estructura inicial):

```bash
docker compose down -v
docker volume rm sportyx_db_data
docker compose up -d --build
```

---

## Endpoints principales disponibles

- POST `/backend/public/api/auth/signup.php` (registro)
- POST `/backend/public/api/auth/login.php` (login)
- GET  `/backend/public/api/auth/logout.php` (logout)
- GET  `/backend/public/api/admin/dashboard.php` (métricas admin)

---

## Privilegios administrador

Por defecto, el registro genera usuarios sin rol administrador. Para hacer administrador a un usuario:

```sql
UPDATE usuarios SET admin = 1 WHERE nickname = 'nombre_usuario';
```

---

## Seguridad

- Es obligatorio cambiar las contraseñas por defecto y usar valores fuertes.
- phpMyAdmin en servidor debe estar restringido solo a administradores y protegido por Access List.
- El archivo `.env` nunca debe incluirse en el repositorio.

---

## Documentación adicional

Para más detalles, consulta la carpeta `/docs` o abre una incidencia en el repositorio si tienes dudas específicas.
