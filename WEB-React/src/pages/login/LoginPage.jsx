import { useRef, useState, useEffect } from "react";;
import { useNavigate } from "react-router-dom";

import Background from "../../components/Background";
import TwoSideContainer from "../../components/TwoSideContainer";
import Button from "../../components/Button";
import Input from "../../components/Input";

import emailIcon from "../../assets/icons/email.png";
import lockIcon from "../../assets/icons/lock.png";
import eyeIcon from "../../assets/icons/eye.png";
import hiddenIcon from "../../assets/icons/hidden.png";

import Modal from "../../components/Modal";
import RecaptchaWrapper from "../../components/RecaptchaWrapper";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

function LoginPage() {  
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetCaptcha, setResetCaptcha] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Verificar si el usuario tiene acceso al dashboard (Admin o Monitorista)
      const userRoleId = user.role_id || user.user_role_id;
      if (userRoleId === 2 || userRoleId === 3) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        backgroundColor: '#000'
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

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

    if (!email || !password) {
      openModal(
        <>
          <h1>Campos requeridos</h1>
          <p>Por favor ingresa tu email y contraseña.</p>
          <button className="button button--modal" onClick={closeModal}>
            Aceptar
          </button>
        </>
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.initiateAuth(email, password, captchaToken);
      
      // Verificar si los datos están en response.data o directamente en response
      const userData = response.data || response;
      
      // Guardar información del usuario para el siguiente paso
      localStorage.setItem('user_id', userData.user_id);
      localStorage.setItem('user_email', userData.email);
      
      // Navegar a la página de verificación de código
      navigate('/login/verificacion');

    } catch (error) {
      let errorMessage = 'Credenciales incorrectas. Por favor verifica tu email y contraseña.';
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        // Error del servidor
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        switch (status) {
          case 401:
            errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
            break;
          case 422:
            errorMessage = 'Los datos ingresados no son válidos. Verifica la información.';
            break;
          case 429:
            errorMessage = 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
            break;
          default:
            errorMessage = serverMessage || 'Error en el servidor. Inténtalo más tarde.';
        }
      } else if (error.request) {
        // Error de red
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }
      
      openModal(
        <>
          <h1>Error de autenticación</h1>
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
        <h1 className="title-right-side">Ingresar</h1>

        <form onSubmit={handleSubmit}>
          <Input 
            icon={emailIcon} 
            placeholder="Ingresa tu correo electrónico" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <Input
            icon={lockIcon}
            placeholder="Ingresa tu contraseña"
            isPassword={true}
            eyeIcon={eyeIcon}
            hiddenIcon={hiddenIcon}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ marginTop: "20px" }}>
            <RecaptchaWrapper 
              onCaptchaChange={setCaptchaToken}
              onReset={setResetCaptcha}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
          
        </form>
        
        <div style={{ marginTop: '15px' }}>
          <Button type="button" onClick={() => navigate('/change-password')}>
            ¿Olvidaste tu contraseña?
          </Button>
        </div>
      </TwoSideContainer>
    </Background>
  );
}


export default LoginPage;
