import { useState } from "react";
import Background from "../components/Background";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SidebarButton from "../components/SidebarButton";

import ReportesTopView from "./reportes/ReportesTopView";
import AdministracionTopView from "./administracion/AdministracionTopView";
import WatchdogTopView from "./watchdog/WatchdogTopView";

import userIcon from '../assets/icons/user.png';
import logoutIcon from '../assets/icons/logout.png';
import carIcon from '../assets/icons/car.png';
import folderIcon from '../assets/icons/documents-folder.png';

function Dashboard({ authToken, userRole, displayName, userInfo, onLogout }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('administracion');

    const handleViewChange = (view) => setCurrentView(view);

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            onLogout();
        }
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'administracion':
                return <AdministracionTopView />;
            case 'watchdog':
                return <WatchdogTopView />;
            case 'reportes':
                return <ReportesTopView />;
            default:
                return <div className="default-view">Select a view from the sidebar</div>;
        }
    };

    return (
        <Background>
        <div className="dashboard-layout">
            <Sidebar
            onStateChange={setIsSidebarOpen}
            renderContent={(isOpen) => (
            <div className="sidebar-content-wrapper">
                <ul className="sidebar-buttons">
                {isOpen ? (
                    <>
                    <li>Usuario</li>

                    <SidebarButton onClick={() => handleViewChange('administracion')}>
                        <img
                        src={userIcon}
                        alt="User Icon"
                        className="sidebar-user-icon"
                        />
                        <p className="sidebar-button-text">Administración</p>
                    </SidebarButton>

                    <SidebarButton onClick={() => handleViewChange('watchdog')}>
                        <img
                        src={carIcon}
                        alt="User Icon"
                        className="sidebar-user-icon"
                        />
                        <p className="sidebar-button-text">Ubicaciones</p>
                    </SidebarButton>

                    <SidebarButton onClick={() => handleViewChange('reportes')}>
                        <img
                        src={folderIcon}
                        alt="User Icon"
                        className="sidebar-user-icon"
                        />
                        <p className="sidebar-button-text">Reportes</p>
                    </SidebarButton>

                    {/* Spacer to push logout button to bottom */}
                    <div className="sidebar-spacer" />

                    <SidebarButton className="sidebar-button-danger" onClick={handleLogout}>
                        <img
                        src={logoutIcon}
                        alt="Logout Icon"
                        className="sidebar-user-icon"
                        />
                        <p className="sidebar-button-text">Cerrar sesión</p>
                    </SidebarButton>
                    </>
                ) : (
                    <>
                    <button className="sidebar-button opened" onClick={() => handleViewChange('administracion')}>
                        <img src={userIcon} alt="User Icon" className="sidebar-user-icon" />
                    </button>
                    <button className="sidebar-button opened" onClick={() => handleViewChange('watchdog')}>
                        <img src={carIcon} alt="Car Icon" className="sidebar-user-icon" />
                    </button>
                    <button className="sidebar-button opened" onClick={() => handleViewChange('reportes')}>
                        <img src={folderIcon} alt="Folder Icon" className="sidebar-user-icon" />
                    </button>
                    </>
                )}
                </ul>
            </div>
            )}

            />

            <Navbar isSidebarOpen={isSidebarOpen}>
            <div className="navbar-title-container">
                <img
                src={
                    currentView === 'administracion'
                    ? userIcon
                    : currentView === 'watchdog'
                    ? carIcon
                    : currentView === 'reportes'
                    ? folderIcon
                    : userIcon
                }
                alt="View Icon"
                className="sidebar-user-icon"
                />
                <p className="tab-title">
                {currentView === 'administracion' && 'Administración'}
                {currentView === 'watchdog' && 'Ubicaciones'}
                {currentView === 'reportes' && 'Reportes'}
                </p>
                <p style={{ marginLeft: '30px' }}>
                {currentView === 'administracion' && 'Gestión de usuarios, vehículos y dispositivos'}
                {currentView === 'watchdog' && 'Watchdog y geocercas'}
                {currentView === 'reportes' && 'Visualización de reportes y exportación'}
                </p>
            </div>

            <div className="navbar-user">
                <p>{displayName || 'Usuario'}</p>
            </div>
            </Navbar>
            
            <div
            className="dashboard-content"
            style={{
                marginTop: '12vh',
                marginLeft: isSidebarOpen ? '21vw' : '7.25vw',
                marginBottom: '2vh',
                marginRight: '1vw',
                transition: 'margin-left 0.3s ease',
            }}
            >
            {renderCurrentView()}
            </div>
        </div>
        </Background>
    );
}

export default Dashboard;