import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, b2bProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se houver roles permitidas, verifica se o perfil B2B corresponde
  if (allowedRoles && b2bProfile && !allowedRoles.includes(b2bProfile.role || '')) {
    // Se o usuário estiver autenticado, mas não tiver a role correta, 
    // podemos redirecionar para uma página de acesso negado ou para a home.
    // Por enquanto, redirecionamos para a home.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;