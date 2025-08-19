<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TwoFactorCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $code;
    public $user;
    public $clientType;
    public $redirectUri;

    /**
     * Create a new message instance.
     *
     * @param string $code
     * @param mixed $user
     * @param string $clientType
     * @param string $redirectUri
     */
    public function __construct($code, $user = null, $clientType = 'web', $redirectUri = '')
    {
        $this->code = $code;
        $this->user = $user;
        $this->clientType = $clientType;
        $this->redirectUri = $redirectUri;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        // Mapear tipos de cliente a nombres legibles
        $clientNames = [
            'web' => 'Aplicación Web',
            'desktop' => 'Aplicación de Escritorio',
            'mobile' => 'Aplicación Móvil'
        ];

        // Generar URL de verificación si existe redirect_uri
        $verificationUrl = null;
        if ($this->redirectUri) {
            $verificationUrl = $this->redirectUri . '?code=' . $this->code;
        }

        return $this->subject('Tu código de verificación - SpotMe')
                    ->view('emails.two_factor_code')
                    ->with([
                        'code' => $this->code,
                        'user' => $this->user,
                        'clientType' => $this->clientType,
                        'clientName' => $clientNames[$this->clientType] ?? 'Aplicación',
                        'redirectUri' => $this->redirectUri,
                        'verificationUrl' => $verificationUrl,
                    ]);
    }
}
