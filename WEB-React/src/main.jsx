import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import LoginPage from './pages/login/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CodigoPage from './pages/codigo/CodigoPage.jsx';
import ContrasenaPage_1 from './pages/contrasena/ContrasenaPage_1.jsx';
import ContrasenaPage_2 from './pages/contrasena/ContrasenaPage_2.jsx';
import ContrasenaPage_Activo from './pages/contrasena/ContrasenaPage_Activo.jsx';
import PasswordManagerPage from './pages/contrasena/PasswordManagerPage.jsx';
import NewPasswordPage from './pages/contrasena/NewPasswordPage.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/verificacion" element={<CodigoPage />} />
                <Route path="/cambiarcontrasena" element={<ContrasenaPage_1 />} />
                <Route path="/cambiarcontrasena/2" element={<ContrasenaPage_2 />} />
                <Route path="/cambiarcontrasena/activo" element={<ContrasenaPage_Activo />} />
                <Route path="/password-manager" element={<PasswordManagerPage />} />
                <Route path="/forgot-password" element={<PasswordManagerPage />} />
                <Route path="/reset-password" element={<PasswordManagerPage />} />
                <Route path="/change-password" element={<NewPasswordPage />} />
                <Route path="/dashboard" element={
                        <Dashboard />

                } />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
)
