import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PromoBanner: React.FC = () => {
  return (
    <Card className="bg-atacado-accent text-white border-none shadow-xl">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Zap className="w-8 h-8 mr-4" />
          <div>
            <h2 className="text-xl font-bold">OFERTAS RELÂMPAGO ATACADO</h2>
            <p className="text-sm text-gray-100">Descontos exclusivos em caixas e dúzias por tempo limitado!</p>
          </div>
        </div>
        <Link to="/catalogo?promocao=true">
          <Button 
            variant="secondary" 
            className="bg-white text-atacado-accent hover:bg-gray-100 font-bold"
          >
            VER PROMOÇÕES <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default PromoBanner;