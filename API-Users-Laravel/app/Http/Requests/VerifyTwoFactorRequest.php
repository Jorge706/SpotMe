<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyTwoFactorRequest extends FormRequest
{
    public function authorize()
    {
        // Sin middleware
        return true;
    }

    public function rules()
    {
        return [
            'code' => ['required', 'regex:/^\d{1,6}$/'],
            'current_password' => ['required', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,18}$/'],
        ];
    }

    public function messages()
    {
        return [
            'code.required' => 'El código de verificación es obligatorio.',
            'code.regex' => 'El código debe contener entre 1 y 6 dígitos numéricos.',
            'current_password.required' => 'La contraseña actual es obligatoria.',
            'current_password.regex' => 'La contraseña debe contener al menos una mayúscula, un número, un caracter especial y tener entre 12 y 18 caracteres.',
        ];
    }
}
