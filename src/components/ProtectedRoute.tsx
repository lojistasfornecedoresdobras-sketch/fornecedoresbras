import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/b2b';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, b2bProfile } = useAuth();
  const location = useLocation(); // Adicionado useLocation para usar location.pathname

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

  // Log de depuração
  console.log("ProtectedRoute: User authenticated. Role:", b2bProfile?.role, "Path:", location.pathname);

  // Se houver roles permitidas, verifica se o perfil B2B corresponde
  // Se b2bProfile.role for null, ele não estará incluído em allowedRoles, o que é o comportamento desejado.
  const userRole = b2bProfile?.role;
  
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Se a rota exige uma role específica, mas o usuário não a tem, redireciona para a home
    console.log("ProtectedRoute: Access denied for role", userRole, "on path", location.pathname);
    return <Navigate to="/" replace />;
  }
  
  // Redirecionamento de segurança para Administrador:
  // Se o usuário for administrador e estiver tentando acessar uma rota comum (que não seja /admin), 
  // redirecionamos para o painel de administração.
  if (b2bProfile?.role === 'administrador' && !location.pathname.startsWith('/admin')) {
    console.log("ProtectedRoute: Admin redirecting to /admin");
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;