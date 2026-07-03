<?php

namespace App\Helpers;

class ErrorCodeHelper
{
    /**
     * Obtiene el mensaje de error por código
     * 
     * @param string $code
     * @return string
     */
    public static function getMessage(string $code): string
    {
        $errorCodes = config('error_codes');
        
        if (isset($errorCodes[$code])) {
            return $errorCodes[$code];
        }
        
        return 'Error desconocido.';
    }
}
