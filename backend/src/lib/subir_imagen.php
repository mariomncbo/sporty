<?php

/**
 * Dimensiones objetivo por tipo de contenido.
 * Posts y avatars → cuadrado (1:1).
 * Stories         → vertical 9:16.
 */
const DIMENSIONES = [
    'posts'   => ['w' => 1080, 'h' => 1080],
    'stories' => ['w' => 1080, 'h' => 1920],
    'avatars' => ['w' =>  400, 'h' =>  400],
    'chats'   => ['w' => 1080, 'h' => 1080],
];

/**
 * Sube una imagen al directorio correspondiente, la recorta y redimensiona
 * al formato estándar del tipo dado, y devuelve la ruta relativa que se
 * almacenará en base de datos.
 *
 * @param array  $archivo  Entrada de $_FILES['campo']
 * @param string $tipo     'avatars' | 'posts' | 'stories' | 'chats'
 * @return string          Ruta relativa: uploads/{tipo}/{nombre}.jpg
 * @throws RuntimeException Si la validación o el guardado fallan
 */
function subirImagen(array $archivo, string $tipo): string
{
    // --- Tipos MIME permitidos por tipo de destino ---
    $tiposImagen = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    // Posts y stories también aceptan vídeo
    $tiposVideo = [
        'video/mp4'       => 'mp4',
        'video/quicktime' => 'mov',
    ];
    $tiposPermitidos = in_array($tipo, ['posts', 'stories'], true)
        ? array_merge($tiposImagen, $tiposVideo)
        : $tiposImagen;

    // --- Tamaño máximo (se aplica después de validar MIME) ---
    $maxBytesImagen = 10  * 1024 * 1024;   // 10 MB
    $maxBytesVideo  = 100 * 1024 * 1024;   // 100 MB

    // --- Directorios válidos ---
    $directoriosValidos = ['avatars', 'posts', 'stories', 'chats'];

    if (!in_array($tipo, $directoriosValidos, true)) {
        throw new RuntimeException("Tipo de directorio no válido: $tipo");
    }

    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException("Error al recibir el archivo (código {$archivo['error']})");
    }

    // Validar tipo MIME real (no el declarado por el cliente)
    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeReal = $finfo->file($archivo['tmp_name']);

    if (!array_key_exists($mimeReal, $tiposPermitidos)) {
        throw new RuntimeException("Tipo de archivo no permitido: $mimeReal");
    }

    $esVideo  = array_key_exists($mimeReal, $tiposVideo);
    $maxBytes = $esVideo ? $maxBytesVideo : $maxBytesImagen;

    if ($archivo['size'] > $maxBytes) {
        $limite = $esVideo ? '100 MB' : '10 MB';
        throw new RuntimeException("El archivo supera el tamaño máximo permitido de $limite");
    }

    // Extensión real según MIME
    $ext         = $tiposPermitidos[$mimeReal];
    $nombreUnico = time() . '_' . uniqid('', true) . '_' . bin2hex(random_bytes(8)) . '.' . $ext;

    $dirBase   = dirname(__DIR__, 2) . '/public/uploads/' . $tipo . '/';
    $rutaFinal = $dirBase . $nombreUnico;

    if (!is_dir($dirBase)) {
        throw new RuntimeException("El directorio de destino no existe: $dirBase");
    }

    if (!move_uploaded_file($archivo['tmp_name'], $rutaFinal)) {
        throw new RuntimeException("No se pudo guardar el archivo en el servidor");
    }

    // Vídeos: se guardan tal cual, sin procesado GD
    if ($esVideo) {
        return 'uploads/' . $tipo . '/' . $nombreUnico;
    }

    // Imágenes: recortar al ratio correcto y redimensionar
    try {
        _procesarImagen($rutaFinal, $mimeReal, $tipo);
    } catch (RuntimeException $e) {
        @unlink($rutaFinal);
        throw $e;
    }

    return 'uploads/' . $tipo . '/' . $nombreUnico;
}

/**
 * Escala la imagen para que quepa entera dentro del canvas (contain),
 * centrándola sobre fondo negro, y guarda como JPEG calidad 90.
 * Nunca deforma ni recorta la imagen original.
 */
function _procesarImagen(string $ruta, string $mime, string $tipo): void
{
    $dim  = DIMENSIONES[$tipo] ?? ['w' => 1080, 'h' => 1080];
    $wDst = $dim['w'];
    $hDst = $dim['h'];

    // Crear recurso GD según el tipo original
    $src = match ($mime) {
        'image/jpeg' => imagecreatefromjpeg($ruta),
        'image/png'  => imagecreatefrompng($ruta),
        'image/webp' => imagecreatefromwebp($ruta),
        default      => throw new RuntimeException("Formato no soportado por GD"),
    };

    if (!$src) {
        throw new RuntimeException("No se pudo leer la imagen con GD");
    }

    $wSrc = imagesx($src);
    $hSrc = imagesy($src);

    // Escala "contain": la imagen cabe entera sin recortar, manteniendo ratio
    $escala  = min($wDst / $wSrc, $hDst / $hSrc);
    $wScaled = (int) round($wSrc * $escala);
    $hScaled = (int) round($hSrc * $escala);

    // Posición centrada sobre el canvas
    $offsetX = (int) round(($wDst - $wScaled) / 2);
    $offsetY = (int) round(($hDst - $hScaled) / 2);

    // Canvas de destino con fondo negro
    $dst   = imagecreatetruecolor($wDst, $hDst);
    $negro = imagecolorallocate($dst, 0, 0, 0);
    imagefill($dst, 0, 0, $negro);

    // Dibujar la imagen escalada centrada
    imagecopyresampled($dst, $src, $offsetX, $offsetY, 0, 0, $wScaled, $hScaled, $wSrc, $hSrc);

    // Guardar siempre como JPEG calidad 90
    imagejpeg($dst, $ruta, 90);

    imagedestroy($src);
    imagedestroy($dst);
}
