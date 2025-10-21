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
import Checkout from "./pages/Checkout";
import PedidosFornecedor from "./pages/PedidosFornecedor";
import PedidosLojista from "./pages/PedidosLojista";
import EditarProduto from "./pages/EditarProduto";
import DashboardAdmin from "./pages/DashboardAdmin";
import GerenciarUsuariosAdmin from "./pages/GerenciarUsuariosAdmin";
import GerenciarProdutosAdmin from "./pages/GerenciarProdutosAdmin";
import ConfiguracoesAdmin from "./pages/ConfiguracoesAdmin";
import GerenciarPedidosAdmin from "./pages/GerenciarPedidosAdmin";
import Ajuda from "./pages/Ajuda";
import ComoFunciona from "./pages/ComoFunciona";
import Requisitos from "./pages/Requisitos";
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
              {/* Rotas Públicas (Acessíveis mesmo se não autenticado) */}
              <Route path="/" element={<Index />} /> {/* Movido para cá */}
              <Route path="/login" element={<Login />} />
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route path="/requisitos" element={<Requisitos />} />
              
              {/* Rotas Protegidas (Acesso Geral B2B) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/perfil" element={<PerfilB2B />} />
                <Route path="/carrinho" element={<Carrinho />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/meus-pedidos" element={<PedidosLojista />} />
              </Route>

              {/* Rotas Protegidas (Acesso Lojista E Fornecedor) */}
              <Route element={<ProtectedRoute allowedRoles={['lojista', 'fornecedor']} />}>
                <Route path="/catalogo" element={<CatalogoAtacado />} />
              </Route>

              {/* Rotas Protegidas (Acesso Fornecedor E Administrador) */}
              <Route element={<ProtectedRoute allowedRoles={['fornecedor', 'administrador']} />}>
                <Route path="/estoque" element={<EstoqueFornecedor />} />
                <Route path="/cadastro-produto" element={<CadastroProduto />} />
                <Route path="/editar-produto/:id" element={<EditarProduto />} />
                <Route path="/pedidos-fornecedor" element={<PedidosFornecedor />} />
              </Route>

              {/* Rotas Protegidas (Acesso Apenas Administrador) */}
              <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
                <Route path="/admin" element={<DashboardAdmin />} />
                <Route path="/admin/pedidos" element={<GerenciarPedidosAdmin />} />
                <Route path="/admin/usuarios" element={<GerenciarUsuariosAdmin />} />
                <Route path="/admin/produtos" element={<GerenciarProdutosAdmin />} />
                <Route path="/admin/config" element={<ConfiguracoesAdmin />} />
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