export function getSaldoRecebivel(recebivel = {}) {
  return Math.max(
    (Number(recebivel.valor) || 0) - (Number(recebivel.valor_pago) || 0),
    0
  );
}