import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { B2BUser, UserRole } from '@/types/b2b';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface AdminEditUserModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const allRoles: UserRole[] = ['lojista', 'fornecedor', 'administrador'];

const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({ userId, isOpen, onClose, onUserUpdated }) => {
  const [userProfile, setUserProfile] = useState<B2BUser | null>(null);
  const [formData, setFormData] = useState<Partial<B2BUser>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserProfile = async (id: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      showError("Erro ao carregar perfil do usuário: " + (error?.message || "Usuário não encontrado."));
      setUserProfile(null);
      setFormData({});
    } else {
      setUserProfile(data as B2BUser);
      setFormData(data as B2BUser);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile(userId);
    } else {
      setUserProfile(null);
      setFormData({});
    }
  }, [isOpen, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof B2BUser, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);

    const updateData = {
      nome_fantasia: formData.nome_fantasia,
      razao_social: formData.razao_social,
      cnpj: formData.cnpj,
      telefone: formData.telefone,
      endereco: formData.endereco,
      role: formData.role,
      pagarme_recipient_id: formData.pagarme_recipient_id, // NOVO CAMPO
    };

    const { error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      showError("Erro ao atualizar usuário: " + error.message);
      console.error(error);
    } else {
      showSuccess("Usuário atualizado com sucesso!");
      onUserUpdated();
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-atacado-primary">
            Editar Usuário B2B: {userProfile?.nome_fantasia || userProfile?.email || 'Carregando...'}
          </DialogTitle>
          <DialogDescription>
            Gerencie os dados cadastrais e a role de acesso deste usuário.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
          </div>
        ) : !userProfile ? (
          <p className="text-center text-red-500">Erro ao carregar dados do usuário.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (ID: {userId?.substring(0, 8)})</Label>
              <Input id="email" value={userProfile.email} disabled />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia / Nome Completo (Se CPF)</Label>
                <Input 
                  id="nome_fantasia" 
                  value={formData.nome_fantasia || ''} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social (Opcional se CPF)</Label>
                <Input 
                  id="razao_social" 
                  value={formData.razao_social || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CPF/CNPJ</Label>
                <Input id="cnpj" required value={formData.cnpj || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={formData.telefone || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário (Role)</Label>
                <Select 
                  required 
                  value={formData.role || ''} 
                  onValueChange={(v) => handleSelectChange('role', v)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoles.map(r => (
                      <SelectItem key={r} value={r}>
                        {r === 'lojista' ? 'Lojista (Comprador)' : r === 'fornecedor' ? 'Fornecedor (Vendedor)' : 'ADMINISTRADOR'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço Principal</Label>
              <Input id="endereco" value={formData.endereco || ''} onChange={handleChange} />
            </div>
            
            {/* ID do Recebedor Pagar.me */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="pagarme_recipient_id">ID do Recebedor Pagar.me (Apenas Fornecedor/Admin)</Label>
              <Input 
                id="pagarme_recipient_id" 
                placeholder="Ex: re_xxxxxxxxxxxxxxxx" 
                value={formData.pagarme_recipient_id || ''} 
                onChange={handleChange} 
              />
              <p className="text-xs text-gray-500">Necessário para o split de pagamento. Deve ser o ID do Recebedor criado no Pagar.me.</p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> SALVAR ALTERAÇÕES</>}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditUserModal;