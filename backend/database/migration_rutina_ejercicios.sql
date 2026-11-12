-- Migración: tabla de ejercicios dentro de una rutina
-- Ejecutar UNA SOLA VEZ:
--   docker exec -i sportyx-mysql-1 mysql -u<user> -p<pass> sportyx_db < migration_rutina_ejercicios.sql

CREATE TABLE IF NOT EXISTS rutina_ejercicios (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    id_rutina       INT          NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    series          TINYINT      NOT NULL DEFAULT 3,
    repeticiones    TINYINT      NOT NULL DEFAULT 10,
    peso_kg         DECIMAL(5,1) DEFAULT NULL,
    orden           TINYINT      NOT NULL DEFAULT 0,
    CONSTRAINT fk_re_rutina FOREIGN KEY (id_rutina) REFERENCES rutinas(id_rutina) ON DELETE CASCADE
);
