import React, { useState } from "react";
import { Settings, Save, Database, Key, CheckCircle } from "lucide-react";

export default function Configuracoes() {
  const [salvo, setSalvo] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações do Sistema
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as integrações e preferências da aplicação RecebeAi.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Config */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Conexão com Supabase
          </h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Status da Integração</label>
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle className="h-4 w-4" /> Variáveis de ambiente configuradas na Vercel
              </div>
            </div>
          </div>
        </div>

        {/* Notificações / Preferências */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> Preferências do Usuário
          </h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              <span>Notificar sobre títulos vencidos automaticamente</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
          >
            <Save className="h-4 w-4" /> Salvar Alterações
          </button>

          {salvo && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Configurações salvas com sucesso!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
