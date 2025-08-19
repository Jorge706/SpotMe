import React, { useState, useEffect } from 'react';
import AuthWebView from './components/AuthWebView';
import Dashboard from './pages/Dashboard';
import './App.css'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authToken, setAuthToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldResetWebView, setShouldResetWebView] = useState(false);

    // Verificar si ya hay una sesión activa al cargar la aplicación
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedRole = localStorage.getItem('userRole');
        const storedDisplayName = localStorage.getItem('displayName');
        const storedUserInfo = localStorage.getItem('userInfo');
        
        if (storedToken && storedRole) {
            console.log('Sesión existente encontrada');
            setAuthToken(storedToken);
            setUserRole(storedRole);
            setDisplayName(storedDisplayName || 'Usuario');
            setUserInfo(storedUserInfo ? JSON.parse(storedUserInfo) : null);
            setIsAuthenticated(true);
        }
        
        setIsLoading(false);
    }, []);

    // Manejar autenticación exitosa
    const handleAuthSuccess = (token, role, displayName, userInfo) => {
        console.log('Autenticación exitosa:', { token, role, displayName, userInfo });
        setAuthToken(token);
        setUserRole(role);
        setDisplayName(displayName);
        setUserInfo(userInfo);
        setIsAuthenticated(true);
    };

    // Manejar cierre de sesión
    const handleLogout = () => {
        // Limpiar sesión en el WebView si existe la función
        if (typeof window.logoutFromWebView === 'function') {
            window.logoutFromWebView();
        }
        
        // Limpiar sesión local
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('displayName');
        localStorage.removeItem('userInfo');
        setAuthToken(null);
        setUserRole(null);
        setDisplayName(null);
        setUserInfo(null);
        setIsAuthenticated(false);
        
        // Marcar que el WebView debe reiniciarse
        setShouldResetWebView(true);
        
        // Resetear la bandera después de un momento
        setTimeout(() => {
            setShouldResetWebView(false);
        }, 2000);
    };

    // Exponer la función de logout globalmente para que pueda ser usada desde el Dashboard
    useEffect(() => {
        window.logout = handleLogout;
    }, []);

    if (isLoading) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '20px'
            }}>
                Iniciando aplicación...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthWebView onAuthSuccess={handleAuthSuccess} shouldReset={shouldResetWebView} />;
    }

    return (
        <Dashboard 
            authToken={authToken} 
            userRole={userRole} 
            displayName={displayName}
            userInfo={userInfo}
            onLogout={handleLogout} 
        />
    );
}

export default App
