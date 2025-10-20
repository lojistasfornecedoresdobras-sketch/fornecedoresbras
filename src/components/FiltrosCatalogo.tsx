import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, ChevronDown, ArrowDownUp } from 'lucide-react';

const FiltrosCatalogo: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* Filtro Categoria */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50">
            <Filter className="w-4 h-4 mr-2" />
            Categoria <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Roupas</DropdownMenuItem>
          <DropdownMenuItem>Calçados</DropdownMenuItem>
          <DropdownMenuItem>Feminino</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro Preço DZ */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50">
            💰 Preço DZ <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filtrar por Preço</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>R$100 - R$200</DropdownMenuItem>
          <DropdownMenuItem>R$200 - R$500</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro Promoção */}
      <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50">
        🔥 Promoção DZ
      </Button>

      {/* Ordenação */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center ml-auto text-atacado-primary border-atacado-primary/50">
            <ArrowDownUp className="w-4 h-4 mr-2" />
            Ordenar: Mais Barato DZ <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Mais Barato DZ</DropdownMenuItem>
          <DropdownMenuItem>Mais Vendido</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FiltrosCatalogo;