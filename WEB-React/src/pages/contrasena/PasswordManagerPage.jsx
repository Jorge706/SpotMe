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

function PasswordManagerPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, user } = useAuth();
    
    // Estados para determinar el flujo activo
    const [currentFlow, setCurrentFlow] = useState('select'); // select, change, forgot, reset
    const [step, setStep] = useState(1); // Para flujos multi-paso
    
    // Estados del formulario
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    
    // Estados de UI
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [resetCaptcha, setResetCaptcha] = useState(null);

    // Efectos
    useEffect(() => {
        // Detectar el flujo inicial basado en parámetros URL o estado de autenticación
        const flowParam = searchParams.get('flow');
        const emailParam = searchParams.get('email');
        
        if (flowParam === 'reset' && emailParam) {
            setCurrentFlow('reset');
            setEmail(emailParam);
        } else if (flowParam === 'forgot') {
            setCurrentFlow('forgot');
        } else if (flowParam === 'change') {
            setCurrentFlow('change');
        } else if (isAuthenticated && user) {
            setCurrentFlow('change');
        } else {
            setCurrentFlow('select');
        }
    }, [searchParams, isAuthenticated, user]);

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
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setVerificationCode('');
        setCaptchaToken(null);
        if (resetCaptcha) resetCaptcha();
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,18}$/;
        return passwordRegex.test(password);
    };

    // Handlers para cada flujo
    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            openModal(
                <>
                    <h1>Campos requeridos</h1>
                    <p>Por favor completa todos los campos.</p>
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
            await authService.changePassword(currentPassword, newPassword, confirmPassword, captchaToken);
            
            openModal(
                <>
                    <h1>¡Contraseña actualizada!</h1>
                    <p>Tu contraseña ha sido cambiada exitosamente.</p>
                    <button className="button button--modal" onClick={() => {
                        closeModal();
                        navigate('/dashboard');
                    }}>
                        Ir al Dashboard
                    </button>
                </>
            );
            
            resetForm();
        } catch (error) {
            let errorMessage = 'Error al cambiar la contraseña.';
            
            try {
                // Intentar parsear la respuesta de error como JSON
                const errorData = JSON.parse(error.message);
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.data && typeof errorData.data === 'object') {
                    // Manejar errores de validación específicos
                    const validationErrors = errorData.data;
                    if (validationErrors.new_password) {
                        errorMessage = validationErrors.new_password[0];
                    } else if (validationErrors.confirm_password) {
                        errorMessage = validationErrors.confirm_password[0];
                    } else if (validationErrors.current_password) {
                        errorMessage = validationErrors.current_password[0];
                    } else {
                        errorMessage = 'Datos de entrada inválidos';
                    }
                }
            } catch (parseError) {
                // Si no se puede parsear, usar los códigos de estado
                if (error.message.includes('400')) {
                    errorMessage = 'La contraseña actual es incorrecta o la nueva contraseña no es válida.';
                } else if (error.message.includes('401')) {
                    errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
                }
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

            // Limpiar reCAPTCHA
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        if (!email) {
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

        setIsLoading(true);

        try {
            await authService.requestPasswordReset(email);
            
            openModal(
                <>
                    <h1>Código enviado</h1>
                    <p>Se ha enviado un código de verificación a tu email. El código expira en 10 minutos.</p>
                    <button className="button button--modal" onClick={() => {
                        closeModal();
                        setCurrentFlow('reset');
                        setStep(1);
                    }}>
                        Continuar
                    </button>
                </>
            );
            
            // Limpiar reCAPTCHA
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
            
        } catch (error) {
            let errorMessage = 'Error al enviar el código.';
            
            try {
                // Intentar parsear la respuesta de error como JSON
                const errorData = JSON.parse(error.message);
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.data && typeof errorData.data === 'object') {
                    // Manejar errores de validación específicos
                    const validationErrors = errorData.data;
                    if (validationErrors.email) {
                        errorMessage = validationErrors.email[0];
                    } else {
                        errorMessage = 'Datos de entrada inválidos';
                    }
                }
            } catch (parseError) {
                // Si no se puede parsear, usar los códigos de estado
                if (error.message.includes('404')) {
                    errorMessage = 'Usuario no encontrado.';
                } else if (error.message.includes('400')) {
                    errorMessage = 'Email no válido.';
                }
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
            
            // Limpiar reCAPTCHA
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (!email || !verificationCode || !newPassword || !confirmPassword) {
            openModal(
                <>
                    <h1>Campos requeridos</h1>
                    <p>Por favor completa todos los campos.</p>
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

        if (verificationCode.length !== 6) {
            openModal(
                <>
                    <h1>Código no válido</h1>
                    <p>El código de verificación debe tener 6 dígitos.</p>
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
            await authService.resetPassword(email, verificationCode, newPassword, confirmPassword);
            
            openModal(
                <>
                    <h1>¡Contraseña restablecida!</h1>
                    <p>Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
                    <button className="button button--modal" onClick={() => {
                        closeModal();
                        navigate('/login');
                    }}>
                        Ir al Login
                    </button>
                </>
            );
            
            resetForm();
        } catch (error) {
            let errorMessage = 'Error al restablecer la contraseña.';
            
            try {
                // Intentar parsear la respuesta de error como JSON
                const errorData = JSON.parse(error.message);
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.data && typeof errorData.data === 'object') {
                    // Manejar errores de validación específicos
                    const validationErrors = errorData.data;
                    if (validationErrors.new_password) {
                        errorMessage = validationErrors.new_password[0];
                    } else if (validationErrors.confirm_password) {
                        errorMessage = validationErrors.confirm_password[0];
                    } else if (validationErrors.code) {
                        errorMessage = validationErrors.code[0];
                    } else if (validationErrors.email) {
                        errorMessage = validationErrors.email[0];
                    } else {
                        errorMessage = 'Datos de entrada inválidos';
                    }
                }
            } catch (parseError) {
                // Si no se puede parsear, usar los códigos de estado
                if (error.message.includes('400')) {
                    errorMessage = 'Código de verificación inválido o expirado.';
                } else if (error.message.includes('404')) {
                    errorMessage = 'Usuario no encontrado.';
                }
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
            
            // Limpiar reCAPTCHA
            if (resetCaptcha) {
                resetCaptcha();
                setCaptchaToken(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Render del contenido según el flujo activo
    const renderContent = () => {
        switch (currentFlow) {
            case 'select':
                return (
                    <>
                        <h1 className="title-right-side">Gestión de Contraseña</h1>
                        <p style={{ color: '#FFFFFF', marginBottom: '30px' }}>
                            Selecciona una opción:
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <Button onClick={() => setCurrentFlow('change')}>
                                Cambiar Contraseña Actual
                            </Button>
                            <Button onClick={() => setCurrentFlow('forgot')}>
                                Olvidé mi Contraseña
                            </Button>
                            <Button onClick={() => navigate('/login')}>
                                Volver al Login
                            </Button>
                        </div>
                    </>
                );

            case 'change':
                return (
                    <>
                        <h1 className="title-right-side">Cambiar Contraseña</h1>
                        <p style={{ color: '#FFFFFF', marginBottom: '20px' }}>
                            Ingresa tu contraseña actual y tu nueva contraseña.
                        </p>

                        <form onSubmit={handleChangePassword}>
                            <Input
                                icon={lockIcon}
                                placeholder="Contraseña actual"
                                isPassword={true}
                                eyeIcon={eyeIcon}
                                hiddenIcon={hiddenIcon}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
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
                                placeholder="Confirmar nueva contraseña"
                                isPassword={true}
                                eyeIcon={eyeIcon}
                                hiddenIcon={hiddenIcon}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />

                            <p style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF', margin: '15px 0' }}>
                                La contraseña debe tener entre 12-18 caracteres,<br />
                                al menos 1 mayúscula, 1 minúscula, 1 número<br />
                                y 1 carácter especial.
                            </p>

                            <div style={{ marginTop: "20px" }}>
                                <RecaptchaWrapper 
                                    onCaptchaChange={setCaptchaToken}
                                    onReset={setResetCaptcha}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                                </Button>
                                <Button type="button" onClick={() => setCurrentFlow('select')}>
                                    Volver
                                </Button>
                            </div>
                        </form>
                    </>
                );

            case 'forgot':
                return (
                    <>
                        <h1 className="title-right-side">Recuperar Contraseña</h1>
                        <p style={{ color: '#FFFFFF', marginBottom: '20px' }}>
                            Ingresa tu email para recibir un código de verificación.
                        </p>

                        <form onSubmit={handleForgotPassword}>
                            <Input
                                icon={emailIcon}
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <div style={{ marginTop: "20px" }}>
                                <RecaptchaWrapper 
                                    onCaptchaChange={setCaptchaToken}
                                    onReset={setResetCaptcha}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Enviando...' : 'Enviar Código'}
                                </Button>
                                <Button type="button" onClick={() => setCurrentFlow('select')}>
                                    Volver
                                </Button>
                            </div>
                        </form>
                    </>
                );

            case 'reset':
                return (
                    <>
                        <h1 className="title-right-side">Restablecer Contraseña</h1>
                        <p style={{ color: '#FFFFFF', marginBottom: '20px' }}>
                            Ingresa el código de verificación y tu nueva contraseña.
                        </p>

                        <form onSubmit={handleResetPassword}>
                            <Input
                                icon={emailIcon}
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={searchParams.get('email')} // Deshabilitar si viene por URL
                            />
                            <Input
                                icon={lockIcon}
                                placeholder="Código de verificación (6 dígitos)"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                maxLength={6}
                            />
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
                                placeholder="Confirmar nueva contraseña"
                                isPassword={true}
                                eyeIcon={eyeIcon}
                                hiddenIcon={hiddenIcon}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />

                            <p style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF', margin: '15px 0' }}>
                                La contraseña debe tener entre 12-18 caracteres,<br />
                                al menos 1 mayúscula, 1 minúscula, 1 número<br />
                                y 1 carácter especial.
                            </p>

                            <div style={{ marginTop: "20px" }}>
                                <RecaptchaWrapper 
                                    onCaptchaChange={setCaptchaToken}
                                    onReset={setResetCaptcha}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                                </Button>
                                <Button type="button" onClick={() => {
                                    setCurrentFlow('forgot');
                                    setVerificationCode('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setCaptchaToken(null);
                                    if (resetCaptcha) resetCaptcha();
                                }}>
                                    Volver
                                </Button>
                            </div>
                        </form>
                    </>
                );

            default:
                return null;
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
                {renderContent()}
            </TwoSideContainer>
        </Background>
    );
}

export default PasswordManagerPage;
