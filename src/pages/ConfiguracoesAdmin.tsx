import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Percent, Users, Loader2, Save, Clock } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';
import { useMemo } from 'react';

interface TaxaComissao {
  id: string;
  taxa: number;
  ativo: boolean;
  data_definicao: string;
  definido_por: string | null; // Adicionado | null para segurança
}

const ConfiguracoesAdmin: React.FC = () => {
  const { user } = useAuth();
  const [taxas, setTaxas] = useState<TaxaComissao[]>([]);
  const [novaTaxaInput, setNovaTaxaInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Coletar IDs dos usuários que definiram as taxas
  const definidorIds = useMemo(() => taxas.map(t => t.definido_por).filter(id => id), [taxas]);
  const { userNames: definidorNames, isLoading: isNamesLoading } = useB2BUserNames(definidorIds as string[]);

  const fetchTaxas = React.useCallback(async () => {
    setIsLoading(true);
    // Busca todas as taxas de comissão, ordenadas da mais recente para a mais antiga
    const { data, error } = await supabase
      .from('taxas_comissao')
      .select('id, taxa, ativo, data_definicao, definido_por')
      .order('data_definicao', { ascending: false });

    if (error) {
      showError("Erro ao carregar histórico de taxas: " + error.message);
      console.error(error);
      setTaxas([]);
    } else {
      setTaxas(data as TaxaComissao[]);
      
      // Define a taxa atual no input se houver uma ativa
      const taxaAtual = data.find(t => t.ativo);
      if (taxaAtual) {
        setNovaTaxaInput(taxaAtual.taxa.toString());
      } else if (data.length > 0) {
        // Se não houver ativa, usa a mais recente como sugestão
        setNovaTaxaInput(data[0].taxa.toString());
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTaxas();
  }, [fetchTaxas]);

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
      // 1. Desativa a taxa atual (se houver uma ativa)
      const taxaAtivaAtual = taxas.find(t => t.ativo);
      if (taxaAtivaAtual) {
        const { error: deactivateError } = await supabase
          .from('taxas_comissao')
          .update({ ativo: false })
          .eq('id', taxaAtivaAtual.id);
        
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
      fetchTaxas(); // Recarrega o histórico
    } catch (error: any) {
      showError("Falha ao salvar a taxa: " + error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const taxaAtual = taxas.find(t => t.ativo);
  const displayLoading = isLoading || isNamesLoading;

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
              {displayLoading ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-semibold">
                    Taxa Ativa Atual: 
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

          {/* Histórico de Taxas */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-atacado-primary flex items-center">
                <Clock className="w-5 h-5 mr-2" /> Histórico de Alterações de Taxa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {displayLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
                </div>
              ) : taxas.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma taxa de comissão registrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Definido Por</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxas.map((taxa) => (
                      <TableRow key={taxa.id}>
                        <TableCell className="font-bold text-atacado-accent">{taxa.taxa}%</TableCell>
                        <TableCell>
                          <Badge variant={taxa.ativo ? 'default' : 'secondary'} className={taxa.ativo ? 'bg-green-500 hover:bg-green-500' : 'bg-gray-300'}>
                            {taxa.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {taxa.definido_por 
                            ? definidorNames[taxa.definido_por] || `ID: ${taxa.definido_por.substring(0, 8)}`
                            : 'Sistema/N/A'}
                        </TableCell>
                        <TableCell>{new Date(taxa.data_definicao).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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