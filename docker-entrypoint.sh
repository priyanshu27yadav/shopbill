#!/bin/sh
set -e

# Generate application key if missing
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Link storage
php artisan storage:link --force 2>/dev/null || true

# Wait for database and run migrations
echo "Running database migrations..."
php artisan migrate --force --isolated 2>/dev/null || php artisan migrate --force || true

if [ "$SEED_DATABASE" = "true" ]; then
    echo "Seeding default data (admin@shopbill.com, shopkeeper@shopbill.com, sample catalogue)..."
    php artisan db:seed --force 2>/dev/null || true
fi

# Cache routes and configs for production speed
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

exec "$@"
