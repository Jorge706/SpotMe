import React from 'react';

function Navbar({ isSidebarOpen, children }) {
    const sidebarWidth = isSidebarOpen ? "20vw" : "6.25vw";

    return (
        <header
        className="navbar"
        style={{
        left: sidebarWidth,
        width: `calc(100vw - ${sidebarWidth})`,
        }}
        >
        <div className="navbar-content">
            {children}
        </div>
        </header>
    );
}

export default Navbar;
