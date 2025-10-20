import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/hooks/use-auth';

interface ProdutoData {
  id?: string; // Presente apenas na edição
  nome: string;
  preco_atacado: string;
  preco_minimo_pequeno: string;
  quantidade_estoque: string;
  unidade_medida: string;
  categoria: string;
  minimo_compra: string;
  foto_url: string;
}

interface FormularioProdutoProps {
  initialData?: ProdutoData;
  isEditing: boolean;
  onSuccess: () => void;
}

const categorias = ['Roupas', 'Calçados', 'Acessórios', 'Infantil'];
const unidades = ['DZ', 'PC', 'CX'];

const FormularioProduto: React.FC<FormularioProdutoProps> = ({ initialData, isEditing, onSuccess }) => {
  const { b2bProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProdutoData>(initialData || {
    nome: '',
    preco_atacado: '',
    preco_minimo_pequeno: '',
    quantidade_estoque: '',
    unidade_medida: '',
    categoria: '',
    minimo_compra: '12',
    foto_url: '/placeholder.svg',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof ProdutoData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bProfile?.id) {
      showError("Erro de autenticação. Fornecedor não identificado.");
      return;
    }
    setIsLoading(true);

    const produtoPayload = {
      nome: formData.nome,
      preco_atacado: parseFloat(formData.preco_atacado),
      preco_minimo_pequeno: parseFloat(formData.preco_minimo_pequeno),
      quantidade_estoque: parseInt(formData.quantidade_estoque),
      unidade_medida: formData.unidade_medida,
      categoria: formData.categoria,
      minimo_compra: parseInt(formData.minimo_compra),
      foto_url: formData.foto_url,
    };

    let error;
    let message;

    if (isEditing && formData.id) {
      // Lógica de Edição
      const result = await supabase
        .from('produtos')
        .update(produtoPayload)
        .eq('id', formData.id);
      error = result.error;
      message = "Produto atualizado com sucesso!";
    } else {
      // Lógica de Cadastro
      const result = await supabase
        .from('produtos')
        .insert([{ ...produtoPayload, fornecedor_id: b2bProfile.id }]);
      error = result.error;
      message = "Produto cadastrado com sucesso!";
    }

    if (error) {
      showError(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} produto: ${error.message}`);
      console.error(error);
    } else {
      showSuccess(message);
      onSuccess();
      
      // Limpar formulário após cadastro
      if (!isEditing) {
        setFormData({
          nome: '',
          preco_atacado: '',
          preco_minimo_pequeno: '',
          quantidade_estoque: '',
          unidade_medida: '',
          categoria: '',
          minimo_compra: '12',
          foto_url: '/placeholder.svg',
        });
      }
    }
    setIsLoading(false);
  };

  return (
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
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> {isEditing ? 'SALVAR ALTERAÇÕES' : 'SALVAR PRODUTO'}</>}
      </Button>
    </form>
  );
};

export default FormularioProduto;