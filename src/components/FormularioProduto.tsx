import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Save, Trash2, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/hooks/use-auth';
import { FotoProduto } from '@/types/produto';
import { Textarea } from '@/components/ui/textarea'; // Importando Textarea

interface ProdutoData {
  id?: string; // Presente apenas na edição
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

// URL de placeholder garantida (usada apenas como fallback visual)
const MOCK_IMAGE_URL = 'https://via.placeholder.com/100x100?text=B2B';

// Função REAL de upload para o Supabase Storage
const uploadImage = async (file: File, fornecedorId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    // Caminho: fornecedorId/nome_do_arquivo
    const filePath = `${fornecedorId}/${fileName}`; 

    const { data, error } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error("Erro real de upload:", error);
        throw new Error(`Falha ao enviar imagem: ${error.message}`);
    }

    // Retorna a URL pública
    const { data: publicUrlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};

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
    descricao: '', // NOVO
    peso_kg: '',
    comprimento_cm: '',
    largura_cm: '',
    altura_cm: '',
    fotos: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        peso_kg: initialData.peso_kg?.toString() || '',
        comprimento_cm: initialData.comprimento_cm?.toString() || '',
        largura_cm: initialData.largura_cm?.toString() || '',
        altura_cm: initialData.altura_cm?.toString() || '',
        fotos: initialData.fotos || [],
        descricao: (initialData as any).descricao || '', // Garante que a descrição seja carregada
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
      // Usamos um ID temporário e a URL blob para pré-visualização
      id: `temp-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      ordem: currentCount + index,
      file: file, // Armazena o objeto File
    }));

    setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...newPhotos] }));
    showSuccess(`${newPhotos.length} foto(s) adicionada(s) para upload.`);
    
    e.target.value = '';
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData(prev => {
      const updatedFotos = prev.fotos
        .filter(f => f.id !== photoId)
        .map((f, index) => ({ ...f, ordem: index }));
      
      // Revoga a URL blob se for uma foto temporária
      const removedPhoto = prev.fotos.find(f => f.id === photoId);
      if (removedPhoto?.file) {
        URL.revokeObjectURL(removedPhoto.url);
      }
      
      // Se a foto já estava salva no DB (não tem 'file'), ela será removida do DB no handleSubmit

      return { ...prev, fotos: updatedFotos };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bProfile?.id) {
      showError("Erro de autenticação. Fornecedor não identificado.");
      return;
    }
    setIsLoading(true);

    let produtoId = formData.id;
    let error;
    let message;

    try {
      // 1. Salvar/Atualizar Produto (Primeiro, para obter o ID se for um novo produto)
      const produtoPayload = {
        nome: formData.nome,
        preco_atacado: parseFloat(formData.preco_atacado),
        preco_minimo_pequeno: parseFloat(formData.preco_minimo_pequeno),
        quantidade_estoque: parseInt(formData.quantidade_estoque),
        unidade_medida: formData.unidade_medida,
        categoria: formData.categoria,
        minimo_compra: parseInt(formData.minimo_compra),
        fornecedor_id: b2bProfile.id,
        descricao: formData.descricao, // NOVO CAMPO
        
        peso_kg: parseFloat(formData.peso_kg) || 0,
        comprimento_cm: parseFloat(formData.comprimento_cm) || 0,
        largura_cm: parseFloat(formData.largura_cm) || 0,
        altura_cm: parseFloat(formData.altura_cm) || 0,
      };

      if (isEditing && produtoId) {
        const result = await supabase
          .from('produtos')
          .update(produtoPayload)
          .eq('id', produtoId);
        error = result.error;
        message = "Produto atualizado com sucesso!";
      } else {
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
        throw new Error(error.message);
      }
      
      // 2. Processar Upload de Novas Fotos e Gerenciar Fotos no DB
      if (produtoId) {
        const photosToUpload = formData.fotos.filter(f => f.file);
        const photosToKeep = formData.fotos.filter(f => !f.file); // Fotos já salvas (com URL pública)

        // A. Upload das novas fotos
        const uploadedPhotos: FotoProduto[] = [];
        for (const photo of photosToUpload) {
          // Upload REAL
          const publicUrl = await uploadImage(photo.file!, b2bProfile.id); 
          uploadedPhotos.push({
            id: `db-${Date.now()}-${Math.random()}`, 
            url: publicUrl,
            ordem: photo.ordem,
            file: undefined, 
          });
          // Revoga a URL blob após upload
          URL.revokeObjectURL(photo.url);
        }

        const finalPhotos = [...photosToKeep, ...uploadedPhotos].sort((a, b) => a.ordem - b.ordem);

        // B. Deletar todas as fotos antigas e inserir as finais
        // Isso garante que fotos removidas pelo usuário sejam apagadas e a ordem seja mantida.
        
        // Deletar todas as fotos antigas (para simplificar a lógica de upsert/delete)
        const { error: deleteError } = await supabase
          .from('fotos_produto')
          .delete()
          .eq('produto_id', produtoId);
        
        if (deleteError) {
          console.error("Erro ao limpar fotos antigas:", deleteError);
        }

        // Inserir todas as fotos finais
        if (finalPhotos.length > 0) {
          const fotosPayload = finalPhotos.map(f => ({
            produto_id: produtoId,
            url: f.url,
            ordem: f.ordem,
          }));

          const { error: insertPhotosError } = await supabase
            .from('fotos_produto')
            .insert(fotosPayload);

          if (insertPhotosError) {
            console.error("Erro ao salvar fotos:", insertPhotosError);
          }
        }
        
        // Atualiza o estado local com as URLs públicas reais
        setFormData(prev => ({
            ...prev,
            fotos: finalPhotos.map(f => ({
                id: f.id,
                url: f.url,
                ordem: f.ordem,
                file: undefined,
            })),
        }));
      }

      showSuccess(message);
      
      // Chama onSuccess para redirecionar
      onSuccess();
      
      if (!isEditing) {
        setFormData({
          nome: '',
          preco_atacado: '',
          preco_minimo_pequeno: '',
          quantidade_estoque: '',
          unidade_medida: '',
          categoria: '',
          minimo_compra: '6',
          descricao: '', // NOVO
          peso_kg: '',
          comprimento_cm: '',
          largura_cm: '',
          altura_cm: '',
          fotos: [],
        });
      }

    } catch (e: any) {
      showError(`Falha na operação: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para garantir que o placeholder seja exibido se a URL falhar
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    // Se a URL já for a URL mockada, não tente carregar novamente para evitar loop
    if (target.src === MOCK_IMAGE_URL) {
        return;
    }
    target.src = MOCK_IMAGE_URL;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Produto</Label>
        <Input id="nome" placeholder="Ex: Camiseta Polo Algodão" required value={formData.nome} onChange={handleChange} />
      </div>
      
      {/* CAMPO DE DESCRIÇÃO */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição Detalhada do Produto</Label>
        <Textarea 
          id="descricao" 
          placeholder="Detalhes sobre material, tamanhos, cores disponíveis e informações de atacado." 
          value={formData.descricao} 
          onChange={handleChange} 
          rows={4}
        />
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
              multiple
              accept="image/*"
            />
          </label>
        </div>
        
        {/* Pré-visualização das Fotos */}
        <div className="flex flex-wrap gap-3">
          {formData.fotos.map((foto) => (
            <div key={foto.id} className="relative w-20 h-20 border rounded-lg overflow-hidden group">
              <img 
                src={foto.url} 
                alt={`Foto ${foto.ordem + 1}`} 
                className="w-full h-full object-cover" 
                onError={handleImageError}
              />
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