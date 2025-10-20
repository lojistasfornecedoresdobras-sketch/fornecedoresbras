import React, { useState, useEffect, useCallback } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, Loader2, ArrowLeft, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface ProdutoFormData {
  nome: string;
  preco_atacado: string;
  preco_minimo_pequeno: string;
  quantidade_estoque: string;
  unidade_medida: string;
  categoria: string;
  minimo_compra: string;
  foto_url: string;
}

const categorias = ['Roupas', 'Calçados', 'Acessórios', 'Infantil'];
const unidades = ['DZ', 'PC', 'CX'];

const EditarProduto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { b2bProfile, isLoading: isAuthLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: '',
    preco_atacado: '',
    preco_minimo_pequeno: '',
    quantidade_estoque: '',
    unidade_medida: '',
    categoria: '',
    minimo_compra: '',
    foto_url: '/placeholder.svg',
  });

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

    setFormData({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    const produtoData = {
      nome: formData.nome,
      preco_atacado: parseFloat(formData.preco_atacado),
      preco_minimo_pequeno: parseFloat(formData.preco_minimo_pequeno),
      quantidade_estoque: parseInt(formData.quantidade_estoque),
      unidade_medida: formData.unidade_medida,
      categoria: formData.categoria,
      minimo_compra: parseInt(formData.minimo_compra),
      foto_url: formData.foto_url,
      // fornecedor_id não precisa ser atualizado
    };

    const { error } = await supabase
      .from('produtos')
      .update(produtoData)
      .eq('id', id);

    if (error) {
      showError("Erro ao atualizar produto: " + error.message);
      console.error(error);
    } else {
      showSuccess("Produto atualizado com sucesso!");
      navigate('/estoque');
    }
    setIsSaving(false);
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
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input id="nome" placeholder="Ex: Camiseta Polo Algodão" required value={formData.nome} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_atacado">Preço DZ/CX/PC (Atacado)</Label>
                  <Input id="preco_atacado" type="number" step="0.01" placeholder="R$ 120,00" required value={formData.preco_atacado} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_minimo_pequeno">Preço Mínimo Varejo (Referência)</Label>
                  <Input id="preco_minimo_pequeno" type="number" step="0.01" placeholder="R$ 19,90" required value={formData.preco_minimo_pequeno} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="minimo_compra">Mínimo Compra (Unidades)</Label>
                  <Input id="minimo_compra" type="number" placeholder="12" required value={formData.minimo_compra} onChange={handleChange} />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="quantidade_estoque">Estoque (Unidades)</Label>
                  <Input id="quantidade_estoque" type="number" placeholder="150" required value={formData.quantidade_estoque} onChange={handleChange} />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                  <Select required value={formData.unidade_medida} onValueChange={(v) => handleSelectChange('unidade_medida', v)}>
                    <SelectTrigger id="unidade_medida">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select required value={formData.categoria} onValueChange={(v) => handleSelectChange('categoria', v)}>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto">Foto do Produto (Mock)</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-atacado-primary/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-3 text-atacado-primary" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SALVAR ALTERAÇÕES'}
              </Button>
            </form>
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