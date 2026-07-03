<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\ErrorCodeHelper;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Log;
use App\Models\LastDeviceCommunication;
use function PHPUnit\Framework\returnArgument;

class LastDeviceCommunicationController extends Controller
{
    public function getLastDeviceCommunication(Request $request){
        /**
         * Código Auth del usuario.
         */
        $user = JWTAuth::parseToken()->authenticate();

        if(!$user){
            return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        }

        // Obtener paginado.
        $per_page = $request->input("per_page", 10);
        $page = $request->input("page",1);

        // Obtener información de Watchdog
        $lastDeviceCommunication = LastDeviceCommunication::with(["device"])
        ->paginate($per_page, ['*'], 'page', $page);

        // Validar que no este vacío.
        if($lastDeviceCommunication->isEmpty()){
            return $this->response(200, true, ErrorCodeHelper::getMessage("EGD007"));
        }

        // Formatear respuesta
        $formatted = $lastDeviceCommunication->map(function($item){
            return [
                'device_id' => $item->device_id,
                'serial_number' => $item->device->serial_number,
                'latitude' => $item->latitude,
                'longitude' => $item->longitude,
                'date_time' => $item->date_time->format('Y-m-d H:i:s'),
                'is_device_communication' => $item->is_device_communicating,
                'created_at' => $item->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Regresar respuesta.
        return $this->response(200, true, "Watchdog Obtenido", [$formatted], [
            "current_page" => $lastDeviceCommunication->currentPage(),
            "per_page" => $lastDeviceCommunication->perPage(),
            "total_pages" => $lastDeviceCommunication->lastPage(),
            "total_devices" => $lastDeviceCommunication->total(),
        ]);
    }
}