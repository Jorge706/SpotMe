import React, { useEffect, useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { updateVehicle, createVehicle, fetchVehicleById, fetchVehicles } from "../utils/vehicleApi";
import Table from "./Table";
import pencilIcon from "../assets/icons/pencil.png";
import cancelIcon from "../assets/icons/cancel.png";
import qrIcon from "../assets/icons/qr.png";
import logo from "../assets/logo.png";
import Modal from "./Modal";
import { QRCodeSVG } from "qrcode.react";
import { Canvg } from "canvg";

function VehicleForm({ setData, vehicle, isEdit, isDelete, onDelete, setMeta, currentPage }) {
    const [vehicleName, setVehicleName] = useState(vehicle?.vehicle_name || "");
    const [vin, setVin] = useState(vehicle?.vin || "");
    const [mark, setMark] = useState(vehicle?.mark || "");
    const [model, setModel] = useState(vehicle?.model || "");
    const [year, setYear] = useState(vehicle?.year || "");
    const [isActive, setIsActive] = useState(vehicle?.is_active ?? true);
    const [errors, setErrors] = useState({});
    const recaptchaRef = useRef(null);
    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const validateForm = () => {
        const newErrors = {};
        const currentYear = new Date().getFullYear();
        
        // Validar vehicle_name
        const vehicleNameStr = String(vehicleName || '');
        if (!vehicleNameStr.trim()) {
            newErrors.vehicleName = "El nombre del vehículo es requerido";
        } else if (vehicleNameStr.length > 255) {
            newErrors.vehicleName = "El nombre del vehículo no puede exceder 255 caracteres";
        }

        // Validar VIN
        const vinStr = String(vin || '');
        if (!vinStr.trim()) {
            newErrors.vin = "El VIN es requerido";
        } else if (vinStr.length !== 17) {
            newErrors.vin = "El VIN debe tener exactamente 17 caracteres";
        } else if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vinStr)) {
            newErrors.vin = "VIN inválido (no debe contener las letras I, O, Q)";
        }

        // Validar mark
        const markStr = String(mark || '');
        if (!markStr.trim()) {
            newErrors.mark = "La marca es requerida";
        } else if (markStr.length > 100) {
            newErrors.mark = "La marca no puede exceder 100 caracteres";
        }

        // Validar model
        const modelStr = String(model || '');
        if (!modelStr.trim()) {
            newErrors.model = "El modelo es requerido";
        } else if (modelStr.length > 100) {
            newErrors.model = "El modelo no puede exceder 100 caracteres";
        }

        // Validar year
        const yearNum = Number(year);
        if (!year || isNaN(yearNum)) {
            newErrors.year = "El año es requerido";
        } else if (yearNum < 1900) {
            newErrors.year = "El año no puede ser menor a 1900";
        } else if (yearNum > (currentYear + 1)) {
            newErrors.year = `El año no puede ser mayor a ${currentYear + 1}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!isDelete && !validateForm()) {
            return;
        }
        
        const recaptchaValue = recaptchaRef.current?.getValue();
        if (!recaptchaValue) {
            setErrors({...errors, recaptcha: "Por favor completa el reCAPTCHA"});
            return;
        }
        
        if (isDelete) {
            if (onDelete) onDelete(vehicle.vehicle_id, { "g-recaptcha-response": recaptchaValue }, setData);
            return;
        }
        if (isEdit) {
            updateVehicle(
                vehicle.vehicle_id,
                {
                    vehicle_name: vehicleName,
                    vin,
                    mark,
                    model,
                    year,
                    is_active: isActive,
                    "g-recaptcha-response": recaptchaValue
                },
                setData,
                setMeta,
                { page : currentPage }
            );
        } else {
            createVehicle({
                vehicle_name: vehicleName,
                vin,
                mark,
                model,
                year,
                is_active: isActive,
                "g-recaptcha-response": recaptchaValue
            }, setData);
        }
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <h1>{isDelete ? "Eliminar vehículo" : isEdit ? "Actualizar vehículo" : "Crear vehículo"}</h1>
            <label className="modal-label">Nombre del vehículo</label>
            <input 
                className={`modal-input ${errors.vehicleName ? 'error' : ''}`} 
                type="text" 
                value={vehicleName} 
                onChange={e => setVehicleName(e.target.value)} 
                disabled={isDelete} 
                maxLength={255}
            />
            {errors.vehicleName && <span className="error-text">{errors.vehicleName}</span>}
            
            <label className="modal-label">VIN</label>
            <input 
                className={`modal-input ${errors.vin ? 'error' : ''}`} 
                type="text" 
                value={vin} 
                onChange={e => setVin(e.target.value.toUpperCase())} 
                disabled={isDelete} 
                maxLength={17}
                placeholder="Ej: 1HGBH41JXMN109186"
            />
            {errors.vin && <span className="error-text">{errors.vin}</span>}
            
            <label className="modal-label">Marca</label>
            <input 
                className={`modal-input ${errors.mark ? 'error' : ''}`} 
                type="text" 
                value={mark} 
                onChange={e => setMark(e.target.value)} 
                disabled={isDelete} 
                maxLength={100}
            />
            {errors.mark && <span className="error-text">{errors.mark}</span>}
            
            <label className="modal-label">Modelo</label>
            <input 
                className={`modal-input ${errors.model ? 'error' : ''}`} 
                type="text" 
                value={model} 
                onChange={e => setModel(e.target.value)} 
                disabled={isDelete} 
                maxLength={100}
            />
            {errors.model && <span className="error-text">{errors.model}</span>}
            
            <label className="modal-label">Año</label>
            <input 
                className={`modal-input ${errors.year ? 'error' : ''}`} 
                type="number" 
                value={year} 
                onChange={e => setYear(e.target.value)} 
                disabled={isDelete} 
                min={1900}
                max={new Date().getFullYear() + 1}
            />
            {errors.year && <span className="error-text">{errors.year}</span>}
            
            {/* <label className="modal-label">¿Activo?</label>
            <select className="modal-select" value={isActive ? "1" : "0"} onChange={e => setIsActive(e.target.value === "1")} disabled={isDelete}>
                <option value="1">Sí</option>
                <option value="0">No</option>
            </select> */}
            <div className="modal-recaptcha" style={{margin: "24px 0"}}>
                <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} />
                {errors.recaptcha && <span className="error-text">{errors.recaptcha}</span>}
            </div>
            <button className={`button button--modal${isDelete ? " danger" : ""}`} type="submit">
                {isDelete ? "Eliminar" : isEdit ? "Aceptar" : "Guardar"}
            </button>
        </form>
    );
}

function VehiclesTable({ setData, data, setMeta, currentPage }) {
    const [selectedVehicle, setSelectedVehicle] = useState(null); // 👈 For QR modal
    const [showQRModal, setShowQRModal] = useState(false);

    const headers = [
        { label: "Nombre", key: "vehicle_name" },
        { label: "VIN", key: "vin" },
        { label: "Marca", key: "mark" },
        { label: "Modelo", key: "model" },
        { label: "Año", key: "year" },
    ];

    const actions = [
        {
        label: "Editar",
        icon: pencilIcon,
        onClick: (item) =>
            fetchVehicleById(item.vehicle_id, setData, false, setMeta, currentPage),
        },
        {
        label: "Eliminar",
        icon: cancelIcon,
        onClick: (item) =>
            fetchVehicleById(item.vehicle_id, setData, true),
        },
        {
        label: "Ver QR",
        icon: qrIcon,
        onClick: (item) => {
            setSelectedVehicle(item);
            setShowQRModal(true);
        },
        },
    ];

    useEffect(() => {
        fetchVehicles(setData, setMeta);
    }, []);

    return (
        <>
        <Table headers={headers} data={data} actions={actions} />

        {showQRModal && selectedVehicle && (
            <Modal onClose={() => setShowQRModal(false)}>
            <QRCodeContent vehicle={selectedVehicle} />
            </Modal>
        )}
        </>
    );
}

function QRCodeContent({ vehicle }) {
    const qrRef = useRef(null);

    if (!vehicle) return null;

    const downloadQRCode = async () => {
        const svg = qrRef.current.querySelector("svg");

        if (!svg) return;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const v = await Canvg.from(ctx, svgString);
        await v.render();

        const pngUrl = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${vehicle.vehicle_name || "vehiculo"}_qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ textAlign: "center", padding: "1rem" }}>
            <h1>QR del Vehículo</h1>
            <p><strong>Nombre del vehículo:</strong> {vehicle.vehicle_name}</p>

            <div ref={qrRef} style={{ marginBottom: "1rem", display: "inline-block" }}>
                <QRCodeSVG
                    value={JSON.stringify(vehicle)}
                    size={256}
                    bgColor="#000000"
                    fgColor="#ffffff"
                    level="Q"
                    imageSettings={{
                        src: logo,
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                <button
                    onClick={downloadQRCode}
                    style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#A4DE02",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "15px",
                        height: "40px",
                    }}
                >
                    Descargar QR
                </button>
            </div>
        </div>
    );
}

export { VehicleForm, VehiclesTable };
