#!/bin/bash
set -e

# Instalar dependencias de Composer al arrancar el contenedor.
# Necesario porque ./backend se monta como volumen y sobreescribe lo generado en build.
if [ -f /var/www/html/backend/composer.json ]; then
    cd /var/www/html/backend
    composer install --no-interaction --prefer-dist --optimize-autoloader --quiet
fi

exec "$@"
