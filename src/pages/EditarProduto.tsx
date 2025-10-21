import React, { useState, useEffect, useCallback } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import FormularioProduto from '@/components/FormularioProduto';
import { FotoProduto } from '@/types/produto';

interface ProdutoFormData {
  id: string;
  nome: string;
  preco_atacado: string;
  preco_minimo_pequeno: string;
  quantidade_estoque: string;
  unidade_medida: string;
  categoria: string;
  minimo_compra: string;
  descricao: string; // NOVO CAMPO
  
  // Novos campos de frete
  peso_kg: string;
  comprimento_cm: string;
  largura_cm: string;
  altura_cm: string;

  // Novo campo de fotos
  fotos: FotoProduto[];
}

const EditarProduto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { b2bProfile, isLoading: isAuthLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<ProdutoFormData | undefined>(undefined);

  const fetchProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    
    // Busca o produto e as fotos relacionadas
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *, 
        fotos_produto (id, url, ordem)
      `)
      .eq('id', productId)
      .single();

    if (error || !data) {
      showError("Erro ao carregar produto: " + (error?.message || "Produto não encontrado."));
      console.error(error);
      setIsLoading(false);
      return;
    }

    const isAdministrator = b2bProfile?.role === 'administrador';
    
    // Verifica se o produto pertence ao fornecedor logado, a menos que seja um administrador
    if (!isAdministrator && data.fornecedor_id !== b2bProfile?.id) {
      showError("Acesso negado. Você não é o proprietário deste produto.");
      navigate('/estoque', { replace: true });
      return;
    }

    // Ordena as fotos pela ordem
    const fotosOrdenadas = (data.fotos_produto as FotoProduto[] || []).sort((a, b) => a.ordem - b.ordem);

    const loadedData: ProdutoFormData = {
      id: data.id,
      nome: data.nome || '',
      descricao: data.descricao || '', // NOVO
      preco_atacado: data.preco_atacado?.toString() || '',
      preco_minimo_pequeno: data.preco_minimo_pequeno?.toString() || '',
      quantidade_estoque: data.quantidade_estoque?.toString() || '',
      unidade_medida: data.unidade_medida || '',
      categoria: data.categoria || '',
      minimo_compra: data.minimo_compra?.toString() || '12',
      // Mapeamento dos campos de frete
      peso_kg: data.peso_kg?.toString() || '',
      comprimento_cm: data.comprimento_cm?.toString() || '',
      largura_cm: data.largura_cm?.toString() || '',
      altura_cm: data.altura_cm?.toString() || '',
      // Mapeamento das fotos
      fotos: fotosOrdenadas,
    };
    
    console.log("Dados do produto carregados (incluindo fotos):", loadedData.fotos); // LOG DE DEBUG

    setInitialData(loadedData);
    setIsLoading(false);
  }, [b2bProfile?.id, b2bProfile?.role, navigate]);

  useEffect(() => {
    // Permite carregar se for fornecedor OU administrador
    if (!isAuthLoading && (b2bProfile?.role === 'fornecedor' || b2bProfile?.role === 'administrador') && id) {
      fetchProduct(id);
    }
  }, [isAuthLoading, b2bProfile, id, fetchProduct]);

  const handleSuccess = () => {
    // Após a edição, redireciona para o estoque (se for fornecedor) ou para o gerenciamento de produtos (se for admin)
    if (b2bProfile?.role === 'administrador') {
      navigate('/admin/produtos');
    } else {
      navigate('/estoque');
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  // Redirecionamento de segurança
  if (b2bProfile?.role !== 'fornecedor' && b2bProfile?.role !== 'administrador') {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(b2bProfile?.role === 'administrador' ? '/admin/produtos' : '/estoque')}
          >
            <ArrowLeft className="w-6 h-6 text-atacado-primary" />
          </Button>
          <h1 className="text-3xl font-bold text-atacado-primary">✏️ EDITAR PRODUTO #{id?.substring(0, 8)}</h1>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {initialData ? (
              <FormularioProduto 
                initialData={initialData}
                isEditing={true}
                onSuccess={handleSuccess}
              />
            ) : (
              <p className="text-center text-red-500">Não foi possível carregar os dados do produto.</p>
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

export default EditarProduto;