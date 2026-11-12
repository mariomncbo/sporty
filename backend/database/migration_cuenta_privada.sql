-- Migración: Sistema de cuenta privada y solicitudes de seguimiento
-- Fecha: 2026-04-17

-- 1. Campo cuenta_privada en usuarios (0 = pública, 1 = privada)
ALTER TABLE usuarios
    ADD COLUMN cuenta_privada TINYINT(1) NOT NULL DEFAULT 0;

-- 2. Campo estado en seguidores para gestionar solicitudes pendientes
ALTER TABLE seguidores
    ADD COLUMN estado ENUM('aceptado', 'pendiente') NOT NULL DEFAULT 'aceptado';
