<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeofenceRequest;
use App\Models\Device;
use Illuminate\Http\Request;
use App\Models\Geofence;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\DB;
use App\Helpers\ErrorCodeHelper;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;


class GeofencesController extends Controller
{
    public function index(Request $request) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Obtener parámetros de entrada.
        $per_page = $request->input('per_page', 10);
        $page = $request->input('page', 1);
        $search = $request->input('search');
        $device_id = $request->input('device_id', null);
        $is_active = $request->input('is_active', null);

        // Consultar Geocercas
        $query = Geofence::with(['device']);

        // Si se proporciona un ID de dispositivo, filtrar por él.
        if ($device_id) {
            $query->where('device_id', $device_id);
        }

        // Si se proporciona un estado de actividad, filtrar por él.
        if ($is_active !== null) {
            $query->where('is_active', $is_active);
        }

        // Si se proporciona un término de búsqueda, filtrar por nombre o descripción.
        if ($search) {
            $query->where('name', 'LIKE', "%{$search}%");
        }

        // Ordenar y paginar los resultados.
        $geofences = $query->orderBy('created_at', 'desc')->paginate($per_page, ['*'], 'page', $page);

        // Mapeo personalizado para incluir el ID del dispositivo.
        $mapped = $geofences->getCollection()->map(function ($geofence) {
            return [
                'geofence_id' => $geofence->geofence_id,
                'device_id' => $geofence->device_id,
                'serial_number' => $geofence->device->serial_number ?? null,
                'name' => $geofence->name,
                'latitude' => $geofence->latitude,
                'longitude' => $geofence->longitude,
                'radius' => $geofence->radius,
                'is_active' => $geofence->is_active,
                'created_at' => $geofence->created_at->toIso8601String(),
            ];
        });

        // Si no se encuentran geocercas, retornar un error.
        if ($mapped->isEmpty()) {
            return $this->response(404, false, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Agregar la colección mapeada al objeto de paginación.
        $geofences->setCollection($mapped);

        // Retornar la respuesta con los datos de las geocercas.
        return $this->response(200, true, 'Geocercas obtenidas correctamente.', [$mapped], [
            'current_page' => $geofences->currentPage(),
            'per_page' => $geofences->perPage(),
            'last_page' => $geofences->lastPage(),
            'total' => $geofences->total(),
        ]);
    }

    public function store(Request $request) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }
        
        // Validar parametros de entrada.
        $validatedData = Validator::make($request->all(), [
            'device_id' => ['required', 'integer', 'min:1', 'regex:/^[1-9][0-9]*$/'],
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\s]+$/'],
            'latitude' => ['required', 'numeric', 'regex:/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/'],
            'longitude' => ['required', 'numeric', 'regex:/^-?(1[0-7]\d(\.\d+)?|0?\d{1,2}(\.\d+)?|180(\.0+)?)$/'],
            'radius' => ['required', 'numeric', 'min:1'],
            'is_active' => ['boolean'],
            'g-recaptcha-response' => ['required', 'string'],
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        $validatedData = $validatedData->validate();

        // Validar reCAPTCHA.
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse; // Retornar error si la validación falla.
        }

        // Verificar que el dispositivo este activo.
        $device = Device::find($validatedData['device_id']);
        if (!$device || !$device->is_active) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

        // Crear una nueva geocerca.
        $geofence = Geofence::create([
            'device_id' => $validatedData['device_id'],
            'name' => $validatedData['name'],
            'latitude' => $validatedData['latitude'],
            'longitude' => $validatedData['longitude'],
            'radius' => $validatedData['radius'],
            'is_active' => $validatedData['is_active'] ?? true, // Por defecto, se activa la geocerca.
        ]);

        // Si la creación falla, retornar un error.
        if (!$geofence) {
            return $this->response(500, false, ErrorCodeHelper::getMessage("ES0004"));
        }

        // Retornar una respuesta exitosa con los datos de la geocerca creada.
        return $this->response(201, true, 'Geocerca creada correctamente.', [$geofence->load('device')]);
    }

    public function show($id) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar el ID de la geocerca.
        if (!is_numeric($id) || $id <= 0) {
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Consultar la geocerca por ID.
        $geofence = Geofence::with('device')->find($id);

        // Si no se encuentra la geocerca, retornar un error.
        if (!$geofence) {
            return $this->response(404, false, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Retornar una respuesta exitosa con los datos de la geocerca.
        return $this->response(200, true, 'Geocerca obtenida correctamente.', [$geofence], []);
    }

    public function update(Request $request, $id) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'device_id' => ['sometimes', 'integer', 'min:1', 'regex:/^[1-9][0-9]*$/'],
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\s]+$/'],
            'latitude' => ['sometimes', 'numeric', 'regex:/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/'],
            'longitude' => ['sometimes', 'numeric', 'regex:/^-?(1[0-7]\d(\.\d+)?|0?\d{1,2}(\.\d+)?|180(\.0+)?)$/'],
            'radius' => ['sometimes', 'numeric', 'min:1'],
            'is_active' => ['boolean'],
            'g-recaptcha-response' => ['required', 'string'],
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        $validatedData = $validatedData->validated();

        // Obtener la información de la geocerca a actualizar.
        $geofence = Geofence::find($id);

        // Si no se encuentra la geocerca, retornar un error.
        if (!$geofence) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        // Validar reCAPTCHA.
        $recaptchaResponse = $this->validateRecaptcha($request->input('g-recaptcha-response'));
        if ($recaptchaResponse) {
            return $recaptchaResponse; // Retornar error si la validación falla.
        }

        // Actualizar los campos de la geocerca.
        $geofence->update([
            'device_id' => $request->input('device_id', $geofence->device_id),
            'name' => $request->input('name', $geofence->name),
            'latitude' => $request->input('latitude', $geofence->latitude),
            'longitude' => $request->input('longitude', $geofence->longitude),
            'radius' => $request->input('radius', $geofence->radius),
            'is_active' => $request->input('is_active', $geofence->is_active),
        ]);

        // Retornar una respuesta exitosa con los datos de la geocerca actualizada.
        return $this->response(200, true, 'Geocerca actualizada correctamente.', 
        [$geofence->fresh()->load('device')]);
    }

    public function destroy($id) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }
        
        // Buscar la geocerca por ID.
        $geofence = Geofence::find($id);

        // Si no se encuentra la geocerca, retornar un error.
        if (!$geofence) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        // Soft delete la geocerca.
        $geofence->delete();

        // Formatear la respuesta.
        $geofencedata = [
            'device_id' => $geofence->device_id,
            'name' => $geofence->name,
            'latitude' => $geofence->latitude,
            'longitude' => $geofence->longitude,
            'radius' => $geofence->radius,
            'is_active' => false,
            'deleted_at' => $geofence->deleted_at->format('c'),
        ];

        // Retornar una respuesta exitosa con los datos de la geocerca eliminada.
        return $this->response(200, true, 'Geocerca eliminada correctamente.', [$geofencedata]);
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


