import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Store, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Fornecedor {
  id: string;
  nome_fantasia: string;
}

interface FornecedorFilterProps {
  selectedFornecedorId: string | null;
  setSelectedFornecedorId: (id: string | null) => void;
}

const FornecedorFilter: React.FC<FornecedorFilterProps> = ({ selectedFornecedorId, setSelectedFornecedorId }) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFornecedores = async () => {
      setIsLoading(true);
      // Busca todos os usuários que são fornecedores
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome_fantasia')
        .eq('role', 'fornecedor')
        .not('nome_fantasia', 'is', null); // Apenas fornecedores com nome fantasia preenchido

      if (error) {
        showError("Erro ao carregar lista de fornecedores: " + error.message);
        console.error(error);
      } else {
        setFornecedores(data as Fornecedor[]);
      }
      setIsLoading(false);
    };

    fetchFornecedores();
  }, []);

  const currentFornecedor = fornecedores.find(f => f.id === selectedFornecedorId);
  const currentLabel = currentFornecedor?.nome_fantasia || 'Todos Fornecedores';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center text-atacado-primary border-atacado-primary/50" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Store className="w-4 h-4 mr-2" />
          )}
          {currentLabel} <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
        <DropdownMenuLabel>Filtrar por Fornecedor</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setSelectedFornecedorId(null)}
          className={selectedFornecedorId === null ? 'bg-gray-100 font-semibold' : ''}
        >
          Todos Fornecedores
        </DropdownMenuItem>

        {fornecedores.map(f => (
          <DropdownMenuItem 
            key={f.id} 
            onClick={() => setSelectedFornecedorId(f.id)}
            className={selectedFornecedorId === f.id ? 'bg-gray-100 font-semibold' : ''}
          >
            {f.nome_fantasia}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FornecedorFilter;