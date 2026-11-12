-- Migración: tabla de comentarios
-- Ejecutar UNA SOLA VEZ en la BD existente:
--   docker exec -i sportyx-mysql-1 mysql -u<user> -p<pass> sportyx_db < migration_comentarios.sql

CREATE TABLE IF NOT EXISTS comentarios (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    id_post       INT  NOT NULL,
    id_autor      INT  NOT NULL,
    contenido     VARCHAR(500) NOT NULL,
    fecha         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_post   FOREIGN KEY (id_post)  REFERENCES posts(id_post)       ON DELETE CASCADE,
    CONSTRAINT fk_comentario_autor  FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
