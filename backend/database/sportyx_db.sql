DROP USER IF EXISTS 'Esporty_Backend'@'%';

CREATE USER 'Esporty_Backend'@'%' IDENTIFIED BY 'Medac$26_';

GRANT ALL PRIVILEGES ON *.* TO 'Esporty_Backend'@'%';
FLUSH PRIVILEGES;

DROP SCHEMA IF EXISTS esporty_bd;

CREATE SCHEMA esporty_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE esporty_bd;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- tabla de usuarios
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    telefono INT UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    admin TINYINT(1) DEFAULT 0,
    entrenador TINYINT(1) DEFAULT 0,
    baneado TINYINT(1) DEFAULT 0,
    verificado TINYINT(1) DEFAULT 0,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    genero ENUM('hombre','mujer','personalizado','prefiero_no_decirlo') DEFAULT NULL,
    deporte_favorito INT DEFAULT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- tabla de Deportes
CREATE TABLE deportes (
    id_deporte INT PRIMARY KEY AUTO_INCREMENT,
    nombre_deporte VARCHAR(50) NOT NULL
);

-- tabla de Ejercicios
CREATE TABLE ejercicios (
    id_ejercicio INT PRIMARY KEY AUTO_INCREMENT,
    nombre_ejercicio VARCHAR(100) NOT NULL,
    id_deporte INT NOT NULL,
    id_creador INT NOT NULL, 
    
    -- foreign keys
    CONSTRAINT fk_deporte FOREIGN KEY (id_deporte) REFERENCES deportes(id_deporte),
    CONSTRAINT fk_creador FOREIGN KEY (id_creador) REFERENCES usuarios(id_usuario)
);

-- tabla de reportes
CREATE TABLE reportes (
    id_reporte INT PRIMARY KEY AUTO_INCREMENT,
    id_emisor INT NOT NULL, -- usuario que crea el reporte
    id_reportado INT DEFAULT NULL, -- usuario reportado
    tipo_reporte ENUM('Error', 'Spam', 'Comportamiento', 'Otro') NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('Pendiente', 'En Revisión', 'Resuelto', 'Desestimado') DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- foreign keys
    CONSTRAINT fk_emisor FOREIGN KEY (id_emisor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_reportado FOREIGN KEY (id_reportado) REFERENCES usuarios(id_usuario)
);

-- tabla de retos
CREATE TABLE retos (
    id_reto INT PRIMARY KEY AUTO_INCREMENT,
    insignias VARCHAR(255) NOT NULL,
    recompensa TEXT NOT NULL,
    no_completados INT NOT NULL DEFAULT 0,
    completados INT NOT NULL DEFAULT 0
);

-- tabla de dietas
CREATE TABLE dietas (
    id_dieta INT PRIMARY KEY AUTO_INCREMENT,
    nombre_dieta VARCHAR(100) NOT NULL, -- nombre de la dieta que vera el usuario
    descripcion TEXT, -- explicacion detallada de la dieta
    calorias INT NOT NULL,
    proteinas DECIMAL(6,2) NOT NULL,
    carbohidratos DECIMAL(6,2) NOT NULL,
    grasas DECIMAL(6,2) NOT NULL,
    agua DECIMAL(6,2) NOT NULL,
    
    -- foreign keys
    id_autor INT NOT NULL,
    CONSTRAINT fk_autor_dieta FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario)
);

-- tabla de publicaciones
CREATE TABLE posts (
    id_post INT PRIMARY KEY AUTO_INCREMENT,
    id_autor INT NOT NULL,
    contenido TEXT NOT NULL,
    imagen VARCHAR(255) DEFAULT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_autor_post FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- tabla de comentarios de posts
CREATE TABLE comentarios (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    id_post INT NOT NULL,
    id_autor INT NOT NULL,
    contenido VARCHAR(500) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_post   FOREIGN KEY (id_post)   REFERENCES posts(id_post)       ON DELETE CASCADE,
    CONSTRAINT fk_comentario_autor  FOREIGN KEY (id_autor)  REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- tabla de seguidores
CREATE TABLE seguidores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_seguidor INT NOT NULL,
    id_seguido INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_follow (id_seguidor, id_seguido),
    CONSTRAINT fk_seguidor FOREIGN KEY (id_seguidor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_seguido FOREIGN KEY (id_seguido) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- tabla de baneos (historial y baneos temporales)
CREATE TABLE baneos (
    id_baneo INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_admin INT DEFAULT NULL,
    tipo ENUM('permanente', 'temporal') NOT NULL DEFAULT 'permanente',
    motivo VARCHAR(255) NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_usuario_baneo FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_admin_baneo FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- tabla de rutinas de usuario
CREATE TABLE rutinas (
    id_rutina INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rutina FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- tabla de conversaciones (DMs entre dos usuarios)
CREATE TABLE conversaciones (
    id_conversacion INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario1 INT NOT NULL,
    id_usuario2 INT NOT NULL,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conversacion (id_usuario1, id_usuario2),
    CONSTRAINT fk_conv_u1 FOREIGN KEY (id_usuario1) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_conv_u2 FOREIGN KEY (id_usuario2) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- tabla de mensajes
CREATE TABLE mensajes (
    id_mensaje INT PRIMARY KEY AUTO_INCREMENT,
    id_conversacion INT NOT NULL,
    id_emisor INT NOT NULL,
    contenido TEXT NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_conv FOREIGN KEY (id_conversacion) REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE,
    CONSTRAINT fk_msg_emisor FOREIGN KEY (id_emisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- tabla de historias (expiran a las 24h)
CREATE TABLE historias (
    id_historia INT PRIMARY KEY AUTO_INCREMENT,
    id_autor    INT NOT NULL,
    imagen      VARCHAR(255) NOT NULL,
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en   TIMESTAMP NOT NULL,
    CONSTRAINT fk_autor_historia FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- FK deporte favorito (despues de crear deportes)
ALTER TABLE usuarios ADD CONSTRAINT fk_deporte_favorito FOREIGN KEY (deporte_favorito) REFERENCES deportes(id_deporte) ON DELETE SET NULL;

-- Si ya tienes la tabla baneos creada de antes, puedes ejecutar esta migracion manual:
-- ALTER TABLE baneos ADD COLUMN motivo VARCHAR(255) NOT NULL DEFAULT 'Incumplimiento de normas';






-- inserts de prueba

-- 1. Insertar Deportes
INSERT INTO deportes (nombre_deporte) VALUES 
('Fútbol'), ('Baloncesto'), ('Tenis'), ('Natación'), 
('Crossfit'), ('Calistenia'), ('Yoga'), ('Pádel');

-- Insertar Usuarios Normales (solo deportistas)
INSERT INTO usuarios (name, nickname, telefono, email, contrasena, admin, entrenador, verificado, deporte_favorito) VALUES 
('Carlos Ruiz', 'cruiz_92', 600111222, 'carlos@mail.com', 'hash_password_1', 0, 0, 1, 1),
('Elena Belmonte', 'ele_fit', 600333444, 'elena@mail.com', 'hash_password_2', 0, 0, 1, 4),
('Marcos Peña', 'marquitos_p', 600555666, 'marcos@mail.com', 'hash_password_3', 0, 0, 0, 2),
('Lucía Sanz', 'lusanz_cali', 600777888, 'lucia@mail.com', 'hash_password_4', 0, 0, 1, 6);

-- Insertar Entrenadores
INSERT INTO usuarios (name, nickname, telefono, email, contrasena, admin, entrenador, verificado, deporte_favorito) VALUES 
('Roberto García', 'coach_rober', 611000111, 'roberto.coach@mail.com', 'hash_safe_5', 0, 1, 1, 5),
('Sara Méndez', 'sara_pro_tennis', 611222333, 'sara.tennis@mail.com', 'hash_safe_6', 0, 1, 1, 3),
('David Valls', 'valls_yoga', 611444555, 'david.yoga@mail.com', 'hash_safe_7', 0, 1, 1, 7),
('Marta López', 'marta_padel_pro', 611666777, 'marta.padel@mail.com', 'hash_safe_8', 0, 1, 0, 8);

-- 2. Insertar Ejercicios vinculados a los deportes creados
-- Nota: Asumimos que los IDs de deportes empiezan en 1 y siguen el orden anterior.
INSERT INTO ejercicios (nombre_ejercicio, id_deporte, id_creador) VALUES 
-- Fútbol (id_deporte: 1)
('Regate en zig-zag', 1, 1),
('Tiro libre a puerta', 1, 1),
('Control de balón orientado', 1, 1),
-- Baloncesto (id_deporte: 2)
('Entrada a canasta', 2, 1),
('Tiro de tres puntos', 2, 1),
('Defensa individual', 2, 1),
-- Tenis (id_deporte: 3)
('Saque liftado', 3, 1),
('Revés a dos manos', 3, 1),
('Volea de derecha', 3, 1),
-- Natación (id_deporte: 4)
('Viraje de crol', 4, 1),
('Patada de mariposa', 4, 1),
-- Crossfit (id_deporte: 5)
('Burpees over bar', 5, 1),
('Clean and Jerk', 5, 1),
('Wall Balls', 5, 1),
-- Calistenia (id_deporte: 6)
('Muscle up', 6, 1),
('Front lever', 6, 1),
('Dominadas explosivas', 6, 1),
-- Yoga (id_deporte: 7)
('Saludo al sol', 7, 1),
('Postura del guerrero', 7, 1),
-- Pádel (id_deporte: 8)
('Bandeja técnica', 8, 1),
('Salida de pared', 8, 1);

-- 1. Reporte por SPAM (Carlos [ID 1] reporta a Marta [ID 8])
INSERT INTO reportes (id_emisor, id_reportado, tipo_reporte, descripcion, estado) 
VALUES (1, 8, 'Spam', 'Marta no para de hacer publicidad de sus clases privadas de pádel en mis entrenamientos.', 'Pendiente');

-- 2. Reporte por Comportamiento (Lucía [ID 4] reporta a Marcos [ID 3])
INSERT INTO reportes (id_emisor, id_reportado, tipo_reporte, descripcion, estado) 
VALUES (4, 3, 'Comportamiento', 'Marcos ha dejado comentarios muy ofensivos y fuera de lugar en mi último post de calistenia.', 'Pendiente');

-- 3. Reporte de Error del Sistema (Roberto [ID 5] avisa de un fallo. OJO: id_reportado es NULL)
INSERT INTO reportes (id_emisor, id_reportado, tipo_reporte, descripcion, estado) 
VALUES (5, NULL, 'Error', 'La aplicación se queda completamente colgada cuando intento subir la foto de mi clase de Crossfit.', 'En Revisión');

-- 4. Reporte por Otro motivo (Sara [ID 6] sospecha de David [ID 7])
INSERT INTO reportes (id_emisor, id_reportado, tipo_reporte, descripcion, estado) 
VALUES (6, 7, 'Otro', 'Sospecho que este perfil es falso. Las fotos de yoga parecen sacadas de un banco de imágenes de internet.', 'Pendiente');

-- 5. Reporte por Comportamiento en chat (Elena [ID 2] reporta a Carlos [ID 1])
INSERT INTO reportes (id_emisor, id_reportado, tipo_reporte, descripcion, estado) 
VALUES (2, 1, 'Comportamiento', 'El usuario tiene una actitud muy tóxica y agresiva por mensajes privados tras perder un partido.', 'Pendiente');

INSERT INTO retos (insignias, recompensa, no_completados, completados) VALUES 
('Madrugador', 'Descuento 10% en tienda deportiva', 45, 120),
('Bestia del Crossfit', 'Acceso gratuito a Masterclass con Roberto', 150, 30),
('Rey de la Pista', 'Pala de pádel profesional', 300, 5),
('Zen Master', 'Suscripción Premium 1 mes', 20, 80),
('Goleador', 'Balón firmado por el equipo local', 500, 2);

INSERT INTO dietas (nombre_dieta, descripcion, calorias, proteinas, carbohidratos, grasas, agua, id_autor) VALUES 
('Volumen Limpio', 'Dieta alta en proteínas para ganar masa muscular sin grasa.', 3200, 180.50, 400.00, 80.00, 3.5, 5),
('Definición Extrema', 'Baja en carbohidratos, ideal para competiciones de fitness.', 1800, 160.00, 100.00, 50.00, 4.0, 5),
('Equilibrada Mediterránea', 'Basada en grasas saludables y productos frescos.', 2200, 110.00, 250.00, 70.00, 2.5, 7),
('Rendimiento Tenis', 'Carga de hidratos previa a partidos de larga duración.', 2800, 130.00, 450.00, 60.00, 3.0, 6),
('Vegana Deportiva', 'Proteína vegetal de alta calidad para atletas.', 2400, 120.00, 350.00, 65.00, 2.8, 8);

INSERT INTO posts (id_autor, contenido, imagen) VALUES 
(1, '¡Hoy completé mi primer entrenamiento de regates! Me siento imparable.', 'foto_futbol_1.jpg'),
(5, 'Consejo del día: No descuides el descanso entre series de Crossfit.', 'tip_roberto.png'),
(2, '¿Alguien para un partido de tenis mañana por la tarde en el centro?', NULL),
(4, 'Mi primera Muscle Up después de 6 meses de intento. ¡No te rindas!', 'video_calistenia.mp4'),
(8, 'Nueva clase de pádel nivel iniciación este sábado. ¡Apúntate!', 'cartel_padel.jpg');

INSERT INTO seguidores (id_seguidor, id_seguido) VALUES 
(1, 5), -- Carlos sigue al entrenador Roberto
(1, 2), -- Carlos sigue a Elena
(2, 1), -- Elena sigue a Carlos (follow back)
(3, 5), -- Marcos sigue a Roberto
(4, 6), -- Lucía sigue a la entrenadora Sara
(5, 1), -- El entrenador sigue a su alumno
(7, 4), -- David sigue a Lucía
(8, 2); -- Marta sigue a Elena