import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface ProductMap {
  [productId: string]: string; // Map<ID do Produto, Nome do Produto>
}

export const useProductNames = (productIds: string[]): { productNames: ProductMap, isLoading: boolean } => {
  const [productNames, setProductNames] = useState<ProductMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      setProductNames({});
      setIsLoading(false);
      return;
    }

    const fetchNames = async () => {
      setIsLoading(true);
      
      // Remove duplicatas e IDs nulos
      const uniqueIds = Array.from(new Set(productIds.filter(id => id)));

      if (uniqueIds.length === 0) {
        setProductNames({});
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome')
        .in('id', uniqueIds);

      if (error) {
        showError("Erro ao buscar nomes dos produtos: " + error.message);
        console.error(error);
        setProductNames({});
      } else {
        const map: ProductMap = {};
        data.forEach(product => {
          map[product.id] = product.nome;
        });
        setProductNames(map);
      }
      setIsLoading(false);
    };

    fetchNames();
  }, [JSON.stringify(productIds)]); // Dependência serializada para evitar loops infinitos

  return { productNames, isLoading };
};