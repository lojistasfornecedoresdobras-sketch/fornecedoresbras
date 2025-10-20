import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthContextType, B2BUser } from '@/types/b2b';
import { showError } from '@/utils/toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const fetchB2BProfile = async (userId: string): Promise<B2BUser | null> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil B2B:", error);
    // Não mostramos um toast aqui, pois pode ser chamado muitas vezes durante a inicialização.
    // Apenas retornamos null.
    return null;
  }
  
  return data as B2BUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [b2bProfile, setB2BProfile] = useState<B2BUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthChange = async (session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const profile = await fetchB2BProfile(currentUser.id);
        setB2BProfile(profile);
      } else {
        setB2BProfile(null);
      }
      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Garante que o estado de carregamento seja redefinido após qualquer evento de autenticação
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          handleAuthChange(session);
        }
      }
    );

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Força o estado de carregamento para true para evitar flashes de conteúdo
    setIsLoading(true); 
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao sair: " + error.message);
      setIsLoading(false); // Se falhar, limpa o loading
    } else {
      // O onAuthStateChange (event === 'SIGNED_OUT') irá lidar com a limpeza final do estado.
      // Se o onAuthStateChange for lento, podemos forçar a limpeza imediata do estado local
      // para que o ProtectedRoute reaja mais rápido.
      setUser(null);
      setB2BProfile(null);
      setIsLoading(false); // Garante que o ProtectedRoute saia do estado de loading e redirecione
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, b2bProfile, isLoading, isAuthenticated, signOut, fetchB2BProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};