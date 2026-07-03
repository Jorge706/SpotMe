<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Helpers\ErrorCodeHelper;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    use ApiResponseTrait;
    /**
     * Register a new user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function registerUser(Request $request): JsonResponse
    {

        $validator = Validator::make($request->all(), [
            'role_id' => ['required', 'integer', 'min:1', 'exists:roles,role_id'],
            'name' => ['regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/'],
            'last_name' => ['required', 'regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/'],
            'username' => ['required', 'regex:/^[A-Za-z0-9_]{1,20}$/', 'unique:users'],
            'email' => ['required', 'regex:/^[\w\.-]+@[\w\.-]+\.\w{2,}$/', 'unique:users'],
            'nss' => ['required', 'regex:/^\d{11}$/'],
            'phone' => ['required', 'regex:/^\d{10}$/'],
            'password' => ['required', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,18}$/', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
            'is_complete' => ['required', 'boolean'],
            'g-recaptcha-response' => ['required', 'string']
        ]);

        // Verificación de reCAPTCHA
        $response = Http::withOptions(['verify' => env('RECAPTCHA_VERIFY_SSL', true)])
            ->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $request->input('g-recaptcha-response'),
            ]);

        $responseBody = json_decode($response->getBody());

        if (!$responseBody->success) {
            return $this->response(
                400,
                false,
                ErrorCodeHelper::getMessage('ES0004'),
                ['message' => '']
            );
        }

        if ($validator->fails()) {
                return $this->response(
                    422,
                    false,
                    ErrorCodeHelper::getMessage('ES0003'),
                    ['errors' => $validator->errors(), 'request' => $request->all()]       
                );
            }

        $validatedData = $validator->validated();

        $user = User::create([
            'role_id' => $validatedData['role_id'],
            'name' => $validatedData['name'],
            'last_name' => $validatedData['last_name'],
            'username' => $validatedData['username'],
            'email' => $validatedData['email'],
            'nss' => $validatedData['nss'],
            'phone' => $validatedData['phone'],
            'password' => Hash::make($validatedData['password']),
            'is_complete' => $validatedData['is_complete'],
            'is_active' => true
        ]);

        return $this->response(
            201,
            true,
            'Usuario creado correctamente.',
            ['user' => $user]
        );
    }
}
