import { useRef, useState, useEffect } from "react";;
import { useNavigate } from "react-router-dom";

import Background from "../../components/Background";
import TwoSideContainer from "../../components/TwoSideContainer";
import Button from "../../components/Button";
import Input from "../../components/Input";

import lockIcon from "../../assets/icons/lock.png";

import Modal from "../../components/Modal";
import RecaptchaWrapper from "../../components/RecaptchaWrapper";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

function CodigoPage() {  
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
    const [captchaToken, setCaptchaToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState('');
    const [resetCaptcha, setResetCaptcha] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    // Redireccionar si ya está autenticado
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            const userRoleId = user.role_id || user.user_role_id;
            if (userRoleId === 2 || userRoleId === 3) {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    // Verificar que venimos del login
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
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

    // 🎯 MANEJAR AUTENTICACIÓN EXITOSA CON SOPORTE PARA APP MÓVIL
    const handleAuthSuccess = async (responseData) => {
        const authData = {
            access_token: responseData.access_token,
            requires_completion: responseData.requires_completion || false,
            user_id: responseData.user?.user_id || responseData.user_id,
            email: responseData.user?.email || responseData.email
        };
        
        // 🔄 PRIMERO: Verificar si necesita completar registro
        if (authData.requires_completion) {
            // Usuario necesita completar registro (SIEMPRE va a change password)
            if (authData.access_token) {
                localStorage.setItem('token', authData.access_token);
                navigate('/cambiarcontrasena');
            } else {
                // Sin token, no se puede proceder
                openModal(
                    <>
                    <h1>Error de configuración</h1>
                    <p>No se pudo obtener acceso para completar el registro. Contacta al administrador.</p>
                    <button className="button button--modal" onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>
                        Volver al Login
                    </button>
                    </>
                );
            }
            return; // ⭐ IMPORTANTE: Salir aquí para que no continúe
        }
        
        // 🎯 SEGUNDO: Si login está completo, detectar si está en APP MÓVIL
        if (window.webkit?.messageHandlers?.mobileAuthHandler) {
            console.log('📱 Enviando datos a app móvil iOS:', authData);
            
            // Enviar datos a la app nativa
            if (window.sendAuthToMobile) {
                window.sendAuthToMobile(authData);
            }
            
            // Opcional: mostrar mensaje de éxito
            openModal(
                <>
                <h1>¡Login exitoso!</h1>
                <p>Regresando a la app...</p>
                <button className="button button--modal" onClick={closeModal}>
                    Aceptar
                </button>
                </>
            );
            return;
        }
        
        // 🌐 TERCERO: Si NO está en app móvil, comportamiento normal web
        // Login exitoso - navegar según rol
        localStorage.setItem('token', responseData.access_token);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        
        // ⭐ ACTUALIZAR AuthContext antes de navegar
        login(responseData.user, responseData.access_token);
        
        // Limpiar datos temporales
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_email');
        
        // Verificar rol del usuario para redirección
        const userRoleId = responseData.user.role_id || responseData.user.user_role_id;
        
        if (userRoleId === 2 || userRoleId === 3) { // Administrador o Monitorista
            navigate('/dashboard');
        } else {
            // Para otros roles, mostrar mensaje y volver al login
            openModal(
                <>
                <h1>Acceso Web Restringido</h1>
                <p>El acceso web está disponible solo para administradores y monitoristas. Por favor utiliza la aplicación móvil.</p>
                <button className="button button--modal" onClick={() => {
                    localStorage.clear();
                    navigate('/login');
                }}>
                    Entendido
                </button>
                </>
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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

        if (!code || code.length !== 6) {
            openModal(
                <>
                <h1>Código requerido</h1>
                <p>Por favor ingresa el código de 6 dígitos que recibiste por correo.</p>
                <button className="button button--modal" onClick={closeModal}>
                    Aceptar
                </button>
                </>
            );
            return;
        }

        setIsLoading(true);

        try {
            const userId = localStorage.getItem('user_id');
            
            if (!userId || isNaN(parseInt(userId))) {
                openModal(
                    <>
                    <h1>Error de sesión</h1>
                    <p>No se encontró información de usuario válida. Inicia sesión nuevamente.</p>
                    <button className="button button--modal" onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>
                        Ir al Login
                    </button>
                    </>
                );
                return;
            }

            const response = await authService.verifyCode(parseInt(userId), code);
            
            // Verificar si los datos están en response.data o directamente en response
            const responseData = response.data || response;

            // 🎯 MANEJAR AUTENTICACIÓN EXITOSA CON SOPORTE MÓVIL
            await handleAuthSuccess(responseData);

        } catch (error) {
            let errorMessage = 'Código incorrecto o expirado. Por favor intenta nuevamente.';
            
            // Manejar diferentes tipos de errores
            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message;
                
                switch (status) {
                    case 401:
                        errorMessage = 'Código de verificación incorrecto.';
                        break;
                    case 410:
                        errorMessage = 'El código ha expirado. Solicita un nuevo código.';
                        break;
                    case 422:
                        errorMessage = 'Código inválido. Verifica que sea de 6 dígitos.';
                        break;
                    case 429:
                        errorMessage = 'Demasiados intentos. Espera antes de intentar nuevamente.';
                        break;
                    default:
                        errorMessage = serverMessage || 'Error en la verificación. Inténtalo nuevamente.';
                }
            } else if (error.request) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            }
            
            openModal(
                <>
                <h1>Error de verificación</h1>
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
            <h1 className="title-right-side">Código de Verificación.</h1>

            <form onSubmit={handleSubmit}>
            <Input 
                icon={lockIcon} 
                placeholder="Ingresa el código de verificación" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength="6"
                type="text"
            />

            <div style={{ marginTop: "20px" }}>
                <RecaptchaWrapper 
                    onCaptchaChange={setCaptchaToken}
                    onReset={setResetCaptcha}
                />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Continuar'}
            </Button>
            
            </form>
        </TwoSideContainer>
        </Background>
    );
}


export default CodigoPage;
