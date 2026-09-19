import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  X,
  Check,
  Tag,
  AlertCircle
} from "lucide-react";

const NIVEIS_PRIORIDADE = [
  {
    id: "alta",
    label: "Alta Prioridade",
    badge: "bg-red-50 text-red-700 border-red-200",
    desc: "Firme e assertivo — atraso prolongado ou histórico crítico",
  },
  {
    id: "media",
    label: "Média Prioridade",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Educado e persistente — atraso moderado (8 a 30 dias)",
  },
  {
    id: "baixa",
    label: "Baixa Prioridade",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Amigável e preventivo — lembretes iniciais de vencimento",
  },
];

export default function Templates() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [filtroNivel, setFiltroNivel] = useState("all");
  const [modalAberto, setModalAberto] = useState(false);
  const [templateEditando, setTemplateEditando] = useState(null);

  // Form State
  const [form, setForm] = useState({
    nome: "",
    nivel: "media",
    tom: "",
    conteudo: "",
    ativo: true,
  });
  const [salvando, setSalvando] = useState(false);

  const carregarTemplates = async () => {
    try {
      const list = await base44.entities.TemplateMensagem.list();
      setTemplates(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTemplates();
  }, []);

  const templatesFiltrados = useMemo(() => {
    if (filtroNivel === "all") return templates;
    return templates.filter((t) => t.nivel === filtroNivel);
  }, [templates, filtroNivel]);

  const handleAbrirModal = (template = null) => {
    if (template) {
      setTemplateEditando(template);
      setForm({
        nome: template.nome || "",
        nivel: template.nivel || "media",
        tom: template.tom || "",
        conteudo: template.conteudo || "",
        ativo: template.ativo ?? true,
      });
    } else {
      setTemplateEditando(null);
      setForm({
        nome: "",
        nivel: "media",
        tom: "",
        conteudo: "Olá {cliente}, sua fatura {nota_fiscal} no valor de {valor} venceu há {dias} dias. Segue nossa chave PIX para quitação: {pix}.",
        ativo: true,
      });
    }
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.conteudo) return;
    setSalvando(true);
    try {
      if (templateEditando) {
        const atualizado = await base44.entities.TemplateMensagem.update(templateEditando.id, form);
        setTemplates((prev) => prev.map((t) => (t.id === templateEditando.id ? atualizado : t)));
      } else {
        const criado = await base44.entities.TemplateMensagem.create(form);
        setTemplates((prev) => [criado, ...prev]);
      }
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (template) => {
    const atualizado = await base44.entities.TemplateMensagem.update(template.id, {
      ativo: !template.ativo,
    });
    setTemplates((prev) => prev.map((t) => (t.id === template.id ? atualizado : t)));
  };

  const handleExcluir = async (id) => {
    if (confirm("Deseja realmente excluir este template de mensagem?")) {
      await base44.entities.TemplateMensagem.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Templates de Cobrança
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Personalização
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Modelos de mensagens que a IA e a Régua utilizam como base para disparo aos devedores
          </p>
        </div>

        <button
          onClick={() => handleAbrirModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Template</span>
        </button>
      </div>

      {/* Filtro por Nível */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroNivel("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filtroNivel === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Todos os Níveis ({templates.length})
        </button>
        {NIVEIS_PRIORIDADE.map((n) => (
          <button
            key={n.id}
            onClick={() => setFiltroNivel(n.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filtroNivel === n.id
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {n.label} ({templates.filter((t) => t.nivel === n.id).length})
          </button>
        ))}
      </div>

      {/* Lista de Templates */}
      {templatesFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">Nenhum template encontrado</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Cadastre modelos de mensagem para padronizar os contatos automáticos da sua empresa.
          </p>
          <button
            onClick={() => handleAbrirModal()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Criar Primeiro Template</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templatesFiltrados.map((tpl) => {
            const cfgNivel = NIVEIS_PRIORIDADE.find((n) => n.id === tpl.nivel) || NIVEIS_PRIORIDADE[1];

            return (
              <div
                key={tpl.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                  tpl.ativo ? "border-slate-200 hover:border-slate-300" : "border-slate-200 opacity-60 bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-sm font-bold text-slate-900">{tpl.nome}</h3>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cfgNivel.badge}`}>
                        {cfgNivel.label}
                      </span>
                      {!tpl.ativo && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          Inativo
                        </span>
                      )}
                    </div>

                    {tpl.tom && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">Tom de voz:</span>
                        <span>{tpl.tom}</span>
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                      {tpl.conteudo}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleAtivo(tpl)}
                      title={tpl.ativo ? "Desativar modelo" : "Ativar modelo"}
                      className={`rounded-xl p-2 transition-colors ${
                        tpl.ativo ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {tpl.ativo ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => handleAbrirModal(tpl)}
                      title="Editar template"
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleExcluir(tpl.id)}
                      title="Excluir template"
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação e Edição de Template */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                {templateEditando ? "Editar Template" : "Novo Template de Cobrança"}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Template *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Cobrança Firme 15 Dias"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nível de Prioridade *
                  </label>
                  <select
                    value={form.nivel}
                    onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {NIVEIS_PRIORIDADE.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tom de Voz
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Firme e respeitoso"
                    value={form.tom}
                    onChange={(e) => setForm({ ...form, tom: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Conteúdo da Mensagem *
                  </label>
                  <span className="text-[11px] text-slate-400">Variáveis dinâmicas permitidas</span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white leading-relaxed font-sans"
                />
              </div>

              {/* Dica de Variáveis */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-blue-900 block mb-1">Variáveis que você pode usar:</strong>
                <div className="flex flex-wrap gap-1.5">
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-700 border">{"{cliente}"}</code>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-700 border">{"{nota_fiscal}"}</code>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-700 border">{"{valor}"}</code>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-700 border">{"{dias}"}</code>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-700 border">{"{pix}"}</code>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ativoCheckbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Manter este template ativo para uso no sistema
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar Template"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
