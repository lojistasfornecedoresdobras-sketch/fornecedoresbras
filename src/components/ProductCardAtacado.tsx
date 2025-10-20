import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

interface ProductCardProps {
  id: string;
  name: string;
  priceDz: number;
  unitPrice: number;
  unit: 'DZ' | 'PC' | 'CX';
  imageUrl: string;
  fornecedorId: string;
  // Campos de Frete
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
}

const ProductCardAtacado: React.FC<ProductCardProps> = ({ 
  id, 
  name, 
  priceDz, 
  unitPrice, 
  unit, 
  imageUrl, 
  fornecedorId,
  peso_kg,
  comprimento_cm,
  largura_cm,
  altura_cm
}) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // Por padrão, adicionamos 1 unidade de atacado (1 DZ, 1 PC ou 1 CX)
    addItem({
      id,
      name,
      priceAtacado: priceDz,
      unit,
      imageUrl,
      fornecedorId,
      peso_kg,
      comprimento_cm,
      largura_cm,
      altura_cm,
    }, 1);
  };

  return (
    <Card className="w-full bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-40 object-cover rounded-t-lg"
        />
      </CardHeader>
      <CardContent className="p-3">
        <h3 className="font-semibold text-lg mb-1 truncate">{name}</h3>
        <p className="text-xl font-bold text-atacado-accent">
          {unit === 'DZ' ? `R$${priceDz.toFixed(2)}/DZ` : `R$${priceDz.toFixed(2)}/${unit}`}
        </p>
        <p className="text-sm text-gray-500">
          (R${unitPrice.toFixed(2)}/un)
        </p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button 
          className="w-full bg-atacado-accent hover:bg-orange-600 text-white text-sm"
          size="sm"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          ADICIONAR 1 {unit}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCardAtacado;