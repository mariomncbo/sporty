<?php
// ============================================================
// PLANTILLA DE EMAIL DE BIENVENIDA - ESPORTY
// ¡Edita este archivo libremente para personalizar el email!
//
// Variables disponibles (se sustituyen automáticamente):
//   $nombre   → Nombre completo del usuario
//   $nickname → Nombre de usuario elegido
//   $email    → Correo electrónico del usuario
// ============================================================
ob_start();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido a eSporty!</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                       style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;max-width:600px;width:100%;">

                    <!-- ===== CABECERA ===== -->
                    <tr>
                        <td align="center" style="background:#16a34a;padding:36px 40px;">
                            <h1 style="color:#ffffff;margin:0;font-size:36px;letter-spacing:3px;font-weight:900;">
                                ESPORTY
                            </h1>
                            <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;letter-spacing:1px;">
                                Tu plataforma deportiva
                            </p>
                        </td>
                    </tr>

                    <!-- ===== CUERPO ===== -->
                    <tr>
                        <td style="padding:40px 40px 24px;">
                            <h2 style="color:#4ade80;margin:0 0 16px;font-size:22px;">
                                ¡Bienvenido, <?= htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') ?>! 👋
                            </h2>
                            <p style="color:#d1d5db;font-size:15px;line-height:1.8;margin:0 0 20px;">
                                Nos alegra que te hayas unido a <strong style="color:#4ade80;">eSporty</strong>.
                                Tu cuenta ha sido creada correctamente y ya puedes disfrutar de todo lo que
                                la plataforma tiene para ofrecerte.
                            </p>

                            <!-- Datos del usuario -->
                            <table cellpadding="0" cellspacing="0"
                                   style="background:#111111;border-radius:8px;padding:16px 20px;margin:0 0 24px;width:100%;box-sizing:border-box;">
                                <tr>
                                    <td style="color:#9ca3af;font-size:14px;padding:5px 0;width:100px;">
                                        Usuario:
                                    </td>
                                    <td style="color:#f3f4f6;font-size:14px;font-weight:bold;padding:5px 0;">
                                        <?= htmlspecialchars($nickname, ENT_QUOTES, 'UTF-8') ?>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color:#9ca3af;font-size:14px;padding:5px 0;">
                                        Email:
                                    </td>
                                    <td style="color:#f3f4f6;font-size:14px;padding:5px 0;">
                                        <?= htmlspecialchars($email, ENT_QUOTES, 'UTF-8') ?>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#d1d5db;font-size:15px;line-height:1.8;margin:0 0 24px;">
                                Ya puedes iniciar sesión y explorar todos los eventos y actividades deportivas
                                disponibles en tu zona.
                            </p>

                            <!-- Botón CTA -->
                            <a href="https://esporty.jcloudhosting.com/frontend/auth/login.html"
                               style="display:inline-block;padding:14px 36px;background:#16a34a;color:#ffffff;
                                      text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
                                Iniciar sesión →
                            </a>
                        </td>
                    </tr>

                    <!-- ===== PIE ===== -->
                    <tr>
                        <td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
                            <p style="color:#6b7280;font-size:12px;margin:0;text-align:center;line-height:1.7;">
                                Si no has creado esta cuenta, puedes ignorar este correo con total seguridad.<br>
                                &copy; <?= date('Y') ?> eSporty &mdash; Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
<?php
return ob_get_clean();
