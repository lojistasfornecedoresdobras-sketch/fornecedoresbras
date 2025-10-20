import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CatalogoAtacado from "./pages/CatalogoAtacado";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import PerfilB2B from "./pages/PerfilB2B";
import EstoqueFornecedor from "./pages/EstoqueFornecedor";
import CadastroProduto from "./pages/CadastroProduto";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout"; // Importando Checkout
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              
              {/* Rotas Protegidas (Acesso Geral B2B) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/catalogo" element={<CatalogoAtacado />} />
                <Route path="/perfil" element={<PerfilB2B />} />
                <Route path="/carrinho" element={<Carrinho />} />
                <Route path="/checkout" element={<Checkout />} /> {/* Usando o componente Checkout */}
              </Route>

              {/* Rotas Protegidas (Acesso Apenas Fornecedor) */}
              <Route element={<ProtectedRoute allowedRoles={['fornecedor']} />}>
                <Route path="/estoque" element={<EstoqueFornecedor />} />
                <Route path="/cadastro-produto" element={<CadastroProduto />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;