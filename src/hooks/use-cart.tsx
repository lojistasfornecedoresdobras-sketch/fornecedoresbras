import React, { createContext, useContext, useState, useMemo } from 'react';
import { showError, showSuccess } from '@/utils/toast';

interface CartItem {
  id: string;
  name: string;
  priceAtacado: number;
  unit: 'DZ' | 'PC' | 'CX';
  quantity: number; // Quantidade de DZ/PC/CX
  imageUrl: string;
  fornecedorId: string; // Novo
  // Campos de Frete
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  
  const totalPrice = useMemo(() => 
    items.reduce((sum, item) => sum + item.priceAtacado * item.quantity, 0), 
    [items]
  );

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number) => {
    if (quantity <= 0) return;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);

      if (existingItem) {
        const updatedItems = prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        showSuccess(`Adicionado +${quantity} ${newItem.unit} de ${newItem.name} ao carrinho.`);
        return updatedItems;
      } else {
        const itemToAdd = { ...newItem, quantity };
        showSuccess(`Adicionado ${quantity} ${newItem.unit} de ${newItem.name} ao carrinho.`);
        return [...prevItems, itemToAdd];
      }
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(prevItems => {
      if (quantity <= 0) {
        showSuccess("Item removido do carrinho.");
        return prevItems.filter(item => item.id !== itemId);
      }
      
      const updatedItems = prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity }
          : item
      );
      return updatedItems;
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prevItems => {
      showSuccess("Item removido do carrinho.");
      return prevItems.filter(item => item.id !== itemId);
    });
  };

  const clearCart = () => {
    setItems([]);
    showSuccess("Carrinho limpo.");
  };

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};