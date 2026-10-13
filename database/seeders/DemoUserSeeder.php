<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            User::query()->updateOrCreate(
                ['email' => 'learner@workbench0.local'],
                [
                    'name' => 'Demo Learner',
                    'password' => Hash::make('password'),
                    'role' => UserRole::Learner,
                    'email_verified_at' => now(),
                ]
            );

            User::query()->updateOrCreate(
                ['email' => 'admin@workbench0.local'],
                [
                    'name' => 'Demo Admin',
                    'password' => Hash::make('password'),
                    'role' => UserRole::Admin,
                    'email_verified_at' => now(),
                ]
            );
        });
    }
}
