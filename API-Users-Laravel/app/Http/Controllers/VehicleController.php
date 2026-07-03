<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Traits\ApiResponseTrait;
use App\Helpers\ErrorCodeHelper;
use App\Http\Requests\VehicleRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VehicleController extends Controller
{
    use ApiResponseTrait;

    /**
     * Display a listing of all vehicles
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Parámetros opcionales para filtrado y paginación
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');

        $query = Vehicle::with(['device'])->where('is_active', true);

        // Búsqueda por nombre, marca, modelo o VIN
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('vehicle_name', 'LIKE', "%{$search}%")
                  ->orWhere('mark', 'LIKE', "%{$search}%")
                  ->orWhere('model', 'LIKE', "%{$search}%")
                  ->orWhere('vin', 'LIKE', "%{$search}%");
            });
        }

        $vehicles = $query->paginate($perPage);

        // Formatear la respuesta
        $vehicleData = $vehicles->items();
        $formattedVehicles = array_map(function($vehicle) {
            return $this->formatVehicleResponse($vehicle);
        }, $vehicleData);

        return $this->response(200, true, 'Vehículos obtenidos', $formattedVehicles, [
            'current_page' => $vehicles->currentPage(),
            'per_page' => $vehicles->perPage(),
            'total_pages' => $vehicles->lastPage(),
            'total_vehicles' => $vehicles->total(),
        ]);
    }

    /**
     * Store a newly created vehicle
     * 
     * @param VehicleRequest $request
     * @return JsonResponse
     */
    public function store(VehicleRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // Crear el vehículo
        $vehicle = Vehicle::create([
            'vehicle_name' => $validatedData['vehicle_name'],
            'vin' => $validatedData['vin'],
            'mark' => $validatedData['mark'],
            'model' => $validatedData['model'],
            'year' => $validatedData['year'],
            'is_active' => $validatedData['is_active'] ?? true,
            'created_at' => now(),
        ]);

        return $this->response(201, true, 'Vehículo creado exitosamente', 
            $this->formatVehicleResponse($vehicle)
        );
    }

    /**
     * Display the specified vehicle
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $vehicle = Vehicle::with(['device'])->find((int) $id);

        if (!$vehicle) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        return $this->response(200, true, 'Vehículo obtenido', 
            [$this->formatVehicleResponse($vehicle, true)]
        );
    }

    /**
     * Update the specified vehicle
     * 
     * @param VehicleRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(VehicleRequest $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::find((int) $id);

        if (!$vehicle) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        $validatedData = $request->validated();

        // Actualizar el vehículo
        $vehicle->update([
            'vehicle_name' => $validatedData['vehicle_name'] ?? $vehicle->vehicle_name,
            'vin' => $validatedData['vin'] ?? $vehicle->vin,
            'mark' => $validatedData['mark'] ?? $vehicle->mark,
            'model' => $validatedData['model'] ?? $vehicle->model,
            'year' => $validatedData['year'] ?? $vehicle->year,
            'is_active' => $validatedData['is_active'] ?? $vehicle->is_active,
            'updated_at' => now(),
        ]);

        return $this->response(200, true, 'Vehículo actualizado exitosamente', 
            $this->formatVehicleResponse($vehicle->fresh())
        );
    }

    /**
     * Remove the specified vehicle (soft delete)
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $vehicle = Vehicle::find((int) $id);

        if (!$vehicle) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        // Verificar si el vehículo tiene dispositivos activos
        if ($vehicle->device && $vehicle->device->is_active) {
            return $this->response(400, false, 'No se puede eliminar un vehículo con dispositivos activos', [
                'code' => 'VEHICLE_HAS_ACTIVE_DEVICE'
            ]);
        }

        // Soft delete - marcar como inactivo y establecer deleted_at
        $vehicle->update([
            'is_active' => false,
            'deleted_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->response(200, true, 'Vehículo eliminado exitosamente');
    }

    /**
     * Format vehicle response
     * 
     * @param Vehicle $vehicle
     * @param bool $detailed
     * @return array
     */
    private function formatVehicleResponse(Vehicle $vehicle, bool $detailed = false): array
    {
        $formatted = [
            'vehicle_id' => $vehicle->vehicle_id,
            'vehicle_name' => $vehicle->vehicle_name,
            'vin' => $vehicle->vin,
            'mark' => $vehicle->mark,
            'model' => $vehicle->model,
            'year' => $vehicle->year,
            'created_at' => $vehicle->created_at ? $vehicle->created_at->format('c') : null,
        ];

        // Agregar información del dispositivo si existe
        if ($vehicle->device) {
            $formatted['devices'] = [
                [
                    'serial_number' => $vehicle->device->serial_number
                ]
            ];
        } else {
            $formatted['devices'] = [];
        }

        return $formatted;
    }
}
