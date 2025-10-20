import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Edit, Trash2 } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { B2BUser, UserRole } from '@/types/b2b';
import { Button } from '@/components/ui/button';
import AdminEditUserModal from '@/components/AdminEditUserModal';
import { useAuth } from '@/hooks/use-auth';

const GerenciarUsuariosAdmin: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<B2BUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    
    // Nota: Administradores podem ler todos os usuários devido à política RLS
    // que deve ser configurada para permitir acesso total ao admin.
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

  const handleOpenModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUserId(null);
    setIsModalOpen(false);
  };

  const handleDeleteUser = async (targetUserId: string, userName: string) => {
    if (!user?.id) {
      showError("Erro de autenticação.");
      return;
    }
    
    if (targetUserId === user.id) {
      showError("Você não pode excluir sua própria conta de administrador.");
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação é irreversível e removerá o usuário do sistema de autenticação.`)) {
      return;
    }

    setIsDeleting(targetUserId);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { targetUserId },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      showSuccess(`Usuário "${userName}" excluído com sucesso.`);
      fetchUsuarios(); // Recarrega a lista
    } catch (error: any) {
      showError("Falha ao excluir usuário: " + error.message);
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-atacado-primary"
                            onClick={() => handleOpenModal(usuario.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(usuario.id, usuario.nome_fantasia || usuario.email)}
                            disabled={isDeleting === usuario.id || usuario.id === user?.id}
                          >
                            {isDeleting === usuario.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
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

      <AdminEditUserModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUserUpdated={fetchUsuarios} // Recarrega a lista após a atualização
      />
    </div>
  );
};

export default GerenciarUsuariosAdmin;