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

interface ProdutoFormData {
  id: string;
  nome: string;
  preco_atacado: string;
  preco_minimo_pequeno: string;
  quantidade_estoque: string;
  unidade_medida: string;
  categoria: string;
  minimo_compra: string;
  foto_url: string;
}

const EditarProduto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { b2bProfile, isLoading: isAuthLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<ProdutoFormData | undefined>(undefined);

  const fetchProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !data) {
      showError("Erro ao carregar produto: " + (error?.message || "Produto não encontrado."));
      console.error(error);
      setIsLoading(false);
      return;
    }

    // Verifica se o produto pertence ao fornecedor logado
    if (data.fornecedor_id !== b2bProfile?.id) {
      showError("Acesso negado. Você não é o proprietário deste produto.");
      navigate('/estoque', { replace: true });
      return;
    }

    setInitialData({
      id: data.id,
      nome: data.nome || '',
      preco_atacado: data.preco_atacado?.toString() || '',
      preco_minimo_pequeno: data.preco_minimo_pequeno?.toString() || '',
      quantidade_estoque: data.quantidade_estoque?.toString() || '',
      unidade_medida: data.unidade_medida || '',
      categoria: data.categoria || '',
      minimo_compra: data.minimo_compra?.toString() || '12',
      foto_url: data.foto_url || '/placeholder.svg',
    });
    setIsLoading(false);
  }, [b2bProfile?.id, navigate]);

  useEffect(() => {
    if (!isAuthLoading && b2bProfile?.role === 'fornecedor' && id) {
      fetchProduct(id);
    }
  }, [isAuthLoading, b2bProfile, id, fetchProduct]);

  const handleSuccess = () => {
    // Após a edição, redireciona para o estoque
    navigate('/estoque');
  };

  if (isAuthLoading || isLoading) {
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

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/estoque')}>
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