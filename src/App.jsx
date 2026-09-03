import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalhes from './pages/ClienteDetalhes';
import Recebiveis from './pages/Recebiveis';
import Configuracoes from './pages/Configuracoes';
import { LayoutDashboard, Users, FileText, Settings, Wallet } from 'lucide-react';

function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Recebíveis', path: '/recebiveis', icon: FileText },
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar / Menu Lateral */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">RecebeAi</h1>
            <p className="text-xs text-gray-500">Gestão de Cobranças</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhes />} />
          <Route path="/recebiveis" element={<Recebiveis />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
