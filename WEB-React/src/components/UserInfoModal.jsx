import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";

function UserInfoModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleChangePassword = () => {
        onClose(); // Cerrar el modal
        navigate('/change-password'); // Ir a la nueva página unificada
    };

    return (
        <Modal onClose={onClose}>
            <div style={{
                padding: '40px 30px 30px',
                color: 'white',
                maxWidth: '400px',
                width: '100%',
                position: 'relative',
                margin: 0,
                boxShadow: 'none',
                border: 'none',
                background: 'none'
            }}>
                {/* Título */}
                <h2 style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: '0 0 30px 0',
                    textAlign: 'center',
                    lineHeight: '1.2'
                }}>
                    Información del Usuario
                </h2>

                {/* Contenido de información */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            margin: '0 0 5px 0',
                            opacity: 1
                        }}>
                            Correo del usuario
                        </h3>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'normal',
                            margin: 0,
                            opacity: 0.9,
                            lineHeight: '1.3'
                        }}>
                            {user?.email || 'No disponible'}
                        </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            margin: '0 0 5px 0',
                            opacity: 1
                        }}>
                            Nombre del usuario
                        </h3>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'normal',
                            margin: 0,
                            opacity: 0.9,
                            lineHeight: '1.3'
                        }}>
                            {user?.name || 'No disponible'}
                        </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            margin: '0 0 5px 0',
                            opacity: 1
                        }}>
                            Apellidos
                        </h3>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'normal',
                            margin: 0,
                            opacity: 0.9,
                            lineHeight: '1.3'
                        }}>
                            {user?.last_name || 'No disponible'}
                        </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            margin: '0 0 5px 0',
                            opacity: 1
                        }}>
                            Número de seguridad social (NSS)
                        </h3>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'normal',
                            margin: 0,
                            opacity: 0.9,
                            lineHeight: '1.3'
                        }}>
                            {user?.nss || 'No disponible'}
                        </p>
                    </div>

                    <div style={{ marginBottom: '0' }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            margin: '0 0 5px 0',
                            opacity: 1
                        }}>
                            Teléfono
                        </h3>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'normal',
                            margin: 0,
                            opacity: 0.9,
                            lineHeight: '1.3'
                        }}>
                            {user?.phone || 'No disponible'}
                        </p>
                    </div>
                </div>

                {/* Botón de cambiar contraseña */}
                <button 
                    onClick={handleChangePassword}
                    style={{
                        width: '100%',
                        padding: '15px 20px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '25px',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    Cambiar Contraseña
                </button>
            </div>
        </Modal>
    );
}

export default UserInfoModal;
