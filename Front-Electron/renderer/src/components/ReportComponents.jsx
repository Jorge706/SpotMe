import { useEffect, useState } from "react";
import { fetchDevices } from "../utils/devicesApi";
import { getHistoricalLocations, getHistoricalEvents, getWatchdog } from "../services/reportService";
import Table from "./Table";
import * as XLSX from 'xlsx';

// Helpers datetime-local -> backend format
function toLocalDateTimeInput(date = new Date()){
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Formatear fecha y hora a formato backend
function tobackendDateTime(dateTimeString) {
    if(!dateTimeString) return null;
    const [datePart, timePart] = dateTimeString.split('T');
    return `${datePart} ${timePart}:00`;
}

// Extraer el serial del objeto device
function getSerialFromDevice(device) {
    return (
        device?.serial_number ??
        device?.device_serial ??
        device?.serial ??
        device?.imei ??
        null
    );
}

async function fetchAllPagesFortDevice(deviceSerial, startDate, endDate, per_page = 10000, page = 1) {
    const resp = await getHistoricalLocations(deviceSerial, startDate, endDate);
    const rows = Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp) ? resp
        : resp?.items ?? resp?.rows ?? [];
    
    return rows;

}

export function ReportsComponent() {
    // Catalogo
    const [devices, setDevices] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [error, setError] = useState("");

    // Seleccionar dispositivos para ubicaciones
    const [allDevices, setAllDevices] = useState(true);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");

    // Seleccionar dispositivos para eventos
    const [allDevicesEvents, setAllDevicesEvents] = useState(true);
    const [selectedDeviceIdEvents, setSelectedDeviceIdEvents] = useState("");

    // Rango de fechas para ubicaciones
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return toLocalDateTimeInput(d);
    });
    const [endDate, setEndDate] = useState(() => toLocalDateTimeInput(new Date()));

    // Rango de fechas para eventos
    const [startDateEvents, setStartDateEvents] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return toLocalDateTimeInput(d);
    });
    const [endDateEvents, setEndDateEvents] = useState(() => toLocalDateTimeInput(new Date()));

    // Resultados para ubicaciones
    const [loadingQuery, setLoadingQuery] = useState(false);
    const [rowsByDevice, setRowsByDevice] = useState({});
    const [totalRows, setTotalRows] = useState(0);

    // Resultados para eventos
    const [loadingEventsQuery, setLoadingEventsQuery] = useState(false);
    const [eventsByDevice, setEventsByDevice] = useState({});
    const [totalEvents, setTotalEvents] = useState(0);

    // Resultados para watchdog
    const [loadingWatchdog, setLoadingWatchdog] = useState(false);
    const [watchdogData, setWatchdogData] = useState([]);
    const [totalWatchdog, setTotalWatchdog] = useState(0);

    // Cargar dispositivos.
    useEffect(() => {
        const loadDevices = async () => {
            setLoadingDevices(true);
            setError("");
            try {
                await fetchDevices(setDevices, setMeta, {per_page: 1000});
            } catch (e) {
                setError(e?.message || "Error cargando dispositivos");
                setDevices([]);
            } finally {
                setLoadingDevices(false);
            }
        };
        
        loadDevices();
    }, []);

    // Validar filtros.
    const validate = () => {
        console.log("🔍 Validando filtros ubicaciones:", { 
            startDate, 
            endDate, 
            allDevices, 
            selectedDeviceId,
            devicesLength: devices?.length 
        });

        if(!startDate || !endDate) return "Selecciona un rango de fechas.";
        if(new Date(startDate) > new Date(endDate)) return "La fecha inicial no puede ser mayor a la fecha de fín.";
        if(!allDevices && !selectedDeviceId) return "Selecciona por lo menos un dispositivo.";
        if(!devices?.length) return "No hay dispositivos por consultar.";
        return null;
    }

    const resolveDevicesToQuery = (isEvents = false) => {
        if(isEvents) {
            if(allDevicesEvents) return devices;
            const one = devices.find((d) => d.device_id === Number(selectedDeviceIdEvents));
            return one ? [one] : [];
        } else {
            if(allDevices) return devices;
            const one = devices.find((d) => d.device_id === Number(selectedDeviceId));
            return one ? [one] : [];
        }
    }

    // Validar filtros para eventos
    const validateEvents = () => {
        console.log("🔍 Validando filtros eventos:", { 
            startDateEvents, 
            endDateEvents, 
            allDevicesEvents, 
            selectedDeviceIdEvents,
            devicesLength: devices?.length 
        });

        if(!startDateEvents || !endDateEvents) return "Selecciona un rango de fechas.";
        if(new Date(startDateEvents) > new Date(endDateEvents)) return "La fecha inicial no puede ser mayor a la fecha de fín.";
        if(!allDevicesEvents && !selectedDeviceIdEvents) return "Selecciona por lo menos un dispositivo.";
        if(!devices?.length) return "No hay dispositivos por consultar.";
        return null;
    }

    // Consultar por dispositivo y juntar.
    const onQuery = async () => {
        console.log("🚗 Iniciando consulta de ubicaciones históricas");
        const err = validate();
        if(err) return alert(err);

        const start_date = tobackendDateTime(startDate);
        const end_date = tobackendDateTime(endDate);
        const list = resolveDevicesToQuery();
        
        console.log("📅 Fechas:", { start_date, end_date });
        console.log("📱 Dispositivos a consultar:", list);

        setLoadingQuery(true);
        setError("");
        setRowsByDevice({});
        setTotalRows(0);

        try {
            const tasks = list.map(async (dev) => {
                const serial = getSerialFromDevice(dev);
                if(!serial) {
                    return { serial: "(sin-serial)", rows: [], error: "Dispositivo sin serial", device:dev };
                }
                try {
                    const rows = await fetchAllPagesFortDevice(serial, start_date, end_date);
                    console.log("📍 Datos recibidos para ubicaciones:", { serial, rows });
                    return { serial, rows, device: dev };
                } catch (e) {
                    return { serial, rows: [], error: e?.message || "Error", device: dev }
                }
            });
            
            const results = await Promise.all(tasks);
            const map = {};
            let count = 0;
            for (const r of results){
                map[r.serial] = r;
                count += Array.isArray(r.rows) ? r.rows.length : 0;
            }
            setRowsByDevice(map);
            setTotalRows(count);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Error consultando reportes");
        } finally {
            setLoadingQuery(false);
        }
    }

  // Preparar datos para la tabla
  const prepareTableData = () => {
    const allData = [];
    console.log("📊 Preparando datos de ubicaciones:", rowsByDevice);
    Object.values(rowsByDevice).forEach(({ device, rows }) => {
      console.log("📊 Procesando dispositivo:", { device, rows });
      if (Array.isArray(rows) && rows.length > 0) {
        // Si rows[0] es un array, entonces rows es un array de arrays
        const dataToProcess = Array.isArray(rows[0]) ? rows[0] : rows;
        dataToProcess.forEach(row => {
          console.log("📊 Procesando fila individual:", row);
          allData.push({
            vehiculo: device?.vehicle?.vehicle_name || 'Sin nombre',
            serial: device.serial_number,
            fecha: row.date_time || row.date || '-',
            latitud: row.latitude || row.lat || '-',
            longitud: row.longitude || row.lng || '-',
            conductor: `${row.driver_name || ''} ${row.driver_last_name || ''}`.trim() || '-',
          });
        });
      }
    });
    console.log("📊 Datos finales ubicaciones:", allData);
    return allData;
  };

  // Preparar datos de eventos para la tabla
  const prepareEventsTableData = () => {
    const allData = [];
    console.log("📊 Preparando datos de eventos:", eventsByDevice);
    Object.values(eventsByDevice).forEach(({ device, events }) => {
      console.log("📊 Procesando dispositivo para eventos:", { device, events });
      if (Array.isArray(events) && events.length > 0) {
        // Si events[0] es un array, entonces events es un array de arrays (estructura anidada)
        const dataToProcess = Array.isArray(events[0]) ? events[0] : events;
        dataToProcess.forEach(event => {
          console.log("📊 Procesando evento individual:", event);
          allData.push({
            serial: event.serial_number || '-',
            latitud: event.latitude || '-',
            longitud: event.longitude || '-',
            fecha: event.date_time || '-',
            alarma: event.alarm_name || '-',
            geocerca: event.geofence_name || '-',
            conductor: `${event.user_name || ''} ${event.user_last_name || ''}`.trim() || '-',
          });
        });
      }
    });
    console.log("📊 Datos finales de eventos:", allData);
    return allData;
  };

    // Consultar eventos por dispositivo
    const onQueryEvents = async () => {
        console.log("🔔 Iniciando consulta de eventos");
        const err = validateEvents();
        if(err) return alert(err);

        const start_date = tobackendDateTime(startDateEvents);
        const end_date = tobackendDateTime(endDateEvents);
        const list = resolveDevicesToQuery(true);

        console.log("📅 Fechas eventos:", { start_date, end_date });
        console.log("📱 Dispositivos a consultar eventos:", list);

        setLoadingEventsQuery(true);
        setError("");
        setEventsByDevice({});
        setTotalEvents(0);

        try {
            const tasks = list.map(async (dev) => {
                const serial = getSerialFromDevice(dev);
                if(!serial) {
                    return { serial: "(sin-serial)", events: [], error: "Dispositivo sin serial", device:dev };
                }
                try {
                    const response = await getHistoricalEvents(serial, start_date, end_date);
                    console.log("📍 Respuesta eventos:", response);
                    // La respuesta viene como array anidado en response.data
                    const events = Array.isArray(response?.data) ? response.data : [];
                    console.log("📍 Eventos procesados:", events);
                    return { serial, events, device: dev };
                } catch (e) {
                    return { serial, events: [], error: e?.message || "Error", device: dev }
                }
            });
            
            const results = await Promise.all(tasks);
            const map = {};
            let count = 0;
            for (const r of results){
                map[r.serial] = r;
                count += Array.isArray(r.events) ? r.events.length : 0;
            }
            setEventsByDevice(map);
            setTotalEvents(count);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Error consultando eventos");
        } finally {
            setLoadingEventsQuery(false);
        }
    };

    // Consultar watchdog
    const onQueryWatchdog = async () => {
        console.log("👀 Iniciando consulta de watchdog");
        setLoadingWatchdog(true);
        setError("");
        setWatchdogData([]);
        setTotalWatchdog(0);

        try {
            const response = await getWatchdog();
            console.log("👀 Respuesta watchdog:", response);
            const data = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response) ? response
                : response?.items ?? response?.rows ?? [];

            // Manejar estructura anidada similar a eventos
            const dataToProcess = Array.isArray(data[0]) ? data[0] : data;

            const formattedData = dataToProcess.map(item => ({
                serial: item.serial_number || '-',
                latitud: item.latitude || '-',
                longitud: item.longitude || '-',
                fecha: item.date_time || '-'
            }));

            setWatchdogData(formattedData);
            setTotalWatchdog(formattedData.length);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Error consultando watchdog");
        } finally {
            setLoadingWatchdog(false);
        }
    };

    // Función para exportar a Excel
    const exportToExcel = (data, filename) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    // Exportar reporte de ubicaciones
    const handleExportLocations = () => {
        if (Object.keys(rowsByDevice).length === 0) {
            alert("No hay datos para exportar");
            return;
        }
        const data = prepareTableData();
        exportToExcel(data, `reporte_ubicaciones_${new Date().toISOString().split('T')[0]}`);
    };

    // Exportar reporte de eventos
    const handleExportEvents = () => {
        if (Object.keys(eventsByDevice).length === 0) {
            alert("No hay datos para exportar");
            return;
        }
        const data = prepareEventsTableData();
        exportToExcel(data, `reporte_eventos_${new Date().toISOString().split('T')[0]}`);
    };

    // Exportar reporte de watchdog
    const handleExportWatchdog = () => {
        if (watchdogData.length === 0) {
            alert("No hay datos para exportar");
            return;
        }
        exportToExcel(watchdogData, `reporte_watchdog_${new Date().toISOString().split('T')[0]}`);
    };

    // Headers para las tablas
    const headers = [
        { key: 'dispositivo', label: 'Dispositivo' },
        { key: 'serial', label: 'Serial' },
        { key: 'fecha', label: 'Fecha y Hora' },
        { key: 'latitud', label: 'Latitud' },
        { key: 'longitud', label: 'Longitud' },
        { key: 'velocidad', label: 'Velocidad' },
    ];  return (
    <div className="tab-view" style={{ 
      padding: '20px',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Sección de Reporte de Ubicaciones Históricas */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Reporte de Ubicaciones Históricas</h4>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Configure los parámetros y genere el reporte.
          </p>
          <h4 style={{ margin: '0 0 15px 0' }}>Filtros de Búsqueda</h4>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h5 style={{ margin: '0 0 10px 0' }}>Rango de Fechas:</h5>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h5 style={{ margin: '0 0 10px 0' }}>Dispositivos:</h5>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                <select
                  value={allDevices ? "" : selectedDeviceId}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setAllDevices(true);
                    } else {
                      setAllDevices(false);
                      setSelectedDeviceId(e.target.value);
                    }
                  }}
                  style={{ 
                    width: '300px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: loadingDevices ? '#f5f5f5' : 'white',
                    cursor: loadingDevices ? 'wait' : 'pointer'
                  }}
                  disabled={loadingDevices}
                >
                  <option value="">
                    {loadingDevices 
                      ? "Cargando dispositivos..." 
                      : devices.length === 0 
                        ? "No hay dispositivos disponibles" 
                        : "2C95E3498CD4"
                    }
                  </option>
                  {!loadingDevices && devices.map((device) => (
                    <option 
                      key={device.device_id} 
                      value={device.device_id}
                    >
                      {device.serial_number}
                    </option>
                  ))}
                </select>

                <button
                  onClick={onQuery}
                  disabled={loadingQuery}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#99CC33',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loadingQuery ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loadingQuery ? 'Cargando...' : 'Generar y descargar'}
                </button>
                            <button
              onClick={handleExportLocations}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Exportar a Excel
            </button>
              </div>
              {error && (
                <div style={{ 
                  color: 'red', 
                  fontSize: '12px', 
                  marginTop: '5px' 
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mensajes de estado */}
        {error && <div style={{ color: 'red', padding: '0 20px' }}>{error}</div>}
        {totalRows > 0 && (
          <div style={{ 
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Total de registros: {totalRows}</span>

          </div>
        )}

        {/* Tabla de resultados */}
        {/* {Object.keys(rowsByDevice).length > 0 && (
          <Table 
            headers={[
              { key: 'dispositivo', label: 'Dispositivo' },
              { key: 'serial', label: 'Serial' },
              { key: 'fecha', label: 'Fecha y Hora' },
              { key: 'latitud', label: 'Latitud' },
              { key: 'longitud', label: 'Longitud' },
              { key: 'velocidad', label: 'Velocidad' }
            ]} 
            data={prepareTableData()} 
          />
        )} */}
      </div>

      {/* Sección de Reporte de Eventos */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Reporte de Eventos</h4>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Configure los parámetros y genere el reporte.
          </p>
          <h4 style={{ margin: '0 0 15px 0' }}>Filtros de Búsqueda</h4>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h5 style={{ margin: '0 0 10px 0' }}>Rango de Fechas:</h5>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="datetime-local"
                  value={startDateEvents}
                  onChange={(e) => setStartDateEvents(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="datetime-local"
                  value={endDateEvents}
                  onChange={(e) => setEndDateEvents(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h5 style={{ margin: '0 0 10px 0' }}>Dispositivos:</h5>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                <select
                  value={allDevicesEvents ? "" : selectedDeviceIdEvents}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setAllDevicesEvents(true);
                    } else {
                      setAllDevicesEvents(false);
                      setSelectedDeviceIdEvents(e.target.value);
                    }
                  }}
                  style={{ 
                    width: '300px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: loadingDevices ? '#f5f5f5' : 'white',
                    cursor: loadingDevices ? 'wait' : 'pointer'
                  }}
                  disabled={loadingDevices}
                >
                  <option value="">
                    {loadingDevices 
                      ? "Cargando dispositivos..." 
                      : devices.length === 0 
                        ? "No hay dispositivos disponibles" 
                        : "2C95E3498CD4"
                    }
                  </option>
                  {!loadingDevices && devices.map((device) => (
                    <option 
                      key={device.device_id} 
                      value={device.device_id}
                    >
                      {device.serial_number}
                    </option>
                  ))}
                </select>

                <button
                  onClick={onQueryEvents}
                  disabled={loadingEventsQuery}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#99CC33',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loadingEventsQuery ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loadingEventsQuery ? 'Cargando...' : 'Generar y descargar'}
                </button>
                            <button
              onClick={handleExportEvents}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Exportar a Excel
            </button>
          </div>
          {error && (
            <div style={{ 
              color: 'red', 
              fontSize: '12px', 
                  marginTop: '5px' 
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensajes de estado para eventos */}
        {error && <div style={{ color: 'red', padding: '0 20px' }}>{error}</div>}
        {totalEvents > 0 && (
          <div style={{ 
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Total de eventos: {totalEvents}</span>

          </div>
        )}

        {/* Tabla de resultados de eventos */}
        {/* {Object.keys(eventsByDevice).length > 0 && (
          <Table 
            headers={[
              { key: 'serial', label: 'Serial' },
              { key: 'latitud', label: 'Latitud' },
              { key: 'longitud', label: 'Longitud' },
              { key: 'fecha', label: 'Fecha y Hora' },
              { key: 'alarma', label: 'Alarma' },
              { key: 'usuario', label: 'Usuario' }
            ]} 
            data={prepareEventsTableData()} 
          />
        )} */}
      </div>

      {/* Sección de Reporte de Watchdog */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Reporte de Watchdog</h4>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Consultar el estado actual de conexión de los dispositivos.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={onQueryWatchdog}
              disabled={loadingWatchdog}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#99CC33',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingWatchdog ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {loadingWatchdog ? 'Cargando...' : 'Generar y descargar'}
            </button>
              <button
                onClick={handleExportWatchdog}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Exportar a Excel
              </button>
          </div>

          {error && <div style={{ color: 'red', padding: '20px 0' }}>{error}</div>}
          {totalWatchdog > 0 && (
            <div style={{ 
              padding: '20px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Total de dispositivos: {totalWatchdog}</span>

            </div>
          )}

          {/* {watchdogData.length > 0 && (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              marginTop: '20px'
            }}>
              <Table 
                headers={[
                  { key: 'serial', label: 'Serial' },
                  { key: 'latitud', label: 'Latitud' },
                  { key: 'longitud', label: 'Longitud' },
                  { key: 'fecha', label: 'Fecha y Hora' }
                ]} 
                data={watchdogData} 
              />
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}