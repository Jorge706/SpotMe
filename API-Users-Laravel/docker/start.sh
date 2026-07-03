#!/bin/sh

# Script de inicio para SpotMe Users API

# Crear directorios de logs si no existen
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx
mkdir -p /var/www/html/storage/logs

# Crear cache de Laravel si no existe
mkdir -p /var/www/html/bootstrap/cache

# Configurar permisos
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html/storage
chmod -R 755 /var/www/html/bootstrap/cache

# Generar clave de aplicación si no existe
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Ejecutar migraciones (opcional, comentar si no se desea)
# php artisan migrate --force

# Limpiar cache de Laravel
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimizar para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Iniciar supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
