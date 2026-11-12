<?php
//Para indicar que va a devolver un json:
header('Content-Type: application/json');

require "../../../src/lib/depurar.php";
require "../../../src/lib/enviar_email.php";
require("../../../src/config/conexion.php");

//Array para guardar los errores.
$respuesta = [
    'success' => false,
    'errores' => []
];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $tmp_name = $_POST["name"];
    $tmp_nickname = $_POST["nickname"];
    $tmp_email = $_POST["email"];
    $tmp_telefono = $_POST["telefono"];
    $tmp_contrasena = $_POST["contrasena"];
    $tmp_confirmarContrasena = $_POST["confirmarContrasena"];

    $errores = false;

    //-----VALIDACIONES:-----
    
    //name
    $tmp_name = depurar($tmp_name);
    if ($tmp_name == "") {
        $respuesta['errores']['name'] = "Introduzca un nombre";
        $errores = true;
    } elseif (strlen($tmp_name) < 3) {
        $respuesta['errores']['name'] = "Introduzca 3 o más caracteres";
        $errores = true;
    } else {
        $name = $tmp_name;
    }

    //nickname
    $tmp_nickname = depurar($tmp_nickname);
    if ($tmp_nickname == "") {
        $respuesta['errores']['nickname'] = "Introduzca un nombre de usuario";
        $errores = true;
    } elseif (strlen($tmp_nickname) < 3) {
        $respuesta['errores']['nickname'] = "Introduzca 3 o más caracteres";
        $errores = true;
    } elseif (!preg_match('/^[a-zA-Z0-9._-]+$/', $tmp_nickname)) {
        $respuesta['errores']['nickname'] = "El nickname solo puede contener letras, números, puntos (.), guiones (-) y guiones bajos (_). Sin espacios.";
        $errores = true;
    } else {
        $nickname = $tmp_nickname;
    }

    //email
    $tmp_email = depurar($tmp_email);
    if ($tmp_email == "") {
        $respuesta['errores']['email'] = "Introduzca un email";
        $errores = true;
    } elseif (!filter_var($tmp_email, FILTER_VALIDATE_EMAIL)) {
        $respuesta['errores']['email'] = "Formato de correo no válido";
        $errores = true;
    } else {
        $email = $tmp_email;
    }

    //telefono
    $tmp_telefono = depurar($tmp_telefono);
    if ($tmp_telefono == "") {
        $respuesta['errores']['telefono'] = "Introduzca un teléfono";
    } else {
        $telefono = $tmp_telefono;
    }

    //contraseña y confirmarContraseña
    $tmp_contrasena = depurarPassword($tmp_contrasena);
    $tmp_confirmarContrasena = depurarPassword($tmp_confirmarContrasena);

    if ($tmp_contrasena === "") {
        $respuesta['errores']['contrasena'] = "Introduzca una contraseña";
        $errores = true;
    } elseif (!preg_match('/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/', $tmp_contrasena)) {
        $respuesta['errores']['contrasena'] = "La contraseña debe tener: 8 a 16 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial.";
        $errores = true;
    } elseif ($tmp_confirmarContrasena === "") {
        $respuesta['errores']['confirmarContrasena'] = "Confirme la contraseña";
        $errores = true;
    } elseif ($tmp_confirmarContrasena !== $tmp_contrasena) {
        $respuesta['errores']['confirmarContrasena'] = "La contraseña no coincide.";
        $errores = true;
    } else {
        $contrasena = $tmp_contrasena;
    }



    //Si no hay errores
    if (!$errores) {
        try {
            $_conexion->beginTransaction();

            // Verificar nickname
            $stmt = $_conexion->prepare("SELECT nickname FROM usuarios WHERE nickname = :nickname");
            $stmt->execute([
                ':nickname' => $nickname
            ]);
            
            if ($stmt->rowCount() > 0) {
                $respuesta['errores']['nickname'] = "El nombre de usuario ya está en uso.";
                $errores = true;
            }

            // Verificar email
            $stmt = $_conexion->prepare("SELECT email FROM usuarios WHERE email = :email");
            $stmt->execute([
                ':email' => $email
            ]);
            if ($stmt->rowCount() > 0) {
                $respuesta['errores']['email'] = "Ya existe un usuario con ese correo.";
                $errores = true;
            }

            // Verificar telefono
            $stmt = $_conexion->prepare("SELECT telefono FROM usuarios WHERE telefono = :telefono");
            $stmt->execute([
                ':telefono' => $telefono
            ]);
            if ($stmt->rowCount() > 0) {
                $respuesta['errores']['telefono'] = "Ya existe un usuario con ese número de teléfono.";
                $errores = true;
            }

            //Si no existe el usuario
            if (!$errores) {
                //Insertamos nuevo usuario
                $contrasena_cifrada = password_hash($contrasena, PASSWORD_DEFAULT);
                $stmt = $_conexion->prepare("INSERT INTO usuarios (name, nickname, email, telefono, contrasena) VALUES (:name, :nickname, :email, :telefono, :contrasena)");
                
                if ($stmt->execute([
                    ':name' => $name,
                    ':nickname' => $nickname,
                    ':email' => $email,
                    ':telefono' => $telefono,
                    ':contrasena' => $contrasena_cifrada
                ])) {
                    $_conexion->commit();
                    $respuesta['success'] = true;

                    // Enviar email de bienvenida (fallo no bloquea el registro)
                    enviarEmailBienvenida($name, $nickname, $email);
                } else {
                    $_conexion->rollBack();
                    $respuesta['errores']['general'] = "El usuario no se ha podido registrar.";
                }
            } else {
                $_conexion->rollBack();
            }
        } catch (PDOException $e) {
            $_conexion->rollBack();
            $respuesta['errores']['general'] = "Error del sistema: " . $e->getMessage();
        }
    } else { //errores
        if (isset($err_name)) echo $err_name;
        if (isset($err_nickname)) echo $err_nickname;
        if (isset($err_email)) echo $err_email;
        if (isset($err_telefono)) echo $err_telefono;
        if (isset($err_contrasena)) echo $err_contrasena;
        if (isset($err_confirmarContrasena)) echo $err_confirmarContrasena;
    }
}

// Imprimimos la respuesta en JSON para que JS la procese:
    echo json_encode($respuesta);
    exit;
?>