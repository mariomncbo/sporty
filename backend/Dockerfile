FROM php:8.2-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

# GD para procesado de imágenes (redimensionar, recortar)
RUN apt-get update && apt-get install -y libpng-dev libjpeg62-turbo-dev libwebp-dev && \
    docker-php-ext-configure gd --with-jpeg --with-webp && \
    docker-php-ext-install gd && \
    rm -rf /var/lib/apt/lists/*

# Dependencias para Composer
RUN apt-get update && apt-get install -y unzip git && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Permitir acceso a subcarpetas
RUN sed -i 's|/var/www/html|/var/www/html|g' /etc/apache2/sites-available/000-default.conf

# Entrypoint personalizado (ejecuta composer install al iniciar)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /var/www/html

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]