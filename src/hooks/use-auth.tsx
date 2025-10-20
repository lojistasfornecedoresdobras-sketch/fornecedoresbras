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
    showError("Erro ao carregar perfil do usuário.");
    return null;
  }
  
  return data as B2BUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [b2bProfile, setB2BProfile] = useState<B2BUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const profile = await fetchB2BProfile(currentUser.id);
          setB2BProfile(profile);
        } else {
          setB2BProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchB2BProfile(currentUser.id).then(setB2BProfile);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao sair: " + error.message);
    } else {
      setUser(null);
      setB2BProfile(null);
    }
    setIsLoading(false);
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