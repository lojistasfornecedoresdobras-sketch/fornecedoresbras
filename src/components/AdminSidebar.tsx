import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Settings, LogOut, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Gerenciar Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Gerenciar Produtos', href: '/admin/produtos', icon: Package },
  { name: 'Gerenciar Usuários', href: '/admin/usuarios', icon: Users },
  { name: 'Configurações', href: '/admin/config', icon: Settings },
];

const AdminSidebar: React.FC = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4">
      <div className="text-xl font-bold text-atacado-accent mb-6">
        Painel Admin B2B
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-atacado-primary text-white hover:bg-atacado-primary/90'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4 bg-sidebar-border" />

      <Button 
        variant="ghost" 
        className="w-full justify-start text-left text-red-500 hover:bg-red-50"
        onClick={signOut}
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sair do Admin
      </Button>
    </div>
  );
};

export default AdminSidebar;