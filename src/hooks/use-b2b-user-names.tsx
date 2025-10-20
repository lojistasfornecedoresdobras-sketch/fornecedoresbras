import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface UserMap {
  [userId: string]: string; // Map<ID do Usuário, Nome Fantasia>
}

export const useB2BUserNames = (userIds: string[]): { userNames: UserMap, isLoading: boolean } => {
  const [userNames, setUserNames] = useState<UserMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userIds.length === 0) {
      setUserNames({});
      setIsLoading(false);
      return;
    }

    const fetchNames = async () => {
      setIsLoading(true);
      
      // Remove duplicatas e IDs nulos
      const uniqueIds = Array.from(new Set(userIds.filter(id => id)));

      if (uniqueIds.length === 0) {
        setUserNames({});
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome_fantasia')
        .in('id', uniqueIds);

      if (error) {
        showError("Erro ao buscar nomes dos usuários B2B: " + error.message);
        console.error(error);
        setUserNames({});
      } else {
        const map: UserMap = {};
        data.forEach(user => {
          map[user.id] = user.nome_fantasia || `Usuário ID: ${user.id.substring(0, 8)}`;
        });
        setUserNames(map);
      }
      setIsLoading(false);
    };

    fetchNames();
  }, [JSON.stringify(userIds)]); // Dependência serializada para evitar loops infinitos

  return { userNames, isLoading };
};