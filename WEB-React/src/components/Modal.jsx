import { useEffect, useState } from "react";
import cancelIcon from '../assets/icons/cancel.png';

function Modal({ children, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(); // Notify parent to unmount after animation
    }, 300); // Must match your animation duration
  };

  // ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside
  const handleClickOutside = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      handleClose();
    }
  };

  return (
    <div
      className={`modal-overlay ${isClosing ? 'fade-out' : ''}`}
      onClick={handleClickOutside}
    >
      <div
        className={`modal-content ${isClosing ? 'slide-down' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-close-button" onClick={handleClose}>
          <img src={cancelIcon} alt="Close" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
