<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'vehicle_id' => ['required', 'integer', 'min:1', 'exists:vehicles,vehicle_id'],
            'serial_number' => ['required', 'string', 'regex:/^[A-Za-z0-9\-]{1,30}$/', 'max:30'],
            'is_active' => ['boolean'],
            'g-recaptcha-response' => ['required', 'string'],
        ];

        // Para actualizaciones, hacer campos opcionales excepto cuando se requieran específicamente
        if ($this->isMethod('PATCH') || $this->isMethod('PUT')) {
            $rules['vehicle_id'][0] = 'sometimes';
            $rules['serial_number'][0] = 'sometimes';
            // reCAPTCHA sigue siendo requerido en actualizaciones
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_id.required' => 'El ID del vehículo es requerido.',
            'vehicle_id.integer' => 'El ID del vehículo debe ser un número entero.',
            'vehicle_id.min' => 'El ID del vehículo debe ser mayor a 0.',
            'vehicle_id.exists' => 'El vehículo especificado no existe.',
            'serial_number.required' => 'El número de serie es requerido.',
            'serial_number.regex' => 'El número de serie solo puede contener letras, números y guiones, máximo 30 caracteres.',
            'serial_number.max' => 'El número de serie no puede tener más de 30 caracteres.',
            'is_active.boolean' => 'El estado activo debe ser verdadero o falso.',
            'g-recaptcha-response.required' => 'La verificación reCAPTCHA es requerida.',
            'g-recaptcha-response.string' => 'La respuesta reCAPTCHA debe ser una cadena de texto.',
        ];
    }
}
