<div align="center">
  <img src="frontend/assets/img/logotipoSporty.png" alt="Sporty App" width="140" />
</div>
<br>
<div align="center">
  <p><b>Sporty</b> es una red social deportiva: comparte entrenamientos, crea y sigue rutinas, chatea con otros atletas y entrenadores y descubre gimnasios cerca de ti.  
Compuesta por frontend (HTML/CSS/JS) y backend (PHP).</p>
</div>

<div align="center">



https://github.com/user-attachments/assets/9ca78d96-bff8-444e-a117-1a40987177f1



https://github.com/user-attachments/assets/a1f187a2-00de-4df4-8b0b-5b993746794d



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

### Inicio e historias
Feed con las publicaciones de la gente a la que sigues, historias que caducan a las 24 h, comentarios, publicaciones guardadas y subida de nuevos posts con foto.


https://github.com/user-attachments/assets/cffd3f6a-534f-4954-a318-206564a9ad56


### Explorar y perfiles
Busca atletas y entrenadores por nombre o por deporte, visita su perfil y síguelos.


https://github.com/user-attachments/assets/6d7d0900-09bf-4baa-bbd5-bdbccd99f599


### Rutinas y modo entrenamiento
Crea rutinas con series, repeticiones y peso, entrena con cronómetro y checklist, y dale like o guarda las rutinas de otros usuarios.


https://github.com/user-attachments/assets/b2df6fee-c78e-45c6-be09-37c303c66de5


### Mensajes y notificaciones
Chat directo entre usuarios, con mensajes nuevos que llegan sin recargar, y notificaciones de seguidores, comentarios y mensajes.


https://github.com/user-attachments/assets/0d751b2e-8e48-4fbc-8a96-5584e9db5b96


### Mapa de gimnasios
Gimnasios cercanos a tu ubicación, con su estado (abierto o cerrado), la distancia, qué amigos lo siguen y la opción de seguirlo.

> En el vídeo, el mapa es una simulación (OpenStreetMap y gimnasios inventados), porque la API de Google Maps no está activada. La tarjeta del gimnasio y el botón de seguir son los de la app.


https://github.com/user-attachments/assets/db0f4dd4-15e7-4c4e-8c32-51550535c717


### Panel de administración
Métricas generales, gestión de reportes por estado y tipo, baneos permanentes o temporales y gestión de usuarios.


https://github.com/user-attachments/assets/3c785faf-db83-4e86-b5f3-e6402459becf


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
