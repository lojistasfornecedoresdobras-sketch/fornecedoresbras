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
  const location = useLocation();

  if (isLoading) {
    console.log("ProtectedRoute: Loading authentication state...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated. Redirecting to /login.");
    return <Navigate to="/login" replace />;
  }

  const userRole = b2bProfile?.role;
  const currentPath = location.pathname;

  console.log(`ProtectedRoute: User authenticated. Role: ${userRole}. Path: ${currentPath}. Allowed Roles: ${allowedRoles ? allowedRoles.join(', ') : 'Any B2B'}`);

  // 1. Redirecionamento de segurança para Administrador
  if (userRole === 'administrador' && !currentPath.startsWith('/admin')) {
    console.log("ProtectedRoute: Admin detected on non-admin path. Redirecting to /admin.");
    return <Navigate to="/admin" replace />;
  }

  // 2. Verificação de Role Específica
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    console.log(`ProtectedRoute: Access denied. Role ${userRole} not in allowed roles.`);
    return <Navigate to="/" replace />;
  }
  
  // 3. Se o perfil B2B for nulo (usuário novo), redireciona para o perfil para preenchimento
  // Nota: O PerfilB2B.tsx lida com a exibição do formulário se a role for null.
  // Se o admin tiver role='administrador', ele passa por aqui.
  if (!userRole && currentPath !== '/perfil') {
    console.log("ProtectedRoute: Role is null. Redirecting to /perfil for setup.");
    return <Navigate to="/perfil" replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;