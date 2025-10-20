import React from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface HeaderAtacadoProps {
  onSearchChange?: (term: string) => void;
}

const HeaderAtacado: React.FC<HeaderAtacadoProps> = ({ onSearchChange }) => {
  const { totalItems } = useCart();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-atacado-primary hover:opacity-80 transition-opacity">
          Fornecedores do Brás
        </Link>

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
        <nav className="flex items-center space-x-2">
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

          {/* Perfil */}
          <Link to="/perfil">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default HeaderAtacado;