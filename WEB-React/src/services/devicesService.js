import { httpRequest } from "../utils.js";

export const devicesService = {
    // Función para obtener dispositivos con paginación
    fetchDevices: async (perPage = 50, page = 1) => {
        try {

            const response = await httpRequest({
                url: '/user-api/devices',
                method: 'GET',
                useToken: true, 
                params: {
                    per_page: perPage,
                    page: page
                }
            });

            return response;
        } catch (error) {
            throw error;
        }
    },

    // Función para obtener TODOS los dispositivos (manejando paginación)
    fetchAllDevices: async () => {
        try {
            let allDevices = [];
            let currentPage = 1;
            let hasMorePages = true;
            const perPage = 50; // Número de dispositivos por página

            while (hasMorePages) {

                const response = await devicesService.fetchDevices(perPage, currentPage);

                if (response && response.data && Array.isArray(response.data)) {
                    allDevices = [...allDevices, ...response.data];

                    if (response.meta && response.meta.pagination) {
                        const { current_page, last_page } = response.meta.pagination;
                        hasMorePages = current_page < last_page;
                        currentPage++;
                    } else if (response.data.length < perPage) {
                        hasMorePages = false;
                    } else {
                        currentPage++;
                    }
                } else {
                    hasMorePages = false;
                }

                // Seguridad: evitar loops infinitos
                if (currentPage > 100) {
                    console.warn("⚠️ Deteniendo después de 100 páginas por seguridad");
                    break;
                }
            }

            return { data: allDevices };

        } catch (error) {
            console.error("❌ Error en fetchAllDevices:", error);
            throw error;
        }
    },

    // Función para mapear dispositivos a seriales (usada en ambos componentes)
    getDeviceSerial: (deviceValue, devices) => {
        if (deviceValue === "Dispositivo-001" || deviceValue === "all") {
            return null; // Para buscar todos los dispositivos
        }

        // Buscar en la lista de dispositivos cargados
        const foundDevice = devices.find(d =>
            d.serial_number === deviceValue ||
            d.device_id === deviceValue ||
            d.serial === deviceValue ||
            d.device_serial === deviceValue ||
            d.id === deviceValue
        );

        return foundDevice ? (foundDevice.serial_number || foundDevice.device_serial || foundDevice.serial || foundDevice.device_id || foundDevice.id) : deviceValue;
    }
};
