import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, Zap, ShoppingCart, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const steps = [
  { icon: Zap, title: "1. Cadastro B2B", description: "Lojistas e Fornecedores se cadastram usando CNPJ e completam o perfil para acesso aos preços de atacado." },
  { icon: ShoppingCart, title: "2. Compra por Volume", description: "Lojistas navegam no catálogo e adicionam produtos em dúzias (DZ), peças (PC) ou caixas (CX) ao carrinho." },
  { icon: DollarSign, title: "3. Pagamento e Split", description: "O pagamento é processado pela plataforma, que automaticamente realiza o split: repasse ao Fornecedor e comissão da Plataforma." },
  { icon: Package, title: "4. Processamento do Pedido", description: "O Fornecedor recebe a notificação, separa o estoque e registra os dados de envio (rastreio e transportadora)." },
  { icon: Truck, title: "5. Entrega Rápida", description: "O pedido é enviado ao Lojista com rastreamento completo. O status é atualizado até a conclusão da entrega." },
];

const ComoFunciona: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ajuda')}>
            <ArrowLeft className="w-6 h-6 text-atacado-primary" />
          </Button>
          <h1 className="text-3xl font-bold text-atacado-primary">
            COMO FUNCIONA O ATACADO B2B
          </h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-atacado-accent">O Fluxo Completo de Compra e Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <Card key={index} className="border-l-4 border-atacado-primary shadow-sm">
                  <CardContent className="p-4">
                    <step.icon className="w-6 h-6 text-atacado-primary mb-2" />
                    <h3 className="font-bold text-lg text-atacado-accent">{step.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
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

export default ComoFunciona;