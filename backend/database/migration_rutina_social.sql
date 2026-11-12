-- Migración: sistema social de rutinas (likes, guardadas, entrenamientos)
-- Ejecutar UNA SOLA VEZ

-- Likes en rutinas
CREATE TABLE IF NOT EXISTS rutina_likes (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    id_rutina   INT NOT NULL,
    id_usuario  INT NOT NULL,
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_rutina_like (id_rutina, id_usuario),
    CONSTRAINT fk_rl_rutina  FOREIGN KEY (id_rutina)  REFERENCES rutinas(id_rutina)   ON DELETE CASCADE,
    CONSTRAINT fk_rl_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Rutinas guardadas/copiadas por otros usuarios
CREATE TABLE IF NOT EXISTS rutina_guardadas (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    id_rutina   INT NOT NULL,   -- rutina original
    id_usuario  INT NOT NULL,   -- quien la guardó
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_rutina_guardada (id_rutina, id_usuario),
    CONSTRAINT fk_rg_rutina  FOREIGN KEY (id_rutina)  REFERENCES rutinas(id_rutina)   ON DELETE CASCADE,
    CONSTRAINT fk_rg_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Historial de entrenamientos realizados
CREATE TABLE IF NOT EXISTS rutina_entrenamientos (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    id_rutina      INT NOT NULL,
    id_usuario     INT NOT NULL,
    duracion_segs  INT NOT NULL DEFAULT 0,
    fecha          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_re_rutina2  FOREIGN KEY (id_rutina)  REFERENCES rutinas(id_rutina)   ON DELETE CASCADE,
    CONSTRAINT fk_re_usuario2 FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
