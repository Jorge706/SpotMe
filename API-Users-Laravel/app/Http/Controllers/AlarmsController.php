<?php

namespace App\Http\Controllers;

use App\Helpers\ErrorCodeHelper;
use Illuminate\Http\Request;
use App\Models\Alarm;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class AlarmsController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->query(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, message: ErrorCodeHelper::getMessage('ES0004'));
        }

        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 10);

        $alarms = Alarm::where('is_active', true)->paginate($perPage, ['*'], 'page', $page);

        return $this->response(200, true, 'Alarmas obtenidas', $alarms->items(), [
            'current_page' => $alarms->currentPage(),
            'per_page' => $alarms->perPage(),
            'total_pages' => $alarms->lastPage(),
            'total_alarms' => $alarms->total(),
        ]);
    }

    public function show($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => 'required|min:1|integer',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

        $alarm = Alarm::find($id);

        if (!$alarm) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        return $this->response(200, true, 'Alarma obtenida', [$alarm->toArray()] );
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'alarm_name' => 'required|regex:/^[A-Za-z0-9\s]{1,30}$/',
            'description' => 'required|regex:/^.{1,50}$/',
            'alarm_code' => 'required|regex:/^[A-Za-z0-9]{1,8}$/',
            'g-recaptcha-response' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

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

        $alarm = Alarm::create($request->all());

        return $this->response(201, true, 'Alarma creada correctamente', $alarm->toArray(), []);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make(array_merge($request->all(), ['id' => $id]), [
            'id' => 'required|regex:/^[1-9][0-9]*$/',
            'alarm_name' => 'sometimes|regex:/^[A-Za-z0-9\s]{1,30}$/',
            'description' => 'sometimes|regex:/^.{1,50}$/',
            'alarm_code' => 'sometimes|regex:/^[A-Za-z0-9]{1,8}$/',
        ]);

        if ($validator->fails()) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

        $alarm = Alarm::find($id);

        if (!$alarm) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        $alarm->update($request->all());
        $alarm->updated_at = now();
        $alarm->save();
        unset($alarm->created_at);

        return $this->response(200, true, 'Alarma actualizada correctamente', $alarm->toArray(), []);
    }

    public function destroy($id, Request $request)
    {
        $validator = Validator::make(array_merge($request->all(), ['id' => $id]), [
            'id' => 'required|regex:/^[1-9][0-9]*$/',
            'g-recaptcha-response' => 'required|string',
        ]); 

        if ($validator->fails()) {
            return $this->response(400, false, ErrorCodeHelper::getMessage('ES0004'));
        }

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

        $alarm = Alarm::find($id);

        if (!$alarm) {
            return $this->response(404, false, ErrorCodeHelper::getMessage('EA0007'));
        }

        $alarm->is_active = false; 
        $alarm->updated_at = now();
        $alarm->deleted_at = now(); 
        $alarm->save();
        unset($alarm->created_at);
        unset($alarm->updated_at);

        return $this->response(200, true, 'Alarma eliminada correctamente', $alarm->toArray());
    }
}

