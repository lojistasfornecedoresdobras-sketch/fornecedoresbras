import { MadeWithDyad } from "@/components/made-with-dyad";
import HeaderAtacado from "@/components/HeaderAtacado";
import HeroCarrossel from "@/components/HeroCarrossel";
import ProductCardAtacado from "@/components/ProductCardAtacado";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Shirt, ShoppingBag, Star, Truck, Loader2, Zap, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

interface Produto {
  id: string;
  nome: string;
  preco_atacado: number;
  unidade_medida: 'DZ' | 'PC' | 'CX';
  foto_url: string;
  fornecedor_id: string;
  categoria: string;
}

const mockBeneficios = [
  { icon: DollarSign, title: "Preços de Atacado", description: "Margens de lucro maximizadas comprando em dúzias ou caixas." },
  { icon: Package, title: "Compra Mínima Flexível", description: "Comece com apenas 6 unidades por produto." },
  { icon: Truck, title: "Entrega Rápida", description: "Logística otimizada para todo o Brasil via Melhor Envio." },
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
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, []);

  const fetchProdutos = async () => {
    setIsLoading(true);
    // Busca os 4 produtos mais recentes
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_atacado, unidade_medida, foto_url, fornecedor_id, categoria')
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

  const fetchCategorias = async () => {
    // Busca categorias únicas
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .not('categoria', 'is', null);

    if (error) {
      console.error("Erro ao carregar categorias:", error);
    } else {
      const uniqueCategories = Array.from(new Set(data.map(item => item.categoria))).slice(0, 4);
      setCategorias(uniqueCategories);
    }
  };

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-10">
        
        {/* HERO CARROSSEL ATACADO */}
        <Link to="/catalogo">
          <HeroCarrossel />
        </Link>

        {/* DESTAQUE: POR QUE COMPRAR NO ATACADO BRÁS? */}
        <section className="text-center">
          <h2 className="text-3xl font-extrabold text-atacado-primary mb-8">
            O SEU HUB DE ATACADO B2B
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockBeneficios.map((beneficio, index) => (
              <Card key={index} className="shadow-lg border-t-4 border-atacado-accent hover:shadow-xl transition-shadow">
                <CardContent className="p-6 flex flex-col items-center">
                  <beneficio.icon className="w-8 h-8 text-atacado-accent mb-3" />
                  <h3 className="font-bold text-lg text-atacado-primary mb-1">{beneficio.title}</h3>
                  <p className="text-sm text-gray-600">{beneficio.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* PRODUTOS EM DESTAQUE */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-atacado-primary">
              ✨ NOVIDADES E MELHORES PREÇOS
            </h2>
            <Link to="/catalogo">
              <Button variant="link" className="text-atacado-accent hover:text-orange-600">
                Ver Catálogo Completo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
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
                  fornecedorId={product.fornecedor_id}
                />
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* CATEGORIAS EM DESTAQUE */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-atacado-primary">
            EXPLORE POR CATEGORIA
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categorias.length > 0 ? (
              categorias.map((category, index) => (
                <Link 
                  key={index} 
                  to={`/catalogo?categoria=${category}`}
                  className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                >
                  <Shirt className="w-8 h-8 text-atacado-accent mb-2" /> {/* Usando Shirt como ícone genérico */}
                  <span className="font-medium text-sm text-atacado-primary text-center">{category}</span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 col-span-4">Nenhuma categoria encontrada.</p>
            )}
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