-- Migración: publicaciones guardadas por el usuario
-- Al borrar el post el CASCADE lo elimina automáticamente de guardados

CREATE TABLE IF NOT EXISTS posts_guardados (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    id_post     INT NOT NULL,
    id_usuario  INT NOT NULL,
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_post_guardado (id_post, id_usuario),
    CONSTRAINT fk_pg_post    FOREIGN KEY (id_post)    REFERENCES posts(id_post)       ON DELETE CASCADE,
    CONSTRAINT fk_pg_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
