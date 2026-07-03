import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Background from "../components/Background";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SidebarButton from "../components/SidebarButton";
import UserInfoModal from "../components/UserInfoModal";

import AdministracionTopView from "./administracion/AdministracionPage";
import TestTopView from "./administracion/test";

import userIcon from '../assets/icons/user.png';
import logoutIcon from '../assets/icons/logout.png';
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";



function Dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('administracion');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleViewChange = (view) => setCurrentView(view);

    const handleLogout = async () => {
        if (isLoggingOut) return; // Prevenir doble click
        
        setIsLoggingOut(true);
        
        try {
            // Intentar logout en el backend
            await authService.logout();
        } catch (error) {
            // Continuar con logout local aunque falle el backend
        } finally {
            // Siempre limpiar datos locales y redirigir
            logout();
            navigate('/login');
            setIsLoggingOut(false);
        }
    };

    const renderCurrentView = () => {
        switch (currentView){
            case 'administracion':
                return <AdministracionTopView />;
            case 'test':
                return <TestTopView />;
            // Add more cases for other views as needed
            default:
                return <div className="default-view">Select a view from the sidebar</div>;
        }
    }


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

                    <SidebarButton onClick={() => setIsUserModalOpen(true)}>
                        <img
                        src={userIcon}
                        alt="User Icon"
                        className="sidebar-user-icon"
                        />
                        <p className="sidebar-button-text">Administración</p>
                    </SidebarButton>

                    {/* Spacer to push logout button to bottom */}
                    <div className="sidebar-spacer" />

                    <SidebarButton className="sidebar-button-danger" onClick={handleLogout}>
                        <img
                        src={logoutIcon}
                        alt="Logout Icon"
                        className="sidebar-user-icon"
                        />
                        <p className="sidebar-button-text">
                            {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                        </p>
                    </SidebarButton>
                    </>
                ) : (
                    <>
                        <button className="sidebar-button opened" onClick={() => setIsUserModalOpen(true)}>
                            <img src={userIcon} alt="User Icon" className="sidebar-user-icon" />
                        </button>
                    </>
                )}
                </ul>
            </div>
            )}

            />

            <Navbar isSidebarOpen={isSidebarOpen}>
                <div className="navbar-title-container">
                    <img src={userIcon} alt="User Icon" className="sidebar-user-icon" />
                    <p className="tab-title">Monitorista</p>
                </div>

                <div className="navbar-user">
                    <p>{user?.name ? `${user.name} ${user.last_name || ''}` : 'Usuario'}</p>
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

            {/* Modal de información del usuario */}
            <UserInfoModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
            />
        </div>
        </Background>
    );
}

export default Dashboard;
