import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importações das páginas (verifique se todas usam "export default" em seus arquivos)
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalhes from './pages/ClienteDetalhes';
import Recebiveis from './pages/Recebiveis';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<ClienteDetalhes />} />
        <Route path="/recebiveis" element={<Recebiveis />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  );
}
