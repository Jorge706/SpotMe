<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\DriverChange;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Helpers\ErrorCodeHelper;
use Tymon\JWTAuth\Facades\JWTAuth;

class DriverChangesController extends Controller
{
    public function insertDriverChanges(Request $request){
        // Validar campos de entrada:
        $validatedData = Validator::make($request->all(),[
            'user_id' => ['required', 'regex:/^[1-9][0-9]*$/'],
            'vehicle_name' => ['required','regex:/^[A-Za-z0-9\s]{1,30}$/'],
            'date_time' => ['required','date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'], //Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage("ES0003"));
        }

        // Obtener información de los eventos.
        $validatedData = $validatedData->validated();

        // Obtener el id del vehículo.
        $vehicleId = Vehicle::where('vehicle_name', $validatedData['vehicle_name'])->first();

        // Validar que se pudo obtener información del vehículo.
        if(!$vehicleId){
            return $this->response(404, false, "No se encontró el vehículo especificado");
        }

        // Guardar los eventos de DriverChanges.
        $driverChange = new DriverChange();

        // Validar que se pudo instanciar el modelo.
        if(!$driverChange){
            return $this->response(500, false, ErrorCodeHelper::getMessage("ES0001"));
        }

        // Asignar información a los campos de la base de datos.
        $driverChange->user_id = $validatedData['user_id'];
        $driverChange->vehicle_id = $vehicleId->vehicle_id;
        $driverChange->date_time = $validatedData["date_time"];
        $driverChange->created_at = now();

        // Guardar excepción.
        $driverChange->save();

        // Retornar respuesta.
        return response()->json([
            "code" => 201,
            "status" => true,
            "message" => "Cambios de conductor insertados correctamente",
            "data" => [],
            "meta" => []
        ]);
    }

    public function getDriverChangesByVehicleAtDay(Request $request){
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'vehicle_name' => ['required','regex:/^[A-Za-z0-9\s]{1,30}$/'],
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage('ES0003'));
        }

        // Obtener la información que ha sido validada.
        $validatedData = $validatedData->validated();

        // Buscar el vehicle_id del vehículo.
        $vehicleId = Vehicle::where('vehicle_name', $validatedData['vehicle_name'])->first();

        // Validar que la consulta del vehículo no este vacia.
        if(is_null($vehicleId)){
            return $this->response(200, true, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Obtener la fecha de hoy.
        $today = Carbon::now();

        // Obtener paginado.
        $per_page = $request->input('per_page', 10);
        $page = $request->input('page',1);

        // Consultar DriverChanges.
        $driverChanges = DriverChange::where('vehicle_id', $vehicleId->vehicle_id)
        ->whereDate('date_time', $today)
        ->with(['user', 'vehicle'])
        ->paginate($per_page, ['*'], 'page', $page);

        // Validar que se pudo consultar la información.
        if($driverChanges->isEmpty()){
            return $this->response(200, false, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear DriverChanges.
        $driverChangesFormatted = $driverChanges->map(function ($data) {
            return [
                'driver_change_id' => $data->driver_change_id,
                'user_id' => $data->user->user_id,
                'user_name' => $data->user->name,
                'user_last_name' => $data->user->last_name,
                'vehicle_id' => $data->vehicle_id,
                'vehicle_name' => $data->vehicle->vehicle_name,
                'date_time' => $data->date_time->format('Y-m-d H:i:s'),
                'created_at' => $data->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Formatear DriverChanges.
        return $this->response(200, true, "Cambios de conductor obtenidos", [$driverChangesFormatted], [
            "current_page" => $driverChanges->currentPage(),
            "per_page" => $driverChanges->perPage(),
            "total_pages" => $driverChanges->lastPage(),
            "total" => $driverChanges->total(),
        ]);
    }

    public function getDriverChangesByDateRanges(Request $request) {
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

        $driverChanges = DriverChange::whereBetween('date_time', [$startDate, $endDate])
        ->with(['user', 'vehicle'])
        ->paginate($perPage, ['*'], 'page', $page);

        // Validar que se pudo consultar la información.
        if($driverChanges->isEmpty()){
            return $this->response(200, false, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear DriverChanges.
        $driverChangesFormatted = $driverChanges->map(function ($data) {
            return [
                'driver_change_id' => $data->driver_change_id,
                'user_id' => $data->user->user_id,
                'user_name' => $data->user->name,
                'user_last_name' => $data->user->last_name,
                'vehicle_id' => $data->vehicle_id,
                'vehicle_name' => $data->vehicle->vehicle_name,
                'date_time' => $data->date_time->format('Y-m-d H:i:s'),
                'created_at' => $data->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Formatear DriverChanges.
        return $this->response(200, true, "Cambios de conductor obtenidos", [$driverChangesFormatted], [
            "current_page" => $driverChanges->currentPage(),
            "per_page" => $driverChanges->perPage(),
            "total_pages" => $driverChanges->lastPage(),
            "total" => $driverChanges->total(),
        ]);
    }

    public function getDriverChangesByVehicleAndDateRanges(Request $request) {
        /**
         * Codigo del Auth del usuario
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user) {
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Validar parámetros de entrada.
        $validatedData = Validator::make($request->all(), [
            'vehicle_name' => ['required','regex:/^[A-Za-z0-9\s]{1,30}$/'],
            'start_date' => ['required','date_format:Y-m-d H:i:s','regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'],
            'end_date' => ['required', 'date_format:Y-m-d H:i:s', 'regex:/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/'] // Formato YYYY-MM-DD HH:M:SS | Y-m-d H:i:s
        ]);

        // Excepción en caso de que los datos no sean correctos o no esten bien formateados.
        if($validatedData->fails()){
            return $this->response(422, false, ErrorCodeHelper::getMessage('ES0003'));
        }

        // Obtener la información que ha sido validada.
        $validatedData = $validatedData->validated();

        // Buscar el vehicle_id del vehículo.
        $vehicleId = Vehicle::where('vehicle_name', $validatedData['vehicle_name'])->first();

        // Validar que la consulta del vehículo no este vacia.
        if(is_null($vehicleId)){
            return $this->response(200, true, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Obtener rango de fechas.
        $startDate = $validatedData['start_date'];
        $endDate = $validatedData['end_date'];

        // Obtener paginado.
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        $driverChanges = DriverChange::where('vehicle_id', $vehicleId->vehicle_id)
        ->whereBetween('date_time', [$startDate, $endDate])
        ->with(['user', 'vehicle'])
        ->paginate($perPage, ['*'],'page', $page);

        // Validar que se pudo consultar la información.
        if($driverChanges->isEmpty()){
            return $this->response(200, false, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear DriverChanges.
        $driverChangesFormatted = $driverChanges->map(function ($data) {
            return [
                'driver_change_id' => $data->driver_change_id,
                'user_id' => $data->user->user_id,
                'user_name' => $data->user->name,
                'user_last_name' => $data->user->last_name,
                'vehicle_id' => $data->vehicle_id,
                'vehicle_name' => $data->vehicle->vehicle_name,
                'date_time' => $data->date_time->format('Y-m-d H:i:s'),
                'created_at' => $data->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Formatear DriverChanges.
        return $this->response(200, true, "Cambios de conductor obtenidos", [$driverChangesFormatted], [
            "current_page" => $driverChanges->currentPage(),
            "per_page" => $driverChanges->perPage(),
            "total_pages" => $driverChanges->lastPage(),
            "total" => $driverChanges->total(),
        ]);
    }
}
