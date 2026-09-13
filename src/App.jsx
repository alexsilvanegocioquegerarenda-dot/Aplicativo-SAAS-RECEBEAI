import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalhes from './pages/ClienteDetalhes';
import Recebiveis from './pages/Recebiveis';
import Cobrancas from './pages/Cobrancas';
import Promessas from './pages/Promessas';
import Configuracoes from './pages/Configuracoes';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública de Login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas envolvidas pelo Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clientes/:id" element={<ClienteDetalhes />} />
                    <Route path="/recebiveis" element={<Recebiveis />} />
                    <Route path="/cobrancas" element={<Cobrancas />} />
                    <Route path="/promessas" element={<Promessas />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />

                    {/* Rota estritamente restrita ao Administrador Master */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}