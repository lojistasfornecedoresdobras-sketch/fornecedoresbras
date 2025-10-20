import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Package, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const DashboardAdmin: React.FC = () => {
  const mockStats = [
    { title: "Total de Pedidos", value: "1.250", icon: ShoppingCart, color: "text-blue-600" },
    { title: "Faturamento Bruto", value: "R$ 500K", icon: DollarSign, color: "text-green-600" },
    { title: "Fornecedores Ativos", value: "45", icon: Users, color: "text-atacado-accent" },
    { title: "Produtos Cadastrados", value: "3.120", icon: Package, color: "text-purple-600" },
  ];

  return (
    <div className="flex min-h-screen bg-atacado-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold text-atacado-primary">Dashboard Administrativo</h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          
          {/* Cartões de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockStats.map((stat, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-atacado-primary">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +20.1% desde o mês passado (Mock)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Seções de Gerenciamento Rápido */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-atacado-primary">Atividade Recente de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 flex items-center justify-center rounded border border-dashed text-gray-500">
                  Tabela/Gráfico de Pedidos Recentes (Mock)
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-atacado-primary">Alertas do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center text-red-500">
                    <Users className="w-4 h-4 mr-2" /> 5 novos cadastros aguardando aprovação.
                  </li>
                  <li className="flex items-center text-yellow-600">
                    <Package className="w-4 h-4 mr-2" /> 1 produto com estoque baixo.
                  </li>
                  <li className="flex items-center text-green-600">
                    <DollarSign className="w-4 h-4 mr-2" /> Pagamento de comissão agendado.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="p-4 border-t bg-white">
          <MadeWithDyad />
        </footer>
      </div>
    </div>
  );
};

export default DashboardAdmin;