<?php

namespace App\Http\Controllers;

use App\Helpers\ErrorCodeHelper;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;


class UserController extends Controller
{
    public function store(Request $request)
    {
        

        $validator = Validator::make($request->all(), [
            'role_id' => ['required', 'integer', 'min:1', 'exists:roles,role_id'],
            'name' => ['regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/'],
            'last_name' => ['required', 'regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/'],
            'username' => [ 'required', 'regex:/^[A-Za-z0-9_]{1,20}$/', 'unique:users,username,NULL,user_id,is_active,1' ],
            'email' => [ 'required', 'regex:/^[\w\.-]+@[\w\.-]+\.\w{2,}$/', 'unique:users,email,NULL,user_id,is_active,1' ],
            'nss' => [ 'required', 'regex:/^\d{11}$/', 'unique:users,nss,NULL,user_id,is_active,1' ],
            'phone' => ['required', 'regex:/^\d{10}$/'],
            'password' => ['required', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,18}$/', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
            'is_complete' => ['required', 'boolean'],
            'g-recaptcha-response' => ['required', 'string']
        ]);

        $response = Http::withOptions(['verify' => env('RECAPTCHA_VERIFY_SSL', true)])
            ->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $request->input('g-recaptcha-response'),
            ]);

        $responseBody = json_decode($response->getBody());

        if (!$responseBody->success) {
            return $this->response(
                400,
                false,
                ErrorCodeHelper::getMessage('ES0004'),
                ['message' => '']
            );
        }

        $existingUser = User::where(function($query) use ($request) {
            $query->where('email', $request->input('email'))
                  ->orWhere('username', $request->input('username'))
                  ->orWhere('nss', $request->input('nss'));
        })->where('is_active', false)->first();


        // Si existe un usuario inactivo, reactivarlo en lugar de crear uno nuevo
        if ($existingUser) {
            $existingUser->update([
                'role_id' => $request->input('role_id'),
                'name' => $request->input('name'),
                'last_name' => $request->input('last_name'),
                'username' => $request->input('username'),
                'email' => $request->input('email'),
                'nss' => $request->input('nss'),
                'phone' => $request->input('phone'),
                'password' => Hash::make($request->input('password')),
                'is_complete' => $request->input('is_complete'),
                'is_active' => true,
                'deleted_at' => null,
                'updated_at' => now()
            ]);

            return $this->response(
                200,
                true,
                'Usuario reactivado correctamente.',
                ['user' => $existingUser->fresh()]
            );
        }

        if ($validator->fails()) {
                return $this->response(
                    422,
                    false,
                    ErrorCodeHelper::getMessage('ES0003'),
                    ['errors' => $validator->errors(), 'request' => $request->all()]       
                );
            }

        $validatedData = $validator->validated();

        $user = User::create([
            'role_id' => $validatedData['role_id'],
            'name' => $validatedData['name'],
            'last_name' => $validatedData['last_name'],
            'username' => $validatedData['username'],
            'email' => $validatedData['email'],
            'nss' => $validatedData['nss'],
            'phone' => $validatedData['phone'],
            'password' => Hash::make($validatedData['password']),
            'is_complete' => $validatedData['is_complete'],
            'is_active' => true
        ]);

        return $this->response(
            201,
            true,
            'Usuario creado correctamente.',
            ['user' => $user]
        );
    }
    
    public function index(Request $request)
    {
        $page = User::with('role')
            ->where('is_active', operator: true)
            ->paginate($request->input('per_page', 10), ['*'], 'page', $request->input('page', 1));

        $users = collect($page->items())->map(function ($user) {
            $array = $user->toArray();
            unset($array['is_active'], $array['role']);
            $array['role_name'] = $user->role ? $user->role->role_name : null;
            return $array;
        })->all();

        if (empty($users)) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('EGD006'));
        }

        $pagination = [
            'current_page'   => (int) $page->currentPage(),
            'per_page'       => (int) $page->perPage(),
            'total_pages'    => (int) $page->lastPage(),
            'total_users'    => (int) $page->total(),
        ];

        return $this->response(200, true, 'Usuarios obtenidos', $users, $pagination);
    }
    public function show($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => ['required', 'integer', 'exists:users,user_id'],
        ]);
        
        if ($validator->fails()) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0002'));
        }
        $user = User::find($id);

        return $this->response(200, true, 'Usuario obtenido', [$user]);
    }

    public function update(Request $request, $id)
    {

        $validator = Validator::make(
            array_merge($request->all(), ['id' => $id]),
            [
                'id' => ['required', 'integer', 'exists:users,user_id'],
                'name' => ['regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/'],
                'last_name' => ['required', 'regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/'],
                'username' => [ 'required', 'regex:/^[A-Za-z0-9_]{1,20}$/', "unique:users,username,{$id},user_id" ],
                'email' => [ 'required', 'regex:/^[\w\.-]+@[\w\.-]+\.\w{2,}$/', "unique:users,email,{$id},user_id" ],
                'nss' => [ 'required', 'regex:/^\d{11}$/', "unique:users,nss,{$id},user_id" ],
                'phone' => ['required', 'regex:/^\d{10}$/'],
                'role_id' => ['required', 'integer', 'min:1', 'exists:roles,role_id'],
                'g-recaptcha-response' => ['required', 'string']
            ]
        );

        $user = User::find($id);

         $response = Http::withOptions(['verify' => env('RECAPTCHA_VERIFY_SSL', false)])
        ->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => env('RECAPTCHA_SECRET_KEY'),
            'response' => $request->input('g-recaptcha-response'),
        ]);

        $responseBody = json_decode($response->getBody());

        if (!$responseBody->success) {
            return $this->response(
                400,
                false,
                ErrorCodeHelper::getMessage('ES0004'),
            );
        }

        if ($validator->fails()) {
            return $this->response(
                422,
                false,
                ErrorCodeHelper::getMessage('ES0003'),
                ['error'=> $validator->errors()]
            );
        }

        $user->name = $request->input('name');
        $user->last_name = $request->input('last_name');
        $user->username = $request->input('username');
        $user->nss = $request->input('nss');
        $user->phone = $request->input('phone');
        $user->role_id = $request->input('role_id');
        $user->email = $request->input('email');
        $user->save();

        return $this->response(200, true, 'Usuario actualizado correctamente', [$user]);
    }

    public function destroy(Request $request, $id)
    {
        $validator = Validator::make(
            array_merge($request->all(), ['id' => $id]),
            [
                'id' => ['required', 'integer', 'exists:users,user_id'],
                'g-recaptcha-response' => ['required', 'string']
            ]
        );

        $response = Http::withOptions(['verify' => env('RECAPTCHA_VERIFY_SSL', true)])
        ->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => env('RECAPTCHA_SECRET_KEY'),
            'response' => $request->input('g-recaptcha-response'),
        ]);

        $responseBody = json_decode($response->getBody());

        if (!$responseBody->success) {
            return $this->response(
                400,
                false,
                ErrorCodeHelper::getMessage('ES0004'),
            );
        }

        if ($validator->fails()) {
            return $this->response(422, false, ErrorCodeHelper::getMessage('ES0003'));
        }

        $user = User::find($id);
        $user->deleted_at = now(); 
        $user->is_active = false; 
        $user->save();
        $result = $user->makeVisible(['created_at', 'deleted_at'])->toArray();


        return $this->response(200, true, 'Usuario eliminado correctamente', [$result]);
    }
    
}
