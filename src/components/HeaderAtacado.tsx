import React from 'react';
import { Search, ShoppingCart, User, Package, ShoppingBag, HelpCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderAtacadoProps {
  onSearchChange?: (term: string) => void;
}

const NavLink: React.FC<{ to: string, children: React.ReactNode, icon: React.ElementType }> = ({ to, children, icon: Icon }) => (
  <Link to={to} className="text-sm font-medium text-gray-700 hover:text-atacado-primary transition-colors hidden lg:inline-flex items-center h-full px-3">
    <Icon className="w-4 h-4 mr-1" />
    {children}
  </Link>
);

const HeaderAtacado: React.FC<HeaderAtacadoProps> = ({ onSearchChange }) => {
  const { totalItems } = useCart();
  const { isAuthenticated, b2bProfile } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const isFornecedor = b2bProfile?.role === 'fornecedor';
  const isLojista = b2bProfile?.role === 'lojista';
  const isAdmin = b2bProfile?.role === 'administrador';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-atacado-primary hover:opacity-80 transition-opacity min-w-max">
          Fornecedores do Brás
        </Link>

        {/* Navegação Principal (Desktop) */}
        <nav className="hidden lg:flex h-full items-center space-x-1 ml-6">
          
          {/* Links Comuns */}
          <NavLink to="/" icon={Truck}>Home</NavLink>
          <NavLink to="/ajuda" icon={HelpCircle}>Ajuda</NavLink>
          
          {/* Links B2B */}
          {isAuthenticated && (
            <>
              {/* Links para Lojista e Fornecedor */}
              {(isLojista || isFornecedor) && (
                <NavLink to="/catalogo" icon={Package}>Catálogo Atacado</NavLink>
              )}

              {/* Links Específicos do Lojista */}
              {isLojista && (
                <NavLink to="/meus-pedidos" icon={ShoppingBag}>Meus Pedidos</NavLink>
              )}

              {/* Links Específicos do Fornecedor */}
              {isFornecedor && (
                <>
                  <NavLink to="/estoque" icon={Package}>Meu Estoque</NavLink>
                  <NavLink to="/pedidos-fornecedor" icon={ShoppingBag}>Pedidos Recebidos</NavLink>
                </>
              )}

              {/* Link Específico do Administrador */}
              {isAdmin && (
                <NavLink to="/admin" icon={User}>Painel Admin</NavLink>
              )}
            </>
          )}
        </nav>

        {/* Search (Hidden on small screens for mobile focus) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="🔍 Busca Atacado..."
              className="pl-9 h-9"
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Navigation Icons (Mobile friendly) */}
        <nav className="flex items-center space-x-2 min-w-max">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Carrinho (Visível apenas para Lojistas ou não autenticados que podem estar navegando) */}
          {(!isAuthenticated || isLojista || isFornecedor) && (
            <Link to="/carrinho" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-atacado-accent"
                >
                  {totalItems}
                </Badge>
              )}
            </Link>
          )}

          {/* Perfil / Login */}
          <Link to={isAuthenticated ? "/perfil" : "/login"}>
            <Button variant="ghost" size="icon" className={cn(
              isAdmin && 'text-red-500 hover:text-red-600'
            )}>
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default HeaderAtacado;