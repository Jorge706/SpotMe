import { useState, useRef, useEffect } from "react";
import { httpRequest } from "../../../utils";
import ReCAPTCHA from "react-google-recaptcha";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchGeofences, updateGeofence, createGeofence, deleteGeofence } from "../../utils/geofencesApi";
import { fetchDevices } from "../../utils/devicesApi";
import Modal from "../../components/Modal";
import addIcon from "../../assets/icons/add.png";

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
}

function LeafletMap({ center, zoom, geofences, onGeofenceCreate, currentGeofence, selectedGeofenceIndex }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (selectedGeofenceIndex !== null && geofences[selectedGeofenceIndex]?.center && mapRef.current) {
      mapRef.current.flyTo(geofences[selectedGeofenceIndex].center, 17); // 17 es el nivel de zoom
    }
  }, [selectedGeofenceIndex, geofences]);

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ width: "100%", height: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {currentGeofence?.center && (
        <Circle
          center={currentGeofence.center}
          radius={currentGeofence.radius}
          pathOptions={{
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.2,
            weight: 2
          }}
        >
          <Popup>Geocerca temporal (Radio: {currentGeofence.radius}m)</Popup>
        </Circle>
      )}
      {geofences.map((geofence, index) => (
        <Circle
          key={index}
          center={geofence.center}
          radius={geofence.radius}
          pathOptions={{
            color: index === selectedGeofenceIndex ? 'green' : 'blue',
            fillColor: index === selectedGeofenceIndex ? 'green' : 'blue',
            fillOpacity: 0.2,
            weight: 2
          }}
        >
          <Popup>
            {geofence.name} <br />
            Radio: {geofence.radius}m
          </Popup>
        </Circle>
      ))}
      <MapClickHandler onMapClick={onGeofenceCreate} />
    </MapContainer>
  );
}

function GeoCerca() {
  const [geofences, setGeofences] = useState([]);
  const [devices, setDevices] = useState([]);
  const [currentGeofence, setCurrentGeofence] = useState({ center: null, radius: 10 });
  const [selectedGeofenceIndex, setSelectedGeofenceIndex] = useState(null);
  const [recaptchaValue, setRecaptchaValue] = useState("");
  const radiusInputRef = useRef(null);
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState(""); // "success" | "error"
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModalMessage = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const handleMapClick = (latlng) => {
    setCurrentGeofence({ ...currentGeofence, center: latlng });
  };

  const saveGeofence = () => {
    if (!currentGeofence.center) return;
    if (!recaptchaValue) {
      showModalMessage("error", "Por favor completa el reCAPTCHA antes de guardar.");
      return;
    }
    if (!currentGeofence.device_id) {
      showModalMessage("error", "Por favor selecciona un dispositivo");
      return;
    }

    const id = selectedGeofenceIndex !== null ? geofences[selectedGeofenceIndex]?.id : null;

    const dataToSend = {
      device_id: parseInt(currentGeofence.device_id, 10),
      name: (currentGeofence.name || `Geocerca ${selectedGeofenceIndex !== null ? selectedGeofenceIndex + 1 : ''}`).replace(/[^a-zA-Z0-9\s]/g, ''), // quitar símbolos
      latitude: parseFloat(currentGeofence.center.lat),
      longitude: parseFloat(currentGeofence.center.lng),
      radius: parseFloat(currentGeofence.radius),
      "g-recaptcha-response": recaptchaValue,
    };

    console.log(dataToSend);

    if (selectedGeofenceIndex !== null) {
      // Actualizar geocerca existente
      if (!id) {
        console.error("ID de geocerca no encontrado para actualización.");
        return;
      }
      updateGeofence(id, dataToSend, (success, message) => {
        if (success) {
          const updated = [...geofences];
          updated[selectedGeofenceIndex] = {
            ...currentGeofence,
            id,
            name: dataToSend.name,
            device_id: currentGeofence.device_id
          };
          setGeofences(updated);
          setCurrentGeofence({ center: null, radius: 100 });
          setSelectedGeofenceIndex(null);
          if (radiusInputRef.current) radiusInputRef.current.value = 100;
          showModalMessage("success", message || "Geocerca actualizada correctamente");
        } else {
          showModalMessage("error", message || "Error al actualizar geocerca");
        }
      });
    } else {
      // Crear nueva geocerca
      createGeofence(dataToSend, (success, message) => {
        if (success) {
          // Recargar geocercas para sincronizar estado
          fetchGeofences((rawGeofences) => {
            const parsed = rawGeofences.flat().map((gf) => ({
              center: { lat: gf.latitude, lng: gf.longitude },
              radius: gf.radius,
              name: gf.name,
              id: gf.geofence_id,
              device_id: gf.device_id
            }));
            setGeofences(parsed);
          });
          setCurrentGeofence({ center: null, radius: 100, device_id: "" });
          setSelectedGeofenceIndex(null);
          if (radiusInputRef.current) radiusInputRef.current.value = 100;
          showModalMessage("success", message || "Geocerca creada correctamente");
        } else {
          showModalMessage("error", message || "Error al crear geocerca");
        }
      });
    }
  };

  useEffect(() => {
    fetchGeofences((rawGeofences) => {
      const parsed = rawGeofences.flat().map((gf) => ({
        center: { lat: gf.latitude, lng: gf.longitude },
        radius: gf.radius,
        name: gf.name,
        id: gf.geofence_id,
        device_id: gf.device_id
      }));
      setGeofences(parsed);
    });

    fetchDevices((deviceList) => {
      setDevices(deviceList);
    });
  }, []);

  const handleDeleteGeofence = (id) => {
    if (!id) return;

    if (!window.confirm("¿Estás seguro de que quieres eliminar esta geocerca?")) return;

    httpRequest({
      url: `/tracking-api/geofences/${id}`,
      method: 'DELETE',
      useToken: true,
    })
      .then(() => {
        showModalMessage("success", "Geocerca eliminada correctamente");

        // Recargar geocercas después de borrar
        fetchGeofences((rawGeofences) => {
          const parsed = rawGeofences.flat().map((gf) => ({
            center: { lat: gf.latitude, lng: gf.longitude },
            radius: gf.radius,
            name: gf.name,
            id: gf.geofence_id,
            device_id: gf.device_id
          }));
          setGeofences(parsed);
        });

        // Limpiar selección si se estaba editando la que borramos
        if (selectedGeofenceIndex !== null && geofences[selectedGeofenceIndex]?.id === id) {
          setCurrentGeofence({ center: null, radius: 100, device_id: "" });
          setSelectedGeofenceIndex(null);
        }
      })
      .catch((error) => {
        let msg = "Error desconocido";
        try {
          msg = JSON.parse(error.message).message;
        } catch {
          msg = error.message || msg;
        }
        showModalMessage("error", msg);
      });
  };

  return (
    <div className="geocerca-container">
      <div className="geocerca-header">
        <div className="geocerca-header-left">
          Geocerca:
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === "new") {
                setCurrentGeofence({ center: null, radius: 100, device_id: "" });
                setSelectedGeofenceIndex(null);
              } else {
                const index = geofences.findIndex((gf) => String(gf.id) === value);
                const gf = geofences[index];
                setCurrentGeofence({
                  ...gf,
                  radius: Number(gf.radius) || 100,
                  device_id: String(gf.device_id || "")
                });
                setSelectedGeofenceIndex(index);
              }
            }}
            style={{ marginRight: "10px" }}
          >
            <option value="new">Nueva geocerca</option>
            {geofences.map((gf) => (
              <option key={gf.id} value={gf.id}>
                {gf.name || `Geocerca ${gf.id}`}
              </option>
            ))}
          </select>
            
          Dispositivo:
          <select
            value={currentGeofence.device_id || ""}
            onChange={(e) =>
              setCurrentGeofence((prev) => ({ ...prev, device_id: e.target.value }))
            }
          >
            <option value="">Seleccionar dispositivo</option>
            {devices.map((device) => (
              <option key={device.device_id} value={device.device_id}>
                {device.serial_number || `Dispositivo ${device.device_id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="geocerca-map-container">
        <div className="map-left">
          <div className="map-container">
            <LeafletMap
              center={[25.5367358, -103.4064629]}
              zoom={15}
              geofences={geofences}
              onGeofenceCreate={handleMapClick}
              currentGeofence={currentGeofence}
              selectedGeofenceIndex={selectedGeofenceIndex}
            />
          </div>
        </div>

        <div className="info-right">
          <div className="geocerca-info-container">
            <div className="geocerca-info-header">Información de la geocerca</div>
            <div className="geocerca-info-body">
              {currentGeofence.center ? (
                <>
                  <div>
                    <label><strong>Nombre de la geocerca:</strong>
                      <input
                        type="text"
                        value={currentGeofence.name || ""}
                        onChange={(e) =>
                          setCurrentGeofence((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label><strong>Latitud:</strong>
                      <input
                        type="number"
                        step="0.00001"
                        value={currentGeofence.center.lat}
                        onChange={(e) =>
                          setCurrentGeofence((prev) => ({
                            ...prev,
                            center: { ...prev.center, lat: parseFloat(e.target.value) || 100 }
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label><strong>Longitud:</strong>
                      <input
                        type="number"
                        step="0.00001"
                        value={currentGeofence.center.lng}
                        onChange={(e) =>
                          setCurrentGeofence((prev) => ({
                            ...prev,
                            center: { ...prev.center, lng: parseFloat(e.target.value) || 100 }
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label><strong>Radio (metros):</strong>
                      <input
                        type="number"
                        ref={radiusInputRef}
                        value={currentGeofence.radius}
                        onChange={(e) =>
                          setCurrentGeofence({
                            ...currentGeofence,
                            radius: parseInt(e.target.value) || 100
                          })
                        }
                      />
                    </label>
                  </div>

                  {/* Aquí agregamos el reCAPTCHA */}
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITE_KEY} // <-- reemplazar con tu clave pública
                    onChange={(value) => setRecaptchaValue(value)}
                  />

                  <button onClick={saveGeofence}>
                    {selectedGeofenceIndex !== null ? "Actualizar Geocerca" : "Guardar Geocerca"}
                  </button>

                  {selectedGeofenceIndex !== null && (
                    <button
                      style={{ background: "#FF2147", color: "white", marginLeft: "10px" }}
                      onClick={() => handleDeleteGeofence(geofences[selectedGeofenceIndex]?.id)}
                    >
                      Eliminar Geocerca
                    </button>
                  )}
                </>
              ) : (
                <p>Selecciona nueva geocerca para crear, selecciona una geocerca existente para editar</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className={`modal-message ${modalType}`}>
            {modalMessage}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default GeoCerca;
