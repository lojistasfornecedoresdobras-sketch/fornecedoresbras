import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Edit, CheckCircle, XCircle } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { B2BUser, UserRole } from '@/types/b2b';
import { Button } from '@/components/ui/button';

const GerenciarUsuariosAdmin: React.FC = () => {
  const [usuarios, setUsuarios] = useState<B2BUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    
    // Nota: Administradores podem ler todos os usuários devido à política RLS
    // que deve ser configurada para permitir acesso total ao admin.
    // Assumindo que o admin tem permissão de leitura total na tabela 'usuarios'.
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError("Erro ao carregar usuários: " + error.message);
      console.error(error);
      setUsuarios([]);
    } else {
      setUsuarios(data as B2BUser[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const getRoleBadge = (role: UserRole | null) => {
    let classes = "px-2 py-1 rounded-full text-xs font-medium";
    let label = role || 'Pendente';

    switch (role) {
      case 'administrador':
        classes += " bg-red-100 text-red-800";
        break;
      case 'fornecedor':
        classes += " bg-atacado-accent text-white";
        break;
      case 'lojista':
        classes += " bg-blue-100 text-blue-800";
        break;
      default:
        classes += " bg-gray-100 text-gray-800";
        label = 'Aguardando Cadastro';
    }

    return <span className={classes}>{label}</span>;
  };

  return (
    <div className="flex min-h-screen bg-atacado-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold text-atacado-primary flex items-center">
            <Users className="w-6 h-6 mr-3" /> Gerenciar Usuários B2B
          </h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
                </div>
              ) : usuarios.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum usuário B2B encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-center">Role</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome_fantasia || 'N/A'}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{usuario.cnpj || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          {getRoleBadge(usuario.role)}
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                          <Button variant="ghost" size="icon" className="text-atacado-primary">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Futuramente: Botão para aprovar/rejeitar ou mudar role */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        <footer className="p-4 border-t bg-white">
          <MadeWithDyad />
        </footer>
      </div>
    </div>
  );
};

export default GerenciarUsuariosAdmin;