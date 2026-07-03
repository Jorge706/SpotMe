import { useRef, useState } from "react";;

import ReCAPTCHA from "react-google-recaptcha";

import Background from "../../components/Background";
import TwoSideContainer from "../../components/TwoSideContainer";
import Button from "../../components/Button";
import Input from "../../components/Input";

import emailIcon from "../../assets/icons/email.png";
import lockIcon from "../../assets/icons/lock.png";
import eyeIcon from "../../assets/icons/eye.png";
import hiddenIcon from "../../assets/icons/hidden.png";

import Modal from "../../components/Modal";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function ContrasenaPage_Activo() {  
    const recaptchaRef = useRef(null);
    const [captchaToken, setCaptchaToken] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    const handleSubmit = (e) => {
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

            <form onSubmit={handleSubmit}>
            <Input icon={lockIcon} placeholder="Ingresa el código de verificación" />

            <Button>Solicitar código</Button>

            <Input
                icon={lockIcon}
                placeholder="Ingresa tu contraseña"
                isPassword={true}
                eyeIcon={eyeIcon}
                hiddenIcon={hiddenIcon}
                
            />

            <div style={{ marginTop: "20px" }}>
                <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                />
            </div>

            <Button>Continuar</Button>
            </form>
            
        </TwoSideContainer>
        </Background>
    );
}


export default ContrasenaPage_Activo;
