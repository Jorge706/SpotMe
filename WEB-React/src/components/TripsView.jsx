import { useState, useEffect } from "react";
import Table from "./Table";
import Modal from "./Modal";
import { StatusModal } from "./StatusModal";
import { tripsService } from "../services/tripsService.js";
import { devicesService } from "../services/devicesService.js";
import { useApiError } from "../hooks/useApiError.js";

function TripsView() {
  // Función para obtener la fecha actual en formato YYYY-MM-DDTHH:MM
  const getCurrentDateTime = (startOfDay = false) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    if (startOfDay) {
      return `${year}-${month}-${day}T08:00`;
    } else {
      return `${year}-${month}-${day}T18:00`;
    }
  };

  const [dateFrom, setDateFrom] = useState(getCurrentDateTime(true));
  const [dateTo, setDateTo] = useState(getCurrentDateTime(false));
  const [device, setDevice] = useState("Dispositivo-001");
  const [tripsData, setTripsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10000, total: 0 });
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [selectedTripIndex, setSelectedTripIndex] = useState(null);
  const [hoveredTripIndex, setHoveredTripIndex] = useState(null);
  const { handleApiError, showModal, modalMessage, clearError } = useApiError();

  // Función para cargar dispositivos
  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      
      const response = await devicesService.fetchAllDevices();
      
      if (response && response.data) {
        const allDevices = Array.isArray(response.data) ? response.data : [];
        setDevices(allDevices);
        
        // Si hay dispositivos y no hay uno seleccionado, seleccionar el primero
        if (allDevices.length > 0 && device === "Dispositivo-001") {
          const firstDeviceSerial = allDevices[0].serial_number || allDevices[0].device_id || allDevices[0].serial;
          setDevice(firstDeviceSerial);
        }
      } else {
        setDevices([]);
      }
    } catch (error) {
      handleApiError(error);
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  // Mapeo de dispositivos a seriales - ahora dinámico
  const getDeviceSerial = (deviceValue) => {
    return devicesService.getDeviceSerial(deviceValue, devices);
  };

  // Función para convertir el formato de fecha
  const formatDateTimeForAPI = (dateTime) => {
    if (!dateTime) return null;
    // Convertir de "2025-08-01T08:00" a "2025-08-01 08:00:00"
    return dateTime.replace('T', ' ') + ':00';
  };

  const handleSearch = async () => {
    setLoading(true);
    try {


      const deviceSerial = getDeviceSerial(device);
      // Convertir las fechas al formato requerido por la API
      const startDateTime = formatDateTimeForAPI(dateFrom);
      const endDateTime = formatDateTimeForAPI(dateTo);

      let response;

      // Decidir qué API usar según los filtros
      if (device && device !== "Dispositivo-001" && device !== "all" && deviceSerial) {
        // Buscar viajes específicos del dispositivo en el rango de fechas
        if (dateFrom && dateTo && dateFrom !== dateTo) {
          response = await tripsService.getDeviceTripsByDateRange(
            deviceSerial, 
            startDateTime, 
            endDateTime, 
            10000, // Obtener hasta 10000 registros
            pagination.page
          );
        } else {
          response = await tripsService.getTripsByDevice(deviceSerial, 10000, pagination.page); // Obtener hasta 10000 registros
        }
      } else {
        response = await tripsService.getTripsByDateRange(
          startDateTime, 
          endDateTime, 
          10000, // Obtener hasta 10000 registros
          pagination.page
        );
      }

      if (response && response.data) {
        let tripsArray = response.data;
        
        if (Array.isArray(tripsArray) && tripsArray.length > 0 && Array.isArray(tripsArray[0])) {
          tripsArray = tripsArray.flat();
        }
        
        
        const processedTrips = tripsArray.map(trip => ({
          "ID del viaje": trip.trip_id || "N/A",
          "Serial del dispositivo": trip.serial_number || "N/A",
          "Coordenadas": trip.latitude && trip.longitude ? `${trip.latitude}, ${trip.longitude}` : "N/A",
          "Fecha y hora": trip.date_time || "N/A",
          "Conductor": trip.driver_name && trip.driver_last_name ? 
            `${trip.driver_name} ${trip.driver_last_name}`.trim() : 
            trip.driver_name || "N/A",
          "Nombre del vehículo": trip.vehicle_name || "N/A",
          "Fecha de creación": trip.created_at || "N/A",
          // Datos originales para el mapa
          _rawData: trip,
          // Guardar la fecha original para ordenamiento
          _originalDate: trip.date_time || trip.created_at
        }));

        // Ordenar por fecha de forma descendente (más nuevos primero)
        const sortedTrips = processedTrips.sort((a, b) => {
          const dateA = new Date(a._originalDate);
          const dateB = new Date(b._originalDate);
          return dateB - dateA; // Orden descendente (más nuevo primero)
        });

        setTripsData(sortedTrips);
        
        if (response.meta || response.pagination) {
          const meta = response.meta || response.pagination;
          setPagination(prev => ({
            ...prev,
            total: meta.total || 0,
            page: meta.current_page || 1
          }));
        }
      } else {
        setTripsData([]);
      }

    } catch (error) {
      handleApiError(error);
      setTripsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (devices.length > 0 || device === "Dispositivo-001") {
      handleSearch();
    }
  }, [devices]);

  // Función para cambiar la página
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Ejecutar búsqueda con la nueva página
    setTimeout(handleSearch, 0);
  };

  // Función para manejar el clic en una fila de viaje
  const handleTripRowClick = (index) => {
    
    if (selectedTripIndex === index) {
      setSelectedTripIndex(null);
    } else {
      setSelectedTripIndex(index);
    }
  };

  const handleTripRowHover = (index) => {
    setHoveredTripIndex(index);
  };

  const handleTripRowLeave = () => {
    setHoveredTripIndex(null);
  };

  // Headers actualizados para mostrar SOLO las columnas que devuelve la API
  const headers = [
    "Nombre del vehículo",
    "Serial del dispositivo",
    "Conductor",
    // "ID del viaje",
    // "Coordenadas",
    // "Fecha y hora",
    // "Fecha de creación"
  ];

  return (
    <div className="trips-view">
      {/* Header con filtros en línea horizontal */}
      <div className="visualizacion-header">
        <div className="events-filters-inline" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Fecha desde:</span>
          <input 
            className="device-select"
            type="datetime-local" 
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          />
          <span>Fecha hasta:</span>
          <input 
            className="device-select"
            type="datetime-local" 
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          />
          <span>Dispositivo:</span>
          <select 
            className="device-select"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            disabled={loadingDevices}
            style={{ 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="Dispositivo-001">Todos los dispositivos</option>
            {loadingDevices ? (
              <option disabled>Cargando dispositivos...</option>
            ) : (
              devices.map((deviceItem, index) => {
                return (
                  <option 
                    key={deviceItem.device_id || deviceItem.id || deviceItem.serial_number} 
                    value={deviceItem.serial_number || deviceItem.device_serial || deviceItem.serial || deviceItem.device_id}
                  >
                    {deviceItem.vehicle?.vehicle_name 
                      ? `${deviceItem.vehicle.vehicle_name} (${deviceItem.serial_number})` 
                      : deviceItem.serial_number || `Dispositivo ${deviceItem.device_id}`}
                  </option>
                );
              })
            )}
          </select>
        </div>
        <button 
          className="add-button" 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Contenido principal con mapa y tabla - similar a Visualizacion.jsx */}
      <div className="visualizacion-map-container">
        <div className="map-left">
          {/* Mapa */}
          <div className="map-container">
            <LeafletTripMap tripsData={tripsData} selectedTripIndex={selectedTripIndex} hoveredTripIndex={hoveredTripIndex} />
          </div>
        </div>
        <div className="info-right">
          {/* Tabla de viajes */}
          <div className="trips-table-section">
            <div className="trips-table-container">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Cargando viajes...
                </div>
              ) : tripsData.length > 0 ? (
                <Table 
                  headers={headers}
                  data={tripsData}
                  onRowClick={handleTripRowClick}
                  onRowHover={handleTripRowHover}
                  onRowLeave={handleTripRowLeave}
                  selectedIndex={selectedTripIndex}
                  hoveredIndex={hoveredTripIndex}
                />
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No se encontraron viajes para los filtros seleccionados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de error */}
      {showModal && (
        <Modal isOpen={showModal} onClose={clearError}>
          <StatusModal
            title="Error en Historial de Viajes"
            msg={modalMessage}
            onClose={clearError}
            isError={true}
          />
        </Modal>
      )}
    </div>
  );
}

function LeafletTripMap({ tripsData = [], selectedTripIndex = null, hoveredTripIndex = null }) {
  useEffect(() => {
    // Limpiar mapa existente si existe
    const mapContainer = document.getElementById("leaflet-map-trips");
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
      mapContainer.innerHTML = '';
    }

    // Coordenadas por defecto (centro de México)
    const defaultLat = 25.6866;
    const defaultLng = -100.3161;
    
    // Filtrar viajes válidos
    const validTrips = tripsData.filter(trip => 
      trip._rawData && 
      trip._rawData.latitude && trip._rawData.longitude && 
      !isNaN(parseFloat(trip._rawData.latitude)) && !isNaN(parseFloat(trip._rawData.longitude))
    );

    // Determinar qué viajes mostrar
    let tripsToShow = validTrips;
    let highlightedTripIndex = null;
    
    // Prioridad: hover > selección > todos
    if (hoveredTripIndex !== null && validTrips[hoveredTripIndex]) {
      tripsToShow = [validTrips[hoveredTripIndex]];
      highlightedTripIndex = hoveredTripIndex;
    } else if (selectedTripIndex !== null && validTrips[selectedTripIndex]) {
      tripsToShow = [validTrips[selectedTripIndex]];
      highlightedTripIndex = selectedTripIndex;
    }

    // Si hay viajes para mostrar, usar el primero como centro
    let centerLat = defaultLat;
    let centerLng = defaultLng;
    
    if (tripsToShow.length > 0) {
      centerLat = parseFloat(tripsToShow[0]._rawData.latitude);
      centerLng = parseFloat(tripsToShow[0]._rawData.longitude);
    }

    const map = window.L.map("leaflet-map-trips").setView([centerLat, centerLng], 13);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Agregar marcadores para los viajes a mostrar
    tripsToShow.forEach((trip, index) => {
      const lat = parseFloat(trip._rawData.latitude);
      const lng = parseFloat(trip._rawData.longitude);
      
      // Marcador de ubicación (azul)
      const popupContent = `
        <div style="font-size: 12px;">
          <strong>🚗 VIAJE #${trip["ID del viaje"]}</strong><br/>
          <strong>Vehículo:</strong> ${trip["Nombre del vehículo"]}<br/>
          <strong>Conductor:</strong> ${trip["Conductor"]}<br/>
          <strong>Dispositivo:</strong> ${trip["Serial del dispositivo"]}<br/>
          <strong>Fecha y hora:</strong> ${trip["Fecha y hora"]}<br/>
          <strong>Coordenadas:</strong> ${lat}, ${lng}
        </div>
      `;
      
      window.L.circleMarker([lat, lng], {
        fillColor: "#2196F3",
        color: "#1976D2",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        radius: 6
      })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Ajustar la vista según la cantidad de viajes
    if (tripsToShow.length > 1) {
      const allPoints = [];
      tripsToShow.forEach(trip => {
        const lat = parseFloat(trip._rawData.latitude);
        const lng = parseFloat(trip._rawData.longitude);
        allPoints.push([lat, lng]);
      });
      
      if (allPoints.length > 0) {
        const group = new window.L.featureGroup(allPoints.map(point => window.L.circleMarker(point)));
        map.fitBounds(group.getBounds().pad(0.1));
      }
    } else if (tripsToShow.length === 1) {
      // Si es un solo viaje, hacer zoom más cercano
      map.setView([centerLat, centerLng], 14);
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [tripsData, selectedTripIndex, hoveredTripIndex]); // Re-ejecutar cuando cambien los viajes, selección o hover

  return (
    <div
      id="leaflet-map-trips"
      style={{ width: "100%", height: "100%" }}
    ></div>
  );
}

export default TripsView;
