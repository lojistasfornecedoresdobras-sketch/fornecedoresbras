import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/b2b';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
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
  // Se b2bProfile.role for null, ele não estará incluído em allowedRoles, o que é o comportamento desejado.
  const userRole = b2bProfile?.role;
  
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Se o usuário estiver autenticado, mas não tiver a role correta, 
    // redireciona para a home ou para o perfil (se for admin tentando acessar rota comum)
    if (allowedRoles.includes('administrador')) {
      // Se a rota exige admin, mas o usuário não é, vai para a home
      return <Navigate to="/" replace />;
    }
    // Para outras roles, redireciona para a home
    return <Navigate to="/" replace />;
  }
  
  // Se o usuário for administrador e estiver tentando acessar uma rota comum, 
  // podemos redirecioná-lo para o painel de administração.
  if (b2bProfile?.role === 'administrador' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;