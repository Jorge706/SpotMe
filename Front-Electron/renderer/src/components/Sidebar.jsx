import { useEffect, useRef, useState } from "react";
import burgerIcon from '../assets/icons/burger-bar.png';
import logo from '../assets/logo.png';

function Sidebar({ children, renderContent, onStateChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef(null);

    const toggleSidebar = () => {
        setIsOpen(prev => {
        const newState = !prev;
        onStateChange?.(newState); // notify parent
        return newState;
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
            setIsOpen(false);
            onStateChange?.(false); // notify parent
        }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <>
        {isOpen && <div className="sidebar-overlay"></div>}

        <div ref={sidebarRef} className={`sidebar ${isOpen ? "open" : "closed"}`}>
            {!isOpen && (
            <button className="toggle-button" onClick={toggleSidebar}>
                <img className="sidebar-menu-icon" src={burgerIcon} alt="Menu" />
            </button>
            )}

            {isOpen && (
            <div className="sidebar-logo">
                <button
                onClick={() => {
                    setIsOpen(false);
                    onStateChange?.(false);
                }}
                style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                }}
                aria-label="Close sidebar"
                >
                <img src={logo} alt="Logo" className="sidebar-logo-img" />
                </button>
            </div>
            )}

            <nav className="sidebar-content">
            {renderContent ? renderContent(isOpen) : children}
            </nav>
        </div>
        </>
    );
}



export default Sidebar;
