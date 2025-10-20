import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, FileText, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const requisitosComuns = [
  "Possuir CNPJ ativo e válido.",
  "Ser uma empresa registrada (MEI, ME, EPP, etc.).",
  "Email B2B para comunicação.",
];

const requisitosLojista = [
  "Comprovar atividade comercial (e-commerce, loja física, etc.).",
  "Aceitar o pedido mínimo de atacado (geralmente 12 unidades).",
];

const requisitosFornecedor = [
  "Ser um fornecedor ou fabricante com sede no Brás ou região metropolitana.",
  "Capacidade de processar pedidos em volume (DZ/CX).",
  "Compromisso com prazos de envio e qualidade dos produtos.",
];

const Requisitos: React.FC = () => {
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
            <FileText className="w-7 h-7 mr-3" /> REQUISITOS DE CADASTRO B2B
          </h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-atacado-accent">Quem pode comprar e vender no Atacado Brás?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Requisitos Comuns */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-atacado-primary border-b pb-1">Requisitos Comuns (Lojista e Fornecedor)</h3>
              <ul className="space-y-2">
                {requisitosComuns.map((req, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-1" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requisitos Lojista */}
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50">
                <h3 className="text-xl font-semibold text-blue-700">Para Lojistas (Compradores)</h3>
                <ul className="space-y-2">
                  {requisitosLojista.map((req, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <CheckCircle className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-1" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requisitos Fornecedor */}
              <div className="space-y-3 p-4 border rounded-lg bg-atacado-accent/10">
                <h3 className="text-xl font-semibold text-atacado-accent">Para Fornecedores (Vendedores)</h3>
                <ul className="space-y-2">
                  {requisitosFornecedor.map((req, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <CheckCircle className="w-5 h-5 mr-2 text-atacado-accent flex-shrink-0 mt-1" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-red-500 flex items-center">
                <XCircle className="w-4 h-4 mr-1" /> Não aceitamos cadastros de CPF ou pessoas físicas.
            </p>
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

export default Requisitos;