<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceFactory extends Factory
{
    protected $model = Device::class;

    public function definition()
    {
        return [
            'vehicle_id' => Vehicle::factory(), // Relaciona con Vehicle
            'serial_number' => $this->faker->unique()->regexify('SN[0-9]{6}'),
            'is_active' => $this->faker->boolean(),
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => $this->faker->dateTimeBetween('-1 years', 'now'),
            'deleted_at' => null, // Por defecto no borrado
        ];
    }
}
