import { getSaldoRecebivel } from "./recebiveis.js";

export const AGING_FAIXAS_KEYS = [
  "current",
  "01_30",
  "31_60",
  "61_90",
  "91_180",
  "181_365",
  "366_720",
  "acima_720",
];

export const agingFaixaConfig = {
  current: {
    id: "current",
    label: "CURRENT",
    short: "CURRENT",
    color: "#10b981",
    barColor: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
  },
  "01_30": {
    id: "01_30",
    label: "01 A 30",
    short: "01 A 30",
    color: "#f59e0b",
    barColor: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
  },
  "31_60": {
    id: "31_60",
    label: "31 A 60",
    short: "31 A 60",
    color: "#f97316",
    barColor: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200",
  },
  "61_90": {
    id: "61_90",
    label: "61 A 90",
    short: "61 A 90",
    color: "#ef4444",
    barColor: "bg-red-500",
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
  },
  "91_180": {
    id: "91_180",
    label: "91 A 180",
    short: "91 A 180",
    color: "#f43f5e",
    barColor: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800",
    border: "border-rose-200",
  },
  "181_365": {
    id: "181_365",
    label: "181 A 365",
    short: "181 A 365",
    color: "#a855f7",
    barColor: "bg-purple-500",
    badge: "bg-purple-100 text-purple-800",
    border: "border-purple-200",
  },
  "366_720": {
    id: "366_720",
    label: "366 A 720",
    short: "366 A 720",
    color: "#475569",
    barColor: "bg-slate-600",
    badge: "bg-slate-100 text-slate-800",
    border: "border-slate-300",
  },
  acima_720: {
    id: "acima_720",
    label: "ACIMA DE 720",
    short: "ACIMA DE 720",
    color: "#1e293b",
    barColor: "bg-slate-800",
    badge: "bg-slate-200 text-slate-900",
    border: "border-slate-400",
  },
};

export const agingFaixaLabels = Object.fromEntries(
  AGING_FAIXAS_KEYS.map((faixa) => [faixa, agingFaixaConfig[faixa].label])
);

export const agingFaixaColors = Object.fromEntries(
  AGING_FAIXAS_KEYS.map((faixa) => [faixa, agingFaixaConfig[faixa].badge])
);

function getCalendarDay(dateValue) {
  if (!dateValue) return null;

  if (typeof dateValue === "string") {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getDate() !== Number(day)
      ) return null;
      return Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86400000;
    }
  }

  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}

export function getAgingDays(vencimento, dataReferencia = new Date()) {
  const diaVencimento = getCalendarDay(vencimento);
  const diaReferencia = getCalendarDay(dataReferencia);
  if (diaVencimento === null || diaReferencia === null) return 0;
  return diaReferencia - diaVencimento;
}

export function calcAgingFaixa(dias, status) {
  if (status === "pago") return null;
  if (dias <= 0) return "current";
  if (dias <= 30) return "01_30";
  if (dias <= 60) return "31_60";
  if (dias <= 90) return "61_90";
  if (dias <= 180) return "91_180";
  if (dias <= 365) return "181_365";
  if (dias <= 720) return "366_720";
  return "acima_720";
}

export function getAgingRecebivel(recebivel, dataReferencia = new Date()) {
  const dias = getAgingDays(recebivel?.vencimento, dataReferencia);
  return {
    dias,
    faixa: calcAgingFaixa(dias, recebivel?.status),
  };
}

export function getRecebivelFaixa(recebivel, dataReferencia = new Date()) {
  return getAgingRecebivel(recebivel, dataReferencia).faixa;
}

export function calcAgingCarteira(recebiveis = [], dataReferencia = new Date()) {
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
    const faixa = getRecebivelFaixa(r, dataReferencia);
    if (faixa && stats[faixa]) {
      const saldo = getSaldoRecebivel(r);
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

export function calcAgingCliente(recebiveis = [], clienteId, dataReferencia = new Date()) {
  const filtrados = (recebiveis || []).filter(
    r => String(r.cliente_id) === String(clienteId)
  );
  return calcAgingCarteira(filtrados, dataReferencia);
}

