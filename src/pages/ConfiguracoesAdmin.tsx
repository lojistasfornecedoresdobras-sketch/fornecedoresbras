import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Percent, Users, Loader2, Save } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface TaxaComissao {
  id: string;
  taxa: number;
  ativo: boolean;
}

const ConfiguracoesAdmin: React.FC = () => {
  const { user } = useAuth();
  const [taxaAtual, setTaxaAtual] = useState<TaxaComissao | null>(null);
  const [novaTaxaInput, setNovaTaxaInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTaxaAtual = React.useCallback(async () => {
    setIsLoading(true);
    // Busca a taxa de comissão ativa mais recente
    const { data, error } = await supabase
      .from('taxas_comissao')
      .select('id, taxa, ativo')
      .eq('ativo', true)
      .order('data_definicao', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      showError("Erro ao carregar taxa de comissão: " + error.message);
      console.error(error);
      setTaxaAtual(null);
    } else if (data) {
      setTaxaAtual(data as TaxaComissao);
      setNovaTaxaInput(data.taxa.toString());
    } else {
      setTaxaAtual(null);
      setNovaTaxaInput('');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTaxaAtual();
  }, [fetchTaxaAtual]);

  const handleSaveTaxa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showError("Usuário não autenticado.");
      return;
    }

    const novaTaxa = parseFloat(novaTaxaInput);
    if (isNaN(novaTaxa) || novaTaxa <= 0 || novaTaxa > 100) {
      showError("Por favor, insira uma taxa de comissão válida (entre 0.01 e 100).");
      return;
    }

    setIsSaving(true);

    try {
      // 1. Desativa a taxa atual (se existir)
      if (taxaAtual && taxaAtual.ativo) {
        const { error: deactivateError } = await supabase
          .from('taxas_comissao')
          .update({ ativo: false })
          .eq('id', taxaAtual.id);
        
        if (deactivateError) throw deactivateError;
      }

      // 2. Insere a nova taxa como ativa
      const { error: insertError } = await supabase
        .from('taxas_comissao')
        .insert({
          taxa: novaTaxa,
          definido_por: user.id,
          ativo: true,
        });

      if (insertError) throw insertError;

      showSuccess(`Nova taxa de comissão (${novaTaxa}%) definida com sucesso!`);
      fetchTaxaAtual(); // Recarrega a taxa
    } catch (error: any) {
      showError("Falha ao salvar a taxa: " + error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-atacado-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold text-atacado-primary flex items-center">
            <Settings className="w-6 h-6 mr-3" /> Configurações do Sistema
          </h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          
          {/* Gerenciamento de Taxa de Comissão */}
          <Card className="shadow-md max-w-2xl">
            <CardHeader>
              <CardTitle className="text-atacado-primary flex items-center">
                <Percent className="w-5 h-5 mr-2" /> Taxa de Comissão da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-semibold">
                    Taxa Atual: 
                    <span className="text-atacado-accent ml-2">
                      {taxaAtual ? `${taxaAtual.taxa}%` : 'N/A'}
                    </span>
                  </p>
                  
                  <Separator />

                  <form onSubmit={handleSaveTaxa} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nova_taxa">Definir Nova Taxa (%)</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="nova_taxa" 
                          type="number" 
                          step="0.01" 
                          min="0.01"
                          max="100"
                          placeholder="Ex: 15.00"
                          value={novaTaxaInput}
                          onChange={(e) => setNovaTaxaInput(e.target.value)}
                          required
                          className="flex-1"
                        />
                        <Button 
                          type="submit" 
                          className="bg-atacado-accent hover:bg-orange-600"
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> Salvar</>}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outras Configurações (Placeholder) */}
          <Card className="shadow-md max-w-2xl">
            <CardHeader>
              <CardTitle className="text-atacado-primary flex items-center">
                <Users className="w-5 h-5 mr-2" /> Aprovação de Cadastro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configurações de aprovação automática de novos lojistas/fornecedores. (Em desenvolvimento)
              </p>
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

export default ConfiguracoesAdmin;