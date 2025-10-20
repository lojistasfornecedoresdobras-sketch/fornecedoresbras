import React from 'react';
import { Search, ShoppingCart, User, Package, ShoppingBag, HelpCircle } from 'lucide-react';
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

const NavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="text-sm font-medium text-gray-700 hover:text-atacado-primary transition-colors hidden lg:inline-flex items-center h-full px-3">
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
          <NavLink to="/">Home</NavLink>
          <NavLink to="/catalogo">Catálogo Atacado</NavLink>
          <NavLink to="/ajuda">
            <HelpCircle className="w-4 h-4 mr-1" /> Ajuda
          </NavLink>
          
          {isAuthenticated && (
            <>
              {isFornecedor && (
                <NavLink to="/estoque">
                  <Package className="w-4 h-4 mr-1" /> Meu Estoque
                </NavLink>
              )}
              {isLojista && (
                <NavLink to="/meus-pedidos">
                  <ShoppingBag className="w-4 h-4 mr-1" /> Meus Pedidos
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin">
                  <User className="w-4 h-4 mr-1" /> Painel Admin
                </NavLink>
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
          
          {/* Carrinho */}
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