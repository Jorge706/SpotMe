<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\Role;
use App\Helpers\ErrorCodeHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RolesController extends Controller
{
    public function getAllRoles(Request $request) {
        /**
         * Código para Auth del usuario.
         */
        // $user = JWTAuth::parseToken()->authenticate();

        // if(!$user) {
        //     return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        // }

        // Obtener paginado de información.
        $per_page = $request->input("per_page", 10);
        $page = $request->input("page",1);

        // Obtener información de Roles.
        $rolesData = Role::all()->paginate($per_page, ['*'], 'page', $page);

        // Validar que la consulta se realizo con exitó.
        if(is_null($rolesData)) {
            return $this->response(200, true, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear datos de roles.
        $rolesFormatted = $rolesData->map(function ($role) {
            return [
                'role_id' => $role->role_id,
                'role_name' => $role->rol_name,
                'created_at' => $role->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return $this->response(200, true, "Roles obtenidos",[$rolesFormatted] ,[
            "current_page" => $rolesData->current_page(),
            "per_page" => $rolesData->per_page(),
            "total_pages" => $rolesData->lastPage(),
            "total" => $rolesData->total(),
        ]);
    }

    public function getRole($id) {
        /**
         * Código para Auth del usuario.
         */
        // $user = JWTAuth::parseToken()->authenticate();

        // // Validar que el usuario cuente con una sesión activa.
        // if(!$user) {
        //     return $this->response(401, false, ErrorCodeHelper::getMessage("EA0005"));
        // }

        // Validar parámetros de entrada.
        $validdatedData = Validator::make(['id' => $id], ['id' => ['required', 'integer', 'exists:roles,role_id']]);
        if ($validdatedData->fails()) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0002'));
        }

        // Obtener información de Roles.
        $rolesData = Role::find($id);

        // Validar que la consulta se realizo con exitó.
        if(is_null($rolesData)) {
            return $this->response(200, true, ErrorCodeHelper::getMessage('EGD007'));
        }

        // Formatear datos de roles.
        $rolesFormatted = $rolesData->map(function ($role) {
            return [
                'role_id' => $role->role_id,
                'role_name' => $role->rol_name,
                'created_at' => $role->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return $this->response(200, true, "Rol obtenido",[$rolesFormatted] ,[]);
    }
}
