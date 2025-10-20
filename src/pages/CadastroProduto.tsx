import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Loader2, Save } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useAuth } from '@/hooks/use-auth';
import { Navigate, useNavigate } from 'react-router-dom';
import FormularioProduto from '@/components/FormularioProduto';

const CadastroProduto: React.FC = () => {
  const { b2bProfile, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  // Redirecionamento de segurança
  if (b2bProfile?.role !== 'fornecedor') {
    return <Navigate to="/perfil" replace />;
  }

  const handleSuccess = () => {
    // Após o cadastro, redireciona para o estoque
    navigate('/estoque');
  };

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <h1 className="text-3xl font-bold text-atacado-primary">📝 NOVO PRODUTO ATACADO</h1>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <FormularioProduto 
              isEditing={false}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </main>

      <footer className="mt-10 bg-atacado-primary text-white p-4 text-center">
        <p className="flex items-center justify-center font-medium">
          Atacado Brás - Entrega Rápida! <Truck className="w-5 h-5 ml-2" />
        </p>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default CadastroProduto;