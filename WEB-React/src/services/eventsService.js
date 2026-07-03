import { httpRequest } from '../utils.js';
import { devicesService } from './devicesService.js';

export const eventsService = {
    /**
     * Obtener eventos del dispositivo por día
     * @param {string} deviceSerial - Número de serie del dispositivo
     * @param {number} perPage - Número de eventos por página (opcional)
     */
    async getEventsByDevice(deviceSerial, perPage = 10) {
        return await httpRequest({
            url: '/tracking-api/exceptions/search/device',
            method: 'GET',
            useToken: true,
            params: {
                device_serial: deviceSerial,
                per_page: perPage
            }
        });
    },

    /**
     * Obtener eventos por rango de fechas (todos los dispositivos)
     * @param {string} startDate - Fecha de inicio (formato: "YYYY-MM-DD HH:mm:ss")
     * @param {string} endDate - Fecha de fin (formato: "YYYY-MM-DD HH:mm:ss")
     * @param {number} perPage - Número de eventos por página (opcional)
     * @param {number} page - Número de página (opcional)
     */
    async getEventsByDateRange(startDate, endDate, perPage = 10, page = 1) {
        return await httpRequest({
            url: '/tracking-api/exceptions/search/dates-range',
            method: 'GET',
            useToken: true,
            params: {
                start_date: startDate,
                end_date: endDate,
                per_page: perPage,
                page: page
            }
        });
    },

    /**
     * Obtener eventos del dispositivo por rango de fechas (historial completo)
     * @param {string} deviceSerial - Número de serie del dispositivo
     * @param {string} startDate - Fecha de inicio (formato: "YYYY-MM-DD HH:mm:ss")
     * @param {string} endDate - Fecha de fin (formato: "YYYY-MM-DD HH:mm:ss")
     * @param {number} perPage - Número de eventos por página (opcional)
     * @param {number} page - Número de página (opcional)
     */
    async getDeviceEventsByDateRange(deviceSerial, startDate, endDate, perPage = 10, page = 1) {
        return await httpRequest({
            url: '/tracking-api/exceptions/search/devices/date-range',
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
    },

    /**
     * Función helper para formatear fechas al formato requerido por la API
     * @param {string} date - Fecha en formato "YYYY-MM-DD"
     * @param {string} time - Hora en formato "HH:mm" (opcional, por defecto "00:00")
     */
    formatDateTime(date, time = "00:00") {
        return `${date} ${time}:00`;
    },

    // Funciones de dispositivos reutilizadas del servicio compartido
    fetchDevices: devicesService.fetchDevices,
    fetchAllDevices: devicesService.fetchAllDevices,
    getDeviceSerial: devicesService.getDeviceSerial
};