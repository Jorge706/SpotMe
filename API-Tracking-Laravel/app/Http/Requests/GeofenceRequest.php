<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GeofenceRequest extends FormRequest
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
            "device_id" => ["required", "integer", "min:1", "regex:/^[1-9][0-9]*$/"],
            "name" => ["required","string", "max:255", "regex:/^[a-zA-Z0-9\s]+$/"],
            "latitude" => ["required", "numeric", "regex:/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/"],
            "longitude" => ["required", "numeric", "regex:/^-?(1[0-7]\d(\.\d+)?|0?\d{1,2}(\.\d+)?|180(\.0+)?)$/"],
            "radius" => ["required", "numeric", "min:1"],
            "is_active" => ["boolean"],
            "g-recaptcha-response" => ["required", "string"],
        ];

        // Para actualizaciones, hacer campos opcionales excepto cuando se requieren especificamente.
        if($this->isMethod('PATCH') || $this->isMethod('PUT')) {
            $rules['device_id'][0] = 'sometimes';
            $rules['name'][0] = 'sometimes';
            $rules['latitude'][0] = 'sometimes';
            $rules['longitude'][0] = 'sometimes';
            $rules['radius'][0] = 'sometimes';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'device_id.required' => 'El campo device_id es obligatorio.',
            'device_id.integer' => 'El campo device_id debe ser un número entero.',
            'device_id.min' => 'El campo device_id debe ser mayor que 0.',
            'device_id.exists' => 'El dispositivo especificado no existe.',
            'name.required' => 'El campo nombre es obligatorio.',
            'name.regex' => 'El nombre solo puede contener letras, números y espacios.',
            'latitude.required' => 'El campo latitud es obligatorio.',
            'latitude.regex' => 'La latitud debe estar entre -90 y 90 grados.',
            'longitude.required' => 'El campo longitud es obligatorio.',
            'longitude.regex' => 'La longitud debe estar entre -180 y 180 grados.',
            'radius.required' => 'El campo radio es obligatorio.',
            'radius.min' => 'El radio debe ser al menos 1.',
            'is_active.boolean' => 'El campo activo debe ser verdadero o falso.',
            'g-recaptcha-response.required' => 'El campo reCAPTCHA es obligatorio.',
        ];
    }
}
