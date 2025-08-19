import React, { useEffect, useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { updatedevice, createdevice, fetchdeviceById, fetchDevices } from "../utils/devicesApi";
import { fetchVehicles } from "../utils/vehicleApi";
import Table from "./Table";
import pencilIcon from "../assets/icons/pencil.png";
import cancelIcon from "../assets/icons/cancel.png";
import qrIcon from "../assets/icons/qr.png";

function DeviceForm({ setData, device, isEdit, isDelete, onDelete, vehicles = [] }) {
    const [vehicleId, setVehicleId] = useState(device?.vehicle_id || "");
    const [serialNumber, setSerialNumber] = useState(device?.serial_number || "");
    const [isActive, setIsActive] = useState(device?.is_active ?? true);
    const recaptchaRef = useRef(null);
    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const handleSubmit = (e) => {
        e.preventDefault();
        const recaptchaValue = recaptchaRef.current?.getValue();
        if (isDelete) {
            if (onDelete) onDelete(device.device_id, { "g-recaptcha-response": recaptchaValue }, setData);
            return;
        }
        const payload = {
            vehicle_id: vehicleId,
            serial_number: serialNumber,
            is_active: isActive,
            "g-recaptcha-response": recaptchaValue
        };
        if (isEdit) {
            updatedevice(device.device_id, payload, setData);
        } else {
            createdevice(payload, setData);
        }
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <h1>{isDelete ? "Eliminar dispositivo" : isEdit ? "Actualizar dispositivo" : "Crear dispositivo"}</h1>
            <label className="modal-label">Vehículo</label>
            <select className="modal-select" value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={isDelete}>
                <option value="">Selecciona un vehículo</option>
                {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_name}</option>
                ))}
            </select>
            <label className="modal-label">Número de serie</label>
            <input className="modal-input" type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} disabled={isDelete} />
            <label className="modal-label">¿Activo?</label>
            <select className="modal-select" value={isActive ? "1" : "0"} onChange={e => setIsActive(e.target.value === "1")} disabled={isDelete}>
                <option value="1">Sí</option>
                <option value="0">No</option>
            </select>
            <div className="modal-recaptcha" style={{margin: "24px 0"}}>
                <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} />
            </div>
            <button className={`button button--modal${isDelete ? " button--danger" : ""}`} type="submit">
                {isDelete ? "Eliminar" : isEdit ? "Aceptar" : "Guardar"}
            </button>
        </form>
    );
}

// Componente wrapper para cargar vehículos y mostrar el formulario
function DeviceFormWrapper(props) {
    const [vehicles, setVehicles] = useState([]);
    useEffect(() => {
        fetchVehicles(setVehicles, () => {}, { per_page: 10000 });
    }, []);
    return <DeviceForm {...props} vehicles={vehicles} />;
}

function DevicesTable({ setData, data, setMeta }) {
    const [selectedDevice, setSelectedDevice] = useState(null); // 👈 For modal
  
    const headers = [
      { label: "Número de serie", key: "serial_number" },
      { label: "Vehículo", key: "vehicle" },
      { label: "Activo", key: "is_active" },
      { label: "Última comunicación", key: "last_communication" }
    ];
  
    const actions = [
      {
        label: "Editar",
        icon: pencilIcon,
        onClick: (item) => fetchdeviceById(item.device_id, setData)
      },
      {
        label: "Eliminar",
        icon: cancelIcon,
        onClick: (item) => fetchdeviceById(item.device_id, setData, true)
      }
    ];
  
    useEffect(() => {
      fetchDevices(setData, setMeta);
    }, []);
  
    const mappedData = Array.isArray(data)
      ? data.map((d) => ({
          ...d,
          vehicle: d.vehicle?.vehicle_name || "",
          is_active: d.is_active ? "Sí" : "No",
          last_communication: d.last_communication || ""
        }))
      : [];
  
    return (
      <>
        <Table headers={headers} data={mappedData} actions={actions} />
        {selectedDevice && (
          <Modal onClose={() => setSelectedDevice(null)}>
            <QRCodeContent device={selectedDevice} />
          </Modal>
        )}
      </>
    );
  }

function QRCodeContent({ device }) {
    if (!device) return null;
  
    return (
      <div style={{ textAlign: "center", padding: "1rem" }}>
        <h2>QR del dispositivo</h2>
        <p><strong>Serial:</strong> {device.serial_number}</p>
        <QRCode value={device.serial_number} size={256} />
      </div>
    );
  }
  

export { DeviceFormWrapper as DeviceForm, DevicesTable };