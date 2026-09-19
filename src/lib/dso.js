// Utilitários de cálculo de DSO (Days Sales Outstanding - Prazo Médio de Recebimento)

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

function isDateInRange(dateStr, startStr, endStr) {
  if (!dateStr) return false;
  const target = dateStr.slice(0, 10);
  return target >= startStr && target <= endStr;
}

export function getSaldoRecebivel(r) {
  if (r.status === "pago") return 0;
  return Math.max(0, (Number(r.valor) || 0) - (Number(r.valor_pago) || 0));
}

export function getDiasEntre(dataInicio, dataFim) {
  const d1 = parseDate(dataInicio);
  const d2 = parseDate(dataFim);
  if (!d1 || !d2) return 0;
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

export function getDiasPeriodo(inicioStr, fimStr) {
  const d1 = parseDate(inicioStr);
  const d2 = parseDate(fimStr);
  if (!d1 || !d2) return 30;
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

export function getDSOPeriodos() {
  const hoje = new Date();
  const formatYMD = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const fimHoje = formatYMD(hoje);

  const subDays = (dias) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - dias + 1);
    return formatYMD(d);
  };

  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const fimMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(ultimoDiaMes).padStart(2, "0")}`;

  return [
    { id: "30", label: "30 dias", inicio: subDays(30), fim: fimHoje },
    { id: "60", label: "60 dias", inicio: subDays(60), fim: fimHoje },
    { id: "90", label: "90 dias", inicio: subDays(90), fim: fimHoje },
    { id: "mes", label: "Mês atual", inicio: inicioMes, fim: fimMes },
  ];
}

export function calcularDSOPeriodo(recebiveis = [], periodo) {
  const diasPeriodo = getDiasPeriodo(periodo.inicio, periodo.fim);

  // Considera data_emissao ou vencimento como fallback para títulos emitidos no período
  const vendasCredito = recebiveis
    .filter((r) => isDateInRange(r.data_emissao || r.vencimento, periodo.inicio, periodo.fim))
    .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

  const ar = recebiveis
    .filter((r) => r.status !== "pago")
    .reduce((acc, r) => acc + getSaldoRecebivel(r), 0);

  const dso = vendasCredito > 0 ? (ar / vendasCredito) * diasPeriodo : (ar > 0 ? diasPeriodo : 0);

  const pagosNoPeriodo = recebiveis.filter(
    (r) => r.status === "pago" && r.data_pagamento && isDateInRange(r.data_pagamento, periodo.inicio, periodo.fim)
  );

  const diasParaPagar = pagosNoPeriodo.length
    ? pagosNoPeriodo.reduce(
        (acc, r) => acc + getDiasEntre(r.data_emissao || r.vencimento, r.data_pagamento),
        0
      ) / pagosNoPeriodo.length
    : 0;

  return {
    dso,
    ar,
    vendasCredito,
    dias: diasPeriodo,
    diasParaPagar,
    pagosCount: pagosNoPeriodo.length,
  };
}

export function calcularDSOClientes(recebiveis = [], periodo, clientes = []) {
  const diasPeriodo = getDiasPeriodo(periodo.inicio, periodo.fim);
  const mapaClientes = {};
  (clientes || []).forEach((c) => {
    mapaClientes[c.id] = c.nome;
  });

  const clienteStats = {};

  recebiveis.forEach((r) => {
    if (!r.cliente_id) return;
    if (!clienteStats[r.cliente_id]) {
      clienteStats[r.cliente_id] = {
        cliente_id: r.cliente_id,
        nome: r.cliente_nome || mapaClientes[r.cliente_id] || "—",
        vendasCredito: 0,
        ar: 0,
        abertos: 0,
        pagos: [],
      };
    }

    const item = clienteStats[r.cliente_id];

    if (isDateInRange(r.data_emissao || r.vencimento, periodo.inicio, periodo.fim)) {
      item.vendasCredito += Number(r.valor) || 0;
    }

    if (r.status !== "pago") {
      item.ar += getSaldoRecebivel(r);
      item.abertos += 1;
    }

    if (r.status === "pago" && r.data_pagamento && isDateInRange(r.data_pagamento, periodo.inicio, periodo.fim)) {
      item.pagos.push(r);
    }
  });

  return Object.values(clienteStats)
    .map((item) => {
      const dso = item.vendasCredito > 0 ? (item.ar / item.vendasCredito) * diasPeriodo : (item.ar > 0 ? diasPeriodo : 0);
      const diasParaPagar = item.pagos.length
        ? item.pagos.reduce(
            (acc, p) => acc + getDiasEntre(p.data_emissao || p.vencimento, p.data_pagamento),
            0
          ) / item.pagos.length
        : 0;

      return {
        cliente_id: item.cliente_id,
        cliente_nome: item.nome,
        dso,
        ar: item.ar,
        vendasCredito: item.vendasCredito,
        abertos: item.abertos,
        diasParaPagar,
        pagosCount: item.pagos.length,
      };
    })
    .sort((a, b) => b.dso - a.dso);
}
