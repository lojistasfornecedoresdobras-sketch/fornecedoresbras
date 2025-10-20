import React, { useEffect, useState, useCallback } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Truck, Loader2 } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface Produto {
  id: string;
  nome: string;
  quantidade_estoque: number;
  preco_atacado: number;
  unidade_medida: 'DZ' | 'PC' | 'CX';
}

const EstoqueFornecedor: React.FC = () => {
  const navigate = useNavigate();
  const { b2bProfile, isLoading: isAuthLoading } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchProdutos = useCallback(async () => {
    if (!b2bProfile?.id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, quantidade_estoque, preco_atacado, unidade_medida')
      .eq('fornecedor_id', b2bProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError("Erro ao carregar estoque: " + error.message);
      console.error(error);
    } else {
      setProdutos(data as Produto[]);
    }
    setIsLoading(false);
  }, [b2bProfile]);

  useEffect(() => {
    if (!isAuthLoading && b2bProfile?.role === 'fornecedor') {
      fetchProdutos();
    }
  }, [isAuthLoading, b2bProfile, fetchProdutos]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${productName}"? Esta ação é irreversível.`)) {
      return;
    }

    setIsDeleting(productId);
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);

    if (error) {
      showError("Erro ao excluir produto: " + error.message);
      console.error(error);
    } else {
      showSuccess(`Produto "${productName}" excluído com sucesso.`);
      // Atualiza a lista localmente
      setProdutos(prev => prev.filter(p => p.id !== productId));
    }
    setIsDeleting(null);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  // Redirecionamento de segurança, embora a rota já esteja protegida pelo ProtectedRoute
  if (b2bProfile?.role !== 'fornecedor') {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-atacado-primary">📦 MEU ESTOQUE ATACADO</h1>
          <Button 
            className="bg-atacado-accent hover:bg-orange-600 text-white"
            onClick={() => navigate('/cadastro-produto')}
          >
            <Plus className="w-4 h-4 mr-2" />
            NOVO PRODUTO ATACADO
          </Button>
        </div>

        {/* Gráfico Mock */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-atacado-primary text-lg">Vendas por Categoria (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-100 flex items-center justify-center rounded border border-dashed text-gray-500">
              GRÁFICO: Vendas por Categoria (barras laranja)
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Produtos */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
              </div>
            ) : produtos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum produto cadastrado. Comece adicionando um novo produto!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Estoque (Un)</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell className="text-right">{produto.quantidade_estoque} un</TableCell>
                      <TableCell className="text-right font-bold text-atacado-accent">R${produto.preco_atacado.toFixed(2)}/{produto.unidade_medida}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="ghost" size="icon" className="text-atacado-primary" onClick={() => navigate(`/editar-produto/${produto.id}`)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(produto.id, produto.nome)}
                          disabled={isDeleting === produto.id}
                        >
                          {isDeleting === produto.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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

export default EstoqueFornecedor;