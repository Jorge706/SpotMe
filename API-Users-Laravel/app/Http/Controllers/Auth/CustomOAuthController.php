<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\TwoFactorController;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CustomOAuthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Initiate OAuth flow - Step 1: Login with credentials
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiateAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'client_type' => 'required|in:web,desktop,mobile',
            'redirect_uri' => 'required|string' // Cambiado de 'url' a 'string' para permitir custom schemes
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, 'Datos de entrada inválidos', $validator->errors()->toArray());
        }

        // Buscar usuario por email
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->response(401, false, 'Credenciales incorrectas');
        }

        // Generar y enviar código 2FA con información del cliente
        $twoFactorController = new TwoFactorController();
        
        // Crear request fake con información adicional para el 2FA
        $twoFactorRequest = Request::create('', 'POST', [
            'client_type' => $request->client_type,
            'redirect_uri' => $request->redirect_uri
        ]);
        
        $twoFactorRequest->setUserResolver(function() use ($user) {
            return $user;
        });

        // Delegar al TwoFactorController
        $response = $twoFactorController->sendCode($twoFactorRequest);
        $responseData = json_decode($response->getContent(), true);

        // Si el envío fue exitoso, modificar la respuesta para incluir información del flujo OAuth
        if ($responseData['status'] === true) {
            return $this->response(200, true, 'Código de verificación enviado', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'client_type' => $request->client_type,
                'next_step' => 'verify_code',
                'expires_in' => 600 // 10 minutos
            ]);
        }

        return $response;
    }

    /**
     * Complete OAuth flow - Step 2: Verify 2FA code and get access token
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function completeAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,user_id',
            'code' => 'required|string|size:6',
            'client_type' => 'required|in:web,desktop,mobile'
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, 'Datos de entrada inválidos', $validator->errors()->toArray());
        }

        // Delegar al TwoFactorController para verificar el código
        $twoFactorController = new TwoFactorController();
        $response = $twoFactorController->verifyCode($request);
        $responseData = json_decode($response->getContent(), true);

        // Si la verificación fue exitosa, verificar si el usuario necesita completar su registro
        if ($responseData['status'] === true) {
            $user = \App\Models\User::find($request->user_id);
            
            // Verificar si el usuario necesita completar su registro
            if (!$user->is_complete) {
                return $this->response(200, true, 'Usuario requiere completar registro', [
                    'requires_completion' => true,
                    'access_token' => $responseData['data']['access_token'],
                    'token_type' => 'Bearer',
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'next_step' => 'complete_registration',
                    'completion_endpoint' => url('/api/complete/user/register'),
                    'client_type' => $request->client_type,
                    'message' => 'El usuario debe cambiar su contraseña antes de continuar'
                ]);
            }
            
            return $this->response(200, true, 'Autenticación exitosa', [
                'access_token' => $responseData['data']['access_token'],
                'token_type' => 'Bearer',
                'expires_in' => 3600,
                'user' => $responseData['data']['user'],
                'client_type' => $request->client_type,
                'requires_completion' => false
            ]);
        }

        return $response;
    }

    /**
     * Get OAuth client configuration
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getClientConfig(Request $request)
    {
        $clientType = $request->query('client_type', 'web');
        
        $config = [
            'auth_endpoint' => url('/api/oauth/auth'),
            'token_endpoint' => url('/api/oauth/token'),
            'supported_client_types' => ['web', 'desktop', 'mobile'],
            'token_expires_in' => 3600,
            'code_expires_in' => 600
        ];

        switch ($clientType) {
            case 'web':
                $config['default_redirect_uri'] = url('https://spotme.jafetguzman.me/login/verificacion');
                break;
            case 'desktop':
                $config['default_redirect_uri'] = url('https://spotme.jafetguzman.me/login/verificacion');
                break;
            case 'mobile':
                $config['default_redirect_uri'] = url('https://spotme.jafetguzman.me/login/verificacion');
                break;
        }

        return $this->response(200, true, 'Configuración del cliente OAuth', $config);
    }

    /**
     * Logout user and revoke JWT token
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Invalidar el token JWT actual
        auth()->logout();

        return $this->response(200, true, 'Sesión cerrada exitosamente', [
            'message' => 'El token JWT ha sido invalidado',
            'logged_out_at' => now()->toISOString()
        ]);
    }
}
