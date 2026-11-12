<?php

function depurar($entrada){
    if(is_array($entrada)) return $entrada; // No procesar arrays
    $salida = htmlspecialchars($entrada); // prevenir ataques XSS
    $salida = trim($salida); // eliminar los espacios en blanco de la iz y de la derecha
    $salida = preg_replace("/\s+/", " ", $salida); // un solo espacio y no mas (entre las palabras)

    return $salida;
}

function depurarPassword($entrada){
    if(is_array($entrada)) return $entrada;
    return trim($entrada);
}
?>