import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import HeaderAtacado from '@/components/HeaderAtacado';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Truck, Edit, ShoppingCart, Package } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Link } from 'react-router-dom';

const PerfilB2B: React.FC = () => {
  const { b2bProfile, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  if (!b2bProfile) {
    return (
      <div className="min-h-screen bg-atacado-background">
        <HeaderAtacado />
        <main className="container mx-auto p-4 text-center pt-10">
          <h1 className="text-2xl font-bold text-atacado-primary">Perfil Não Encontrado</h1>
          <p className="text-gray-600 mt-2">Por favor, complete seu cadastro após o login.</p>
          <Button onClick={signOut} className="mt-4 bg-atacado-accent hover:bg-orange-600">
            Sair
          </Button>
        </main>
      </div>
    );
  }

  const isFornecedor = b2bProfile.role === 'fornecedor';

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <h1 className="text-3xl font-bold text-atacado-primary">👤 MINHA LOJA</h1>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-atacado-primary">
              {b2bProfile.nome_fantasia || 'Dados Cadastrais'}
              <Button variant="ghost" size="icon" className="text-atacado-accent hover:text-orange-600">
                <Edit className="w-5 h-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-700">
            <p><strong>Email:</strong> {b2bProfile.email}</p>
            <p><strong>CNPJ:</strong> {b2bProfile.cnpj || 'Não informado'}</p>
            <p><strong>Razão Social:</strong> {b2bProfile.razao_social || 'Não informado'}</p>
            <p><strong>Telefone:</strong> {b2bProfile.telefone || 'Não informado'}</p>
            <p><strong>Endereço:</strong> {b2bProfile.endereco || 'Não informado'}</p>
            <p className="pt-2">
              <strong className="text-atacado-accent">Tipo de Usuário:</strong> {isFornecedor ? 'Fornecedor Brás' : 'Lojista Atacado'}
            </p>
          </CardContent>
        </Card>

        {/* Métricas B2B e Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isFornecedor ? (
            <>
              {/* Card de Pedidos Recebidos */}
              <Link to="/pedidos-fornecedor">
                <Card className="bg-atacado-primary text-white hover:bg-atacado-primary/90 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center justify-between">
                      PEDIDOS RECEBIDOS <ShoppingCart className="w-5 h-5" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">12 Novos</p>
                    <p className="text-sm text-gray-300">Clique para gerenciar</p>
                  </CardContent>
                </Card>
              </Link>
              
              {/* Card de Estoque */}
              <Link to="/estoque">
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-atacado-primary text-lg flex items-center justify-between">
                      MEU ESTOQUE <Package className="w-5 h-5 text-atacado-accent" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-atacado-accent">1.200 DZ</p>
                    <p className="text-sm text-gray-500">Produtos disponíveis</p>
                  </CardContent>
                </Card>
              </Link>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-atacado-primary text-lg">PEDIDOS CONCLUÍDOS ⭐</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-atacado-accent">245</p>
                  <p className="text-sm text-gray-500">Total de pedidos no atacado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-atacado-primary text-lg">ECONOMIA ATACADO 💰</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-atacado-accent">R$45.890</p>
                  <p className="text-sm text-gray-500">Economia total em compras DZ/CX</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            onClick={signOut} 
            variant="destructive"
          >
            Sair da Conta
          </Button>
          <Button 
            className="bg-atacado-accent hover:bg-orange-600 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            EDITAR DADOS
          </Button>
        </div>
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

export default PerfilB2B;