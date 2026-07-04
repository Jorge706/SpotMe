# SpotMe — Tracking Device Firmware

Firmware for SpotMe's custom GPS tracking device, built on an **ESP32** with a **SIM800L** cellular modem and a GPS module.

## How it works

- **Positioning** — reads NMEA sentences from the GPS module over UART and parses them with **TinyGPS++**.
- **Cellular uplink** — transmits location payloads as JSON over GSM/GPRS through the SIM800L.
- **Connection watchdog** — verifies GSM network health on a fixed interval and re-establishes the session automatically.
- **Offline buffering** — when the network drops, readings are persisted to an **SD card** and resent once connectivity returns, so no positions are lost.
- **Panic button** — a hardware button triggers an immediate alert through the platform.

## Hardware

| Component | Role |
|---|---|
| ESP32 | Main MCU (dual UART: GPS + modem) |
| GPS module | Positioning (NMEA over UART) |
| SIM800L | GSM/GPRS connectivity |
| SD card (SPI) | Offline data buffering |
| Push button | Panic alert |

## Stack

C++ (Arduino framework) · TinyGPS++ · ESP32

Part of the [SpotMe monorepo](https://github.com/Jorge706/SpotMe) — see the root README for the full architecture.
