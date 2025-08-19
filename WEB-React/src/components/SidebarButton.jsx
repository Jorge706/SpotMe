function SidebarButton({ children, className = "", onClick  }) {
    return (
        <button className={`sidebar-button-opened ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}

export default SidebarButton;