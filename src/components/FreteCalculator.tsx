import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Truck, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';

interface CartItemForFrete {
  id: string;
  name: string;
  priceAtacado: number;
  unit: 'DZ' | 'PC' | 'CX';
  quantity: number;
  imageUrl: string;
  fornecedorId: string;
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
}

interface GroupedOrder {
  fornecedorId: string;
  fornecedorNome: string;
  items: CartItemForFrete[];
  subtotal: number;
}

interface FreteRate {
    id: number;
    name: string;
    price: number;
    delivery_time: number;
    error: string | null;
}

interface FreteCalculatorProps {
  orderGroup: GroupedOrder;
  lojistaId: string;
  cepDestino: string;
  onRatesCalculated: (fornecedorId: string, rates: FreteRate[]) => void;
  onRateSelected: (fornecedorId: string, rate: FreteRate | null) => void;
  selectedRate: FreteRate | null;
}

const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
};

const FreteCalculator: React.FC<FreteCalculatorProps> = ({ 
    orderGroup, 
    lojistaId, 
    cepDestino, 
    onRatesCalculated, 
    onRateSelected,
    selectedRate
}) => {
  const [rates, setRates] = useState<FreteRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);

  const calculateFrete = useCallback(async () => {
    if (!cepDestino || cepDestino.length < 8) return;

    setIsLoading(true);
    setRates([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('calcular-frete', {
        body: {
          lojistaId,
          fornecedorId: orderGroup.fornecedorId,
          items: orderGroup.items,
          cepDestino,
        },
      });

      if (error) {
        showError(`Erro ao calcular frete para ${orderGroup.fornecedorNome}: ${error.message}`);
        console.error(error);
        onRatesCalculated(orderGroup.fornecedorId, []);
        return;
      }

      const calculatedRates = data.rates as FreteRate[];
      setRates(calculatedRates);
      onRatesCalculated(orderGroup.fornecedorId, calculatedRates);
      setIsCalculated(true);

    } catch (e: any) {
      showError(`Falha na comunicação com o servidor: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [lojistaId, orderGroup, cepDestino, onRatesCalculated]);

  useEffect(() => {
    // Recalcula automaticamente quando o CEP de destino muda
    if (cepDestino && cepDestino.length === 8) {
        calculateFrete();
    }
  }, [cepDestino, calculateFrete]);

  const handleSelectRate = (rate: FreteRate) => {
    onRateSelected(orderGroup.fornecedorId, rate);
  };

  const hasErrors = rates.some(rate => rate.error);
  const validRates = rates.filter(rate => !rate.error);

  return (
    <Card className="border-atacado-accent/50">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-atacado-accent flex items-center">
          <Truck className="w-5 h-5 mr-2" /> Opções de Envio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
          </div>
        ) : (
          <>
            {hasErrors && (
                <p className="text-sm text-red-500">
                    Erro no cálculo de frete. Verifique o CEP ou as dimensões do produto.
                </p>
            )}

            {validRates.length === 0 && isCalculated && !hasErrors && (
                <p className="text-sm text-gray-500">
                    Nenhuma opção de frete encontrada para este CEP.
                </p>
            )}

            {validRates.map((rate) => (
              <div 
                key={rate.id} 
                className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedRate?.id === rate.id 
                    ? 'border-atacado-accent bg-atacado-accent/10' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectRate(rate)}
              >
                <div>
                  <p className="font-semibold text-atacado-primary">{rate.name}</p>
                  <p className="text-xs text-gray-500">Entrega em {rate.delivery_time} dias úteis (Mock)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-atacado-accent">{formatCurrency(rate.price)}</p>
                  {selectedRate?.id === rate.id && <CheckCircle className="w-4 h-4 text-green-600 mt-1" />}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FreteCalculator;