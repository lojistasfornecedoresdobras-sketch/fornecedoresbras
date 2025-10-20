import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Truck } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useNavigate } from 'react-router-dom';

const mockEstoque = [
  { nome: "Camiseta Polo", estoque: 150, preco: 120.00, unidade: 'DZ' },
  { nome: "Calça Jeans Slim", estoque: 50, preco: 450.00, unidade: 'CX' },
  { nome: "Vestido Casual", estoque: 80, preco: 180.00, unidade: 'DZ' },
];

const EstoqueFornecedor: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-atacado-primary">📦 MEU ESTOQUE ATACADO</h1>
          <Button 
            className="bg-atacado-accent hover:bg-orange-600 text-white"
            onClick={() => navigate('/cadastro-produto')}
          >
            <Plus className="w-4 h-4 mr-2" />
            NOVO PRODUTO ATACADO
          </Button>
        </div>

        {/* Gráfico Mock */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-atacado-primary text-lg">Vendas por Categoria (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-100 flex items-center justify-center rounded border border-dashed text-gray-500">
              GRÁFICO: Vendas por Categoria (barras laranja)
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Produtos */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEstoque.map((produto, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="text-right">{produto.estoque} {produto.unidade}</TableCell>
                    <TableCell className="text-right font-bold text-atacado-accent">R${produto.preco.toFixed(2)}/{produto.unidade}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="ghost" size="icon" className="text-atacado-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export default EstoqueFornecedor;