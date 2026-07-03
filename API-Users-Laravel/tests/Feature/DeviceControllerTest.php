<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Device;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;

class DeviceControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $vehicle;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Crear un rol de prueba
        $role = Role::create([
            'role_id' => 1,
            'role_name' => 'Admin',
            'is_active' => true,
            'created_at' => now(),
        ]);

        // Crear un usuario de prueba
        $this->user = User::create([
            'name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'nss' => '12345678901',
            'phone' => '1234567890',
            'password' => bcrypt('password'),
            'role_id' => $role->role_id,
            'is_active' => true,
            'is_complete' => true,
            'created_at' => now(),
        ]);

        // Crear un vehículo de prueba
        $this->vehicle = Vehicle::create([
            'vehicle_name' => 'Test Vehicle',
            'vin' => 'TEST123456789',
            'mark' => 'Toyota',
            'model' => 'Camry',
            'year' => 2023,
            'is_active' => true,
            'created_at' => now(),
        ]);
    }

    /** @test */
    public function it_can_create_a_device()
    {
        // Mock reCAPTCHA response
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success' => true
            ], 200)
        ]);

        $deviceData = [
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
            'g-recaptcha-response' => 'valid-captcha-token',
        ];

        $response = $this->actingAs($this->user, 'api')
                         ->postJson('/api/devices', $deviceData);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => true,
                     'message' => 'Dispositivo creado exitosamente',
                 ])
                 ->assertJsonStructure([
                     'code',
                     'status',
                     'message',
                     'data' => [
                         'device_id',
                         'vehicle_id',
                         'serial_number',
                         'is_active',
                         'created_at',
                         'vehicle'
                     ]
                 ]);

        $this->assertDatabaseHas('devices', [
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_can_get_all_devices()
    {
        // Crear algunos dispositivos de prueba
        Device::create([
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
            'created_at' => now(),
        ]);

        Device::create([
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV002',
            'is_active' => true,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'api')
                         ->getJson('/api/devices');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => true,
                     'message' => 'Dispositivos obtenidos',
                 ])
                 ->assertJsonStructure([
                     'code',
                     'status',
                     'message',
                     'data' => [
                         '*' => [
                             'device_id',
                             'vehicle_id',
                             'serial_number',
                             'is_active',
                             'created_at',
                             'vehicle'
                         ]
                     ],
                     'meta' => [
                         'current_page',
                         'per_page',
                         'total_pages',
                         'total_devices'
                     ]
                 ]);
    }

    /** @test */
    public function it_prevents_duplicate_serial_numbers()
    {
        // Crear un dispositivo existente
        Device::create([
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
            'created_at' => now(),
        ]);

        // Crear otro vehículo para el segundo dispositivo
        $vehicle2 = Vehicle::create([
            'vehicle_name' => 'Test Vehicle 2',
            'vin' => 'TEST987654321',
            'mark' => 'Honda',
            'model' => 'Civic',
            'year' => 2023,
            'is_active' => true,
            'created_at' => now(),
        ]);

        // Intentar crear otro dispositivo con el mismo número de serie
        $deviceData = [
            'vehicle_id' => $vehicle2->vehicle_id,
            'serial_number' => 'DEV001', // Mismo número de serie
            'is_active' => true,
        ];

        $response = $this->actingAs($this->user, 'api')
                         ->postJson('/api/devices', $deviceData);

        $response->assertStatus(400)
                 ->assertJson([
                     'status' => false,
                     'message' => 'El número de serie ya está en uso por otro dispositivo activo',
                 ]);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $deviceData = [
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/devices', $deviceData);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_requires_recaptcha_validation()
    {
        $deviceData = [
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
            // Sin g-recaptcha-response
        ];

        $response = $this->actingAs($this->user, 'api')
                         ->postJson('/api/devices', $deviceData);

        $response->assertStatus(422); // Validation error
    }

    /** @test */
    public function it_rejects_invalid_recaptcha()
    {
        // Mock reCAPTCHA response como fallida
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success' => false
            ], 200)
        ]);

        $deviceData = [
            'vehicle_id' => $this->vehicle->vehicle_id,
            'serial_number' => 'DEV001',
            'is_active' => true,
            'g-recaptcha-response' => 'invalid-captcha-token',
        ];

        $response = $this->actingAs($this->user, 'api')
                         ->postJson('/api/devices', $deviceData);

        $response->assertStatus(400)
                 ->assertJsonFragment([
                     'status' => false
                 ]);
    }
}
