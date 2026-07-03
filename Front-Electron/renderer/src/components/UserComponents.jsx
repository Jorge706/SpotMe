import React, { useEffect, useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { updateUser, createUser, fetchUserById, fetchUsers } from "../utils/userApi";
import Table from "./Table";
import pencilIcon from "../assets/icons/pencil.png";
import cancelIcon from "../assets/icons/cancel.png";

function UserForm({ setData, user, isEdit, isDelete, onDelete, setMeta, currentPage }) {
    const [roleId, setRoleId] = useState(user?.role_id || 1);
    const [name, setName] = useState(user?.name || "");
    const [lastName, setLastName] = useState(user?.last_name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [nss, setNss] = useState(user?.nss || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [isComplete, setIsComplete] = useState(user?.is_complete || false);
    const [errors, setErrors] = useState({});
    const recaptchaRef = useRef(null);
    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const validateForm = () => {
        const newErrors = {};
        
        // Validar role_id
        if (!roleId || roleId < 1) {
            newErrors.roleId = "El rol es requerido";
        }

        // Validar name (solo para create, opcional en edit pero si se proporciona debe ser válido)
        const nameStr = String(name || '');
        if ((!isEdit && !nameStr.trim()) || (nameStr.trim() && !/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/.test(nameStr))) {
            if (!nameStr.trim() && !isEdit) {
                newErrors.name = "El nombre es requerido";
            } else if (nameStr.trim()) {
                newErrors.name = "Solo letras, acentos y espacios, máximo 50 caracteres";
            }
        }

        // Validar last_name
        const lastNameStr = String(lastName || '');
        if (!lastNameStr.trim()) {
            newErrors.lastName = "Los apellidos son requeridos";
        } else if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{1,50}$/.test(lastNameStr)) {
            newErrors.lastName = "Solo letras, acentos y espacios, máximo 50 caracteres";
        }

        // Validar username (solo para crear)
        if (!isEdit) {
            const usernameStr = String(username || '');
            if (!usernameStr.trim()) {
                newErrors.username = "El nombre de usuario es requerido";
            } else if (!/^[A-Za-z0-9_]{1,20}$/.test(usernameStr)) {
                newErrors.username = "Solo letras, números y guión bajo, máximo 20 caracteres";
            }
        }

        // Validar email (solo para crear)
        if (!isEdit) {
            const emailStr = String(email || '');
            if (!emailStr.trim()) {
                newErrors.email = "El email es requerido";
            } else if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(emailStr)) {
                newErrors.email = "Formato de email inválido";
            }
        }

        // Validar nss (solo para crear)
        if (!isEdit) {
            const nssStr = String(nss || '');
            if (!nssStr.trim()) {
                newErrors.nss = "El NSS es requerido";
            } else if (!/^\d{11}$/.test(nssStr)) {
                newErrors.nss = "El NSS debe tener exactamente 11 dígitos";
            }
        }

        // Validar phone
        const phoneStr = String(phone || '');
        if (!phoneStr.trim()) {
            newErrors.phone = "El teléfono es requerido";
        } else if (!/^\d{10}$/.test(phoneStr)) {
            newErrors.phone = "El teléfono debe tener exactamente 10 dígitos";
        }

        // Validar password solo para crear usuario
        if (!isEdit && !isDelete) {
            const passwordStr = String(password || '');
            if (!passwordStr.trim()) {
                newErrors.password = "La contraseña es requerida";
            } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,18}$/.test(passwordStr)) {
                newErrors.password = "La contraseña debe tener 12-18 caracteres, al menos 1 mayúscula, 1 número y 1 carácter especial";
            }

            const passwordConfirmationStr = String(passwordConfirmation || '');
            if (!passwordConfirmationStr.trim()) {
                newErrors.passwordConfirmation = "La confirmación de contraseña es requerida";
            } else if (passwordStr !== passwordConfirmationStr) {
                newErrors.passwordConfirmation = "Las contraseñas no coinciden";
            }
        }

        setErrors(newErrors);
        console.log(newErrors);
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
            if (onDelete) onDelete(user.user_id, { "g-recaptcha-response": recaptchaValue }, setData);
            return;
        }
        if (isEdit) {
            updateUser(
                user.user_id,
                {
                    role_id: roleId,
                    name,
                    last_name: lastName,
                    username,
                    email,
                    nss,
                    phone,
                    is_complete: isComplete,
                    "g-recaptcha-response": recaptchaValue
                },
                setData,
                setMeta,
                { page : currentPage }
            );
        } else {
            createUser({
                role_id: roleId,
                name,
                last_name: lastName,
                username,
                email,
                nss,
                phone,
                password,
                password_confirmation: passwordConfirmation,
                is_complete: isComplete,
                "g-recaptcha-response": recaptchaValue
            }, setData);
        }
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <h1>{isDelete ? "Seguro que deseas eliminar a:" : isEdit ? "Actualizar usuario" : "Agregar un usuario"}</h1>
            {(!isEdit || isDelete === true) && (
                <>
                    <label className="modal-label">Correo del usuario</label>
                    <input 
                        className={`modal-input ${errors.email ? 'error' : ''}`} 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        disabled={isDelete}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                </>
            )}

            <label className="modal-label">Nombre</label>
            <input 
                className={`modal-input ${errors.name ? 'error' : ''}`} 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                disabled={isDelete} 
                maxLength={50}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
            
            <label className="modal-label">Apellidos</label>
            <input 
                className={`modal-input ${errors.lastName ? 'error' : ''}`} 
                type="text" 
                value={lastName} 
                onChange={e => setLastName(e.target.value)} 
                disabled={isDelete} 
                maxLength={50}
            />
            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            {!isEdit && (
                <>
                <label className="modal-label">Nombre de usuario</label>
                <input 
                    className={`modal-input ${errors.username ? 'error' : ''}`} 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    disabled={isDelete} 
                    maxLength={20}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
            </>
            )}
            {(!isEdit || isDelete === true) && (
            <>
                <label className="modal-label">Numero de seguridad social (NSS)</label>
                <input 
                    className={`modal-input ${errors.nss ? 'error' : ''}`} 
                    type="text" 
                    value={nss} 
                    onChange={e => setNss(e.target.value)} 
                    disabled={isDelete} 
                    maxLength={11}
                />
                {errors.nss && <span className="error-text">{errors.nss}</span>}
            </>
            )}
            <label className="modal-label">Teléfono</label>
            <input 
                className={`modal-input ${errors.phone ? 'error' : ''}`} 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                disabled={isDelete} 
                maxLength={10}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
            {!isEdit && !isDelete && (
                <>
                    <label className="modal-label">Contraseña</label>
                    <input 
                        className={`modal-input ${errors.password ? 'error' : ''}`} 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        maxLength={18}
                    />
                    {errors.password && <span className="error-text">{errors.password}</span>}
                    
                    <label className="modal-label">Confirmar contraseña</label>
                    <input 
                        className={`modal-input ${errors.passwordConfirmation ? 'error' : ''}`} 
                        type="password" 
                        value={passwordConfirmation} 
                        onChange={e => setPasswordConfirmation(e.target.value)} 
                        maxLength={18}
                    />
                    {errors.passwordConfirmation && <span className="error-text">{errors.passwordConfirmation}</span>}
                </>
            )}
            {/* <label className="modal-label">¿Datos completos?</label>
            <select className="modal-select" value={isComplete ? "1" : "0"} onChange={e => setIsComplete(e.target.value === "1")} disabled={isDelete}> 
                <option value="1">Sí</option>
                <option value="0">No</option>
            </select> */}
            <label className="modal-label">Rol del usuario</label>
            <select 
                className={`modal-select ${errors.roleId ? 'error' : ''}`} 
                value={roleId} 
                onChange={e => setRoleId(Number(e.target.value))} 
                disabled={isDelete}
            >
                <option value={1}>Conductor</option>
                <option value={2}>Administrador</option>
            </select>
            {errors.roleId && <span className="error-text">{errors.roleId}</span>}
            
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

function UsersTable({ setData, data, setMeta, currentPage }) {
    const headers = [{label:"Nombre", key:"name"}, {label:"Email", key:"email"}, {label:"Rol", key:"role_name"}];

    useEffect(() => {
        fetchUsers(setData, setMeta);
    }, []);

    const actions = [
        { label: "Editar", icon: pencilIcon, onClick: (item) => fetchUserById(item.user_id, setData, false, setMeta, currentPage) },
        { label: "Eliminar", icon: cancelIcon, onClick: (item) => fetchUserById(item.user_id, setData, true)},
    ];

    return <Table headers={headers} data={data} actions={actions} />;
}

export { UserForm, UsersTable };