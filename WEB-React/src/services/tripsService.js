import { httpRequest } from "../utils.js";
import { devicesService } from "./devicesService.js";

export const tripsService = {
    // Función para formatear fecha y hora
    formatDateTime: (date, time) => {
        if (!date || !time) return null;
        return `${date} ${time}:00`;
    },

    // Viajes del dispositivo por día
    getTripsByDevice: async (deviceSerial, perPage = 10, page = 1) => {
        try {
            const response = await httpRequest({
                url: '/tracking-api/trips/search/devices',
                method: 'GET',
                useToken: true,
                params: {
                    device_serial: deviceSerial,
                    per_page: perPage,
                    page: page
                }
            });

            return response;
        } catch (error) {
            console.error("❌ Error en getTripsByDevice:", error);
            throw error;
        }
    },

    // Viajes por rango de fechas (trae todos)
    getTripsByDateRange: async (startDate, endDate, perPage = 10, page = 1) => {
        try {
            const response = await httpRequest({
                url: '/tracking-api/trips/search/dates-range',
                method: 'GET',
                useToken: true,
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    per_page: perPage,
                    page: page
                }
            });

            return response;
        } catch (error) {
            console.error("❌ Error en getTripsByDateRange:", error);
            throw error;
        }
    },

    // Viajes del dispositivo por rango de fechas (historial completo)
    getDeviceTripsByDateRange: async (deviceSerial, startDate, endDate, perPage = 10, page = 1) => {
        try {
            const response = await httpRequest({
                url: '/tracking-api/trips/search/devices/date-range',
                method: 'GET',
                useToken: true,
                params: {
                    device_serial: deviceSerial,
                    start_date: startDate,
                    end_date: endDate,
                    per_page: perPage,
                    page: page
                }
            });

            return response;
        } catch (error) {
            console.error("❌ Error en getDeviceTripsByDateRange:", error);
            throw error;
        }
    },

    // Funciones de dispositivos reutilizadas del servicio compartido
    fetchDevices: devicesService.fetchDevices,
    fetchAllDevices: devicesService.fetchAllDevices,
    getDeviceSerial: devicesService.getDeviceSerial
};