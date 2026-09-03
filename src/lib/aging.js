export const agingFaixaLabels = {
  a_vencer: "A Vencer",
  vencido_1_30: "1 a 30 dias",
  vencido_31_60: "31 a 60 dias",
  vencido_61_90: "61 a 90 dias",
  vencido_91_plus: "Acima de 90 dias",
};

export const agingFaixaColors = {
  a_vencer: "bg-emerald-100 text-emerald-800",
  vencido_1_30: "bg-amber-100 text-amber-800",
  vencido_31_60: "bg-orange-100 text-orange-800",
  vencido_61_90: "bg-red-100 text-red-800",
  vencido_91_plus: "bg-rose-200 text-rose-900",
};

export function calcAgingCarteira(recebiveis = []) {
  const faixas = {
    a_vencer: { faixa: "a_vencer", valor: 0, quantidade: 0, percentual: 0 },
    vencido_1_30: { faixa: "vencido_1_30", valor: 0, quantidade: 0, percentual: 0 },
    vencido_31_60: { faixa: "vencido_31_60", valor: 0, quantidade: 0, percentual: 0 },
    vencido_61_90: { faixa: "vencido_61_90", valor: 0, quantidade: 0, percentual: 0 },
    vencido_91_plus: { faixa: "vencido_91_plus", valor: 0, quantidade: 0, percentual: 0 },
  };

  let valorTotal = 0;

  recebiveis.forEach((item) => {
    const valor = Number(item.valor || 0);
    valorTotal += valor;

    const faixaKey = item.faixa_aging || "a_vencer";
    if (faixas[faixaKey]) {
      faixas[faixaKey].valor += valor;
      faixas[faixaKey].quantidade += 1;
    }
  });

  return Object.values(faixas).map((f) => ({
    ...f,
    percentual: valorTotal > 0 ? (f.valor / valorTotal) * 100 : 0,
  }));
}

export function calcAgingCliente(recebiveis = [], clienteId) {
  const filtrados = recebiveis.filter((r) => r.cliente_id === clienteId || r.clienteId === clienteId);
  return calcAgingCarteira(filtrados);
}
