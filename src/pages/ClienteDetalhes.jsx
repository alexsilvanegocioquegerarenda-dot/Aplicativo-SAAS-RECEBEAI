import React, { useEffect, useState } from "react";

import { useParams, useNavigate, Link } from "react-router-dom";

import { supabase } from '../api/supabaseClient'

import { formatCurrency, formatDate, daysBetween, calcRecebivelStatus, statusLabels, statusColors, riscoColors } from "@/lib/format";

import AgingTabela from "@/components/AgingTabela";

import { ArrowLeft, MessageSquare, Handshake, CheckCircle2, Wallet, Clock, AlertTriangle } from "lucide-react";



export default function ClienteDetalhes() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [cliente, setCliente] = useState(null);

  const [recebiveis, setRecebiveis] = useState([]);

  const [cobrancas, setCobrancas] = useState([]);

  const [promessas, setPromessas] = useState([]);

  const [prioridade, setPrioridade] = useState(null);



  const load = async () => {

    const [c, r, cob, prom, prios] = await Promise.all([

      base44.entities.Cliente.list(),

      base44.entities.Recebivel.filter({ cliente_id: id }),

      base44.entities.Cobranca.filter({ cliente_id: id }),

      base44.entities.Promessa.filter({ cliente_id: id }),

      base44.entities.PrioridadeCobranca.filter({ cliente_id: id }),

    ]);

    setCliente(c.find(x => x.id === id) || null);

    setRecebiveis(r);

    setCobrancas(cob.reverse());

    setPromessas(prom.reverse());

    setPrioridade(prios[0] || null);

    setLoading(false);

  };



  useEffect(() => { load(); }, [id]);



  const registrarPagamento = async (r) => {

    const updated = await base44.entities.Recebivel.update(r.id, {

      status: "pago",

      valor_pago: r.valor,

      data_pagamento: new Date().toISOString().split("T")[0],

    });

    setRecebiveis(recebiveis.map(x => x.id === r.id ? updated : x));

  };



  if (loading) {

    return (

      <div className="flex h-full items-center justify-center">

        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />

      </div>

    );

  }



  if (!cliente) {

    return (

      <div className="mx-auto max-w-3xl px-5 py-12 text-center">

        <p className="text-muted-foreground">Cliente não encontrado.</p>

        <Link to="/clientes" className="mt-3 inline-block text-sm font-medium text-foreground underline">Voltar para clientes</Link>

      </div>

    );

  }



  const recebiveisCalc = recebiveis.map(r => ({

    ...r,

    statusCalc: calcRecebivelStatus(r),

    dias: daysBetween(r.vencimento),

    saldo: (Number(r.valor) || 0) - (Number(r.valor_pago) || 0),

  }));

  const valorAberto = recebiveisCalc.filter(r => r.status !== "pago").reduce((s, r) => s + r.saldo, 0);

  const valorVencido = recebiveisCalc.filter(r => r.status !== "pago" && r.dias > 0).reduce((s, r) => s + r.saldo, 0);

  const maiorAtraso = Math.max(0, ...recebiveisCalc.filter(r => r.status !== "pago").map(r => r.dias));



  const nivelCores = {

    alta: "bg-red-100 text-red-700",

    media: "bg-amber-100 text-amber-700",

    baixa: "bg-emerald-100 text-emerald-700",

  };



  return (

    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">

      <button onClick={() => navigate("/clientes")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">

        <ArrowLeft className="h-4 w-4" /> Clientes

      </button>



      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">

        <div>

          <h1 className="font-heading text-2xl font-semibold tracking-tight">{cliente.nome}</h1>

          <p className="mt-0.5 text-sm text-muted-foreground">CNPJ: {cliente.cnpj || "—"}</p>

        </div>

        <div className="flex flex-wrap gap-2">

          <Link to="/cobrancas" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background hover:opacity-90">

            <MessageSquare className="h-4 w-4" /> Cobrar agora

          </Link>

          <Link to="/promessas" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:bg-accent">

            <Handshake className="h-4 w-4" /> Registrar promessa

          </Link>

        </div>

      </div>



      {prioridade && (

        <div className="mb-6 rounded-xl border border-border bg-card p-4">

          <div className="flex flex-wrap items-center gap-2">

            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${nivelCores[prioridade.nivel]}`}>

              Prioridade {prioridade.nivel}

            </span>

            <span className="text-xs text-muted-foreground">Score: {prioridade.score}</span>

          </div>

          <p className="mt-2 text-sm text-muted-foreground">{prioridade.motivo}</p>

          <p className="mt-1 text-sm font-medium">Recomendação: {prioridade.recomendacao}</p>

        </div>

      )}



      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

        <div className="rounded-xl border border-border bg-card p-4">

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Valor em aberto</div>

          <div className="mt-1.5 text-lg font-semibold">{formatCurrency(valorAberto)}</div>

        </div>

        <div className="rounded-xl border border-border bg-card p-4">

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" /> Valor vencido</div>

          <div className="mt-1.5 text-lg font-semibold text-red-600">{formatCurrency(valorVencido)}</div>

        </div>

        <div className="rounded-xl border border-border bg-card p-4">

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Maior atraso</div>

          <div className="mt-1.5 text-lg font-semibold">{maiorAtraso} dias</div>

        </div>

        <div className="rounded-xl border border-border bg-card p-4">

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Títulos em aberto</div>

          <div className="mt-1.5 text-lg font-semibold">{recebiveisCalc.filter(r => r.status !== "pago").length}</div>

        </div>

      </div>



      <div className="mb-8">

        <h2 className="mb-3 font-heading text-base font-semibold">Aging individual</h2>

        <AgingTabela recebiveisEnriched={recebiveisCalc} clienteId={id} />

      </div>



      <div className="mb-8">

        <h2 className="mb-3 font-heading text-base font-semibold">Recebíveis</h2>

        {recebiveisCalc.length === 0 ? (

          <p className="text-sm text-muted-foreground">Nenhum recebível cadastrado.</p>

        ) : (

          <div className="overflow-x-auto rounded-xl border border-border">

            <table className="w-full text-sm">

              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">

                <tr>

                  <th className="px-4 py-2.5 font-medium">Nota fiscal</th>

                  <th className="px-4 py-2.5 font-medium">Valor</th>

                  <th className="px-4 py-2.5 font-medium">Vencimento</th>

                  <th className="px-4 py-2.5 font-medium">Atraso</th>

                  <th className="px-4 py-2.5 font-medium">Status</th>

                  <th className="px-4 py-2.5 font-medium text-right">Ação</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-border">

                {recebiveisCalc.map(r => (

                  <tr key={r.id}>

                    <td className="px-4 py-3">{r.nota_fiscal || "—"}</td>

                    <td className="px-4 py-3">{formatCurrency(r.saldo)}</td>

                    <td className="px-4 py-3">{formatDate(r.vencimento)}</td>

                    <td className="px-4 py-3">{r.dias > 0 ? `${r.dias} dias` : "—"}</td>

                    <td className="px-4 py-3">

                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] || "bg-slate-100 text-slate-600"}`}>

                        {statusLabels[r.status] || r.status}

                      </span>

                    </td>

                    <td className="px-4 py-3 text-right">

                      {r.status !== "pago" && (

                        <button onClick={() => registrarPagamento(r)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">

                          <CheckCircle2 className="h-3.5 w-3.5" /> Pago

                        </button>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>



      <div>

        <h2 className="mb-3 font-heading text-base font-semibold">Histórico de cobrança</h2>

        {cobrancas.length === 0 ? (

          <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>

        ) : (

          <div className="space-y-2">

            {cobrancas.map(c => (

              <div key={c.id} className="rounded-xl border border-border bg-card p-3.5">

                <div className="flex flex-wrap items-center justify-between gap-2">

                  <div className="flex items-center gap-2">

                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || "bg-slate-100 text-slate-600"}`}>

                      {statusLabels[c.status] || c.status}

                    </span>

                    <span className="text-xs text-muted-foreground">{c.origem === "regua" ? "Régua" : "Manual"}</span>

                    {c.regua_step && <span className="text-xs text-muted-foreground">· Degrau {c.regua_step}</span>}

                  </div>

                  <span className="text-xs text-muted-foreground">{formatDate(c.data_envio)}</span>

                </div>

                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.mensagem}</p>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

} 

