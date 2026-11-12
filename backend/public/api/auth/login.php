<?php
//Para indicar que va a devolver un json:
header('Content-Type: application/json');

require "../../../src/lib/depurar.php";
require("../../../src/config/conexion.php");


//Array para guardar los errores.
$respuesta = [
    'success' => false,
    'errores' => [],
    'admin' => false
];


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $tmp_nickname = $_POST["nickname"];
    $tmp_contrasena = $_POST["contrasena"];

    //Depurar inputs.
    $tmp_nickname = depurar($tmp_nickname);
    $tmp_contrasena = depurarPassword($tmp_contrasena);

    //-----VALIDACIONES:-----
    if ($tmp_contrasena == "") {
        $respuesta['errores']['contrasena'] = "Introduce tu contraseña";
    } else{
        $contrasena = $tmp_contrasena;
    }

    if ($tmp_nickname == "") {
        $respuesta['errores']['nickname'] = "Introduce un nombre de usuario";
    } else {
        $nickname = $tmp_nickname;
    }


    if (isset($nickname) && isset($contrasena)) {
        $_conexion->beginTransaction();
        $consulta = $_conexion->prepare("SELECT * FROM usuarios WHERE nickname = :nickname");

        $consulta->bindValue(':nickname', $nickname, PDO::PARAM_STR);
        $consulta->execute();
        $resultado = $consulta->fetchAll();

        if (empty($resultado)) {
            $respuesta['errores']['nickname'] = "El usuario no existe.";
        } else {
            $info_usuario = $resultado[0];
            $nickname = $info_usuario["nickname"];

            // Verificar si está baneado
            if (isset($info_usuario['baneado']) && (int)$info_usuario['baneado'] === 1) {
                $respuesta['errores']['baneado'] = "Este usuario está baneado. No puedes iniciar sesión.";
            } else {
                $acceso_concedido = password_verify($contrasena, $info_usuario["contrasena"]);
                if (!$acceso_concedido) {
                    $respuesta['errores']['contrasena'] = "La contraseña es incorrecta";
                } else {
                    session_start();
                    $_SESSION["nickname"] = $nickname;
                    $_SESSION["admin"] = $info_usuario["admin"];
                    $respuesta['success'] = true;
                    $respuesta['admin'] = ((int) $info_usuario["admin"] === 1);
                }
            }
        }
    }
    // Imprimimos la respuesta en JSON para que JS la procese:
    echo json_encode($respuesta);
    exit;
}
?>
