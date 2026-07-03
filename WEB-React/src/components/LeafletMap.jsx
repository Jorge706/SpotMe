import { useEffect, useState } from "react";

function LeafletMap() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Pequeño delay para asegurar que Leaflet esté cargado
    const timer = setTimeout(() => {
      // Verificar que Leaflet esté disponible
      if (!window.L) {
        console.error('Leaflet no está cargado');
        return;
      }

      // Coordenadas de Torreón, México (basado en la imagen)
      const lat = 25.5428;
      const lng = -103.4068;

      const map = window.L.map("leaflet-map").setView([lat, lng], 13);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Datos simulados de dispositivos
      const deviceData = [
        {
          id: "123456",
          vehicle: "ABC-123",
          lat: 25.5428,
          lng: -103.4068,
          driver: "Juan P.",
          status: "active"
        },
        {
          id: "123450",
          vehicle: "XYZ-789",
          lat: 25.5448,
          lng: -103.4088,
          driver: "María G.",
          status: "alarm"
        }
      ];

      setDevices(deviceData);

      // Agregar marcadores para cada dispositivo
      deviceData.forEach(device => {
        const markerColor = device.status === 'alarm' ? 'red' : 'green';
        
        window.L.marker([device.lat, device.lng])
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>Vehículo:</strong> ${device.vehicle}<br>
              <strong>Conductor:</strong> ${device.driver}<br>
              <strong>Estado:</strong> ${device.status === 'alarm' ? 'Alarma' : 'Activo'}
            </div>
          `);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      // Intentar limpiar el mapa si existe
      try {
        const mapElement = document.getElementById('leaflet-map');
        if (mapElement && mapElement._leaflet_id) {
          const map = window.L.map(mapElement);
          map.remove();
        }
      } catch (error) {
        console.log('Error al limpiar el mapa:', error);
      }
    };
  }, []);

  return (
    <div
      id="leaflet-map"
      style={{ width: "100%", height: "100%", borderRadius: '8px' }}
    ></div>
  );
}

export default LeafletMap;
