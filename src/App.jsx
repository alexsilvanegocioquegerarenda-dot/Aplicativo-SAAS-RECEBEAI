import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalhes from './pages/ClienteDetalhes';
import Recebiveis from './pages/Recebiveis';
import Cobrancas from './pages/Cobrancas';
import Promessas from './pages/Promessas';
import Configuracoes from './pages/Configuracoes';
import AdminDashboard from './pages/AdminDashboard';
import Kanban from './pages/Kanban';
import Importacoes from './pages/Importacoes';
import Aging from './pages/Aging';
import DSO from './pages/DSO';
import Regua from './pages/Regua';
import Templates from './pages/Templates';
import IAFinanceira from './pages/IAFinanceira';
import Recuperacao from './pages/Recuperacao';
import Planos from './pages/Planos';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Primeira página do aplicativo: Landing Page de vendas e conversão */}
          <Route path="/" element={<LandingPage />} />

          {/* 2. Rotas públicas de Autenticação Multi-empresa */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* 3. Rotas autenticadas da Plataforma SaaS envolvidas pelo Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clientes/:id" element={<ClienteDetalhes />} />
                    <Route path="/recebiveis" element={<Recebiveis />} />
                    <Route path="/kanban" element={<Kanban />} />
                    <Route path="/importacoes" element={<Importacoes />} />
                    <Route path="/aging" element={<Aging />} />
                    <Route path="/dso" element={<DSO />} />
                    <Route path="/cobrancas" element={<Cobrancas />} />
                    <Route path="/regua" element={<Regua />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/promessas" element={<Promessas />} />
                    <Route path="/ia" element={<IAFinanceira />} />
                    <Route path="/recuperacao" element={<Recuperacao />} />
                    <Route path="/relatorios" element={<Recuperacao />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/planos" element={<Planos />} />

                    {/* Rota estritamente restrita ao Administrador Master */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback de rotas internas redireciona para o Dashboard */}
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