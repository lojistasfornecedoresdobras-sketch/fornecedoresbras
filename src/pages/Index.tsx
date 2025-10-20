import { MadeWithDyad } from "@/components/made-with-dyad";
import HeaderAtacado from "@/components/HeaderAtacado";
import HeroCarrossel from "@/components/HeroCarrossel";
import ProductCardAtacado from "@/components/ProductCardAtacado";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Shirt, ShoppingBag, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockProducts = [
  { name: "Camiseta Polo", priceDz: 120.00, unitPrice: 10.00, unit: 'DZ', imageUrl: "/placeholder.svg" },
  { name: "Calça Jeans", priceDz: 450.00, unitPrice: 37.50, unit: 'CX', imageUrl: "/placeholder.svg" },
  { name: "Vestido Casual", priceDz: 180.00, unitPrice: 15.00, unit: 'DZ', imageUrl: "/placeholder.svg" },
  { name: "Tênis Esportivo", priceDz: 600.00, unitPrice: 50.00, unit: 'PC', imageUrl: "/placeholder.svg" },
];

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

const Index = () => {
  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-8">
        
        {/* HERO CARROSSEL ATACADO */}
        <HeroCarrossel />

        {/* MAIS VENDIDOS ATACADO */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-atacado-primary">MAIS VENDIDOS ATACADO</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockProducts.slice(0, 4).map((product, index) => (
              <ProductCardAtacado key={index} {...product} />
            ))}
          </div>
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