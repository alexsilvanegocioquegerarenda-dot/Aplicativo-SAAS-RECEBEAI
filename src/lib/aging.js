import { daysBetween } from "./format";

export const AGING_FAIXAS_KEYS = [
  "a_vencer",
  "ate_30",
  "31_60",
  "61_90",
  "91_180",
  "181_360",
  "acima_360",
];

export const agingFaixaConfig = {
  a_vencer: {
    id: "a_vencer",
    label: "A vencer",
    short: "A vencer",
    color: "#10b981",
    barColor: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
  },
  ate_30: {
    id: "ate_30",
    label: "Até 30 dias",
    short: "1-30d",
    color: "#f59e0b",
    barColor: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
  },
  "31_60": {
    id: "31_60",
    label: "31 a 60 dias",
    short: "31-60d",
    color: "#f97316",
    barColor: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200",
  },
  "61_90": {
    id: "61_90",
    label: "61 a 90 dias",
    short: "61-90d",
    color: "#ef4444",
    barColor: "bg-red-500",
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
  },
  "91_180": {
    id: "91_180",
    label: "91 a 180 dias",
    short: "91-180d",
    color: "#f43f5e",
    barColor: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800",
    border: "border-rose-200",
  },
  "181_360": {
    id: "181_360",
    label: "181 a 360 dias",
    short: "181-360d",
    color: "#a855f7",
    barColor: "bg-purple-500",
    badge: "bg-purple-100 text-purple-800",
    border: "border-purple-200",
  },
  acima_360: {
    id: "acima_360",
    label: "Acima de 360 dias",
    short: "360d+",
    color: "#1e293b",
    barColor: "bg-slate-800",
    badge: "bg-slate-100 text-slate-800",
    border: "border-slate-300",
  },
};

export const agingFaixaLabels = {
  a_vencer: "A vencer",
  ate_30: "Até 30 dias",
  "1_30": "Até 30 dias", // compatibilidade
  "31_60": "31 a 60 dias",
  "61_90": "61 a 90 dias",
  "91_180": "91 a 180 dias",
  "90_mais": "Mais de 90 dias", // compatibilidade
  "181_360": "181 a 360 dias",
  acima_360: "Acima de 360 dias",
};

export const agingFaixaColors = {
  a_vencer: "bg-emerald-100 text-emerald-800",
  ate_30: "bg-amber-100 text-amber-800",
  "1_30": "bg-amber-100 text-amber-800",
  "31_60": "bg-orange-100 text-orange-800",
  "61_90": "bg-red-100 text-red-800",
  "91_180": "bg-rose-100 text-rose-800",
  "90_mais": "bg-rose-200 text-rose-900",
  "181_360": "bg-purple-100 text-purple-800",
  acima_360: "bg-slate-100 text-slate-800",
};

export function getRecebivelFaixa(r) {
  if (r.status === "pago") return null;
  const dias = typeof r.dias === "number" ? r.dias : daysBetween(r.vencimento);
  if (dias <= 0) return "a_vencer";
  if (dias <= 30) return "ate_30";
  if (dias <= 60) return "31_60";
  if (dias <= 90) return "61_90";
  if (dias <= 180) return "91_180";
  if (dias <= 360) return "181_360";
  return "acima_360";
}

export function calcAgingFaixa(dias, status) {
  if (status === "pago") return null;
  if (dias <= 0) return "a_vencer";
  if (dias <= 30) return "ate_30";
  if (dias <= 60) return "31_60";
  if (dias <= 90) return "61_90";
  if (dias <= 180) return "91_180";
  if (dias <= 360) return "181_360";
  return "acima_360";
}

export function calcAgingCarteira(recebiveis = []) {
  const faixas = AGING_FAIXAS_KEYS;
  
  const stats = faixas.reduce((acc, f) => {
    acc[f] = { 
      faixa: f, 
      label: agingFaixaConfig[f].label,
      short: agingFaixaConfig[f].short,
      color: agingFaixaConfig[f].color,
      barColor: agingFaixaConfig[f].barColor,
      badge: agingFaixaConfig[f].badge,
      valor: 0, 
      quantidade: 0, 
      percentual: 0,
      clientesSet: new Set()
    };
    return acc;
  }, {});

  const emAberto = (recebiveis || []).filter(r => r.status !== "pago");
  
  let totalValorAberto = 0;

  emAberto.forEach(r => {
    const faixa = getRecebivelFaixa(r);
    if (faixa && stats[faixa]) {
      const saldo = typeof r.saldo === "number" 
        ? r.saldo 
        : (Number(r.valor) || 0) - (Number(r.valor_pago) || 0);
      stats[faixa].valor += saldo;
      stats[faixa].quantidade += 1;
      if (r.cliente_id) stats[faixa].clientesSet.add(r.cliente_id);
      totalValorAberto += saldo;
    }
  });

  return faixas.map(f => {
    const item = stats[f];
    item.percentual = totalValorAberto > 0 ? (item.valor / totalValorAberto) * 100 : 0;
    item.quantidadeClientes = item.clientesSet.size;
    return item;
  });
}

export function calcAgingCliente(recebiveis = [], clienteId) {
  const filtrados = (recebiveis || []).filter(
    r => String(r.cliente_id) === String(clienteId)
  );
  return calcAgingCarteira(filtrados);
}

