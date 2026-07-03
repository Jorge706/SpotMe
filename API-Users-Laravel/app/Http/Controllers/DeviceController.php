<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Vehicle;
use App\Traits\ApiResponseTrait;
use App\Helpers\ErrorCodeHelper;
use App\Http\Requests\DeviceRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class DeviceController extends Controller
{
    use ApiResponseTrait;

    /**
     * Display a listing of all devices
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Parámetros opcionales para filtrado y paginación
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $vehicleId = $request->input('vehicle_id');
        $isActive = $request->input('is_active');

        $query = Device::with(['vehicle']);

        // Filtrar por vehículo específico
        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }

        // Filtrar por estado activo
        if ($isActive !== null) {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        } else {
            // Por defecto, solo mostrar dispositivos activos
            $query->where('is_active', true);
        }

        // Búsqueda por número de serie
        if ($search) {
            $query->where('serial_number', 'LIKE', "%{$search}%");
        }

        $devices = $query->paginate($perPage);

        // Formatear la respuesta
        $deviceData = $devices->items();
        $formattedDevices = array_map(function($device) {
            return $this->formatDeviceResponse($device);
        }, $deviceData);

        return $this->response(200, true, 'Dispositivos obtenidos', $formattedDevices, [
            'current_page' => $devices->currentPage(),
            'per_page' => $devices->perPage(),
            'total_pages' => $devices->lastPage(),
            'total_devices' => $devices->total(),
        ]);
    }

    /**
     * Store a newly created device
     * 
     * @param DeviceRequest $request
     * @return JsonResponse
     */
    public function store(DeviceRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // Verificar reCAPTCHA
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse;
        }

        // Verificar que el vehículo esté activo
        $vehicle = Vehicle::find($validatedData['vehicle_id']);
        if (!$vehicle || !$vehicle->is_active) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

        // Verificar que el vehículo no tenga ya un dispositivo activo
        $existingDevice = Device::where('vehicle_id', $validatedData['vehicle_id'])
                                ->where('is_active', true)
                                ->first();
        if ($existingDevice) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

        // Verificar que el número de serie no esté en uso por otro dispositivo activo
        $existingSerial = Device::where('serial_number', $validatedData['serial_number'])
                               ->where('is_active', true)
                               ->first();
        if ($existingSerial) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

        // Crear el dispositivo
        $device = Device::create([
            'vehicle_id' => $validatedData['vehicle_id'],
            'serial_number' => $validatedData['serial_number'],
            'is_active' => $validatedData['is_active'] ?? true,
            'created_at' => now(),
        ]);

        return $this->response(201, true, 'Dispositivo creado exitosamente', 
            $this->formatDeviceResponse($device->load('vehicle'))
        );
    }

    /**
     * Display the specified device
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $device = Device::with(['vehicle', 'latestCommunication'])->find((int) $id);

        if (!$device) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        return $this->response(200, true, 'Dispositivo obtenido', 
            [$this->formatDeviceResponse($device, true)]
        );
    }

    /**
     * Update the specified device
     * 
     * @param DeviceRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(DeviceRequest $request, string $id): JsonResponse
    {
        $device = Device::find((int) $id);

        if (!$device) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        $validatedData = $request->validated();

        // Verificar reCAPTCHA
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse;
        }

        // Si se está cambiando el vehículo, verificar que esté activo
        if (isset($validatedData['vehicle_id']) && $validatedData['vehicle_id'] !== $device->vehicle_id) {
            $vehicle = Vehicle::find($validatedData['vehicle_id']);
            if (!$vehicle || !$vehicle->is_active) {
                return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
            }

            // Verificar que el nuevo vehículo no tenga ya un dispositivo activo
            $existingDevice = Device::where('vehicle_id', $validatedData['vehicle_id'])
                                    ->where('is_active', true)
                                    ->where('device_id', '!=', $device->device_id)
                                    ->first();
            if ($existingDevice) {
                return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
            }
        }

        // Si se está cambiando el número de serie, verificar que no esté en uso
        if (isset($validatedData['serial_number']) && $validatedData['serial_number'] !== $device->serial_number) {
            $existingSerial = Device::where('serial_number', $validatedData['serial_number'])
                                   ->where('is_active', true)
                                   ->where('device_id', '!=', $device->device_id)
                                   ->first();
            if ($existingSerial) {
                return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
            }
        }

        // Actualizar el dispositivo
        $device->update([
            'vehicle_id' => $validatedData['vehicle_id'] ?? $device->vehicle_id,
            'serial_number' => $validatedData['serial_number'] ?? $device->serial_number,
            'is_active' => $validatedData['is_active'] ?? $device->is_active,
            'updated_at' => now(),
        ]);

        return $this->response(200, true, 'Dispositivo actualizado exitosamente', 
            $this->formatDeviceResponse($device->fresh()->load('vehicle'))
        );
    }

    /**
     * Remove the specified device (soft delete)
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $device = Device::find((int) $id);

        if (!$device) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        // Verificar si el dispositivo tiene trips activos
        // NOTA: La tabla trips no tiene columna end_date, se comenta la validación
        // $activeTrips = $device->trips()->whereNull('end_date')->count();
        // if ($activeTrips > 0) {
        //     return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        // }

        // Soft delete - marcar como inactivo y establecer deleted_at
        $device->update([
            'is_active' => false,
            'deleted_at' => now(),
            'updated_at' => now(),
        ]);

        // Formatear la respuesta según la documentación
        $deviceData = [
            'device_id' => $device->device_id,
            'serial_number' => $device->serial_number,
            'is_active' => $device->is_active,
            'deleted_at' => $device->deleted_at->format('c'),
        ];

        return $this->response(200, true, 'Dispositivo eliminado correctamente', [$deviceData]);
    }

    /**
     * Format device response
     * 
     * @param Device $device
     * @param bool $detailed
     * @return array
     */
    private function formatDeviceResponse(Device $device, bool $detailed = false): array
    {
        $formatted = [
            'device_id' => $device->device_id,
            'vehicle_id' => $device->vehicle_id,
            'serial_number' => $device->serial_number,
            'is_active' => $device->is_active,
            'created_at' => $device->created_at ? $device->created_at->format('c') : null,
            'updated_at' => $device->updated_at ? $device->updated_at->format('c') : null,
        ];

        // Agregar información del vehículo si está disponible
        if ($device->vehicle) {
            $formatted['vehicle'] = [
                'vehicle_id' => $device->vehicle->vehicle_id,
                'vehicle_name' => $device->vehicle->vehicle_name,
                'vin' => $device->vehicle->vin,
                'mark' => $device->vehicle->mark,
                'model' => $device->vehicle->model,
                'year' => $device->vehicle->year,
            ];
        }

        // Si es vista detallada, agregar información adicional
        if ($detailed) {
            // Agregar última comunicación si existe
            if ($device->latestCommunication) {
                $formatted['last_communication'] = [
                    'date_time' => $device->latestCommunication->date_time->format('c'),
                    'latitude' => $device->latestCommunication->latitude,
                    'longitude' => $device->latestCommunication->longitude,
                ];
            } else {
                $formatted['last_communication'] = null;
            }

            // Agregar fecha de eliminación si existe
            if ($device->deleted_at) {
                $formatted['deleted_at'] = $device->deleted_at->format('c');
            }
        }

        return $formatted;
    }

    /**
     * Validate reCAPTCHA response
     * 
     * @param string $recaptchaResponse
     * @return JsonResponse|null
     */
    private function validateRecaptcha(string $recaptchaResponse): ?JsonResponse
    {
        $captchaResponse = Http::withOptions(['verify' => env('RECAPTCHA_VERIFY_SSL', true)])
            ->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $recaptchaResponse,
            ]);

        $responseBody = json_decode($captchaResponse->getBody());

        if (!$responseBody->success) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('EA0009'));
        }

        return null;
    }
}
