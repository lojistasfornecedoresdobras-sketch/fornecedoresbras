import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, ShoppingCart, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

const Carrinho: React.FC = () => {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const currentItem = items.find(item => item.id === itemId);
    if (currentItem) {
      updateQuantity(itemId, currentItem.quantity + delta);
    }
  };

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <h1 className="text-3xl font-bold text-atacado-primary flex items-center">
          <ShoppingCart className="w-7 h-7 mr-3" /> MEU CARRINHO ATACADO
        </h1>

        {items.length === 0 ? (
          <Card className="p-10 text-center shadow-lg">
            <CardTitle className="text-xl text-gray-600">Seu carrinho está vazio.</CardTitle>
            <p className="text-gray-500 mt-2">Adicione produtos do catálogo para começar a comprar no atacado.</p>
            <Link to="/catalogo">
              <Button className="mt-6 bg-atacado-accent hover:bg-orange-600">
                Ver Catálogo
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna Principal: Itens do Carrinho */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="flex p-4 shadow-md">
                  <img 
                    src={item.imageUrl || "/placeholder.svg"} 
                    alt={item.name} 
                    className="w-24 h-24 object-cover rounded-lg mr-4"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-atacado-primary">{item.name}</h3>
                      <p className="text-sm text-gray-500">Preço Atacado: {formatCurrency(item.priceAtacado)}/{item.unit}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center h-8"
                          min="1"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xl font-bold text-atacado-accent">
                      {formatCurrency(item.priceAtacado * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </Card>
              ))}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Carrinho
                </Button>
              </div>
            </div>

            {/* Coluna Lateral: Resumo do Pedido */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-atacado-primary">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal (Produtos)</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Frete Estimado</span>
                    <span className="text-green-600">A calcular</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-xl font-bold text-atacado-primary">
                    <span>Total do Atacado</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  
                  <Link to="/checkout">
                    <Button 
                      className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3 mt-4"
                    >
                      PROSSEGUIR PARA O CHECKOUT <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 bg-atacado-primary text-white p-4 text-center">
        <p className="flex items-center justify-center font-medium">
          Atacado Brás - Entrega Rápida! <Truck className="w-5 h-5 ml-2" />
        </p>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Carrinho;