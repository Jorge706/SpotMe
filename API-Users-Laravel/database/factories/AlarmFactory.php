<?php

namespace Database\Factories;

use App\Models\Alarm;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlarmFactory extends Factory
{
    protected $model = Alarm::class;

    public function definition()
    {
        return [
            'alarm_name' => $this->faker->unique()->regexify('[A-Za-z0-9 ]{10,30}'),
            'description' => $this->faker->unique()->regexify('.{10,50}'),
            'alarm_code' => $this->faker->unique()->regexify('[A-Za-z0-9]{5,8}'),
            'is_active' => $this->faker->boolean(100), // 80% chance of being active
        ];
    }
}
