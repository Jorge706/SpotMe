<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Trip;
use Carbon\Carbon;
use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Helpers\ErrorCodeHelper;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Events\TripCreated;
use Illuminate\Support\Facades\Log;
use App\Models\LastDeviceCommunication;
use App\Models\Geofence;
use App\Models\Alarm;
use App\Models\ExceptionLog;

class TripsController extends Controller
{
    public function insertTrips(Request $request)
    {
        // Validar campos de entrada:
        $validatedData = Validator::make($request->all(), [
            'device_serial' => ['required','regex:/^[A-Za-z0-9\-]{1,30}$/'],
            'latitude' => ['required','regex:/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/'],
            'longitude' => ['required','regex:/^-?(1[0-7]\d(\.\d+)?|0?\d{1,2}(\.\d+)?|180(\.0+)?)$/'],
            'date_time' => ['required','date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'], //Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }
        
        $validatedData = $validatedData->validated(); // Se debe obtener la información validada, porque $validatedData es un Array.

        // Buscar el device_id en base al serial.
        $deviceId = Device::where('serial_number', $validatedData['device_serial'])->first();

        // Validar que el dispositivo no este vacio.
        if(!$deviceId){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Buscar el user_id en base al ultimó cambio de conductor.
        $user = DB::table('driverchanges AS dc')
        ->join('devices AS d', 'dc.vehicle_id', '=', 'd.vehicle_id')
        ->where('d.serial_number', $validatedData['device_serial'])
        ->where('dc.date_time', '<=', now())
        ->orderByDesc('dc.date_time')
        ->first();

        if(!$user){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }
        
        // Guardar registros en la base de datos.
        // Instanciar Modelo de Trip.
        $trip = new Trip();

        if(!$trip){
            return $this->response(500, false, ErrorCodeHelper::getMessage("ES0001"));
        }

        // Asignar valor a los campos de la base de datos
        $trip->device_id = $deviceId->device_id;
        $trip->latitude = $validatedData['latitude'];
        $trip->longitude = $validatedData['longitude'];
        $trip->date_time = $validatedData['date_time'];
        $trip->user_id = $user->user_id;
        $trip->created_at = now();

        // Guardar Trip.
        $trip->save();

        // Emitir evento por broadcast
        $trip->load('device');
        event(new TripCreated($trip));

        // Verificación de Geocercas.
        // Aquí se puede agregar la lógica para verificar si el viaje está dentro de una geocerca.
        $geofences = Geofence::where('device_id', $deviceId->device_id)
            ->where('is_active', true)
            ->get();

        // Setear coordenadas del viaje para validar en las geocercas.
        $currentLat = (double) $validatedData['latitude'];
        $currentLon = (double) $validatedData['longitude'];
        $isInside = false;

        $matchedGeofence = null; // Para almacenar la geocerca que coincide. || Dato nuevo

        // Verificar si el viaje está dentro de alguna geocerca.
        foreach ($geofences as $geofence) {
            $distance = $this->haversineDistance(
                $currentLat,
                $currentLon,
                $geofence->latitude,
                $geofence->longitude
            );

            Log::info("Distancia a la geocerca {$geofence->geofence_id}: {$distance} metros");

            $tolerance = 3.0; // metros de tolerancia

            if ($distance <= ($geofence->radius + $tolerance)) {
                $isInside = true;
                $matchedGeofence = $geofence;
                break;
            }
        }

        $lastComm = LastDeviceCommunication::where('device_id', $deviceId->device_id)->first();

        $wasInside = $lastComm ? (bool) $lastComm->was_inside_geofence : null;

        // Si no existe, lo instanciamos pero NO evaluamos cambios aún.
        if (!$lastComm) {
            $lastComm = new LastDeviceCommunication([
                'device_id' => $deviceId->device_id
            ]);
        }

        // if ($wasInside !== $isInside) {
        if ($wasInside !== null && $wasInside !== $isInside) {
            $alarmCode = $isInside ? 'AC002' : 'AC003'; // AC002: Entrada a geocerca, AC003: Salida de geocerca.
            $alarm = Alarm::where('alarm_code', $alarmCode)->first();

            Log::info("Estado: " . ($isInside ? 'Dentro' : 'Fuera') . " de la geocerca");

            if ($alarm) {
                ExceptionLog::create([
                    'device_id' => $deviceId->device_id,
                    'alarm_id' => $alarm->alarm_id,
                    'geofence_id' => $isInside
                        ? ($matchedGeofence->geofence_id ?? null) // Datos nuevos
                        : ($lastComm->geofence_id ?? null),
                    'latitude' => $currentLat,
                    'longitude' => $currentLon,
                    'date_time' => $validatedData['date_time'],
                    'user_id' => $user->user_id,
                    'created_at' => now(),
                ]);
            }
        }
        
        Log::info("Estado: " . ($isInside ? 'Dentro' : 'Fuera') . " de la geocerca");
        $lastComm->latitude = $currentLat;
        $lastComm->longitude = $currentLon;
        $lastComm->date_time = $validatedData['date_time'];
        $lastComm->is_device_communicating = true;
        $lastComm->was_inside_geofence = $isInside; // Actualizar si estaba dentro de la geocerca.
        $lastComm->geofence_id = $matchedGeofence->geofence_id ?? null; // Dato nuevo
        $lastComm->save(); // Guardar cambios en LastDeviceCommunication.

        // Retornar respuesta.
        return $this->response(201, true, "Viaje insertado correctamente");
    }

    public function getTripsByDeviceAtDay(Request $request)
    {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(),[
            'device_serial' => ['required','regex:/^[A-Za-z0-9\-]{1,30}$/'],
        ]);

        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        $validatedData = $validatedData->validated(); // Se debe obtener la información validada, porque $validatedData es un Array.

        // Buscar el device_id en base al serial.
        $deviceId = Device::where('serial_number', $validatedData['device_serial'])->first();

        // Validar que el dispositivo no este vacio.
        if(is_null($deviceId)) {
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Obtener la fecha de hoy
        $today = Carbon::now();
        //$offsetDay = $today->subDay(); // Aqui se indica los dias a restar, si no se pasa nada, por defecto es 1

        // Obtener paginado.
        $per_page = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Consultar los viajes del dispositivo del dia actual.
        $trips = Trip::where('device_id', $deviceId->device_id)
        ->whereDate('date_time', $today)
        ->with(['device.vehicle', 'user'])
        ->paginate($per_page, ['*'], 'page', $page);

        if($trips->isEmpty()){
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Formatear respuesta para obtener la información del vehículo.
        $tripsFormatted = $trips->map(function ($trip){
            return [
                'trip_id' => $trip->trip_id,
                'device_id' => $trip->device_id,
                'serial_number' => $trip->device->serial_number ?? null,
                'latitude' => $trip->latitude,
                'longitude' => $trip->longitude,
                'date_time' => $trip->date_time->format('Y-m-d H:i:s'),
                'user_id' => $trip->user_id,
                'driver_name' => $trip->user->name,
                'driver_last_name' => $trip->user->last_name,
                'vehicle_id' => $trip->device->vehicle->vehicle_id,
                'vehicle_name' => $trip->device->vehicle->vehicle_name,
                'created_at' => $trip->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return $this->response( 200, true, "Datos Obtenidos:", [$tripsFormatted], [
                "current_page" => $trips->currentPage(),
                "per_page" => $trips->perPage(),
                "total_pages" => $trips->lastPage(),
                "total_trips" => $trips->total(),
            ]
        );
    }

    // Función para obtener los viajes en un periodo de fechas determinado.
    public function getTripsByDateRanges(Request $request)
    {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(),[
            'start_date' => ['required','date_format:Y-m-d H:i:s','regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'],
            'end_date' => ['required', 'date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'] // Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        $validatedData = $validatedData->validated(); // Se debe obtener la información validada, porque $validatedData es un Array.

        // Obtener fechas.
        $startDate = $validatedData['start_date'];
        $endDate = $validatedData['end_date'];

        // Obtener paginado.
        $per_page = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Obtener información de Trips en base al periodo de fechas.
        $trips = Trip::whereBetween('date_time', [$startDate, $endDate])
        ->with(['device.vehicle', 'user']) // Relaciones de tablas para hacer consultas.
        ->paginate($per_page, ['*'], 'page', $page);

        if($trips->isEmpty()){
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Formatear respuesta para obtener la información del vehículo.
        $tripsFormatted = $trips->map(function ($trip){
            return [
                'trip_id' => $trip->trip_id,
                'device_id' => $trip->device_id,
                'serial_number' => $trip->device->serial_number ?? null,
                'latitude' => $trip->latitude,
                'longitude' => $trip->longitude,
                'date_time' => $trip->date_time->format('Y-m-d H:i:s'),
                'user_id' => $trip->user_id,
                'driver_name' => $trip->user->name,
                'driver_last_name' => $trip->user->last_name,
                'vehicle_id' => $trip->device->vehicle->vehicle_id,
                'vehicle_name' => $trip->device->vehicle->vehicle_name,
                'created_at' => $trip->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return $this->response(200, true, "Datos Obtenidos:", [$tripsFormatted], [
                "current_page" => $trips->currentPage(),
                "per_page" => $trips->perPage(),
                "total_pages" => $trips->lastPage(),
                "total_trips" => $trips->total(),
            ]
        );
    }

    // Función para obtener los viajes del dispositivo en un periodo de fechas determinado.
    public function getTripsByDeviceAndDateRanges(Request $request)
    {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(),[
            'device_serial' => ['required','regex:/^[A-Za-z0-9\-]{1,30}$/'],
            'start_date' => ['required','date_format:Y-m-d H:i:s','regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'],
            'end_date' => ['required','date_format:Y-m-d H:i:s','regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/']
        ]);

        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        $validatedData = $validatedData->validated(); // Se debe obtener la información validada, porque $validatedData es un Array.

        // Obtener fechas y dispositivo.
        $startDate = $validatedData['start_date'];
        $endDate = $validatedData['end_date'];

        // Buscar el device_id en base al serial.
        $deviceId = Device::where('serial_number', $validatedData['device_serial'])->first();

        // Validar que el dispositivo no este vacio.
        if(is_null($deviceId)) {
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Obtener paginado
        $per_page = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Obtener los viajes.
        $trips = Trip::where('device_id', $deviceId->device_id)
        ->whereBetween('date_time', [$startDate, $endDate])
        ->with(['device.vehicle', 'user'])
        ->paginate($per_page, ['*'], 'page', $page);

        if($trips->isEmpty()){
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Formatear respuesta para obtener la información del vehículo.
        $tripsFormatted = $trips->map(function ($trip){
            return [
                'trip_id' => $trip->trip_id,
                'device_id' => $trip->device_id,
                'serial_number' => $trip->device->serial_number ?? null,
                'latitude' => $trip->latitude,
                'longitude' => $trip->longitude,
                'date_time' => $trip->date_time->format('Y-m-d H:i:s'),
                'user_id' => $trip->user_id,
                'driver_name' => $trip->user->name,
                'driver_last_name' => $trip->user->last_name,
                'vehicle_id' => $trip->device->vehicle->vehicle_id,
                'vehicle_name' => $trip->device->vehicle->vehicle_name,
                'created_at' => $trip->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return $this->response(200, true, "Datos Obtenidos:", [$tripsFormatted], [
            "current_page" => $trips->currentPage(),
                "per_page" => $trips->perPage(),
                "total_pages" => $trips->lastPage(),
                "total_trips" => $trips->total(),
            ]
        );
    }

    /**
     * Calcula la distancia entre dos coordenadas (en metros)
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // metros
        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        $a = sin($deltaLat / 2) ** 2 +
            cos($lat1Rad) * cos($lat2Rad) *
            sin($deltaLon / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}