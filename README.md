# SpotMe — Real-Time Vehicle Tracking Platform

SpotMe is an end-to-end, real-time vehicle tracking and logistics monitoring platform built from the hardware up: custom GPS tracking devices report location over cellular networks to a cloud-hosted backend, which streams live positions to web, desktop, and iOS clients.

I designed, led, and built this platform across every layer of the stack — embedded firmware, backend APIs, cloud infrastructure, and client applications.

## Architecture

```
┌─────────────────────┐
│  Tracking Device    │  ESP32 + GPS (TinyGPS++) + SIM800L (GSM/GPRS)
│  (Firmware, C++)    │  SD-card buffering · panic button
└─────────┬───────────┘
          │ cellular (HTTP/JSON)
          ▼
┌─────────────────────────────────────────────┐
│  Kubernetes Cluster (Azure AKS)             │
│                                             │
│  ┌───────────────┐   ┌───────────────────┐  │
│  │  Users API    │   │  Tracking API     │  │
│  │  (Laravel)    │   │  (Laravel)        │  │
│  │  auth · 2FA   │   │  trips · geofences│  │
│  │  roles · JWT  │   │  alarms · events  │  │
│  └───────┬───────┘   └─────────┬─────────┘  │
│          │                     │            │
│  ┌───────┴─────────────────────┴─────────┐  │
│  │  MySQL master + replica (SSL repl.)   │  │
│  └───────────────────────────────────────┘  │
│  HAProxy load balancer · TLS termination    │
└─────────────────────┬───────────────────────┘
                      │ REST + Pusher (WebSockets)
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
   Web client    Desktop client   iOS client
   (React 19)    (Electron)       (Swift/UIKit)
```

## Components

| Directory | Description | Stack |
|---|---|---|
| `Firmware/` | GPS tracker firmware: reads NMEA data via TinyGPS++, transmits over GSM/GPRS with connection watchdog, buffers to SD card on network loss, panic-button alerts | C++ (Arduino / ESP32), SIM800L |
| `API-Users-Laravel/` | Identity service: registration, JWT auth, two-factor authentication, role-based access control, reCAPTCHA | PHP, Laravel, MySQL |
| `API-Tracking-Laravel/` | Telemetry service: trips, geofences, driver changes, device-communication monitoring, alarm events broadcast in real time | PHP, Laravel, Pusher |
| `Infraestructure-K8s/` | Production infrastructure: namespaced deployments, MySQL master/replica with SSL replication, HAProxy load balancing, TLS, RBAC guest access | Kubernetes (Azure AKS), Shell |
| `WEB-React/` | Live-tracking web dashboard with real-time position updates | React 19, Vite, Pusher |
| `Front-Electron/` | Cross-platform desktop client | Electron, Node.js |
| `Movil-IOS/` | Native iOS client | Swift, UIKit |

## Key Features

- **Real-time tracking** — device positions stream to all connected clients via WebSockets (Pusher), with trip lifecycle events (`TripCreated`, etc.) broadcast from the Tracking API.
- **Resilient firmware** — the tracker verifies GSM network health on a fixed interval, buffers readings to SD when offline, and resends on reconnection.
- **Geofencing & alarms** — server-side geofence evaluation with alarm and exception reporting.
- **Panic button** — hardware button on the device triggers an immediate alert through the platform.
- **Security** — JWT-based auth, two-factor authentication, RBAC, SSL-encrypted MySQL replication, and TLS at the load balancer.
- **High availability** — MySQL master/replica topology, health checks, resource quotas, and HAProxy load balancing on Kubernetes.

## Configuration

All credentials are injected through environment variables / Kubernetes Secrets — see `.env.example` in each API and the templates in `Infraestructure-K8s/kubernetes/config/` (values marked `CHANGE_ME`). No real credentials are stored in this repository.

## Status

SpotMe operated with real users and devices as a university-led production project. The cloud deployment is currently offline; the codebase is published as a portfolio reference.

## Author

**Jorge Jafet Guzmán García** — [LinkedIn](https://www.linkedin.com/in/jorge-jafet-guzman-garcia-a61954294) · jafetguzman17@gmail.com
