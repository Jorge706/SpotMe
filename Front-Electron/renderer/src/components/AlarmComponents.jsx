import React, { useEffect, useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { updateAlarm, createAlarm, fetchAlarmById, fetchAlarms } from "../utils/alarmApi";
import Table from "./Table";
import pencilIcon from "../assets/icons/pencil.png";
import cancelIcon from "../assets/icons/cancel.png";

function AlarmForm({ setData, alarm, isEdit, isDelete, onDelete, setMeta, currentPage }) {
    const [alarmName, setAlarmName] = useState(alarm?.alarm_name || "");
    const [description, setDescription] = useState(alarm?.description || "");
    const [alarmCode, setAlarmCode] = useState(alarm?.alarm_code || "");
    const [errors, setErrors] = useState({});
    const recaptchaRef = useRef(null);
    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const validateForm = () => {
        const newErrors = {};
        
        if (!alarmName.trim()) {
            newErrors.alarmName = "El nombre de la alarma es requerido";
        } else if (!/^[A-Za-z0-9\s]{1,30}$/.test(alarmName)) {
            newErrors.alarmName = "Solo letras, números y espacios, máximo 30 caracteres";
        }

        if (!description.trim()) {
            newErrors.description = "La descripción es requerida";
        } else if (description.length > 50) {
            newErrors.description = "Máximo 50 caracteres";
        }

        if (!alarmCode.trim()) {
            newErrors.alarmCode = "El código de alarma es requerido";
        } else if (!/^[A-Za-z0-9]{1,8}$/.test(alarmCode)) {
            newErrors.alarmCode = "Solo letras y números, máximo 8 caracteres";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const recaptchaValue = recaptchaRef.current?.getValue();
        if (!recaptchaValue) {
            setErrors({...errors, recaptcha: "Por favor completa el reCAPTCHA"});
            return;
        }
        
        if (isDelete) {
            if (onDelete) onDelete(alarm.alarm_id, { "g-recaptcha-response": recaptchaValue }, setData);
            return;
        }
        const payload = {
            alarm_name: alarmName,
            description,
            alarm_code: alarmCode,
            "g-recaptcha-response": recaptchaValue
        };
        if (isEdit) {
            updateAlarm(alarm.alarm_id, payload, setData, setMeta, { page : currentPage });
        } else {
            createAlarm(payload, setData);
        }
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <h1>{isDelete ? "Eliminar alarma" : isEdit ? "Actualizar alarma" : "Crear alarma"}</h1>
            <label className="modal-label">Nombre de la alarma</label>
            <input 
                className={`modal-input ${errors.alarmName ? 'error' : ''}`} 
                type="text" 
                value={alarmName} 
                onChange={e => setAlarmName(e.target.value)} 
                disabled={isDelete} 
                maxLength={30} 
            />
            {errors.alarmName && <span className="error-text">{errors.alarmName}</span>}
            
            <label className="modal-label">Descripción</label>
            <input 
                className={`modal-input ${errors.description ? 'error' : ''}`} 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                disabled={isDelete} 
                maxLength={50} 
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
            
            <label className="modal-label">Código de alarma</label>
            <input 
                className={`modal-input ${errors.alarmCode ? 'error' : ''}`} 
                type="text" 
                value={alarmCode} 
                onChange={e => setAlarmCode(e.target.value)} 
                disabled={isDelete} 
                maxLength={8} 
            />
            {errors.alarmCode && <span className="error-text">{errors.alarmCode}</span>}
            
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

function AlarmsTable({ setData, data, setMeta, currentPage }) {
    const headers = [
        {label:"Nombre", key:"alarm_name"}, 
        {label:"Descripción", key:"description"}, 
        {label:"Código", key:"alarm_code"}
    ];

    useEffect(() => {
        fetchAlarms(setData, setMeta);
    }, []);

    const actions = [
        { label: "Editar", icon: pencilIcon, onClick: (item) => fetchAlarmById(item.alarm_id, setData, false, setMeta, currentPage) },
        { label: "Eliminar", icon: cancelIcon, onClick: (item) => fetchAlarmById(item.alarm_id, setData, true)},
    ];

    return <Table headers={headers} data={data} actions={actions} />;
}

export { AlarmForm, AlarmsTable };