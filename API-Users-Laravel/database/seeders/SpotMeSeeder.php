<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SpotmeSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Insertar Roles
        DB::table('roles')->insert([
            ['role_name' => 'Conductor', 'created_at' => $now],
            ['role_name' => 'Administrador', 'created_at' => $now],
            ['role_name' => 'Monitorista', 'created_at' => $now],
        ]);

        // Insertar Alarma
        DB::table('alarms')->insert([
            [
                'alarm_name'  => 'Boton de panico',
                'description' => 'Botón para indicar eventos de riesgo del conductor',
                'alarm_code'  => 'AC001',
                'created_at'  => $now,
            ],
            [
                'alarm_name'  => 'Entrada a Geocerca',
                'description' => 'Geocerca UTT',
                'alarm_code'  => 'AC002',
                'created_at'  => $now,
            ],
            [
                'alarm_name'  => 'Salida de Geocerca',
                'description' => 'Geocerca UTT',
                'alarm_code'  => 'AC003',
                'created_at'  => $now,
            ],
        ]);

        // Insertar Acciones del AuditLog
        DB::table('actions')->insert([
            ['action_name' => 'Crear'],
            ['action_name' => 'Editar'],
            ['action_name' => 'Eliminar'],
        ]);

        // Insertar Usuario por Defecto
        DB::table('users')->insert([
            [
                'role_id'     => 2, // Administrador
                'name'        => 'SpotMe',
                'last_name'   => 'Admin',
                'username'    => 'SpotMe',
                'email'       => 'spotme_admin@spotme.mx',
                'nss'         => '12345678912',
                'phone'       => '8711234567',
                'password'    => bcrypt('#SpotMe_ADL20250713'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => false,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 2, // Administrador
                'name'        => 'Victor',
                'last_name'   => 'Maldonado',
                'username'    => 'EdwardLynx24',
                'email'       => 'v.eduardo.maldonado@gmail.com',
                'nss'         => '34567891333',
                'phone'       => '8715644203',
                'password'    => bcrypt('#ElMasWapo12345'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 2, // Administrador
                'name'        => 'Gabriel',
                'last_name'   => 'Vargas',
                'username'    => 'Gyromitte',
                'email'       => 'gyromitte@gmail.com',
                'nss'         => '12345678911',
                'phone'       => '8711234567',
                'password'    => bcrypt('@Password123'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 3, // Administrador
                'name'        => 'Gabriel',
                'last_name'   => 'Vargas',
                'username'    => 'Gyro sin mitte',
                'email'       => 'dev.gabriel.vazquez@gmail.com',
                'nss'         => '12345678913',
                'phone'       => '8711234567',
                'password'    => bcrypt('@Password123'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 1, // Administrador
                'name'        => 'Gabriel',
                'last_name'   => 'Vargas',
                'username'    => 'Este no es Gyromitte',
                'email'       => 'gabrielvazquez705705@gmail.com',
                'nss'         => '12345678914',
                'phone'       => '8711234567',
                'password'    => bcrypt('@Password123'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 3, // Monitorista
                'name'        => 'Ricardo',
                'last_name'   => 'Gallegos',
                'username'    => 'Rikiku',
                'email'       => 'ricky.gallegos@hotmail.com',
                'nss'         => '12345678915',
                'phone'       => '8711234567',
                'password'    => bcrypt('Sense!123llqq'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 2, // Administrador
                'name'        => 'Ricardo',
                'last_name'   => 'Gallegos',
                'username'    => 'Jhiikan',
                'email'       => 'xzepknight@gmail.com',
                'nss'         => '12345678916',
                'phone'       => '8711234567',
                'password'    => bcrypt('Sense!123llqq'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 1, // Conductor
                'name'        => 'Ricardo',
                'last_name'   => 'Gallegos',
                'username'    => 'xSleep',
                'email'       => 'znamelessboy@gmail.com',
                'nss'         => '12345678917',
                'phone'       => '8711234567',
                'password'    => bcrypt('Sense!123llqq'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 2, // Administrador
                'name'        => 'Jafet',
                'last_name'   => 'Guzman',
                'username'    => 'JafetGuzman',
                'email'       => 'gogocumple12@gmail.com',
                'nss'         => '12345678918',
                'phone'       => '8711234567',
                'password'    => bcrypt('Qwerty1234!@#$'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 3, // Administrador
                'name'        => 'Jorge',
                'last_name'   => 'Guzman',
                'username'    => 'JorgeGuzman',
                'email'       => 'Jorge.jafet18@gmail.com',
                'nss'         => '12345678919',
                'phone'       => '8711234567',
                'password'    => bcrypt('Qwerty1234@'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
            [
                'role_id'     => 1, // Administrador
                'name'        => 'Jorge Jafet',
                'last_name'   => 'Guzman',
                'username'    => 'JafetGarcia',
                'email'       => '22170185@uttcampus.edu.mx',
                'nss'         => '12345678920',
                'phone'       => '8711234567',
                'password'    => bcrypt('Qwerty1234!@#$'), // o usa Hash::make
                'is_active'   => true,
                'is_complete' => true,
                'created_at'  => $now,
            ],
        ]);

        // Insertar Vehículo por Defecto
        $vehicleId = DB::table('vehicles')->insertGetId([
            'vehicle_name' => 'Spotme Test',
            'vin'          => '1HGCM82633A004352',
            'mark'         => 'Chevrolet',
            'model'        => 'Camaro',
            'year'         => 2018,
            'is_active'    => true,
            'created_at'   => $now,
        ]);

        // Insertar Dispositivo asociado al vehículo
        DB::table('devices')->insert([
            'vehicle_id'   => $vehicleId,
            'serial_number'=> '2C95E3498CD4',
            'is_active'    => true,
            'created_at'   => $now,
        ]);

        // Insertar Driverchanges por defecto.
        DB::table('driverchanges')->insert([
            'user_id' => 1,
            'vehicle_id' => $vehicleId,
            'date_time' => $now,
            'created_at' => $now,
        ]);

        // Insertar Geocerca por defecto.
        DB::table('geofences')->insert([
            'device_id' => 1, // Asumiendo que el dispositivo tiene ID 1
            'name' => 'UTT',
            'latitude' => 25.5318741,
            'longitude' => -103.3213018,
            'radius' => 100, // Radio en metros
            'is_active' => true,
            'created_at' => $now,
        ]);
    }
}
