<?php

date_default_timezone_set('Europe/Madrid');

$_servidor  = getenv('DB_HOST') ?: 'mysql';
$_bd        = getenv('DB_DATABASE') ?: 'esporty_bd';
$_usuario   = getenv('DB_USERNAME') ?: 'Esporty_Backend';
$_contrasena= getenv('DB_PASSWORD') ?: 'Medac$26_';

try {
    $_conexion = new PDO(
        "mysql:host=$_servidor;dbname=$_bd;charset=utf8mb4",
        $_usuario,
        $_contrasena
    );

    $_conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $_conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $_conexion->exec("SET time_zone = '+02:00'");
    //echo "Conectados";

} catch (PDOException $e) {
    die("Error: No se pudo conectar a la base de datos.<br>Detalles: ".$e->getMessage());
}

?>