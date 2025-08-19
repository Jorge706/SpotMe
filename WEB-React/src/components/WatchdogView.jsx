import { useState, useEffect } from "react";
import Table from "./Table";
import Pagination from "./Pagination";
import Modal from "./Modal";
import { StatusModal } from "./StatusModal";
import { watchdogService } from "../services/watchdogService.js";
import { useApiError } from "../hooks/useApiError.js";

function WatchdogView() {
  const [watchdogData, setWatchdogData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ 
    page: 1, 
    perPage: 10, 
    total: 0 
  });
  const { handleApiError, showModal, modalMessage, clearError } = useApiError();

  const handleSearch = async () => {
    setLoading(true);
    try {

      const response = await watchdogService.getLastDeviceCommunication(pagination.perPage, pagination.page);

      // Procesar la respuesta de la API
      if (response && response.data) {
        
        // Los datos pueden venir como array anidado [[{...}]] o array simple [{...}]
        let watchdogArray = response.data;
        
        // Si es un array anidado, aplanar
        if (Array.isArray(watchdogArray) && watchdogArray.length > 0 && Array.isArray(watchdogArray[0])) {
          watchdogArray = watchdogArray.flat();
        }
        
        
        const processedWatchdog = watchdogArray.map(device => ({
          "N. Serie": device.serial_number || "N/A",
          "Latitud": device.latitude ? device.latitude.toString() : "Coordenadas",
          "Longitud": device.longitude ? device.longitude.toString() : "Coordenadas", 
          "Fecha": device.date_time ? device.date_time.split(' ')[0] : "dd-mm-aa", // Solo la fecha
          // Datos originales para referencia
          _rawData: device,
          // Guardar la fecha original para ordenamiento
          _originalDate: device.date_time
        }));

        // Ordenar por fecha de forma descendente (más nuevos primero)
        const sortedWatchdog = processedWatchdog.sort((a, b) => {
          const dateA = new Date(a._originalDate);
          const dateB = new Date(b._originalDate);
          return dateB - dateA; // Orden descendente (más nuevo primero)
        });

        setWatchdogData(sortedWatchdog);
        
        // Actualizar información de paginación si está disponible
        if (response.meta) {
          setPagination(prev => ({
            ...prev,
            total: response.meta.total_devices || 0,
            page: response.meta.current_page || 1
          }));
        }
      } else {
        setWatchdogData([]);
      }

    } catch (error) {
      console.error("Error al buscar datos de watchdog:", error);
      handleApiError(error);
      setWatchdogData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de watchdog al montar el componente y cuando cambie la paginación
  useEffect(() => {
    handleSearch();
  }, [pagination.page]);

  // Función para cambiar la página
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Headers de la tabla según la imagen
  const headers = [
    "N. Serie",
    "Latitud", 
    "Longitud",
    "Fecha"
  ];

  return (
    <div className="events-view">
      
      {/* Header con botón buscar */}
      <div className="visualizacion-header">
        <div className="events-filters-inline" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        </div>
        <button 
          className="add-button" 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Contenedor de la tabla */}
      <div className="events-container">
        <div className="events-table-section" style={{ width: '100%' }}>
          {/* Header de la tabla
          <div className="device-info-header">
            <h3>
              Watchdog
              {pagination.total > 0 && (
                <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '10px' }}>
                  (Mostrando {watchdogData.length} de {pagination.total} dispositivos)
                </span>
              )}
            </h3>
          </div> */}
          
          {/* Contenedor de la tabla */}
          <div className="events-table-container">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Cargando datos de watchdog...
              </div>
            ) : watchdogData.length > 0 ? (
              <Table 
                headers={headers}
                data={watchdogData}
              />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No se encontraron datos de watchdog
              </div>
            )}
          </div>
        </div>
        
        {/* Componente de paginación - siempre en la parte inferior */}
        <div className="tab-footer" style={{ 
          width: '100%', 
          maxWidth: '100%', 
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '100%', 
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Pagination
              currentPage={pagination.page}
              totalPages={Math.max(1, Math.ceil(pagination.total / pagination.perPage))}
              onPageChange={handlePageChange}
              from={pagination.total > 0 ? (pagination.page - 1) * pagination.perPage + 1 : 0}
              to={pagination.total > 0 ? Math.min(pagination.page * pagination.perPage, pagination.total) : 0}
              total={pagination.total}
              label="dispositivos"
            />
          </div>
        </div>
      </div>
      
      {/* Modal de error */}
      {showModal && (
        <Modal isOpen={showModal} onClose={clearError}>
          <StatusModal
            title="Error en Watchdog"
            msg={modalMessage}
            onClose={clearError}
            isError={true}
          />
        </Modal>
      )}
    </div>
  );
}

export default WatchdogView;
