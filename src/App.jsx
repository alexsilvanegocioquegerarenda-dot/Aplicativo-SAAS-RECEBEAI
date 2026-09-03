import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react'
import Configuracoes from './pages/Configuracoes';
import ClienteDetalhes from './pages/ClienteDetalhes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/configuracoes" replace />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/clientes/:id" element={<ClienteDetalhes />} />
      </Routes>
    </BrowserRouter>
  );
}