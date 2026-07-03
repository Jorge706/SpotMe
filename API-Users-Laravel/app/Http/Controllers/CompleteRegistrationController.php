<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use App\Helpers\ErrorCodeHelper;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class CompleteRegistrationController extends Controller
{
    use ApiResponseTrait;
    /**
     * Complete user registration by setting their first password
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function completeUserRegistration(Request $request): JsonResponse
    {
        // Validar los datos de entrada
        $validationResponse = $this->validateRequestData($request);
        if ($validationResponse) {
            return $validationResponse;
        }
        
        // Validar reCAPTCHA
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse;
        }
        
        // Obtener y validar el usuario autenticado
        $userResponse = $this->getAuthenticatedUser();
        if ($userResponse instanceof JsonResponse) {
            return $userResponse;
        }
        $user = $userResponse;
        
        // Verificar que el usuario necesita completar su registro
        $completionResponse = $this->ensureUserNeedsCompletion($user);
        if ($completionResponse) {
            return $completionResponse;
        }
        
        // Actualizar la contraseña y completar el registro
        $this->updateUserPassword($user, $request->input('new_password'));
        
        return $this->response(201, true, 'Contraseña actualizada y registro completado exitosamente');
    }

    /**
     * Validate the request data
     * 
     * @param Request $request
     * @return JsonResponse|null
     */
    private function validateRequestData(Request $request): ?JsonResponse
    {
        try {
            $request->validate([
                'new_password' => [
                    'required',
                    'string',
                    'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,18}$/'
                ],
                'confirm_password' => 'required|same:new_password',
                'g-recaptcha-response' => 'required|string'
            ], [
                'new_password.regex' => 'La contraseña debe tener por lo menos una letra mayúscula, un carácter especial, un número y debe tener una longitud de entre 12 y 18 caracteres.',
                'confirm_password.same' => 'Las contraseñas no coinciden.'
            ]);
            
            return null; // No hay errores
        } catch (ValidationException $e) {
            return $this->response(422, false, ErrorCodeHelper::getMessage('ES0003'), [
                'errors' => $e->errors()
            ]);
        }
    }

    /**
     * Validate reCAPTCHA response
     * 
     * @param string $recaptchaResponse
     * @return JsonResponse|null
     */
    private function validateRecaptcha(string $recaptchaResponse): ?JsonResponse
    {
        $captchaResponse = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => config('services.recaptcha.secret'),
            'response' => $recaptchaResponse,
        ]);

        if (!$captchaResponse->json('success')) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('EA0009'));
        }
        
        return null; // No hay errores
    }

    /**
     * Get the authenticated user
     * 
     * @return \App\Models\User|JsonResponse
     */
    private function getAuthenticatedUser()
    {
        $user = auth()->user();

        if (!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage('EA0005'));
        }

        return $user;
    }

    /**
     * Ensure the user needs to complete their registration
     * 
     * @param \App\Models\User $user
     * @return JsonResponse|null
     */
    private function ensureUserNeedsCompletion($user): ?JsonResponse
    {
        if ($user->is_complete) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ECD009'));
        }
        
        return null; // No hay errores
    }

    /**
     * Update user password and mark registration as complete
     * 
     * @param \App\Models\User $user
     * @param string $newPassword
     */
    private function updateUserPassword($user, string $newPassword): void
    {
        $user->password = Hash::make($newPassword);
        $user->is_complete = true;
        $user->save();
    }
}
