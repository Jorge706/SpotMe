import { useRef, useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const RecaptchaWrapper = ({ onCaptchaChange, onReset }) => {
    const recaptchaRef = useRef(null);
    const [captchaError, setCaptchaError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const handleCaptchaChange = (token) => {
        setCaptchaError(false);
        onCaptchaChange(token);
    };

    const handleCaptchaError = () => {
        setCaptchaError(true);
        onCaptchaChange(null);
    };

    const handleCaptchaExpired = () => {
        console.warn('reCAPTCHA expired');
        setCaptchaError(true);
        onCaptchaChange(null);
    };

    const resetCaptcha = () => {
        if (recaptchaRef.current) {
            try {
                recaptchaRef.current.reset();
                setCaptchaError(false);
            } catch (error) {
                console.warn('Error resetting reCAPTCHA:', error);
            }
        }
    };

    // Exponer método reset al componente padre
    useEffect(() => {
        if (onReset) {
            onReset(resetCaptcha);
        }
    }, [onReset]);

    const reloadCaptcha = () => {
        setCaptchaError(false);
        setIsLoaded(false);
        // Forzar re-render del componente
        setTimeout(() => setIsLoaded(true), 100);
    };

    if (!RECAPTCHA_SITE_KEY) {
        return (
            <div style={{ 
                padding: '10px', 
                backgroundColor: '#ffebee', 
                border: '1px solid #f44336', 
                borderRadius: '4px',
                color: '#d32f2f'
            }}>
                ⚠️ reCAPTCHA no configurado correctamente
            </div>
        );
    }

    if (captchaError) {
        return (
            <div style={{ 
                padding: '10px', 
                backgroundColor: '#fff3e0', 
                border: '1px solid #ff9800', 
                borderRadius: '4px',
                textAlign: 'center'
            }}>
                <p style={{ margin: '0 0 10px 0', color: '#e65100' }}>
                    Error al cargar reCAPTCHA
                </p>
                <button 
                    onClick={reloadCaptcha}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div>
            <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                onErrored={handleCaptchaError}
                onExpired={handleCaptchaExpired}
                theme="light"
                size="normal"
            />
        </div>
    );
};

export default RecaptchaWrapper;
