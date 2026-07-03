# Dockerfile para SpotMe Users API (Laravel)
FROM php:8.2-fpm-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    mysql-client \
    openssl

# Limpiar cache de Alpine
RUN rm -rf /var/cache/apk/*

# Instalar extensiones PHP
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Obtener composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar directorio de trabajo
WORKDIR /var/www/html

# Copiar archivos de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p /var/www/html/bootstrap/cache && \
    mkdir -p /var/www/html/storage/logs && \
    mkdir -p /var/www/html/storage/framework/cache && \
    mkdir -p /var/www/html/storage/framework/sessions && \
    mkdir -p /var/www/html/storage/framework/views

# Instalar dependencias de Composer
RUN composer install --optimize-autoloader --no-dev

# Configurar permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Copiar configuración de supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copiar script de entrada
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Exponer puerto 50350
EXPOSE 50350

# Comando de inicio
CMD ["/start.sh"]
