import { daysBetween } from "./format";

export const agingFaixaLabels = {
  a_vencer: "A vencer",
  "1_30": "1 a 30 dias",
  "31_60": "31 a 60 dias",
  "61_90": "61 a 90 dias",
  "90_mais": "Mais de 90 dias",
};

export const agingFaixaColors = {
  a_vencer: "bg-emerald-100 text-emerald-800",
  "1_30": "bg-amber-100 text-amber-800",
  "31_60": "bg-orange-100 text-orange-800",
  "61_90": "bg-red-100 text-red-800",
  "90_mais": "bg-rose-200 text-rose-900",
};

export function getRecebivelFaixa(r) {
  if (r.status === "pago") return null;
  const dias = typeof r.dias === "number" ? r.dias : daysBetween(r.vencimento);
  if (dias <= 0) return "a_vencer";
  if (dias <= 30) return "1_30";
  if (dias <= 60) return "31_60";
  if (dias <= 90) return "61_90";
  return "90_mais";
}

export function calcAgingCarteira(recebiveis = []) {
  const faixas = ["a_vencer", "1_30", "31_60", "61_90", "90_mais"];
  
  const stats = faixas.reduce((acc, f) => {
    acc[f] = { faixa: f, valor: 0, quantidade: 0, percentual: 0 };
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
      totalValorAberto += saldo;
    }
  });

  return faixas.map(f => {
    const item = stats[f];
    item.percentual = totalValorAberto > 0 ? (item.valor / totalValorAberto) * 100 : 0;
    return item;
  });
}

export function calcAgingCliente(recebiveis = [], clienteId) {
  const filtrados = (recebiveis || []).filter(
    r => String(r.cliente_id) === String(clienteId)
  );
  return calcAgingCarteira(filtrados);
}
