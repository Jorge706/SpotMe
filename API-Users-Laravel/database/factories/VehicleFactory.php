<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Vehicle>
 */
class VehicleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'vehicle_name' => $this->faker->word(),
            'vin' => $this->faker->unique()->bothify('??######??##??##'),
            'mark' => $this->faker->company(),
            'model' => $this->faker->word(),
            'year' => $this->faker->numberBetween(1990, date('Y')),
            'is_active' => true,
            'updated_at' => now(),
            'deleted_at' => null,
            'created_at' => now(),
        ];
    }
}
