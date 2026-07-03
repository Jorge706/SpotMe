<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorCodeMail;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Helpers\ErrorCodeHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class PasswordController extends Controller
{
    use ApiResponseTrait;

    /**
     * Handle password reset - Single endpoint for both request and reset
     * 
     * Step 1: Send only email to request code
     * Step 2: Send email + code + new password to reset
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        // Determinar si es solicitud de código o reset de contraseña
        $isCodeRequest = !$request->has('reset_code');

        if ($isCodeRequest) {
            // PASO 1: Solicitar código de restablecimiento
            return $this->handleCodeRequest($request);
        } else {
            // PASO 2: Resetear contraseña con código
            return $this->handlePasswordReset($request);
        }
    }

    /**
     * Handle code request (Step 1)
     */
    private function handleCodeRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'g-recaptcha-response' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('ES0004'));
        }

        // Validar reCAPTCHA
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse;
        }

        // Buscar el usuario por email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->response(404, false, message: ErrorCodeHelper::getMessage('EA0007'));
        }

        // Verificar que el usuario esté activo
        if ($user->is_active !== 1) {
            return $this->response(403, false, message: ErrorCodeHelper::getMessage('EA0006'));
        }

        // Generar código de restablecimiento (6 dígitos)
        $resetCode = rand(100000, 999999);

        // Guardar el código en el usuario (reutilizando los campos de verificación 2FA)
        $user->verification_code = Hash::make($resetCode);
        $user->verification_code_expiration_date = now()->addMinutes(10);
        $user->save();

        // Enviar código por email
        try {
            Mail::to($user->email)->send(new TwoFactorCodeMail(
                $resetCode,
                $user,
                'web',
                ''
            ));
        } catch (\Exception $e) {
            return $this->response(500, false, message: ErrorCodeHelper::getMessage('ES0001'));
        }

        return $this->response(200, true, 'Código de restablecimiento enviado a tu email', [
            'email' => $user->email,
            'next_step' => 'Envía el mismo email con el código recibido y la nueva contraseña',
            'code_expires_at' => now()->addMinutes(10)->toISOString(),
            'max_attempts' => 3
        ]);
    }

    /**
     * Handle password reset with code (Step 2)
     */
    private function handlePasswordReset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'reset_code' => 'required|string|min:6|max:6',
            'new_password' => [
                'required',
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$!%*?&])[A-Za-z\d@\$!%*?&]{12,18}$/'
            ],
            'confirm_password' => 'required|same:new_password',
            'g-recaptcha-response' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('ES0004'));
        }

        // Validar reCAPTCHA
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse;
        }

        // Buscar el usuario por email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->response(404, false, message: ErrorCodeHelper::getMessage('EA0007'));
        }

        // Verificar que el usuario esté activo
        if ($user->is_active !== 1) {
            return $this->response(403, false, message: ErrorCodeHelper::getMessage('EA0006'));
        }

        // Verificar que el código no haya expirado (10 minutos)
        if (!$user->verification_code_expiration_date || now()->gt($user->verification_code_expiration_date)) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('EA0008'));
        }

        // Verificar el código de restablecimiento
        if (!$user->verification_code || !Hash::check($request->reset_code, $user->verification_code)) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('EA0002'));
        }

        // Verificar que la nueva contraseña no sea igual a la actual
        if (Hash::check($request->new_password, $user->password)) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('EA0003'));
        }

        // Actualizar la contraseña
        $user->password = Hash::make($request->new_password);
        
        // Limpiar el código de restablecimiento
        $user->verification_code = null;
        $user->verification_code_expiration_date = null;
        $user->save();

        return $this->response(200, true, 'Contraseña restablecida exitosamente', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'reset_at' => now()->toISOString()
        ]);
    }

    /**
     * Change user password (requires current password)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => [
                'required',
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$!%*?&])[A-Za-z\d@\$!%*?&]{12,18}$/'
            ],
            'confirm_password' => 'required|same:new_password',
            'g-recaptcha-response' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('ES0004'));
        }

        // Validar reCAPTCHA
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse;
        }

        // Obtener el usuario autenticado
        $user = Auth::user();
        if (!$user) {
            return $this->response(401, false, message: ErrorCodeHelper::getMessage('EA0005'));
        }

        // Verificar la contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('EA0001'));
        }

        // Verificar que la nueva contraseña no sea igual a la actual
        if (Hash::check($request->new_password, $user->password)) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('EA0003'));
        }

        // Actualizar la contraseña
        $user->password = Hash::make($request->new_password);
        $user->save();

        return $this->response(200, true, 'Contraseña actualizada exitosamente', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'updated_at' => now()->toISOString()
        ]);
    }

    /**
     * Valida el reCAPTCHA con Google
     */
    private function validateRecaptcha(string $recaptchaResponse): ?\Illuminate\Http\JsonResponse
    {
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => config('services.recaptcha.secret'),
            'response' => $recaptchaResponse,
        ]);

        $result = $response->json();

        if (!$result['success']) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('EA0009'));
        }

        return null;
    }
}
