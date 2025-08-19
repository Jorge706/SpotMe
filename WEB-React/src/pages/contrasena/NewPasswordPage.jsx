import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Background from "../../components/Background";
import TwoSideContainer from "../../components/TwoSideContainer";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import RecaptchaWrapper from "../../components/RecaptchaWrapper";

import emailIcon from "../../assets/icons/email.png";
import lockIcon from "../../assets/icons/lock.png";
import eyeIcon from "../../assets/icons/eye.png";
import hiddenIcon from "../../assets/icons/hidden.png";

import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

function NewPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, user } = useAuth();
    
    // Estados para el flujo
    const [step, setStep] = useState(1); // 1: email/código, 2: contraseñas
    const [isAuthenticated_] = useState(isAuthenticated && user); // Sesión activa o no
    
    // Estados del formulario
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [currentPassword, setCurrentPassword] = useState(''); // Solo para sesión activa
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Estados de UI
    const [isLoading, setIsLoading] = useState(false);
    const [isRequestingCode, setIsRequestingCode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [resetCaptcha, setResetCaptcha] = useState(null);

    // Efectos
    useEffect(() => {
        // Si viene de una URL específica, puede pre-llenar el email
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    // Funciones de utilidad
    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    const resetForm = () => {
        setEmail('');
        setVerificationCode('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCaptchaToken(null);
        if (resetCaptcha) resetCaptcha();
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,18}$/;
        return passwordRegex.test(password);
    };

    // Handler para solicitar código
    const handleRequestCode = async () => {
        if (!isAuthenticated_ && !email) {
            openModal(
                <>
                    <h1>Email requerido</h1>
                    <p>Por favor ingresa tu email.</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            return;
        }

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

        setIsRequestingCode(true);

        try {
            if (isAuthenticated_) {
                // Para sesión activa - usar el email del usuario logueado
                const userEmail = user?.email || '';
                await authService.requestPasswordResetCode(userEmail, captchaToken);
            } else {
                // Para sesión no activa - usar el email del formulario
                await authService.requestPasswordResetCode(email, captchaToken);
            }
            
            openModal(
                <>
                    <h1>Código enviado</h1>
                    <p>Se ha enviado un código de verificación a tu email. El código expira en 10 minutos.</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            
            // Limpiar reCAPTCHA después del envío exitoso
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
            
        } catch (error) {
            let errorMessage = 'Error al enviar el código. Inténtalo nuevamente.';
            
            try {
                const errorData = JSON.parse(error.message);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                // Usar mensaje por defecto si no se puede parsear
            }
            
            openModal(
                <>
                    <h1>Error</h1>
                    <p>{errorMessage}</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            
            // Limpiar reCAPTCHA en caso de error
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
        } finally {
            setIsRequestingCode(false);
        }
    };

    // Handler para continuar (paso 1 -> paso 2)
    const handleStep1Continue = () => {
        if (!verificationCode || verificationCode.length !== 6) {
            openModal(
                <>
                    <h1>Código requerido</h1>
                    <p>Por favor ingresa el código de verificación de 6 dígitos.</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            return;
        }

        if (isAuthenticated_ && !currentPassword) {
            openModal(
                <>
                    <h1>Contraseña actual requerida</h1>
                    <p>Por favor ingresa tu contraseña actual.</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            return;
        }

        setStep(2);
    };

    // Handler para finalizar cambio de contraseña (paso 2)
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            openModal(
                <>
                    <h1>Campos requeridos</h1>
                    <p>Por favor completa todos los campos de contraseña.</p>
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

        if (!validatePassword(newPassword)) {
            openModal(
                <>
                    <h1>Contraseña no válida</h1>
                    <p>La contraseña debe tener entre 12-18 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            return;
        }

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

        setIsLoading(true);

        try {
            if (isAuthenticated_) {
                // Flujo para sesión activa - cambio de contraseña con JWT
                await authService.changePassword(currentPassword, newPassword, confirmPassword, captchaToken);
            } else {
                // Flujo para sesión no activa - reset con código
                await authService.resetPasswordWithCode(email, verificationCode, newPassword, confirmPassword, captchaToken);
            }
            
            openModal(
                <>
                    <h1>¡Contraseña actualizada!</h1>
                    <p>Tu contraseña ha sido cambiada exitosamente.</p>
                    <button className="button button--modal" onClick={() => {
                        closeModal();
                        if (isAuthenticated_) {
                            navigate('/dashboard');
                        } else {
                            navigate('/login');
                        }
                    }}>
                        {isAuthenticated_ ? 'Ir al Dashboard' : 'Ir al Login'}
                    </button>
                </>
            );
            
            resetForm();
        } catch (error) {
            let errorMessage = 'Error al cambiar la contraseña. Inténtalo nuevamente.';
            
            try {
                const errorData = JSON.parse(error.message);
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.data && typeof errorData.data === 'object') {
                    // Manejar errores de validación específicos del backend
                    const validationErrors = errorData.data;
                    if (validationErrors.new_password) {
                        errorMessage = validationErrors.new_password[0];
                    } else if (validationErrors.confirm_password) {
                        errorMessage = validationErrors.confirm_password[0];
                    } else if (validationErrors.reset_code) {
                        errorMessage = 'Código de verificación inválido o expirado.';
                    } else if (validationErrors.current_password) {
                        errorMessage = validationErrors.current_password[0];
                    } else {
                        errorMessage = 'Datos de entrada inválidos';
                    }
                }
            } catch (parseError) {
                // Usar mensaje por defecto si no se puede parsear
            }
            
            openModal(
                <>
                    <h1>Error</h1>
                    <p>{errorMessage}</p>
                    <button className="button button--modal" onClick={closeModal}>
                        Aceptar
                    </button>
                </>
            );
            
            // Limpiar reCAPTCHA en caso de error
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Render del paso 1
    const renderStep1 = () => (
        <>
            <h1 className="title-right-side">Cambiar Contraseña</h1>
            
            {/* Solo mostrar campo email si no hay sesión activa */}
            {!isAuthenticated_ && (
                <>
                    <Input
                        icon={emailIcon}
                        placeholder="Ingresa tu correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    
                    <Button 
                        type="button" 
                        onClick={handleRequestCode}
                        disabled={isRequestingCode}
                        style={{ marginBottom: '20px' }}
                    >
                        {isRequestingCode ? 'Enviando...' : 'Solicitar código'}
                    </Button>
                </>
            )}

            <Input
                icon={lockIcon}
                placeholder="Ingresa el código de verificación"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
            />

            {/* Botón para solicitar código si hay sesión activa */}
            {isAuthenticated_ && (
                <Button 
                    type="button" 
                    onClick={handleRequestCode}
                    disabled={isRequestingCode}
                    style={{ marginBottom: '20px' }}
                >
                    {isRequestingCode ? 'Enviando...' : 'Solicitar código'}
                </Button>
            )}

            {/* Campo contraseña actual solo para sesión activa */}
            {isAuthenticated_ && (
                <Input
                    icon={lockIcon}
                    placeholder="Ingresa tu contraseña"
                    isPassword={true}
                    eyeIcon={eyeIcon}
                    hiddenIcon={hiddenIcon}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
            )}

            {/* reCAPTCHA requerido para AMBOS flujos según el controller */}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                <RecaptchaWrapper 
                    onCaptchaChange={setCaptchaToken}
                    onReset={setResetCaptcha}
                />
            </div>

            <Button type="button" onClick={handleStep1Continue}>
                Continuar
            </Button>
        </>
    );

    // Render del paso 2
    const renderStep2 = () => (
        <>
            <h1 className="title-right-side">Cambiar Contraseña</h1>
            
            <form onSubmit={handlePasswordChange}>
                <Input
                    icon={lockIcon}
                    placeholder="Ingresa tu contraseña nueva"
                    isPassword={true}
                    eyeIcon={eyeIcon}
                    hiddenIcon={hiddenIcon}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <p style={{ 
                    fontWeight: 600, 
                    fontSize: '14px', 
                    color: '#FFFFFF', 
                    margin: '15px 0',
                    lineHeight: '1.4'
                }}>
                    La contraseña debe ser de mínimo 12, máximo 18<br />
                    caracteres, debe tener por lo menos 1 Mayúscula,<br />
                    1 Número y 1 Carácter Especial
                </p>

                <Input
                    icon={lockIcon}
                    placeholder="Confirmar contraseña"
                    isPassword={true}
                    eyeIcon={eyeIcon}
                    hiddenIcon={hiddenIcon}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                    <RecaptchaWrapper 
                        onCaptchaChange={setCaptchaToken}
                        onReset={setResetCaptcha}
                    />
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Procesando...' : 'Continuar'}
                </Button>
            </form>
        </>
    );

    return (
        <Background>
            {isModalOpen && (
                <Modal onClose={closeModal}>
                    {modalContent}
                </Modal>
            )}
            <TwoSideContainer>
                {step === 1 ? renderStep1() : renderStep2()}
            </TwoSideContainer>
        </Background>
    );
}

export default NewPasswordPage;
