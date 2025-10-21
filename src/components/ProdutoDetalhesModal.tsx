import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Package, Truck, ShoppingCart, Ruler, Weight, Image, X } from 'lucide-react';
import { Produto, UnidadeMedida } from '@/types/produto';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useCart } from '@/hooks/use-cart';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';

interface ProdutoDetalhesModalProps {
  produtoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Tipagem completa do produto para o modal
interface ProdutoDetalhes extends Produto {
    fornecedor_id: string;
}

const MOCK_IMAGE_URL = '/placeholder.svg';

const ProdutoDetalhesModal: React.FC<ProdutoDetalhesModalProps> = ({ produtoId, isOpen, onClose }) => {
  const { addItem } = useCart();
  const [produto, setProduto] = useState<ProdutoDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Busca o nome do fornecedor
  const fornecedorId = produto?.fornecedor_id ? [produto.fornecedor_id] : [];
  const { userNames: fornecedorNames, isLoading: isFornecedorNameLoading } = useB2BUserNames(fornecedorId);
  const fornecedorNome = fornecedorNames[fornecedorId[0]] || (fornecedorId[0] ? `Fornecedor ID: ${fornecedorId[0].substring(0, 8)}` : 'N/A');

  const fetchProdutoDetalhes = useCallback(async (id: string) => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        fotos_produto (id, url, ordem)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      showError("Erro ao carregar detalhes do produto: " + (error?.message || "Produto não encontrado."));
      console.error(error);
      setProduto(null);
    } else {
      // Ordena as fotos
      const fotosOrdenadas = (data.fotos_produto || []).sort((a, b) => a.ordem - b.ordem);
      setProduto({ ...data, fotos_produto: fotosOrdenadas } as ProdutoDetalhes);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && produtoId) {
      fetchProdutoDetalhes(produtoId);
    } else {
      setProduto(null);
    }
  }, [isOpen, produtoId, fetchProdutoDetalhes]);

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };
  
  const calculateUnitPrice = (price: number, unit: UnidadeMedida): number => {
    switch (unit) {
      case 'DZ': return price / 12;
      case 'CX': return price / 100;
      case 'PC': default: return price;
    }
  };

  const handleAddToCart = () => {
    if (!produto) return;
    
    // Adiciona 1 unidade de atacado (1 DZ, 1 PC ou 1 CX)
    addItem({
      id: produto.id,
      name: produto.nome,
      priceAtacado: produto.preco_atacado,
      unit: produto.unidade_medida,
      imageUrl: produto.fotos_produto?.[0]?.url || MOCK_IMAGE_URL,
      fornecedorId: produto.fornecedor_id,
      peso_kg: produto.peso_kg,
      comprimento_cm: produto.comprimento_cm,
      largura_cm: produto.largura_cm,
      altura_cm: produto.altura_cm,
    }, 1);
    onClose();
  };

  const isContentLoading = isLoading || isFornecedorNameLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto p-0">
        
        {isContentLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
          </div>
        ) : !produto ? (
          <div className="p-6 text-center">
            <p className="text-center text-gray-500">Detalhes do produto não encontrados.</p>
            <Button onClick={onClose} className="mt-4" variant="outline">Fechar</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Coluna 1: Imagens */}
            <div className="p-4 bg-gray-50">
              <Carousel className="w-full">
                <CarouselContent>
                  {produto.fotos_produto.map((foto, index) => (
                    <CarouselItem key={index}>
                      <img 
                        src={foto.url || MOCK_IMAGE_URL} 
                        alt={`${produto.nome} - Foto ${index + 1}`} 
                        className="w-full h-auto object-contain rounded-lg aspect-square"
                        onError={(e) => (e.currentTarget.src = MOCK_IMAGE_URL)}
                      />
                    </CarouselItem>
                  ))}
                  {produto.fotos_produto.length === 0 && (
                    <CarouselItem>
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg aspect-square">
                            <Image className="w-10 h-10 text-gray-500" />
                        </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>

            {/* Coluna 2: Detalhes e Ação */}
            <div className="p-6 space-y-4">
              <DialogHeader className="p-0">
                <DialogTitle className="text-3xl font-bold text-atacado-primary">{produto.nome}</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                    Vendido por: <span className="font-semibold text-atacado-accent">{fornecedorNome}</span>
                </DialogDescription>
              </DialogHeader>

              <Separator />

              {/* Descrição */}
              {produto.descricao && (
                <div className="space-y-2">
                    <h3 className="font-semibold text-atacado-primary">Descrição</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{produto.descricao}</p>
                </div>
              )}
              
              <Separator />

              {/* Preços */}
              <div className="space-y-1">
                <p className="text-4xl font-extrabold text-atacado-accent">
                  {formatCurrency(produto.preco_atacado)}/{produto.unidade_medida}
                </p>
                <p className="text-lg text-gray-600">
                  Preço por unidade: {formatCurrency(calculateUnitPrice(produto.preco_atacado, produto.unidade_medida))}
                </p>
                <p className="text-sm text-gray-500">
                  Mínimo de compra: {produto.minimo_compra} unidades.
                </p>
              </div>

              <Separator />

              {/* Informações de Estoque e Categoria */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Categoria:</strong> {produto.categoria}</p>
                <p><strong>Estoque:</strong> {produto.quantidade_estoque} unidades</p>
              </div>

              {/* Dimensões para Frete */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-atacado-primary flex items-center">
                        <Truck className="w-4 h-4 mr-2" /> Informações de Envio (Por Unidade)
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="flex items-center"><Weight className="w-4 h-4 mr-1 text-gray-500" /> Peso: {produto.peso_kg} kg</p>
                        <p className="flex items-center"><Ruler className="w-4 h-4 mr-1 text-gray-500" /> Comprimento: {produto.comprimento_cm} cm</p>
                        <p className="flex items-center"><Ruler className="w-4 h-4 mr-1 text-gray-500" /> Largura: {produto.largura_cm} cm</p>
                        <p className="flex items-center"><Ruler className="w-4 h-4 mr-1 text-gray-500" /> Altura: {produto.altura_cm} cm</p>
                    </div>
                </CardContent>
              </Card>

              {/* Ação */}
              <div className="pt-4">
                <Button 
                  className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" /> ADICIONAR 1 {produto.unidade_medida} AO CARRINHO
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  <X className="w-4 h-4 mr-2" /> Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProdutoDetalhesModal;