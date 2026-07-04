# SpotMe — Users API

Identity and access service for the SpotMe platform. Handles everything related to who can use the system and what they are allowed to do.

## Responsibilities

- **Authentication** — registration, login, and JWT issuance, with optional **two-factor authentication** and reCAPTCHA protection.
- **Authorization** — role-based access control (`RolesController`) for administrators, operators, and guests.
- **User & device management** — user accounts (`UserController`) and tracked-device registration (`DeviceController`).
- **Alarm configuration** — user-facing alarm settings (`AlarmsController`).

## Stack

PHP · Laravel · MySQL · JWT · reCAPTCHA

## Running locally

```bash
composer install
cp .env.example .env      # fill in your own values — no credentials are committed
php artisan key:generate
php artisan migrate
php artisan serve
```

Part of the [SpotMe monorepo](https://github.com/Jorge706/SpotMe) — see the root README for the full architecture.
