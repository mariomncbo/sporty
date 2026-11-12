<?php

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Envía el email de bienvenida al usuario recién registrado.
 * El contenido del email se puede editar en:
 *   backend/src/templates/email_bienvenida.php
 *
 * @param string $nombre   Nombre completo del usuario
 * @param string $nickname Nombre de usuario
 * @param string $email    Correo del destinatario
 * @return bool            true si el envío fue exitoso
 */
function enviarEmailBienvenida(string $nombre, string $nickname, string $email): bool
{
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->SMTPDebug  = 2; // DEBUG TEMPORAL: quitar cuando funcione
        $mail->Debugoutput = function($str, $level) { error_log('[SMTP] ' . $str); };
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = MAIL_ENCRYPTION === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $mail->addAddress($email, $nombre);

        $mail->isHTML(true);
        $mail->Subject = '¡Bienvenido a eSporty, ' . $nombre . '!';

        // Carga la plantilla HTML (editable en src/templates/email_bienvenida.php)
        // Las variables $nombre, $nickname y $email están disponibles dentro de la plantilla
        $mail->Body    = require __DIR__ . '/../templates/email_bienvenida.php';
        $mail->AltBody = "¡Bienvenido a eSporty, $nombre! Tu usuario es: $nickname. Ya puedes iniciar sesión.";

        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log('[eSporty] Error al enviar email de bienvenida a ' . $email . ': ' . $mail->ErrorInfo);
        return false;
    }
}
