import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, HelpCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';

const faqItems = [
  {
    question: "Como faço para me cadastrar como Lojista?",
    answer: "O cadastro é feito na página de Login. Você precisará informar seu CNPJ e Razão Social. Após o cadastro, complete seu perfil B2B na área 'Minha Loja'."
  },
  {
    question: "Qual é o pedido mínimo?",
    answer: "O pedido mínimo é geralmente de 12 unidades (1 Dúzia) por produto, mas verifique a unidade de medida (DZ, PC, CX) e a quantidade mínima de compra na página de cada produto."
  },
  {
    question: "Como funciona o frete?",
    answer: "Utilizamos o serviço Melhor Envio para calcular o frete volumétrico e garantir a entrega mais rápida e econômica para todo o Brasil. O frete é calculado no checkout."
  },
  {
    question: "Posso vender meus produtos na plataforma?",
    answer: "Sim! Se você é um fornecedor do Brás, cadastre-se como 'Fornecedor' e complete seu perfil. Você terá acesso ao painel de estoque e pedidos."
  },
];

const Ajuda: React.FC = () => {
  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <h1 className="text-3xl font-bold text-atacado-primary flex items-center">
          <HelpCircle className="w-7 h-7 mr-3" /> CENTRAL DE AJUDA
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Navegação Rápida */}
          <Card className="shadow-lg md:col-span-1">
            <CardContent className="p-4 space-y-2">
              <Link to="/como-funciona" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-atacado-primary font-medium">
                Como Funciona o Atacado B2B <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/requisitos" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-atacado-primary font-medium">
                Requisitos de Cadastro (CNPJ, etc.) <ChevronRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-atacado-primary">Perguntas Frequentes (FAQ)</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="font-semibold text-left">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-gray-700">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
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

export default Ajuda;