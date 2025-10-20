import { MadeWithDyad } from "@/components/made-with-dyad";
import HeaderAtacado from "@/components/HeaderAtacado";
import HeroCarrossel from "@/components/HeroCarrossel";
import ProductCardAtacado from "@/components/ProductCardAtacado";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Shirt, ShoppingBag, Star, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Produto {
  id: string;
  nome: string;
  preco_atacado: number;
  unidade_medida: 'DZ' | 'PC' | 'CX';
  foto_url: string;
  fornecedor_id: string; // Adicionado
}

const mockCategories = [
  { name: "Roupas", icon: Shirt },
  { name: "Calçados", icon: ShoppingBag },
  { name: "Feminino", icon: ShoppingBag },
  { name: "Masculino", icon: Shirt },
];

const mockFornecedores = [
  { name: "João Confecções", rating: 5, sales: 500 },
  { name: "Maria Modas", rating: 4.8, sales: 320 },
];

const calculateUnitPrice = (price: number, unit: 'DZ' | 'PC' | 'CX'): number => {
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

const Index = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setIsLoading(true);
    // Busca os 4 produtos mais recentes (mockando "mais vendidos" por enquanto)
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_atacado, unidade_medida, foto_url, fornecedor_id') // Incluindo fornecedor_id
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      showError("Erro ao carregar produtos: " + error.message);
      console.error(error);
    } else {
      setProdutos(data as Produto[]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-8">
        
        {/* HERO CARROSSEL ATACADO */}
        <HeroCarrossel />

        {/* MAIS VENDIDOS ATACADO */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-atacado-primary">MAIS VENDIDOS ATACADO</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum produto disponível.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {produtos.map((product) => (
                <ProductCardAtacado 
                  key={product.id} 
                  id={product.id}
                  name={product.nome} 
                  priceDz={product.preco_atacado} 
                  unitPrice={calculateUnitPrice(product.preco_atacado, product.unidade_medida)}
                  unit={product.unidade_medida} 
                  imageUrl={product.foto_url || "/placeholder.svg"} 
                  fornecedorId={product.fornecedor_id} // Passando fornecedorId
                />
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* CATEGORIAS ATACADO */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-atacado-primary">CATEGORIAS ATACADO</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mockCategories.map((category, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <category.icon className="w-8 h-8 text-atacado-accent mb-2" />
                <span className="font-medium text-sm text-atacado-primary">{category.name}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* FORNECEDORES TOP BRÁS */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-atacado-primary">FORNECEDORES TOP BRÁS</h2>
          <div className="space-y-4">
            {mockFornecedores.map((fornecedor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mr-2" />
                  <div>
                    <p className="font-semibold text-atacado-primary">{fornecedor.name}</p>
                    <p className="text-sm text-gray-500">
                      {fornecedor.rating} ({fornecedor.sales}+ vendas)
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-atacado-accent hover:bg-orange-600 text-white text-sm"
                >
                  Mapa Brás + WhatsApp <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </section>
        
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

export default Index;