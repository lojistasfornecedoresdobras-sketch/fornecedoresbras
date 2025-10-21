import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { B2BUser, UserRole } from '@/types/b2b';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface FormularioPerfilB2BProps {
  initialProfile: B2BUser;
  onProfileUpdated: (newProfile: B2BUser) => void;
}

// Apenas lojista e fornecedor podem ser selecionados pelo usuário.
// 'administrador' é definido apenas via banco de dados.
const selectableRoles: UserRole[] = ['lojista', 'fornecedor'];

const FormularioPerfilB2B: React.FC<FormularioPerfilB2BProps> = ({ initialProfile, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    nome_fantasia: initialProfile.nome_fantasia || '',
    razao_social: initialProfile.razao_social || '',
    cnpj: initialProfile.cnpj || '',
    telefone: initialProfile.telefone || '',
    endereco: initialProfile.endereco || '',
    cep: initialProfile.cep || '', // NOVO CAMPO
    role: initialProfile.role || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      nome_fantasia: initialProfile.nome_fantasia || '',
      razao_social: initialProfile.razao_social || '',
      cnpj: initialProfile.cnpj || '',
      telefone: initialProfile.telefone || '',
      endereco: initialProfile.endereco || '',
      cep: initialProfile.cep || '', // NOVO CAMPO
      role: initialProfile.role || '',
    });
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    let processedValue = value;
    if (id === 'cep') {
      // Remove caracteres não numéricos e limita a 8 dígitos
      processedValue = value.replace(/\D/g, '').substring(0, 8);
    }

    setFormData(prev => ({ ...prev, [id]: processedValue }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value as UserRole }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Garante que a role 'administrador' não seja sobrescrita se já estiver definida
    const roleToUpdate = initialProfile.role === 'administrador' ? 'administrador' : formData.role;

    // Função auxiliar para converter string vazia para null
    const toNullIfEmpty = (value: string | null | undefined) => (value === '' ? null : value);

    const updateData = {
      nome_fantasia: toNullIfEmpty(formData.nome_fantasia),
      razao_social: toNullIfEmpty(formData.razao_social),
      cnpj: formData.cnpj, // CNPJ é obrigatório no formulário
      telefone: toNullIfEmpty(formData.telefone),
      endereco: toNullIfEmpty(formData.endereco),
      cep: formData.cep, // CEP é obrigatório no formulário
      role: roleToUpdate,
    };

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', initialProfile.id)
      .select()
      .single();

    if (error) {
      showError("Erro ao atualizar perfil: " + error.message);
      console.error(error);
    } else {
      showSuccess("Perfil atualizado com sucesso!");
      onProfileUpdated({ ...initialProfile, ...data });
    }
    setIsSaving(false);
  };

  // Se o usuário for administrador, ele não pode mudar sua própria role aqui.
  const isRoleFieldDisabled = initialProfile.role === 'administrador';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome_fantasia">Nome Fantasia / Nome Completo (Se CPF)</Label>
          <Input 
            id="nome_fantasia" 
            value={formData.nome_fantasia} 
            onChange={handleChange} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="razao_social">Razão Social (Opcional se CPF)</Label>
          <Input 
            id="razao_social" 
            value={formData.razao_social} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CPF/CNPJ</Label>
          <Input id="cnpj" required value={formData.cnpj} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" value={formData.telefone} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Tipo de Usuário</Label>
          <Select 
            required 
            value={formData.role} 
            onValueChange={(v) => handleSelectChange('role', v)}
            disabled={isRoleFieldDisabled} // Desabilita se for admin
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent>
              {selectableRoles.map(r => <SelectItem key={r} value={r}>{r === 'lojista' ? 'Lojista (Comprador)' : 'Fornecedor (Vendedor)'}</SelectItem>)}
              {isRoleFieldDisabled && <SelectItem key="administrador" value="administrador">Administrador</SelectItem>}
            </SelectContent>
          </Select>
          {isRoleFieldDisabled && (
            <p className="text-xs text-red-500">A role de Administrador não pode ser alterada aqui.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço Principal (Rua, Número, Bairro)</Label>
          <Input id="endereco" value={formData.endereco} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cep">CEP de Origem/Entrega</Label>
          <Input 
            id="cep" 
            value={formData.cep} 
            onChange={handleChange} 
            placeholder="Apenas números (8 dígitos)"
            maxLength={8}
            required
          />
        </div>
      </div>
      
      <p className="text-sm text-gray-500">
        * Se estiver usando CPF, preencha o campo "Nome Fantasia" com seu nome completo.
      </p>

      <Button 
        type="submit" 
        className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
        disabled={isSaving}
      >
        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> SALVAR DADOS B2B</>}
      </Button>
    </form>
  );
};

export default FormularioPerfilB2B;