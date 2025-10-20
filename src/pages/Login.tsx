import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Redireciona para a página inicial após o login
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-atacado-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-atacado-primary">
            Acesso Atacado B2B
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Entre ou cadastre-se para acessar os preços de dúzia/caixa.
          </p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1E3A8A', // atacado-primary
                    brandAccent: '#F97316', // atacado-accent
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin + '/'}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email B2B',
                  password_label: 'Senha',
                  button_label: 'Entrar no Atacado',
                  link_text: 'Já tem conta? Entrar',
                },
                sign_up: {
                  email_label: 'Email B2B',
                  password_label: 'Criar Senha',
                  button_label: 'Cadastrar Lojista/Fornecedor',
                  link_text: 'Não tem conta? Cadastre-se',
                },
                forgotten_password: {
                  link_text: 'Esqueceu a senha?',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;