import { User } from "@supabase/supabase-js";

export type UserRole = 'fornecedor' | 'lojista' | 'administrador';

export interface B2BUser {
  id: string;
  email: string;
  role: UserRole | null;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  cep: string | null; // NOVO CAMPO
}

export interface AuthContextType {
  user: User | null;
  b2bProfile: B2BUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  fetchB2BProfile: (userId: string) => Promise<B2BUser | null>;
}