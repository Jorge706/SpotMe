<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorCodeMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class TwoFactorController extends Controller
{
    /**
     * Envía un código de verificación 2FA al correo del usuario.
     * Este código se encripta y dura 10 minutos.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendCode(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'code'    => 404,
                'status'  => false,
                'message' => 'EGD008 - No se encontró un usuario válido.',
                'data'    => [],
                'meta'    => [],
            ], 404);
        }

        $code = rand(100000, 999999);
        $user->verification_code                = Hash::make($code);
        $user->verification_code_expiration_date = Carbon::now()->addMinutes(10);
        $user->save();

        // Obtener información del cliente desde el request
        $clientType = $request->input('client_type', 'web');
        $redirectUri = $request->input('redirect_uri', '');

        try {
            // Pasar información del cliente al email
            Mail::to($user->email)->send(new TwoFactorCodeMail($code, $user, $clientType, $redirectUri));

            return response()->json([
                'code'    => 200,
                'status'  => true,
                'message' => 'El código se envió al correo satisfactoriamente.',
                'data'    => [],
                'meta'    => [],
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Error sending 2FA email: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => $user->user_id ?? null,
                'email' => $user->email ?? null,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'code'    => 500,
                'status'  => false,
                'message' => 'ES0001 - Error interno, no se pudo completar la solicitud.',
                'data'    => ['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], // More detailed debugging
                'meta'    => [],
            ], 500);
        }
    }

    /**
     * Verifica el código 2FA ingresado por el usuario durante el login.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyCode(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => ['required', 'regex:/^[1-9][0-9]*$/'],
                'code'    => ['required', 'regex:/^\d{6}$/'],
            ]);

            $user = User::find($validated['user_id']);

            if (
                ! $user ||
                ! $user->verification_code ||
                ! $user->verification_code_expiration_date
            ) {
                return $this->errorResponse(404, 'EA0007 - Recurso no encontrado');
            }

            if (Carbon::now()->gt($user->verification_code_expiration_date)) {
                return $this->errorResponse(400, 'ES0004 - No se pudo procesar la petición');
            }

            if (! Hash::check($validated['code'], $user->verification_code)) {
                return $this->errorResponse(400, 'EA0002 - El código de verificación no es correcto');
            }

            // Limpiar el código y expiración
            $user->verification_code                = null;
            $user->verification_code_expiration_date = null;
            $user->save();

            // Generar token de acceso
            $token = auth('api')->login($user);

            return response()->json([
                'code'    => 200,
                'status'  => true,
                'message' => 'Inicio de sesión exitoso',
                'data'    => [
                    'access_token' => $token,
                    'token_type'   => 'Bearer',
                    'expires_in'   => 3600,
                    'user'         => [
                        'user_id'   => $user->user_id,
                        'name'      => $user->name,
                        'last_name' => $user->last_name,
                        'username'  => $user->username,
                        'email'     => $user->email,
                        'is_active' => $user->is_active,
                        'is_complete' => $user->is_complete,
                        'role_id'   => $user->role_id,
                        'nss'       => $user->nss,
                        'phone'     => $user->phone,
                    ],
                ],
                'meta' => [],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse(422, 'ES0003 - Solicitud entendida, pero no pudo ser procesada por errores semánticos en los datos enviados');
        } catch (\Throwable $e) {
            return $this->errorResponse(500, 'ES0001 - Error interno, no se pudo completar la solicitud');
        }
    }

    /**
     * Método de utilidad para respuestas de error.
     *
     * @param  int     $code
     * @param  string  $message
     * @return \Illuminate\Http\JsonResponse
     */
    private function errorResponse(int $code, string $message)
    {
        return response()->json([
            'code'    => $code,
            'status'  => false,
            'message' => $message,
            'data'    => [],
            'meta'    => [],
        ], $code);
    }
}
