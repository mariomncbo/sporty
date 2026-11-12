-- Tabla para guardar los gimnasios a los que sigues.
CREATE TABLE IF NOT EXISTS gimnasios_seguidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    place_id VARCHAR(255) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gimnasio_usuario (id_usuario, place_id),
    CONSTRAINT fk_gym_seg_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);