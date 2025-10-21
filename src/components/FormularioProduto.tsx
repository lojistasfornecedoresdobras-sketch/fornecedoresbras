import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Save, Trash2, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/hooks/use-auth';
import { FotoProduto } from '@/types/produto'; // Importando a nova tipagem

interface ProdutoData {
  id?: string; // Presente apenas na edição
  nome: string;
  preco_atacado: string;
  preco_minimo_pequeno: string;
  quantidade_estoque: string;
  unidade_medida: string;
  categoria: string;
  minimo_compra: string;
  // Removido foto_url
  
  // Novos campos de frete
  peso_kg: string;
  comprimento_cm: string;
  largura_cm: string;
  altura_cm: string;

  // Novo estado para fotos
  fotos: FotoProduto[];
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
    minimo_compra: '6',
    // Valores iniciais para frete
    peso_kg: '',
    comprimento_cm: '',
    largura_cm: '',
    altura_cm: '',
    fotos: [], // Inicializa com array vazio
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Garante que os campos numéricos sejam strings vazias se forem 0 ou null
        peso_kg: initialData.peso_kg || '',
        comprimento_cm: initialData.comprimento_cm || '',
        largura_cm: initialData.largura_cm || '',
        altura_cm: initialData.altura_cm || '',
        fotos: initialData.fotos || [],
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Omit<ProdutoData, 'fotos'>, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Manipulador de upload de foto atualizado para múltiplos arquivos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.fotos.length;
    const filesArray = Array.from(files);
    const filesToAdd = filesArray.slice(0, 5 - currentCount);

    if (filesToAdd.length === 0) {
      showError("Limite de 5 fotos atingido.");
      return;
    }

    const newPhotos: FotoProduto[] = filesToAdd.map((file, index) => ({
      id: `mock-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      ordem: currentCount + index,
    }));

    setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...newPhotos] }));
    showSuccess(`${newPhotos.length} foto(s) adicionada(s) (Mock).`);
    
    // Limpa o valor do input para permitir o upload do mesmo arquivo novamente
    e.target.value = '';
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter(f => f.id !== photoId).map((f, index) => ({ ...f, ordem: index })),
    }));
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
      // Removido foto_url
      fornecedor_id: b2bProfile.id, // Adicionado para garantir que está no payload de insert
      
      // Campos de frete
      peso_kg: parseFloat(formData.peso_kg) || 0,
      comprimento_cm: parseFloat(formData.comprimento_cm) || 0,
      largura_cm: parseFloat(formData.largura_cm) || 0,
      altura_cm: parseFloat(formData.altura_cm) || 0,
    };

    let error;
    let message;
    let produtoId = formData.id;

    if (isEditing && produtoId) {
      // Lógica de Edição
      const result = await supabase
        .from('produtos')
        .update(produtoPayload)
        .eq('id', produtoId);
      error = result.error;
      message = "Produto atualizado com sucesso!";
    } else {
      // Lógica de Cadastro
      const result = await supabase
        .from('produtos')
        .insert([produtoPayload])
        .select('id')
        .single();
      error = result.error;
      message = "Produto cadastrado com sucesso!";
      if (result.data) {
        produtoId = result.data.id;
      }
    }

    if (error) {
      showError(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} produto: ${error.message}`);
      console.error(error);
      setIsLoading(false);
      return;
    }
    
    // 2. Gerenciar Fotos (Inserir/Atualizar/Deletar)
    if (produtoId) {
      // 2a. Deletar fotos antigas (simplesmente deletamos todas e reinserimos)
      if (isEditing) {
        const { error: deleteError } = await supabase
          .from('fotos_produto')
          .delete()
          .eq('produto_id', produtoId);
        
        if (deleteError) {
          showError("Erro ao limpar fotos antigas: " + deleteError.message);
          console.error(deleteError);
          // Continuamos, mas com aviso
        }
      }

      // 2b. Inserir novas fotos
      if (formData.fotos.length > 0) {
        const fotosPayload = formData.fotos.map(f => ({
          produto_id: produtoId,
          url: f.url,
          ordem: f.ordem,
        }));

        const { error: insertPhotosError } = await supabase
          .from('fotos_produto')
          .insert(fotosPayload);

        if (insertPhotosError) {
          showError("Erro ao salvar fotos: " + insertPhotosError.message);
          console.error(insertPhotosError);
          // Continuamos, mas com aviso
        }
      }
    }

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
        minimo_compra: '6',
        peso_kg: '',
        comprimento_cm: '',
        largura_cm: '',
        altura_cm: '',
        fotos: [],
      });
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
          <Input id="minimo_compra" type="number" placeholder="6" required value={formData.minimo_compra} onChange={handleChange} />
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
      
      {/* CAMPOS DE FRETE */}
      <h3 className="text-lg font-semibold text-atacado-primary pt-4 border-t">Dimensões e Peso (Por Unidade)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="peso_kg">Peso (kg)</Label>
          <Input id="peso_kg" type="number" step="0.01" placeholder="0.5" required value={formData.peso_kg} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comprimento_cm">Comprimento (cm)</Label>
          <Input id="comprimento_cm" type="number" step="0.1" placeholder="20" required value={formData.comprimento_cm} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="largura_cm">Largura (cm)</Label>
          <Input id="largura_cm" type="number" step="0.1" placeholder="15" required value={formData.largura_cm} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="altura_cm">Altura (cm)</Label>
          <Input id="altura_cm" type="number" step="0.1" placeholder="5" required value={formData.altura_cm} onChange={handleChange} />
        </div>
      </div>

      {/* NOVO CAMPO DE FOTOS */}
      <h3 className="text-lg font-semibold text-atacado-primary pt-4 border-t">Fotos do Produto (Máx. 5)</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${formData.fotos.length >= 5 ? 'bg-gray-200 border-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 border-atacado-primary/50'}`}>
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-5 h-5 mb-1 text-atacado-primary" />
              <p className="text-sm text-gray-500">
                Clique para upload ({formData.fotos.length}/5). <span className="font-semibold text-red-500">Recomendado: 1000x1000px.</span>
              </p>
            </div>
            <input 
              id="dropzone-file" 
              type="file" 
              className="hidden" 
              onChange={handlePhotoUpload}
              disabled={formData.fotos.length >= 5}
              multiple // Permite múltiplos arquivos
            />
          </label>
        </div>
        
        {/* Pré-visualização das Fotos */}
        <div className="flex flex-wrap gap-3">
          {formData.fotos.map((foto) => (
            <div key={foto.id} className="relative w-20 h-20 border rounded-lg overflow-hidden group">
              <img src={foto.url} alt={`Foto ${foto.ordem + 1}`} className="w-full h-full object-cover" />
              <Button 
                type="button"
                variant="destructive" 
                size="icon" 
                className="absolute top-0 right-0 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemovePhoto(foto.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {formData.fotos.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma foto adicionada.</p>
          )}
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