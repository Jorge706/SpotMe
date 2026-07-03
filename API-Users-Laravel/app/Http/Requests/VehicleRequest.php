<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Helpers\ErrorCodeHelper;
use App\Traits\ApiResponseTrait;

class VehicleRequest extends FormRequest
{
    use ApiResponseTrait;

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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $vehicleId = $this->route('id');
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'vehicle_name' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'vin' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'size:17', // VIN siempre tiene 17 caracteres
                'regex:/^[A-HJ-NPR-Z0-9]{17}$/', // VIN válido (sin I, O, Q)
                $isUpdate ? "unique:vehicles,vin,{$vehicleId},vehicle_id" : 'unique:vehicles,vin'
            ],
            'mark' => $isUpdate ? 'sometimes|required|string|max:100' : 'required|string|max:100',
            'model' => $isUpdate ? 'sometimes|required|string|max:100' : 'required|string|max:100',
            'year' => [
                $isUpdate ? 'sometimes' : 'required',
                'integer',
                'min:1900',
                'max:' . (date('Y') + 1) // Año actual + 1
            ],
            'is_active' => 'sometimes|boolean',
            'g-recaptcha-response' => $isUpdate ? 'sometimes|required|string' : 'required|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_name.required' => 'El nombre del vehículo es obligatorio',
            'vehicle_name.string' => 'El nombre del vehículo debe ser una cadena de texto',
            'vehicle_name.max' => 'El nombre del vehículo no puede exceder 255 caracteres',
            'vin.required' => 'El VIN es obligatorio',
            'vin.string' => 'El VIN debe ser una cadena de texto',
            'vin.size' => 'El VIN debe tener exactamente 17 caracteres',
            'vin.regex' => 'El VIN tiene un formato inválido',
            'vin.unique' => 'Este VIN ya está registrado',
            'mark.required' => 'La marca es obligatoria',
            'mark.string' => 'La marca debe ser una cadena de texto',
            'mark.max' => 'La marca no puede exceder 100 caracteres',
            'model.required' => 'El modelo es obligatorio',
            'model.string' => 'El modelo debe ser una cadena de texto',
            'model.max' => 'El modelo no puede exceder 100 caracteres',
            'year.required' => 'El año es obligatorio',
            'year.integer' => 'El año debe ser un número entero',
            'year.min' => 'El año debe ser mayor a 1900',
            'year.max' => 'El año no puede ser mayor al año siguiente al actual',
            'is_active.boolean' => 'El estado activo debe ser verdadero o falso',
            'captcha.required' => 'El captcha es obligatorio',
            'captcha.string' => 'El captcha debe ser una cadena de texto',
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param Validator $validator
     * @return void
     *
     * @throws HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        $response = $this->response(
            422,
            false,
            ErrorCodeHelper::getMessage('ES0003'),
            ['errors' => $validator->errors()],
            []
        );

        throw new HttpResponseException($response);
    }
}
