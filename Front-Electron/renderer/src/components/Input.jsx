import { useState } from "react";

function Input({ icon, placeholder, isPassword = false, eyeIcon, hiddenIcon }) {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => setIsVisible((prev) => !prev);
    const inputType = isPassword ? (isVisible ? "text" : "password") : "text";

    return (
        <div className="custom-input">
        {/* Left-side icon */}
        {icon && <img src={icon} alt="" className="input-icon" />}

        {/* Text input */}
        <input
            className="input"
            type={inputType}
            placeholder={placeholder}
        />

        {/* Right-side toggle icon */}
        {isPassword && (eyeIcon || hiddenIcon) && (
            <img
            src={isVisible ? hiddenIcon : eyeIcon}
            alt="Toggle visibility"
            className="input-icon right-icon clickable"
            onClick={toggleVisibility}
            />
        )}
        </div>
    );
}

export default Input;
