<div align="center">
  <img src="frontend/assets/img/logotipoSporty.png" alt="Sporty App" width="140" />
</div>
<div align="center">
  <p><b>Sporty</b> es una aplicación web para gestión deportiva-social, compuesta por frontend (HTML/CSS/JS) y backend (PHP).  
Incluye autenticación de usuarios y panel de administración básico.</p>
</div>

---

## Estado actual

- En desarrollo activo.
- Autenticación funcional.
- Panel de administración operativo.
- Redirección automática según rol de usuario.

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
