import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Mostrar loading mientras se carga la autenticación
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        backgroundColor: '#000'
      }}>
        <p>Cargando...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar si el usuario tiene uno de los roles permitidos
  const userRoleId = user.role_id || user.user_role_id;
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleId)) {
    // Usuario no tiene el rol necesario
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        color: 'white',
        backgroundColor: '#000'
      }}>
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta página.</p>
        <p>Solo usuarios administradores y monitoristas pueden acceder al Dashboard web.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Volver al Login
        </button>
      </div>
    );
  }
  
  return children;
};

export default RoleProtectedRoute;
