import React from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Truck } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const CadastroProduto: React.FC = () => {
  // Mock de categorias e unidades
  const categorias = ['Roupas', 'Calçados', 'Acessórios', 'Infantil'];
  const unidades = ['DZ', 'PC', 'CX'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Produto salvo!");
    // Lógica de salvamento no Supabase aqui
  };

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <h1 className="text-3xl font-bold text-atacado-primary">📝 NOVO PRODUTO ATACADO</h1>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input id="nome" placeholder="Ex: Camiseta Polo Algodão" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_dz">Preço DZ/CX/PC (Atacado)</Label>
                  <Input id="preco_dz" type="number" step="0.01" placeholder="R$ 120,00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_unidade">Preço por Unidade (Referência)</Label>
                  <Input id="preco_unidade" type="number" step="0.01" placeholder="R$ 10,00" required />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="minimo_compra">Mínimo Compra (Unidades)</Label>
                  <Input id="minimo_compra" type="number" placeholder="12" required />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="estoque">Estoque (Unidades)</Label>
                  <Input id="estoque" type="number" placeholder="150" required />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="unidade">Unidade de Medida</Label>
                  <Select required>
                    <SelectTrigger id="unidade">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select required>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto">Foto do Produto</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-atacado-primary/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-3 text-atacado-primary" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
              >
                SALVAR PRODUTO
              </Button>
            </form>
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

export default CadastroProduto;