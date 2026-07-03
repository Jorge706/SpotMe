import { useEffect, useState, useRef } from "react";
import pusher from "../../utils/pusher";
import { eventsService } from "../../services/eventsService";

function Visualizacion() {
    const [devices, setDevices] = useState([]);
    const [device, setDevice] = useState("Dispositivo-001");
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null); // ← 🌍 live GPS here
    const [alertasEnviadasPorDispositivo, setAlertasEnviadasPorDispositivo] = useState({}); // Track por dispositivo

    const selectedDevice =
        device === "Dispositivo-001"
            ? null
            : devices.find(
                (d) =>
                    d.serial_number === device ||
                    d.device_serial === device ||
                    d.device_id === device
            );

    const loadDevices = async () => {
        setLoadingDevices(true);
        try {
            const response = await eventsService.fetchAllDevices();
            const allDevices = Array.isArray(response.data) ? response.data : [];
            setDevices(allDevices);

            if (allDevices.length > 0 && device === "Dispositivo-001") {
                const firstDeviceSerial =
                    allDevices[0].serial_number ||
                    allDevices[0].device_id ||
                    allDevices[0].serial;
                setDevice(firstDeviceSerial);
            }
        } catch (error) {
            console.error("❌ Error al cargar dispositivos:", error);
            setDevices([]);
        } finally {
            setLoadingDevices(false);
        }
    };

    // Función simple para mostrar notificaciones
    const mostrarNotificacion = (titulo, mensaje) => {
        if (Notification.permission === "granted") {
            new Notification(titulo, {
                body: mensaje,
                icon: '/app_logo.png'
            });
        }
    };

    // Función para consultar alertas reales
    const consultarAlertas = async () => {
        if (!selectedDevice || !selectedDevice.serial_number) {
            console.log('❌ No hay dispositivo seleccionado');
            return;
        }

        try {
            // Consultar alertas de los últimos 5 minutos
            const ahora = new Date();
            const cincoMinutosAtras = new Date(ahora.getTime() - 5 * 60 * 1000); // Últimos 5 minutos
            
            // Formatear fechas para la API
            const formatearFecha = (fecha) => {
                const año = fecha.getFullYear();
                const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                const dia = String(fecha.getDate()).padStart(2, '0');
                const hora = String(fecha.getHours()).padStart(2, '0');
                const minuto = String(fecha.getMinutes()).padStart(2, '0');
                const segundo = String(fecha.getSeconds()).padStart(2, '0');
                return `${año}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
            };

            console.log(`🔍 Consultando alertas para ${selectedDevice.serial_number}...`);
            
            const respuesta = await eventsService.getDeviceEventsByDateRange(
                selectedDevice.serial_number,
                formatearFecha(cincoMinutosAtras),
                formatearFecha(ahora),
                50,
                1
            );

            if (respuesta && respuesta.data) {
                const eventos = Array.isArray(respuesta.data) ? respuesta.data.flat() : [];
                console.log(`✅ Se encontraron ${eventos.length} eventos en los últimos 5 minutos`);
                
                // Obtener el Set de alertas enviadas para este dispositivo específico
                setAlertasEnviadasPorDispositivo(prevState => {
                    // Asegurar que existe el Set para este dispositivo
                    if (!prevState[selectedDevice.serial_number]) {
                        prevState = {
                            ...prevState,
                            [selectedDevice.serial_number]: new Set()
                        };
                    }
                    
                    const alertasEnviadasEsteDispositivo = prevState[selectedDevice.serial_number];
                    
                    // Filtrar alertas que no han sido enviadas aún para ESTE dispositivo
                    const alertasNuevas = eventos.filter(alerta => {
                        // Crear un ID más específico y único
                        const alertaId = alerta.exception_id || 
                            `${alerta.date_time || alerta.created_at}_${alerta.alarm_name}_${selectedDevice.serial_number}_${alerta.latitude || ''}_${alerta.longitude || ''}`;
                        
                        const yaEnviada = alertasEnviadasEsteDispositivo.has(alertaId);
                        
                        if (yaEnviada) {
                            console.log(`🔄 Alerta ya enviada para ${selectedDevice.serial_number} (ignorando): ${alerta.alarm_name} - ${alerta.date_time}`);
                        }
                        
                        return !yaEnviada;
                    });
                    
                    console.log(`🆕 Alertas completamente nuevas: ${alertasNuevas.length}`);
                    
                    // Si hay alertas nuevas, enviarlas
                    if (alertasNuevas.length > 0) {
                        console.log(`📤 Enviando ${alertasNuevas.length} notificaciones nuevas`);
                        
                        const nuevoSetAlertas = new Set([...alertasEnviadasEsteDispositivo]);
                        
                        alertasNuevas.forEach((alerta, index) => {
                            // Crear ID único para la alerta (mismo que arriba)
                            const alertaId = alerta.exception_id || 
                                `${alerta.date_time || alerta.created_at}_${alerta.alarm_name}_${selectedDevice.serial_number}_${alerta.latitude || ''}_${alerta.longitude || ''}`;
                            
                            // Marcar como enviada ANTES de mostrar la notificación
                            nuevoSetAlertas.add(alertaId);
                            
                            // Retraso escalonado para evitar spam de notificaciones
                            setTimeout(() => {
                                mostrarNotificacion(
                                    `🚨 ${alerta.alarm_name || 'Nueva Alerta'}`,
                                    `Dispositivo: ${selectedDevice.serial_number} - ${alerta.date_time || alerta.created_at || ''}`
                                );
                                console.log(`✅ Notificación enviada: ${alerta.alarm_name} - ${alerta.date_time}`);
                            }, index * 1000); // 1 segundo de diferencia entre cada notificación
                        });
                        
                        console.log(`📊 Total alertas marcadas como enviadas para ${selectedDevice.serial_number}: ${nuevoSetAlertas.size}`);
                        
                        // Retornar el estado actualizado
                        return {
                            ...prevState,
                            [selectedDevice.serial_number]: nuevoSetAlertas
                        };
                    } else {
                        console.log('� No hay alertas nuevas');
                        return prevState; // Sin cambios
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error al consultar alertas:', error);
        }
    };

    // Hacer las funciones disponibles globalmente para pruebas
    window.mostrarNotificacion = mostrarNotificacion;
    window.consultarAlertas = consultarAlertas;

    useEffect(() => {
        loadDevices();
    }, []);

    // Solicitar permisos de notificación al cargar el componente
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!selectedDevice?.serial_number) return;

        const channel = pusher.subscribe(`trips-device-${selectedDevice.serial_number}`);

        channel.bind('trip.created', function (data) {
            const trip = data.trip;
            console.log('🚗 Nuevo viaje recibido:', trip);

            // Solo actualiza si el evento es del dispositivo seleccionado
            if (trip.serial_number === selectedDevice.serial_number) {
                setCurrentLocation({ lat: trip.latitude, lng: trip.longitude });
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [selectedDevice?.serial_number]);

    // Polling automático para alertas cada 60 segundos
    useEffect(() => {
        if (!selectedDevice?.serial_number) return;

        console.log(`🔄 Iniciando monitoreo de alertas para ${selectedDevice.serial_number}`);
        
        // Consultar inmediatamente
        consultarAlertas();
        
        // Configurar polling cada 60 segundos
        const intervalo = setInterval(() => {
            consultarAlertas();
        }, 30000); // 30 segundos

        return () => {
            console.log(`⏹️ Deteniendo monitoreo de alertas`);
            clearInterval(intervalo);
        };
    }, [selectedDevice?.serial_number]);

    return (
        <div className="visualizacion-container">
            <div className="visualizacion-header">
                <div className="visualizacion-header-left">
                    Dispositivo:
                    <select
                        className="device-select"
                        value={device}
                        onChange={(e) => setDevice(e.target.value)}
                        disabled={loadingDevices}
                    >
                        <option value="Dispositivo-001">Selecciona un dispositivo</option>
                        {devices.map((d) => (
                            <option
                                key={d.device_id || d.id || d.serial_number}
                                value={
                                    d.serial_number ||
                                    d.device_serial ||
                                    d.serial ||
                                    d.device_id
                                }
                            >
                                {d.vehicle?.vehicle_name
                                    ? `${d.vehicle.vehicle_name} (${d.serial_number})`
                                    : d.serial_number || `Dispositivo ${d.device_id}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="visualizacion-map-container">
                <div className="map-left">
                    <div className="map-container">
                        <LeafletMap currentLocation={currentLocation} />
                    </div>
                </div>

                <div className="info-right">
                    <div className="device-info-container">
                        <div className="device-info-header">Información de la Unidad</div>
                        {selectedDevice ? (
                            <div className="device-info-body">
                                <p><strong>ID del dispositivo:</strong> {selectedDevice.device_id}</p>
                                <p><strong>Serial:</strong> {selectedDevice.serial_number}</p>
                                <p><strong>Activo:</strong> {selectedDevice.is_active ? "Sí" : "No"}</p>
                                <p><strong>Fecha de creación:</strong> {selectedDevice.created_at}</p>
                                <p><strong>Última actualización:</strong> {selectedDevice.updated_at}</p>
                                {selectedDevice.vehicle && (
                                    <>
                                        <p><strong>Nombre del vehículo:</strong> {selectedDevice.vehicle.vehicle_name}</p>
                                        <p><strong>VIN:</strong> {selectedDevice.vehicle.vin}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <p>Selecciona un dispositivo para ver su información.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LeafletMap({ currentLocation }) {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [showMap, setShowMap] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

    // Initialize map only once
    useEffect(() => {
        if (mapRef.current) return;

        const initialLat = 34.6777115;
        const initialLng = 135.4036376;

        const map = window.L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([initialLat, initialLng], 17);

        mapRef.current = map;
        mapContainerRef.current.style.visibility = 'hidden';

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        markerRef.current = window.L.marker([initialLat, initialLng], {
            opacity: 0
        }).addTo(map).bindPopup("Ubicación actual");

        // Proper initialization sequence
        const initMap = () => {
            map.invalidateSize(true);
            setIsMapReady(true);
        };

        // Wait for map to be ready
        setTimeout(initMap, 100);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Handle location updates
    useEffect(() => {
        if (!isMapReady || !currentLocation || !mapRef.current || !markerRef.current) return;

        const lat = currentLocation.latitude ?? currentLocation.lat;
        const lng = currentLocation.longitude ?? currentLocation.lng;

        // Final coordinate validation
        if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            console.error('Invalid coordinates:', currentLocation);
            return;
        }

        // First location - reveal map
        if (!showMap) {
            mapContainerRef.current.style.visibility = 'visible';
            markerRef.current.setOpacity(1);
            
            // Add controls safely after delay
            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.addControl(window.L.control.zoom());
                    mapRef.current.addControl(window.L.control.attribution());
                }
            }, 50);
            
            setShowMap(true);
        }

        // Animation sequence
        const updateMap = () => {
            if (!mapRef.current || !markerRef.current) return;
            
            try {
                markerRef.current.setLatLng([lat, lng]);
                mapRef.current.flyTo([lat, lng], 17, {
                    duration: 0.5,
                });
                markerRef.current.getPopup()?.setContent("Ubicación actual").openOn(mapRef.current);
            } catch (error) {
                console.error('Animation error:', error);
                if (mapRef.current) mapRef.current.setView([lat, lng], 17);
                if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
            }
        };

        // Ensure DOM is ready
        requestAnimationFrame(updateMap);

    }, [currentLocation, showMap, isMapReady]);

    return (
        <>
            {!showMap && (
                <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "#777",
                    textAlign: "center",
                    padding: "1rem",
                }}>
                    Esperando datos de ubicación...
                </div>
            )}
            <div
                ref={mapContainerRef}
                id="leaflet-map"
                style={{ 
                    width: "100%", 
                    height: "100%",
                    visibility: showMap ? 'visible' : 'hidden'
                }}
            />
        </>
    );
}


export default Visualizacion;