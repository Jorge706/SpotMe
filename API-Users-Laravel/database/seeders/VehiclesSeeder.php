<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;

class VehiclesSeeder extends Seeder
{
    public function run(): void
    {
        Vehicle::factory()->count(50)->create();
    }
}
