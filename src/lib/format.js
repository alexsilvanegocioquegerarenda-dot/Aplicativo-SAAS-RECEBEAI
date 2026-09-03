export function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today - d) / 86400000);
}

export function calcRecebivelStatus(recebivel) {
  if (recebivel.status === "pago") return "pago";
  const dias = daysBetween(recebivel.vencimento);
  if (dias > 0) return "atrasado";
  if (dias > -7) return "a_vencer";
  return "em_dia";
}

export const statusLabels = {
  em_dia: "Em dia",
  a_vencer: "A vencer",
  atrasado: "Atrasado",
  pago: "Pago",
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  respondida: "Respondida",
  promessa: "Promessa",
  pendente: "Pendente",
  cumprida: "Cumprida",
  quebrada: "Quebrada",
  vencido: "Vencido",
  parcialmente_pago: "Parcialmente pago",
  aberta: "Aberta",
  paga: "Paga",
  parcialmente_paga: "Parcialmente paga",
  vencida: "Vencida",
  cancelada: "Cancelada",
  agendada: "Agendada",
  entregue: "Entregue",
  falhou: "Falhou",
};

export const statusColors = {
  em_dia: "bg-emerald-100 text-emerald-700",
  a_vencer: "bg-amber-100 text-amber-700",
  atrasado: "bg-red-100 text-red-700",
  pago: "bg-emerald-100 text-emerald-700",
  rascunho: "bg-slate-100 text-slate-600",
  enviada: "bg-blue-100 text-blue-700",
  visualizada: "bg-indigo-100 text-indigo-700",
  respondida: "bg-purple-100 text-purple-700",
  promessa: "bg-amber-100 text-amber-700",
  pendente: "bg-amber-100 text-amber-700",
  cumprida: "bg-emerald-100 text-emerald-700",
  quebrada: "bg-red-100 text-red-700",
  vencido: "bg-red-100 text-red-700",
  parcialmente_pago: "bg-amber-100 text-amber-700",
  aberta: "bg-amber-100 text-amber-700",
  paga: "bg-emerald-100 text-emerald-700",
  parcialmente_paga: "bg-amber-100 text-amber-700",
  vencida: "bg-red-100 text-red-700",
  cancelada: "bg-slate-100 text-slate-500",
  agendada: "bg-blue-100 text-blue-700",
  entregue: "bg-indigo-100 text-indigo-700",
  falhou: "bg-red-100 text-red-700",
};

export const riscoColors = {
  baixo: "bg-emerald-100 text-emerald-700",
  medio: "bg-amber-100 text-amber-700",
  alto: "bg-red-100 text-red-700",
};

export const historicoLabels = {
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
};

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}