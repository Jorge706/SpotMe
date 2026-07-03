import { useRef, useState, useEffect } from "react";;
import { useNavigate } from "react-router-dom";

import Background from "../../components/Background";
import TwoSideContainer from "../../components/TwoSideContainer";
import Button from "../../components/Button";
import Input from "../../components/Input";

import lockIcon from "../../assets/icons/lock.png";
import eyeIcon from "../../assets/icons/eye.png";
import hiddenIcon from "../../assets/icons/hidden.png";

import Modal from "../../components/Modal";
import RecaptchaWrapper from "../../components/RecaptchaWrapper";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

function ContrasenaPage_1() {  
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const [captchaToken, setCaptchaToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [resetCaptcha, setResetCaptcha] = useState(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    // Redireccionar si ya está completamente autenticado
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            const userRoleId = user.role_id || user.user_role_id;
            if (userRoleId === 2 || userRoleId === 3) {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    // Verificar que tenemos token de autenticación
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Current captchaToken value:', captchaToken); // Debug

        if (!captchaToken) {
        openModal(
            <>
            <h1>Verificación requerida</h1>
            <p>Por favor confirma que no eres un robot completando el reCAPTCHA.</p>
            <button className="button button--modal" onClick={closeModal}>
                Aceptar
            </button>
            </>
        );
        return;
        }

        // Verificar si el reCAPTCHA expiró
        if (captchaToken && captchaToken.length < 50) {
            openModal(
                <>
                <h1>reCAPTCHA expirado</h1>
                <p>El reCAPTCHA ha expirado. Por favor complétalo nuevamente.</p>
                <button className="button button--modal" onClick={() => {
                    closeModal();
                    if (resetCaptcha) {
                        resetCaptcha();
                        setCaptchaToken(null);
                    }
                }}>
                    Aceptar
                </button>
                </>
            );
            return;
        }

        if (!newPassword || !confirmPassword) {
            openModal(
                <>
                <h1>Campos requeridos</h1>
                <p>Por favor ingresa tu nueva contraseña y confírmala.</p>
                <button className="button button--modal" onClick={closeModal}>
                    Aceptar
                </button>
                </>
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            openModal(
                <>
                <h1>Las contraseñas no coinciden</h1>
                <p>Por favor verifica que ambas contraseñas sean iguales.</p>
                <button className="button button--modal" onClick={closeModal}>
                    Aceptar
                </button>
                </>
            );
            return;
        }

        setIsLoading(true);

        try {
            // Verificar si tenemos el token
            const token = localStorage.getItem('token');
            
            await authService.completeRegistration(newPassword, confirmPassword, captchaToken);
            
            // Obtener información del usuario para verificar rol
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userRoleId = storedUser.role_id || storedUser.user_role_id;
            
            openModal(
                <>
                <h1>¡Registro completado!</h1>
                <p>Tu contraseña ha sido actualizada exitosamente.</p>
                <button className="button button--modal" onClick={() => {
                    closeModal();
                    // Redirigir según el rol del usuario
                    if (userRoleId === 2 || userRoleId === 3) { // Administrador o Monitorista
                        navigate('/dashboard');
                    } else {
                        // Para otros roles, ir al login
                        localStorage.clear();
                        navigate('/login');
                    }
                }}>
                    {(userRoleId === 2 || userRoleId === 3) ? 'Ir al Dashboard' : 'Ir al Login'}
                </button>
                </>
            );

        } catch (error) {
            let errorMessage = 'No se pudo actualizar la contraseña. Por favor intenta nuevamente.';
            
            // Manejar diferentes tipos de errores
            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message;
                
                switch (status) {
                    case 401:
                        errorMessage = 'Sesión expirada. Vuelve a iniciar sesión.';
                        break;
                    case 422:
                        errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
                        break;
                    case 400:
                        errorMessage = 'Las contraseñas no coinciden o son demasiado débiles.';
                        break;
                    default:
                        errorMessage = serverMessage || 'Error al actualizar la contraseña.';
                }
            } else if (error.request) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            }
            
            openModal(
                <>
                <h1>Error al actualizar contraseña</h1>
                <p>{errorMessage}</p>
                <button className="button button--modal" onClick={closeModal}>
                    Aceptar
                </button>
                </>
            );
            
            // Limpiar reCAPTCHA
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Background>
        {isModalOpen && (
            <Modal onClose={closeModal}>
            {modalContent}
            </Modal>
        )}
        <TwoSideContainer>
            <h1 className="title-right-side">Cambiar Contraseña</h1>
            <p style={{ color: '#FFFFFF', marginBottom: '20px' }}>
                Para completar tu registro, establece una nueva contraseña segura.
            </p>

            <form onSubmit={handleSubmit}>
            <Input
                icon={lockIcon}
                placeholder="Nueva contraseña"
                isPassword={true}
                eyeIcon={eyeIcon}
                hiddenIcon={hiddenIcon}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
                icon={lockIcon}
                placeholder="Confirmar contraseña"
                isPassword={true}
                eyeIcon={eyeIcon}
                hiddenIcon={hiddenIcon}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div style={{ marginTop: "20px" }}>
                <RecaptchaWrapper 
                    onCaptchaChange={setCaptchaToken}
                    onReset={setResetCaptcha}
                />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
            </form>
            
        </TwoSideContainer>
        </Background>
    );
}

export default ContrasenaPage_1;
