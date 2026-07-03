<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Alarm;

class AlarmSeeder extends Seeder
{
    public function run()
    {
        Alarm::factory()->count(50)->create();
    }
}
