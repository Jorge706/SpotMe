<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Forzar que use las variables del .env en lugar de las sobrescritas
        if (app()->environment('local')) {
            $envPath = base_path('.env');
            if (file_exists($envPath)) {
                $envVars = [];
                $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                
                foreach ($lines as $line) {
                    if (strpos(trim($line), '#') === 0) continue; // Skip comments
                    if (strpos($line, '=') === false) continue; // Skip invalid lines
                    
                    [$key, $value] = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value, '"\''); // Remove quotes
                    
                    if (strpos($key, 'MAIL_') === 0) {
                        $envVars[$key] = $value;
                    }
                }
                
                // Apply mail config from .env
                if (isset($envVars['MAIL_HOST'])) {
                    config([
                        'mail.mailers.smtp.host' => $envVars['MAIL_HOST'],
                        'mail.mailers.smtp.port' => $envVars['MAIL_PORT'] ?? 587,
                        'mail.mailers.smtp.encryption' => $envVars['MAIL_ENCRYPTION'] ?? 'tls',
                        'mail.mailers.smtp.username' => $envVars['MAIL_USERNAME'] ?? null,
                        'mail.mailers.smtp.password' => $envVars['MAIL_PASSWORD'] ?? null,
                    ]);
                }
            }
        }
    }
}
