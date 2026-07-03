<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class FakeUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()
            ->count(100)
            ->sequence(fn ($sequence) => [
                'role_id' => 1,
                'last_name' => 'Apellido',
                'username' => 'usuario' . uniqid(),
                'nss' => random_int(10000000000, 99999999999),
                'phone' => random_int(1000000000, 9999999999),
                'is_active' => true,
                'is_complete' => false,
            ])
            ->create();
    }
}
