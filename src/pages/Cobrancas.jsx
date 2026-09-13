import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, statusColors, statusLabels } from "@/lib/format";
import {
  MessageSquareText,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sliders,
  History,
  AlertCircle
} from "lucide-react";

export default function Cobrancas() {
  const [reguas, setReguas] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [recebiveis, setRecebiveis] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado do disparador WhatsApp
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [selectedRecebivelId, setSelectedRecebivelId] = useState("");
  const [selectedReguaId, setSelectedReguaId] = useState("");
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("");
  const [sucessoDisparo, setSucessoDisparo] = useState(false);

  const loadData = async () => {
    try {
      const [reg, cob, cli, rec, cfg] = await Promise.all([
        base44.entities.Regua.list(),
        base44.entities.Cobranca.list(),
        base44.entities.Cliente.list(),
        base44.entities.Recebivel.list(),
        base44.entities.Configuracao.get(),
      ]);
      setReguas(reg);
      setCobrancas(cob);
      setClientes(cli);
      setRecebiveis(rec);
      setConfig(cfg);

      if (cli.length > 0) {
        setSelectedClienteId(cli[0].id);
      }
      if (reg.length > 0) {
        setSelectedReguaId(reg[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Atualiza recebíveis disponíveis ao selecionar cliente
  const recebiveisDoCliente = recebiveis.filter(
    (r) => String(r.cliente_id) === String(selectedClienteId) && r.status !== "pago"
  );

  useEffect(() => {
    if (recebiveisDoCliente.length > 0) {
      setSelectedRecebivelId(recebiveisDoCliente[0].id);
    } else {
      setSelectedRecebivelId("");
    }
  }, [selectedClienteId]);

  // Monta a mensagem prévia
  useEffect(() => {
    const cli = clientes.find((c) => String(c.id) === String(selectedClienteId));
    const rec = recebiveis.find((r) => String(r.id) === String(selectedRecebivelId));
    const reg = reguas.find((rg) => String(rg.id) === String(selectedReguaId));

    if (!reg) return;

    let msg = reg.mensagem;
    msg = msg.replace(/\{\{cliente\}\}/g, cli?.nome || "Cliente");
    msg = msg.replace(/\{\{nota_fiscal\}\}/g, rec?.nota_fiscal || "NF-XXXX");
    msg = msg.replace(/\{\{valor\}\}/g, rec ? formatCurrency(rec.valor) : "R$ 0,00");
    msg = msg.replace(/\{\{vencimento\}\}/g, rec ? formatDate(rec.vencimento) : "hoje");
    msg = msg.replace(/\{\{chave_pix\}\}/g, config?.chave_pix || "pix@empresa.com.br");
    msg = msg.replace(/\{\{link_pagamento\}\}/g, `https://pix.recebeai.com.br/pay/${rec?.id || "exemplo"}`);

    setMensagemPersonalizada(msg);
  }, [selectedClienteId, selectedRecebivelId, selectedReguaId, reguas, config]);

  const handleDispararWhatsApp = async () => {
    const cli = clientes.find((c) => String(c.id) === String(selectedClienteId));
    const rec = recebiveis.find((r) => String(r.id) === String(selectedRecebivelId));
    const reg = reguas.find((rg) => String(rg.id) === String(selectedReguaId));

    if (!cli) return;

    // Registrar no histórico
    const novaCobranca = await base44.entities.Cobranca.create({
      cliente_id: cli.id,
      recebivel_id: rec?.id || null,
      tipo: "whatsapp",
      origem: "manual",
      regua_step: reg?.dias_gatilho || 0,
      status: "enviada",
      data_envio: new Date().toISOString().split("T")[0],
      mensagem: mensagemPersonalizada,
    });

    setCobrancas([novaCobranca, ...cobrancas]);
    setSucessoDisparo(true);
    setTimeout(() => setSucessoDisparo(false), 4000);

    // Abrir WhatsApp Web
    const telefone = cli.telefone?.replace(/\D/g, "") || "";
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagemPersonalizada)}`;
    window.open(url, "_blank");
  };

  const handleToggleRegua = async (reguaId, ativoAtual) => {
    const updated = await base44.entities.Regua.update(reguaId, { ativo: !ativoAtual });
    setReguas(reguas.map((r) => (r.id === reguaId ? updated : r)));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Régua de Cobrança & Disparos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Automação de lembretes preventivos, mensagens amigáveis e avisos no WhatsApp com PIX integrado.
        </p>
      </div>

      {/* Grid Principal: Central de Disparo e Régua */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Central de Disparos Diretos no WhatsApp (col 7) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Send className="h-4 w-4" />
              </div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Disparo Rápido via WhatsApp
              </h2>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              WhatsApp Web / API
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente / Devedor</label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.telefone || "Sem telefone"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título / Fatura em Aberto</label>
                <select
                  value={selectedRecebivelId}
                  onChange={(e) => setSelectedRecebivelId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  disabled={recebiveisDoCliente.length === 0}
                >
                  {recebiveisDoCliente.length === 0 ? (
                    <option value="">Nenhum título em aberto</option>
                  ) : (
                    recebiveisDoCliente.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nota_fiscal} - {formatCurrency(r.valor)} (Vence {formatDate(r.vencimento)})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo de Mensagem da Régua</label>
              <select
                value={selectedReguaId}
                onChange={(e) => setSelectedReguaId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {reguas.map((rg) => (
                  <option key={rg.id} value={rg.id}>
                    {rg.nome} ({rg.dias_gatilho === 0 ? "No vencimento" : rg.dias_gatilho < 0 ? `${Math.abs(rg.dias_gatilho)} dias antes` : `${rg.dias_gatilho} dias após`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Prévia da Mensagem Formatada</label>
                <span className="text-[11px] text-slate-400">Pode ser editada antes de enviar</span>
              </div>
              <textarea
                rows={4}
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>

            {/* Simulação Balão WhatsApp */}
            <div className="rounded-xl border border-emerald-100 bg-[#EFEAE2] p-4 shadow-inner">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Visualização no WhatsApp:</div>
              <div className="max-w-md rounded-xl rounded-tl-none bg-white p-3 text-xs text-slate-800 shadow-sm leading-relaxed whitespace-pre-wrap">
                {mensagemPersonalizada}
                <div className="mt-1 text-right text-[10px] text-slate-400">12:00 ✓✓</div>
              </div>
            </div>

            {sucessoDisparo && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Mensagem enviada com sucesso e registrada no histórico de cobranças!</span>
              </div>
            )}

            <button
              onClick={handleDispararWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>Abrir WhatsApp e Enviar Cobrança</span>
            </button>
          </div>
        </div>

        {/* Etapas Configuradas da Régua (col 5) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-slate-900">Etapas da Régua</h2>
            <span className="text-xs text-slate-500">{reguas.length} etapas ativas</span>
          </div>

          <div className="space-y-3">
            {reguas.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  r.ativo ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900">{r.nome}</span>
                  <button
                    onClick={() => handleToggleRegua(r.id, r.ativo)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {r.ativo ? "Ativa" : "Pausada"}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 italic">
                  "{r.mensagem}"
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Gatilho: {r.dias_gatilho === 0 ? "No dia" : `${r.dias_gatilho} dias`}</span>
                  <span>•</span>
                  <span>Canal: WhatsApp</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico Recente de Cobranças */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">Histórico de Cobranças Realizadas</h2>
            <p className="text-xs text-slate-500">Registro com status de envio, data e mensagem disparada</p>
          </div>
        </div>

        {cobrancas.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Nenhuma cobrança realizada ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {cobrancas.map((c) => {
              const cli = clientes.find((cl) => String(cl.id) === String(c.cliente_id));
              return (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{cli?.nome || "Cliente"}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-medium ${
                          statusColors[c.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabels[c.status] || c.status}
                      </span>
                      <span className="text-[11px] text-slate-400">Via {c.tipo}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-1">{c.mensagem}</p>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(c.data_envio)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
