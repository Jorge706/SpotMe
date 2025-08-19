import { httpRequest } from "../../utils";

// Función para obtener historial de ubicaciones
export const getHistoricalLocations = async (deviceSerial, startDate, endDate) => {
    try {
        console.log("📄 Obteniendo ubicaciones históricas:", { deviceSerial, startDate, endDate });

        const response = await httpRequest({
            url: `/tracking-api/trips/search/devices/date-range`,
            method: 'GET',
            useToken: true,
            params: {
                device_serial: deviceSerial,
                start_date: startDate,
                end_date: endDate,
                per_page: 10000,
                page: 1
            }
        });

        return response;
    } catch (error) {
        console.error("❌ Error en getHistoricalLocations:", error);
        throw error;
    }
}

// Función para obtener historial de eventos de seguridad
export const getHistoricalEvents = async (deviceSerial, startDate, endDate) => {
    try {
        console.log("📄 Obteniendo eventos históricos:", { deviceSerial, startDate, endDate });

        const response = await httpRequest({
            url: `/tracking-api/exceptions/search/devices/date-range`,
            method: 'GET',
            useToken: true,
            params: {
                device_serial: deviceSerial,
                start_date: startDate,
                end_date: endDate,
                per_page: 10000,
                page: 1
            }
        });

        return response;
    } catch (error) {
        console.error("❌ Error en obtener eventos:", error);
        throw error;
    }
}

// Función para obtener el Watchdog
export const getWatchdog = async () => {
    try {
        console.log("📄 Obteniendo Watchdog");

        const response = await httpRequest({
            url: `/tracking-api/last-device-communication/search`,
            method: 'GET',
            useToken: true,
            params: {
                per_page: 10000,
                page: 1
            }
        });

        return response;
    } catch (error) {
        console.error("❌ Error en obtener watchdog:", error);
        throw error;
    }
}