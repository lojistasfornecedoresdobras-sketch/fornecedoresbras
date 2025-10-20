import React, { useEffect, useState, useCallback } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import ProductCardAtacado from '@/components/ProductCardAtacado';
import FiltrosCatalogo from '@/components/FiltrosCatalogo';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Produto {
  id: string;
  nome: string;
  preco_atacado: number;
  unidade_medida: 'DZ' | 'PC' | 'CX';
  foto_url: string;
  fornecedor_id: string; // Adicionado
  categoria: string; // Adicionado para filtro
}

type SortOrder = 'created_at_desc' | 'preco_atacado_asc' | 'preco_atacado_desc';

const CatalogoAtacado: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('created_at_desc'); // Padrão: Mais Recentes

  const fetchProdutos = useCallback(async (term: string, category: string | null, order: SortOrder) => {
    setIsLoading(true);
    
    let query = supabase
      .from('produtos')
      .select('id, nome, preco_atacado, unidade_medida, foto_url, fornecedor_id, categoria');

    // 1. Filtro de Busca (Nome)
    if (term) {
      query = query.ilike('nome', `%${term}%`);
    }

    // 2. Filtro de Categoria
    if (category && category !== 'Todos') {
      query = query.eq('categoria', category);
    }

    // 3. Ordenação
    let orderByColumn = 'created_at';
    let ascending = false;

    if (order === 'preco_atacado_asc') {
      orderByColumn = 'preco_atacado';
      ascending = true;
    } else if (order === 'preco_atacado_desc') {
      orderByColumn = 'preco_atacado';
      ascending = false;
    }
    // 'created_at_desc' é o padrão

    query = query.order(orderByColumn, { ascending });

    const { data, error } = await query;

    if (error) {
      showError("Erro ao carregar catálogo: " + error.message);
      console.error(error);
    } else {
      setProdutos(data as Produto[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Debounce para busca e filtros
    const handler = setTimeout(() => {
      fetchProdutos(searchTerm, selectedCategory, sortOrder);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, selectedCategory, sortOrder, fetchProdutos]);

  const calculateUnitPrice = (price: number, unit: 'DZ' | 'PC' | 'CX'): number => {
    // Assumindo: DZ = 12 unidades, CX = 100 unidades, PC = 1 unidade
    switch (unit) {
      case 'DZ':
        return price / 12;
      case 'CX':
        return price / 100;
      case 'PC':
      default:
        return price;
    }
  };

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado onSearchChange={setSearchTerm} />
      
      <main className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold text-atacado-primary pt-4">📦 CATÁLOGO ATACADO BRÁS</h1>
        
        <FiltrosCatalogo 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Exibindo o termo de busca ativo */}
        {(searchTerm || selectedCategory) && (
          <p className="text-sm text-gray-600">
            Filtros ativos: 
            {searchTerm && <span className="font-semibold text-atacado-accent ml-1">Busca: "{searchTerm}"</span>}
            {selectedCategory && selectedCategory !== 'Todos' && <span className="font-semibold text-atacado-accent ml-1">Categoria: {selectedCategory}</span>}
          </p>
        )}

        {/* Grade de Produtos */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhum produto encontrado no catálogo {searchTerm ? `para "${searchTerm}"` : ''}.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.map((product) => (
              <ProductCardAtacado 
                key={product.id} 
                id={product.id}
                name={product.nome} 
                priceDz={product.preco_atacado} 
                unitPrice={calculateUnitPrice(product.preco_atacado, product.unidade_medida)}
                unit={product.unidade_medida} 
                imageUrl={product.foto_url || "/placeholder.svg"} 
                fornecedorId={product.fornecedor_id}
              />
            ))}
          </div>
        )}

        {/* Rolagem Infinita Mock */}
        {!isLoading && produtos.length > 0 && (
          <div className="text-center py-8">
            <Button variant="outline" className="text-atacado-primary border-atacado-primary/50">
              Carregando mais DZ...
            </Button>
          </div>
        )}
        
      </main>

      {/* FOOTER */}
      <footer className="mt-10 bg-atacado-primary text-white p-4 text-center">
        <p className="flex items-center justify-center font-medium">
          Atacado Brás - Entrega Rápida! <Truck className="w-5 h-5 ml-2" />
        </p>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default CatalogoAtacado;