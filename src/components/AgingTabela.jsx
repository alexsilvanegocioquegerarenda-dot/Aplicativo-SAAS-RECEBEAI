import React from "react";
import { formatCurrency } from "@/lib/format";
import { calcAgingCarteira, calcAgingCliente, agingFaixaLabels, agingFaixaColors } from "@/lib/aging";

export default function AgingTabela({ recebiveisEnriched, clienteId }) {
  const aging = clienteId
    ? calcAgingCliente(recebiveisEnriched, clienteId)
    : calcAgingCarteira(recebiveisEnriched);
  const maiorFaixa = [...aging].sort((a, b) => b.valor - a.valor)[0];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Faixa</th>
            <th className="px-4 py-2.5 text-right font-medium">Valor</th>
            <th className="px-4 py-2.5 text-right font-medium">%</th>
            <th className="px-4 py-2.5 text-right font-medium">Títulos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {aging.map(a => (
            <tr key={a.faixa} className={a.faixa === maiorFaixa?.faixa && a.valor > 0 ? "bg-amber-50/50" : ""}>
              <td className="px-4 py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${agingFaixaColors[a.faixa]}`}>
                  {agingFaixaLabels[a.faixa]}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(a.valor)}</td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{a.percentual.toFixed(1)}%</td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{a.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}