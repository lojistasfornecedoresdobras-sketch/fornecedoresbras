import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, ChevronDown, ArrowDownUp } from 'lucide-react';

interface FiltrosCatalogoProps {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  sortOrder: 'created_at_desc' | 'preco_atacado_asc' | 'preco_atacado_desc';
  setSortOrder: (order: 'created_at_desc' | 'preco_atacado_asc' | 'preco_atacado_desc') => void;
}

const categorias = ['Todos', 'Roupas', 'Calçados', 'Acessórios', 'Infantil'];
const sortOptions = [
  { value: 'created_at_desc', label: 'Mais Recentes' },
  { value: 'preco_atacado_asc', label: 'Mais Barato DZ' },
  { value: 'preco_atacado_desc', label: 'Mais Caro DZ' },
];

const FiltrosCatalogo: React.FC<FiltrosCatalogoProps> = ({ 
  selectedCategory, 
  setSelectedCategory, 
  sortOrder, 
  setSortOrder 
}) => {

  const currentSortLabel = sortOptions.find(opt => opt.value === sortOrder)?.label || 'Ordenar';
  const currentCategoryLabel = selectedCategory || 'Categoria';

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* Filtro Categoria */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50">
            <Filter className="w-4 h-4 mr-2" />
            {currentCategoryLabel} <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categorias.map(c => (
            <DropdownMenuItem 
              key={c} 
              onClick={() => setSelectedCategory(c === 'Todos' ? null : c)}
              className={selectedCategory === c || (c === 'Todos' && selectedCategory === null) ? 'bg-gray-100 font-semibold' : ''}
            >
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro Preço DZ (Mock - mantido para UX) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50">
            💰 Preço DZ <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filtrar por Preço</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>R$100 - R$200 (Mock)</DropdownMenuItem>
          <DropdownMenuItem>R$200 - R$500 (Mock)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro Promoção (Mock) */}
      <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50">
        🔥 Promoção DZ (Mock)
      </Button>

      {/* Ordenação */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center ml-auto text-atacado-primary border-atacado-primary/50">
            <ArrowDownUp className="w-4 h-4 mr-2" />
            Ordenar: {currentSortLabel} <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortOptions.map(opt => (
            <DropdownMenuItem 
              key={opt.value} 
              onClick={() => setSortOrder(opt.value as FiltrosCatalogoProps['sortOrder'])}
              className={sortOrder === opt.value ? 'bg-gray-100 font-semibold' : ''}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FiltrosCatalogo;