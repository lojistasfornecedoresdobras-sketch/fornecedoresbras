import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Edit, Trash2, Search } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';
import { Input } from '@/components/ui/input';

interface Produto {
  id: string;
  nome: string;
  preco_atacado: number;
  unidade_medida: 'DZ' | 'PC' | 'CX';
  quantidade_estoque: number;
  fornecedor_id: string;
}

const GerenciarProdutosAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Coletar IDs de fornecedores para buscar nomes
  const fornecedorIds = useMemo(() => produtos.map(p => p.fornecedor_id), [produtos]);
  const { userNames: fornecedorNames, isLoading: isNamesLoading } = useB2BUserNames(fornecedorIds);

  const fetchProdutos = useCallback(async (term: string) => {
    setIsLoading(true);
    
    let query = supabase
      .from('produtos')
      .select('id, nome, preco_atacado, unidade_medida, quantidade_estoque, fornecedor_id')
      .order('created_at', { ascending: false });

    if (term) {
      query = query.ilike('nome', `%${term}%`);
    }

    // Assumindo que o admin tem permissão de leitura total na tabela 'produtos'.
    const { data, error } = await query;

    if (error) {
      showError("Erro ao carregar produtos: " + error.message);
      console.error(error);
      setProdutos([]);
    } else {
      setProdutos(data as Produto[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProdutos(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchProdutos]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${productName}"? Esta ação é irreversível.`)) {
      return;
    }

    setIsDeleting(productId);
    
    // Assumindo que o admin tem permissão de DELETE total na tabela 'produtos'.
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

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  const displayLoading = isLoading || isNamesLoading;

  return (
    <div className="flex min-h-screen bg-atacado-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold text-atacado-primary flex items-center">
            <Package className="w-6 h-6 mr-3" /> Gerenciar Produtos
          </h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          
          {/* Barra de Busca */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-0">
              {displayLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
                </div>
              ) : produtos.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum produto encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Estoque (Un)</TableHead>
                      <TableHead className="text-right">Preço Atacado</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell className="text-atacado-primary">
                          {fornecedorNames[produto.fornecedor_id] || `ID: ${produto.fornecedor_id.substring(0, 8)}`}
                        </TableCell>
                        <TableCell className="text-right">{produto.quantidade_estoque} un</TableCell>
                        <TableCell className="text-right font-bold text-atacado-accent">
                          {formatCurrency(produto.preco_atacado)}/{produto.unidade_medida}
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                          {/* Redireciona para a página de edição existente, mas o admin pode editar */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-atacado-primary" 
                            onClick={() => navigate(`/editar-produto/${produto.id}`)}
                          >
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

        <footer className="p-4 border-t bg-white">
          <MadeWithDyad />
        </footer>
      </div>
    </div>
  );
};

export default GerenciarProdutosAdmin;