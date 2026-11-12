<?php
// ============================================================
// CONFIGURACIÓN SMTP - ESPORTY
// Edita las variables en tu archivo .env para cambiar el
// proveedor de correo (Gmail, SendGrid, Mailtrap, etc.)
// ============================================================

define('MAIL_HOST',       getenv('MAIL_HOST')       ?: 'smtp.gmail.com');
define('MAIL_PORT',       (int)(getenv('MAIL_PORT') ?: 587));
define('MAIL_ENCRYPTION', getenv('MAIL_ENCRYPTION') ?: 'tls'); // 'tls' o 'ssl'
define('MAIL_USERNAME',   getenv('MAIL_USERNAME')   ?: '');
define('MAIL_PASSWORD',   getenv('MAIL_PASSWORD')   ?: '');
define('MAIL_FROM',       getenv('MAIL_FROM')       ?: getenv('MAIL_USERNAME'));
define('MAIL_FROM_NAME',  getenv('MAIL_FROM_NAME')  ?: 'eSporty');
