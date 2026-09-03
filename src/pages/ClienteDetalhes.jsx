import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { formatCurrency, formatDate } from "../lib/format";
import AgingTabela from "../components/AgingTabela";
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";

export default function ClienteDetalhes() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [recebiveis, setRecebiveis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Busca cliente
        const { data: clienteData, error: clienteErr } = await supabase
          .from("clientes")
          .select("*")
          .eq("id", id)
          .single();

        if (clienteErr) throw clienteErr;
        setCliente(clienteData);

        // Busca recebíveis do cliente
        const { data: recebiveisData, error: recebiveisErr } = await supabase
          .from("recebiveis")
          .select("*")
          .eq("cliente_id", id);

        if (recebiveisErr) throw recebiveisErr;
        setRecebiveis(recebiveisData || []);
      } catch (err) {
        console.error("Erro ao carregar dados do cliente:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Link to="/clientes" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clientes" className="rounded-lg border border-border p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cliente.nome}</h1>
            <p className="text-sm text-muted-foreground">CNPJ/CPF: {cliente.documento || "Não informado"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações do Cliente */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" /> Dados de Contato
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Mail className="mr-2 h-4 w-4" /> {cliente.email || "Sem e-mail"}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4" /> {cliente.telefone || "Sem telefone"}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" /> {cliente.endereco || "Endereço não cadastrado"}
            </div>
          </div>
        </div>

        {/* Tabela de Aging */}
        <div className="md:col-span-2">
          <AgingTabela recebiveisEnriched={recebiveis} clienteId={id} />
        </div>
      </div>

      {/* Lista de Recebíveis do Cliente */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Títulos de Cobrança
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recebiveis.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum título encontrado para este cliente.
                  </td>
                </tr>
              ) : (
                recebiveis.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.descricao || item.numero_documento || "Cobrança"}</td>
                    <td className="px-4 py-3">{formatDate(item.data_vencimento)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === "pago" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status === "pago" ? (
                          <><CheckCircle className="mr-1 h-3 w-3" /> Pago</>
                        ) : (
                          <><Clock className="mr-1 h-3 w-3" /> Pendente</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
