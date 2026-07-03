<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ExceptionLog;
use App\Models\Device;
use App\Models\Alarm;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Helpers\ErrorCodeHelper;
use Tymon\JWTAuth\Facades\JWTAuth;

class ExceptionsController extends Controller
{
    public function insertExceptions(Request $request) {
        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'device_serial' => ['required','regex:/^[A-Za-z0-9\-]{1,30}$/'],
            'alarm_name' => ['required', 'regex:/^[A-Za-z0-9\s]{1,30}$/'],
            'latitude' => ['required','regex:/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/'],
            'longitude' => ['required','regex:/^-?(1[0-7]\d(\.\d+)?|0?\d{1,2}(\.\d+)?|180(\.0+)?)$/'],
            'date_time' => ['required','date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'], //Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Obtener la información de los eventos.
        $validatedData = $validatedData->validated();

        // Obtener el id del dispositivo.
        $deviceId = Device::where('serial_number', $validatedData['device_serial'])->first();

        // Obtener el alarmId en base al alarm name.
        $alarmId = Alarm::where('alarm_name', $validatedData['alarm_name'])->first();

        // Validar que se pudo obtener la información del dispositivo.
        if(!$deviceId){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Buscar el user_id en base al ultimó cambio de conductor.
        $user = DB::table('driverchanges AS dc')
        ->join('devices AS d', 'dc.vehicle_id', '=', 'd.vehicle_id')
        ->where('d.serial_number', $validatedData["device_serial"])
        ->where('dc.date_time', '<=', now())
        ->orderByDesc('dc.date_time')
        ->first();

        // Validar que se pudo obtener la información del usuario.
        if(!$user){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Guardar los registros en la base de datos. Instanciar Modelo de Excepciones.
        $exceptionEvent = new ExceptionLog();

        // Validar que se pudo instanciar el modelo.
        if(!$exceptionEvent) {
            return $this->response(500, false, ErrorCodeHelper::getMessage("ES0001"));
        }

        // Asignar valor a los campos de la base de datos.
        $exceptionEvent->device_id = $deviceId->device_id;
        $exceptionEvent->alarm_id = $alarmId->alarm_id;
        $exceptionEvent->latitude = $validatedData["latitude"];
        $exceptionEvent->longitude = $validatedData["longitude"];
        $exceptionEvent->date_time = $validatedData["date_time"];
        $exceptionEvent->user_id = $user->user_id;
        $exceptionEvent->created_at = now();

        // Guardar excepción.
        $exceptionEvent->save();

        return response()->json([
            "code" => 201,
            "status" => true,
            "message" => "Excepción insertada correctamente",
            "data" => [],
            "meta" => []
        ]);
    }

    public function getExceptionsByDeviceAtDay(Request $request) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'device_serial' => ['required','regex:/^[A-Za-z0-9\-]{1,30}$/'],
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Obtener la información que ha sido validada.
        $validatedData = $validatedData->validated();

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

        // Consultar las excepciones.
        $exceptionsLog = ExceptionLog::where('device_id', $deviceId->device_id)
        ->whereDate('date_time', $today)
        ->with(['device.vehicle', 'user', 'alarm', 'geeofence'])
        ->paginate($per_page, ['*'], 'page', $page);

        // Validar que se pudo obtener la información.
        if($exceptionsLog->isEmpty()){
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Formatear excepciones.
        $exceptionsFormatted = $exceptionsLog->map(function ($data){
            return [
                'exception_id' => $data->exception_id,
                'device_id' => $data->device_id,
                'serial_number' => $data->device->serial_number ?? null,
                'alarm_id' => $data->alarm_id,
                'alarm_name' => $data->alarm->alarm_name,
                'geofence_id' => $data->geofence_id ?? null,
                'geofence_name' => $data->geofence->name ?? "",
                'latitude' => $data->latitude,
                'longitude' => $data->longitude,
                'date_time' => $data->date_time->format('Y-m-d H:i:s'),
                'user_id' => $data->user_id,
                'user_name' => $data->user->name,
                'user_last_name' => $data->user->last_name,
                'created_at' => $data->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Formatear respuesta para obtener la información del vehículo.
        return $this->response(200, true, "Eventos de seguridad obtenidos", [$exceptionsFormatted], [
            "current_page" => $exceptionsLog->currentPage(),
            "per_page" => $exceptionsLog->perPage(),
            "total_pages" => $exceptionsLog->lastPage(),
            "total_exceptions" => $exceptionsLog->total(),
        ]);  
    }

    public function getExceptionsByDateRanges(Request $request) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'start_date' => ['required','date_format:Y-m-d H:i:s','regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'],
            'end_date' => ['required', 'date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'] // Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Obtener la información que ha sido validada.
        $validatedData = $validatedData->validated();

        // Obtener rango de fechas.
        $startDate = $validatedData['start_date'];
        $endDate = $validatedData['end_date'];

        // Obtener paginado.
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Obtener información de excepciones en base al periodo de fechas.
        $exceptionsLog = ExceptionLog::whereBetween('date_time', [$startDate, $endDate])
        ->with(['device.vehicle', 'user', 'alarm'])
        ->paginate($perPage, ['*'], 'page', $page);

        // Validar que las excepciones tenga información.
        if($exceptionsLog->isEmpty()) {
            return $this->response(200, true, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear excepciones.
        $exceptionsFormatted = $exceptionsLog->map(function ($data){
            return [
                'exception_id' => $data->exception_id,
                'device_id' => $data->device_id,
                'serial_number' => $data->device->serial_number ?? null,
                'alarm_id' => $data->alarm_id,
                'alarm_name' => $data->alarm->alarm_name,
                'geofence_id' => $data->geofence_id ?? null,
                'geofence_name' => $data->geofence->name ?? "",
                'latitude' => $data->latitude,
                'longitude' => $data->longitude,
                'date_time' => $data->date_time->format('Y-m-d H:i:s'),
                'user_id' => $data->user_id,
                'user_name' => $data->user->name,
                'user_last_name' => $data->user->last_name,
                'created_at' => $data->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Formatear respuesta para obtener la información del vehículo.
        return $this->response(200, true, "Eventos de seguridad obtenidos", [$exceptionsFormatted], [
            "current_page" => $exceptionsLog->currentPage(),
            "per_page" => $exceptionsLog->perPage(),
            "total_pages" => $exceptionsLog->lastPage(),
            "total_exceptions" => $exceptionsLog->total(),
        ]);        
    }

    public function getExceptionsByDeviceAndDateRanges(Request $request) {
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

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Obtener la información que ha sido validada.
        $validatedData = $validatedData->validated();

        // Buscar el device_id en base al serial.
        $deviceId = Device::where('serial_number', $validatedData['device_serial'])->first();

        // Validar que el dispositivo no este vacio.
        if(is_null($deviceId)) {
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Obtener rango de fechas.
        $startDate = $validatedData['start_date'];
        $endDate = $validatedData['end_date'];

        // Obtener paginado.
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Obtener información de excepciones en base al dispositivo y rango de fechas.
        $exceptionsLog = ExceptionLog::where('device_id', $deviceId->device_id)
        ->whereBetween('date_time', [$startDate, $endDate])
        ->with(['device.vehicle', 'user', 'alarm', 'geofence'])
        ->paginate($perPage, ['*'], 'page', $page);

        // Validar que exista información en la base de datos.
        if($exceptionsLog->isEmpty()){
            return $this->response(200, true, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear excepciones.
        $exceptionsFormatted = $exceptionsLog->map(function ($data){
            return [
                'exception_id' => $data->exception_id,
                'device_id' => $data->device_id,
                'serial_number' => $data->device->serial_number ?? null,
                'alarm_id' => $data->alarm_id,
                'alarm_name' => $data->alarm->alarm_name,
                'geofence_id' => $data->geofence_id ?? null,
                'geofence_name' => $data->geofence->name ?? "",
                'latitude' => $data->latitude,
                'longitude' => $data->longitude,
                'date_time' => $data->date_time->format('Y-m-d H:i:s'),
                'user_id' => $data->user_id,
                'user_name' => $data->user->name,
                'user_last_name' => $data->user->last_name,
                'created_at' => $data->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Formatear respuesta para obtener la información del vehículo.
        return $this->response(200, true, "Eventos de seguridad obtenidos", [$exceptionsFormatted], [
            "current_page" => $exceptionsLog->currentPage(),
            "per_page" => $exceptionsLog->perPage(),
            "total_pages" => $exceptionsLog->lastPage(),
            "total_exceptions" => $exceptionsLog->total(),
        ]);       

    }

    public function insertVirtualButtonException(Request $request){
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'user_id' => ['required', 'regex:/^[1-9][0-9]*$/'],
            'vehicle_name' => ['required','regex:/^[A-Za-z0-9\s]{1,30}$/'],
            'alarm_name' => ['required', 'regex:/^[A-Za-z0-9\s]{1,30}$/'],
            'latitude' => ['required','regex:/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/'],
            'longitude' => ['required','regex:/^-?(1[0-7]\d(\.\d+)?|0?\d{1,2}(\.\d+)?|180(\.0+)?)$/'],
            'date_time' => ['required','date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'], //Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Obtener la información de los eventos.
        $validatedData = $validatedData->validated();

        // Obtener inofmración del vehículo.
        $vehicle = DB::table('vehicles')->where('vehicle_name', $validatedData['vehicle_name'])->first();

        // Validar que se pudo obtener la información del vehículo.
        if(!$vehicle) {
            return $this->response(404, false, "No se encontró el vehículo especificado");
        }

        // Obtener el id del dispositivo en base al vehicle_id.
        $deviceId = Device::where('vehicle_id', $vehicle->vehicle_id)->first();

        // Validar que se pudo obtener la información del dispositivo.
        if(!$deviceId) {
            return $this->response(404, false, "No se encontró el dispositivo asociado al vehículo");
        }

        // Obtener el alarmId en base al alarm name.
        $alarmId = Alarm::where('alarm_name', $validatedData['alarm_name'])->first();

        // Insertar excepción. Instanciar Modelo de Excepciones.
        $exceptionEvent = new ExceptionLog();

        // Validar que se pudo instanciar el modelo.
        if(!$exceptionEvent) {
            return $this->response(500, false, ErrorCodeHelper::getMessage("ES0001"));
        }

        // Asignar valor a los campos de la base de datos.
        $exceptionEvent->device_id = $deviceId->device_id;
        $exceptionEvent->alarm_id = $alarmId->alarm_id;
        $exceptionEvent->latitude = $validatedData["latitude"];
        $exceptionEvent->longitude = $validatedData["longitude"];
        $exceptionEvent->date_time = $validatedData["date_time"];
        $exceptionEvent->user_id = $validatedData["user_id"];
        $exceptionEvent->created_at = now();

        // Guardar excepción.
        $exceptionEvent->save();

        return response()->json([
            "code" => 201,
            "status" => true,
            "message" => "Excepción insertada correctamente",
            "data" => [],
            "meta" => []
        ]);
    }
}
