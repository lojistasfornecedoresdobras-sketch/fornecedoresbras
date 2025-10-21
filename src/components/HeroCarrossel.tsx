import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';

const carouselItems = [
  { title: "🔥 ATACADO BRÁS - MÍNIMO 6 UNIDADES!", description: "Mescle produtos do mesmo fornecedor." },
  { title: "🏆 TOP VENDAS", description: "Calça CX R$450" },
  { title: "🚚 ENTREGA RÁPIDA", description: "Frete Volumétrico Melhor Envio" },
];

const HeroCarrossel: React.FC = () => {
  return (
    <div className="relative mb-8">
      <Carousel className="w-full">
        <CarouselContent>
          {carouselItems.map((item, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="bg-atacado-primary text-white border-none">
                  <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 lg:p-10 aspect-[16/7] md:aspect-[16/6]">
                    <span className="text-lg md:text-2xl font-bold mb-2 text-center">
                      {item.title}
                    </span>
                    <p className="text-sm md:text-lg text-gray-200">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
      
      <div className="text-center mt-4">
        <Button 
          className="bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors"
          // Removido onClick, pois o componente é envolvido por um Link em Index.tsx
        >
          VER CATÁLOGO COMPLETO
        </Button>
      </div>
    </div>
  );
};

export default HeroCarrossel;