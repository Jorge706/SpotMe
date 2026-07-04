# SpotMe — Tracking API

Telemetry service for the SpotMe platform. Receives location data from GPS tracking devices and turns it into trips, geofence events, and real-time updates for connected clients.

## Responsibilities

- **Trip management** — trip lifecycle handling (`TripsController`) with events such as `TripCreated` broadcast over **Pusher (WebSockets)** for live client updates.
- **Geofencing** — server-side geofence definitions and evaluation (`GeofencesController`).
- **Driver changes** — driver assignment and change tracking (`DriverChangesController`).
- **Device health** — last-communication monitoring (`LastDeviceCommunicationController`) and exception reporting (`ExceptionsController`).

## Stack

PHP · Laravel · MySQL · Pusher (WebSockets)

## Running locally

```bash
composer install
cp .env.example .env      # fill in your own values — no credentials are committed
php artisan key:generate
php artisan migrate
php artisan serve
```

Part of the [SpotMe monorepo](https://github.com/Jorge706/SpotMe) — see the root README for the full architecture.
