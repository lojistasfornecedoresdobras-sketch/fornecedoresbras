import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import ProductCardAtacado from '@/components/ProductCardAtacado';
import FiltrosCatalogo from '@/components/FiltrosCatalogo';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockProducts = [
  { name: "Camiseta Polo", priceDz: 120.00, unitPrice: 10.00, unit: 'DZ' as const, imageUrl: "/placeholder.svg" },
  { name: "Calça Jeans Slim", priceDz: 450.00, unitPrice: 37.50, unit: 'CX' as const, imageUrl: "/placeholder.svg" },
  { name: "Vestido Casual Verão", priceDz: 180.00, unitPrice: 15.00, unit: 'DZ' as const, imageUrl: "/placeholder.svg" },
  { name: "Tênis Esportivo", priceDz: 600.00, unitPrice: 50.00, unit: 'PC' as const, imageUrl: "/placeholder.svg" },
  { name: "Blusa de Moletom", priceDz: 240.00, unitPrice: 20.00, unit: 'DZ' as const, imageUrl: "/placeholder.svg" },
  { name: "Meia Social", priceDz: 60.00, unitPrice: 5.00, unit: 'CX' as const, imageUrl: "/placeholder.svg" },
  { name: "Shorts Praia", priceDz: 150.00, unitPrice: 12.50, unit: 'DZ' as const, imageUrl: "/placeholder.svg" },
  { name: "Jaqueta Couro Sintético", priceDz: 720.00, unitPrice: 60.00, unit: 'PC' as const, imageUrl: "/placeholder.svg" },
];

const CatalogoAtacado: React.FC = () => {
  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold text-atacado-primary pt-4">📦 CATÁLOGO ATACADO BRÁS</h1>
        
        <FiltrosCatalogo />

        {/* Grade de Produtos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockProducts.map((product, index) => (
            <ProductCardAtacado key={index} {...product} />
          ))}
        </div>

        {/* Rolagem Infinita Mock */}
        <div className="text-center py-8">
          <Button variant="outline" className="text-atacado-primary border-atacado-primary/50">
            Carregando mais DZ...
          </Button>
        </div>
        
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