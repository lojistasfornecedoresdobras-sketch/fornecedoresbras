import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Copy, QrCode, ArrowRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

interface PixDetails {
  pedidoId: string;
  pagarmeId: string;
  totalPago: string;
  qr_code: string;
  qr_code_text: string;
}

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixDetails: PixDetails | null;
  onPaymentConfirmed: () => void;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({ isOpen, onClose, pixDetails, onPaymentConfirmed }) => {
  const navigate = useNavigate();

  if (!pixDetails) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixDetails.qr_code_text);
    showSuccess("Código PIX Copiado!");
  };
  
  const handleGoToOrders = () => {
    onClose();
    onPaymentConfirmed(); // Limpa o carrinho e redireciona
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <DialogTitle className="text-2xl font-bold text-atacado-primary">
            Pagamento PIX Criado!
          </DialogTitle>
          <DialogDescription>
            Seu pedido #{pixDetails.pedidoId.substring(0, 8)} foi gerado. Use o QR Code ou o código abaixo para pagar.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-atacado-accent">
            Valor Total: R${pixDetails.totalPago}
          </p>

          {/* QR Code */}
          <div className="flex justify-center">
            {/* Em um cenário real, usaríamos uma biblioteca para renderizar o QR Code a partir de pixDetails.qr_code_text */}
            <div className="w-48 h-48 bg-gray-100 border border-gray-300 flex items-center justify-center rounded-lg">
                <QrCode className="w-12 h-12 text-atacado-primary" />
                <p className="absolute text-xs text-gray-600 mt-20">QR Code Mock</p>
            </div>
          </div>

          {/* Código Copia e Cola */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Código PIX Copia e Cola</p>
            <div className="flex border rounded-lg overflow-hidden">
              <input 
                type="text" 
                value={pixDetails.qr_code_text} 
                readOnly 
                className="flex-1 p-3 text-sm font-mono bg-gray-50 truncate"
              />
              <Button 
                type="button"
                variant="secondary" 
                size="icon" 
                className="h-full rounded-none bg-atacado-primary hover:bg-atacado-primary/90 text-white"
                onClick={handleCopy}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
            A confirmação do pagamento é automática via webhook.
        </p>

        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 mt-4"
          onClick={handleGoToOrders}
        >
          ACOMPANHAR MEUS PEDIDOS <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentModal;