import { useState, useEffect, useRef } from "react";
import Table from "./Table";
import Modal from "./Modal";
import { StatusModal } from "./StatusModal";
import { eventsService } from "../services/eventsService.js";
import { devicesService } from "../services/devicesService.js";
import { useApiError } from "../hooks/useApiError.js";

function EventsView() {
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

  const startPolling = () => {
    if (pollingIntervalRef.current) return; // Ya está ejecutándose
    
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      checkForNewExceptions();
    }, 10000); // 5 segundos
  };

  // Función para detener el polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const updateEventsData = async () => {
    if (!lastRequestParamsRef.current) return;
    
    try {
      const { deviceSerial, startDateTime, endDateTime, isAllDevices } = lastRequestParamsRef.current;
      
      let response;
      if (isAllDevices || !deviceSerial) {
        response = await eventsService.getEventsByDateRange(
          startDateTime, 
          endDateTime, 
          10000, 
          pagination.page
        );
      } else {
        // Siempre usar el endpoint de rango de fechas cuando hay fechas especificadas
        if (startDateTime && endDateTime) {
          response = await eventsService.getDeviceEventsByDateRange(
            deviceSerial, 
            startDateTime, 
            endDateTime, 
            10000,
            pagination.page
          );
        } else {
          response = await eventsService.getEventsByDevice(deviceSerial, 10000);
        }
      }

      if (response && response.data) {
        let eventsArray = response.data;
        
        if (Array.isArray(eventsArray) && eventsArray.length > 0 && Array.isArray(eventsArray[0])) {
          eventsArray = eventsArray.flat();
        }
        
        const processedEvents = eventsArray.map(event => ({
          "Número de dispositivo": event.serial_number || event.device_serial || event.device_id || "N/A",
          "Latitud": event.latitude || event.lat || "N/A",
          "Longitud": event.longitude || event.lng || "N/A", 
          "Conductor": event.user_name ? `${event.user_name} ${event.user_last_name || ''}`.trim() : event.driver_name || "N/A",
          "Nombre de la alarma": event.alarm_name || event.exception_type || event.event_type || "N/A",
          "Geofence": event.geofence_name || "N/A",
          "Fecha": event.date_time || event.created_at || event.timestamp || "N/A",
          "Descripción": event.description || `Alarma: ${event.alarm_name || 'N/A'}`,
          _originalDate: event.date_time || event.created_at || event.timestamp
        }));

        // Ordenar por fecha de forma descendente (más nuevos primero)
        const sortedEvents = processedEvents.sort((a, b) => {
          const dateA = new Date(a._originalDate);
          const dateB = new Date(b._originalDate);
          return dateB - dateA;
        });

        // Solo actualizar si los datos realmente cambiaron
        const eventsChanged = JSON.stringify(sortedEvents) !== JSON.stringify(eventsData);
        if (eventsChanged) {
          setEventsData(sortedEvents);
        }
        
        // Actualizar información de paginación si está disponible
        if (response.meta || response.pagination) {
          const meta = response.meta || response.pagination;
          setPagination(prev => ({
            ...prev,
            total: meta.total || 0,
            page: meta.current_page || 1
          }));
        }
      }
    } catch (error) {
      console.warn('Error actualizando datos:', error);
      // No mostrar error al usuario para no interrumpir la experiencia
    }
  };

  // Función para verificar nuevas excepciones
  const checkForNewExceptions = async () => {
    if (!lastRequestParamsRef.current) return;
    
    try {
      const { deviceSerial, startDateTime, endDateTime, isAllDevices } = lastRequestParamsRef.current;
      
      let response;
      if (isAllDevices || !deviceSerial) {
        response = await eventsService.getEventsByDateRange(
          startDateTime, 
          endDateTime, 
          10000, 
          pagination.page
        );
      } else {
        if (startDateTime && endDateTime) {
          response = await eventsService.getDeviceEventsByDateRange(
            deviceSerial, 
            startDateTime, 
            endDateTime, 
            10000,
            pagination.page
          );
        } else {
          response = await eventsService.getEventsByDevice(deviceSerial, 10000);
        }
      }

      if (response && response.meta) {
        const meta = response.meta;
        const newTotalExceptions = meta.total_exceptions !== undefined ? meta.total_exceptions : meta.total || 0;
        
        // Solo actualizar si el total de excepciones cambió
        if (newTotalExceptions !== totalExceptions) {
          setTotalExceptions(newTotalExceptions);
          await updateEventsData();
        }
      }
    } catch (error) {
      console.warn('Error en polling:', error);
      // No mostrar error al usuario para no interrumpir la experiencia
    }
  };

  const [dateFrom, setDateFrom] = useState(getCurrentDateTime(true));
  const [dateTo, setDateTo] = useState(getCurrentDateTime(false));
  const [device, setDevice] = useState("Dispositivo-001");
  const [eventsData, setEventsData] = useState([]);
  const [mapEventsData, setMapEventsData] = useState([]); // Datos separados para el mapa
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10000, total: 0 });
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);
  const [hoveredEventIndex, setHoveredEventIndex] = useState(null);
  const { handleApiError, showModal, modalMessage, clearError } = useApiError();
  
  // Estados para el polling
  const [totalExceptions, setTotalExceptions] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Para controlar la primera carga
  const pollingIntervalRef = useRef(null);
  const lastRequestParamsRef = useRef(null);

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
    // Convertir de "2025-08-02T08:00" a "2025-08-02 08:00:00"
    return dateTime.replace('T', ' ') + ':00';
  };

  const handleSearch = async (showLoading = true) => {
    // Detener polling anterior si existe
    if (showLoading) {
      stopPolling();
    }
    
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const deviceSerial = getDeviceSerial(device);
      // Convertir las fechas al formato requerido por la API
      const startDateTime = formatDateTimeForAPI(dateFrom);
      const endDateTime = formatDateTimeForAPI(dateTo);

      // Guardar los parámetros de la última búsqueda para el polling
      const isAllDevices = device === "Dispositivo-001" || device === "all" || !deviceSerial;
      lastRequestParamsRef.current = {
        deviceSerial,
        startDateTime,
        endDateTime,
        isAllDevices
      };

      let response;

      if (!isAllDevices && deviceSerial) {
        // Siempre usar el endpoint de rango de fechas cuando hay fechas especificadas
        if (startDateTime && endDateTime) {
          response = await eventsService.getDeviceEventsByDateRange(
            deviceSerial, 
            startDateTime, 
            endDateTime, 
            10000, // Obtener hasta 10000 registros
            pagination.page
          );
        } else {
          response = await eventsService.getEventsByDevice(deviceSerial, 10000); 
        }
      } else {
        response = await eventsService.getEventsByDateRange(
          startDateTime, 
          endDateTime, 
          10000, 
          pagination.page
        );
      }

      if (response && response.data) {
        
        let eventsArray = response.data;
        
        if (Array.isArray(eventsArray) && eventsArray.length > 0 && Array.isArray(eventsArray[0])) {
          eventsArray = eventsArray.flat();
        }
        
        
        const processedEvents = eventsArray.map(event => ({
          "Número de dispositivo": event.serial_number || event.device_serial || event.device_id || "N/A",
          "Latitud": event.latitude || event.lat || "N/A",
          "Longitud": event.longitude || event.lng || "N/A", 
          "Conductor": event.user_name ? `${event.user_name} ${event.user_last_name || ''}`.trim() : event.driver_name || "N/A",
          "Nombre de la alarma": event.alarm_name || event.exception_type || event.event_type || "N/A",
          "Geofence": event.geofence_name || "N/A",
          "Fecha": event.date_time || event.created_at || event.timestamp || "N/A",
          "Descripción": event.description || `Alarma: ${event.alarm_name || 'N/A'}`,
          // Guardar la fecha original para ordenamiento
          _originalDate: event.date_time || event.created_at || event.timestamp
        }));

        // Ordenar por fecha de forma descendente (más nuevos primero)
        const sortedEvents = processedEvents.sort((a, b) => {
          const dateA = new Date(a._originalDate);
          const dateB = new Date(b._originalDate);
          return dateB - dateA; // Orden descendente (más nuevo primero)
        });

        setEventsData(sortedEvents);
        
        if (showLoading) {
          setMapEventsData(sortedEvents);
        }
        
        if (response.meta || response.pagination) {
          const meta = response.meta || response.pagination;
          
          setPagination(prev => ({
            ...prev,
            total: meta.total || 0,
            page: meta.current_page || 1
          }));
          
          // Iniciar polling en búsquedas manuales
          if (showLoading) {
            const newTotalExceptions = meta.total_exceptions !== undefined ? meta.total_exceptions : meta.total || 0;
            setTotalExceptions(newTotalExceptions);
            startPolling();
          }
        }
      } else {
        setEventsData([]);
      }

    } catch (error) {
      handleApiError(error);
      setEventsData([]);
      stopPolling();
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (!isInitialized && devices.length >= 0) { 
      setIsInitialized(true);
      handleSearch();
    }
  }, [devices, isInitialized]);

  // Detener polling cuando cambien filtros (excepto en la inicialización)
  useEffect(() => {
    if (isInitialized) {
      stopPolling();
    }
  }, [dateFrom, dateTo, device, isInitialized]);

  // Limpiar el polling cuando el componente se desmonte
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    setTimeout(handleSearch, 0);
  };

  const handleEventRowClick = (index) => {
    if (selectedEventIndex === index) {
      setSelectedEventIndex(null);
    } else {
      setSelectedEventIndex(index);
    }
  };

  const handleEventRowHover = (index) => {
    setHoveredEventIndex(index);
  };

  const handleEventRowLeave = () => {
    setHoveredEventIndex(null);
  };

  const headers = ["Número de dispositivo", "Latitud", "Longitud", "Conductor", "Nombre de la alarma", "Geofence", "Fecha"];

  return (
    <div className="events-view">
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
            <LeafletMap eventsData={mapEventsData} selectedEventIndex={selectedEventIndex} hoveredEventIndex={hoveredEventIndex} />
          </div>
        </div>
        <div className="info-right">
          {/* Tabla de eventos */}
          <div className="events-table-container">
            {/* <div className="device-info-header">
              Eventos del Sistema 
              {selectedEventIndex !== null ? (
                <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '10px', color: '#2196F3' }}>
                  (Mostrando evento #{selectedEventIndex + 1} - Haz clic nuevamente para ver todos)
                </span>
              ) : pagination.total > 0 ? (
                <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '10px' }}>
                  ({pagination.total} eventos encontrados - Haz clic en un evento para verlo individualmente)
                </span>
              ) : null}
            </div> */}
            
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                Cargando eventos...
              </div>
            ) : eventsData.length > 0 ? (
              <>
                <Table 
                  headers={headers}
                  data={eventsData}
                  onRowClick={handleEventRowClick}
                  onRowHover={handleEventRowHover}
                  onRowLeave={handleEventRowLeave}
                  selectedIndex={selectedEventIndex}
                  hoveredIndex={hoveredEventIndex}
                />
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No se encontraron eventos para los filtros seleccionados
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de error */}
      {showModal && (
        <Modal isOpen={showModal} onClose={clearError}>
          <StatusModal
            title="Error en Eventos"
            msg={modalMessage}
            onClose={clearError}
            isError={true}
          />
        </Modal>
      )}
    </div>
  );
}

function LeafletMap({ eventsData = [], selectedEventIndex = null, hoveredEventIndex = null }) {
  useEffect(() => {
    // Limpiar mapa existente si existe
    const mapContainer = document.getElementById("leaflet-map-events");
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
      mapContainer.innerHTML = '';
    }

    // Coordenadas por defecto (centro de México)
    const defaultLat = 40.7142700;
    const defaultLng = -74.0059700;
    
    // Filtrar eventos válidos
    const validEvents = eventsData.filter(event => 
      event.Latitud && event.Longitud && 
      event.Latitud !== "N/A" && event.Longitud !== "N/A" &&
      !isNaN(parseFloat(event.Latitud)) && !isNaN(parseFloat(event.Longitud))
    );

    // Determinar qué eventos mostrar
    let eventsToShow = validEvents;
    let highlightedEventIndex = null;
    
    // Prioridad: hover > selección > todos
    if (hoveredEventIndex !== null && validEvents[hoveredEventIndex]) {
      eventsToShow = [validEvents[hoveredEventIndex]];
      highlightedEventIndex = hoveredEventIndex;
    } else if (selectedEventIndex !== null && validEvents[selectedEventIndex]) {
      eventsToShow = [validEvents[selectedEventIndex]];
      highlightedEventIndex = selectedEventIndex;
    }
    
    // Si hay eventos para mostrar, usar el primero como centro
    let centerLat = defaultLat;
    let centerLng = defaultLng;
    
    if (eventsToShow.length > 0) {
      centerLat = parseFloat(eventsToShow[0].Latitud);
      centerLng = parseFloat(eventsToShow[0].Longitud);
    }


    const map = window.L.map("leaflet-map-events").setView([centerLat, centerLng], 13);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Agregar marcadores para los eventos a mostrar
    eventsToShow.forEach((event, index) => {
      const lat = parseFloat(event.Latitud);
      const lng = parseFloat(event.Longitud);
      
      const popupContent = `
        <div style="font-size: 12px;">
          <strong>${event["Nombre de la alarma"]}</strong><br/>
          <strong>Dispositivo:</strong> ${event["Número de dispositivo"]}<br/>
          <strong>Conductor:</strong> ${event.Conductor}<br/>
          <strong>Fecha:</strong> ${event.Fecha}<br/>
          <strong>Coords:</strong> ${lat}, ${lng}
        </div>
      `;
      
      // Usar diferentes colores según el tipo de alarma
      const alarmName = event["Nombre de la alarma"].toLowerCase();
      let markerColor = 'blue'; // color por defecto
      
      if (alarmName.includes('panico') || alarmName.includes('emergency')) {
        markerColor = 'red';
      } else if (alarmName.includes('velocidad') || alarmName.includes('speed')) {
        markerColor = 'orange';
      } else if (alarmName.includes('zona') || alarmName.includes('geofence')) {
        markerColor = 'purple';
      }

      const marker = window.L.circleMarker([lat, lng], {
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

    // Ajustar la vista según la cantidad de eventos
    if (eventsToShow.length > 1) {
      const group = new window.L.featureGroup(
        eventsToShow.map(event => 
          window.L.circleMarker([parseFloat(event.Latitud), parseFloat(event.Longitud)])
        )
      );
      map.fitBounds(group.getBounds().pad(0.1));
    } else if (eventsToShow.length === 1) {
      // Si es un solo evento, hacer zoom más cercano
      map.setView([centerLat, centerLng], 16);
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [eventsData, selectedEventIndex, hoveredEventIndex]); // Re-ejecutar cuando cambien los eventos, selección o hover

  return (
    <div
      id="leaflet-map-events"
      style={{ width: "100%", height: "100%" }}
    ></div>
  );
}

export default EventsView;