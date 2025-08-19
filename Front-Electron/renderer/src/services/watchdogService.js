import { httpRequest } from "../../utils";

export const watchdogService = {
    // Obtener última comunicación de dispositivos
    getLastDeviceCommunication: async (perPage = 10, page = 1) => {
        try {
            console.log("🐕 Obteniendo última comunicación de dispositivos:", { perPage, page });

            const response = await httpRequest({
                url: '/tracking-api/last-device-communication/search',
                method: 'GET',
                useToken: true,
                params: {
                    per_page: perPage,
                    page: page
                }
            });

            return response;
        } catch (error) {
            console.error("❌ Error en getLastDeviceCommunication:", error);
            throw error;
        }
    }
};
