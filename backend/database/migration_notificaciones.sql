-- Migración: tabla de notificaciones
-- Ejecutar UNA SOLA VEZ en la BD existente:
--   docker exec -i sportyx-mysql-1 mysql -u<user> -p<pass> sportyx_db < migration_notificaciones.sql

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT PRIMARY KEY AUTO_INCREMENT,
    id_destinatario INT NOT NULL,              -- quien recibe la notificación
    id_emisor       INT NOT NULL,              -- quien la genera
    tipo            ENUM('nuevo_seguidor','nuevo_comentario','nuevo_mensaje') NOT NULL,
    id_referencia   INT DEFAULT NULL,          -- id_post (comentario) | id_conversacion (mensaje)
    leida           TINYINT(1) DEFAULT 0,
    fecha           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_dest   FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_notif_emisor FOREIGN KEY (id_emisor)       REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
