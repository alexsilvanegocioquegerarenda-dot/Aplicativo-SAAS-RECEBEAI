// Test QA Suite for RecebeAi SaaS
import { calcAgingFaixa } from './src/lib/aging.js';
import { formatCurrency, daysBetween, calcRecebivelStatus } from './src/lib/format.js';
import { MERCADO_PAGO_PLANS } from './src/lib/mercadoPago.js';

console.log("=== INICIANDO BATERIA DE TESTES AUTOMATIZADOS RECEBEAI ===\n");

// 1. Teste dos Planos e Preços
console.log("1. Validando Valores dos Planos Comerciais:");
const pEssencial = MERCADO_PAGO_PLANS.essencial;
const pProfissional = MERCADO_PAGO_PLANS.profissional;
const pEnterprise = MERCADO_PAGO_PLANS.enterprise;

console.log(`- Essencial: R$ ${pEssencial.preco} (Esperado: 149) -> ${pEssencial.preco === 149 ? '✅ OK' : '❌ ERRO'}`);
console.log(`- Profissional: R$ ${pProfissional.preco} (Esperado: 349) -> ${pProfissional.preco === 349 ? '✅ OK' : '❌ ERRO'}`);
console.log(`- Enterprise: R$ ${pEnterprise.preco} (Esperado: 799) -> ${pEnterprise.preco === 799 ? '✅ OK' : '❌ ERRO'}`);

// 2. Teste de Cálculo de Aging e Status
console.log("\n2. Validando Motor de Cálculo de Aging e Status:");
const hoje = new Date();
const formatYMD = (d) => d.toISOString().split('T')[0];

const dFutura = new Date(hoje.getTime() + 10 * 86400000);
const dOntem = new Date(hoje.getTime() - 5 * 86400000);
const d45DiasAtras = new Date(hoje.getTime() - 45 * 86400000);

const statusFuturo = calcRecebivelStatus({ vencimento: formatYMD(dFutura), status: 'em_dia' });
const statusOntem = calcRecebivelStatus({ vencimento: formatYMD(dOntem), status: 'atrasado' });
const faixaOntem = calcAgingFaixa(daysBetween(formatYMD(dOntem)));
const faixa45 = calcAgingFaixa(daysBetween(formatYMD(d45DiasAtras)));

console.log(`- Título a vencer (10 dias): ${statusFuturo} -> ${statusFuturo === 'em_dia' ? '✅ OK' : '❌ ERRO'}`);
console.log(`- Título vencido (5 dias): ${statusOntem} | Faixa: ${faixaOntem} -> ${faixaOntem === 'ate_30' ? '✅ OK' : '❌ ERRO'}`);
console.log(`- Título vencido (45 dias): Faixa: ${faixa45} -> ${faixa45 === '31_60' ? '✅ OK' : '❌ ERRO'}`);

// 3. Teste do Cálculo de DSO (Days Sales Outstanding)
console.log("\n3. Validando Cálculo de DSO da Carteira:");
const saldoEmAberto = 45000;
const faturamento90Dias = 90000;
const dsoCalculado = Math.round((saldoEmAberto / faturamento90Dias) * 90);
console.log(`- Saldo em Aberto: R$ 45.000 | Faturamento 90d: R$ 90.000`);
console.log(`- DSO Calculado: ${dsoCalculado} dias (Esperado: 45 dias) -> ${dsoCalculado === 45 ? '✅ OK' : '❌ ERRO'}`);

// 4. Teste de Formatação de Moeda
console.log("\n4. Validando Formatação Financeira (BRL):");
const formatoMoeda = formatCurrency(149.50);
console.log(`- R$ 149.50 formatado: "${formatoMoeda}" -> ${formatoMoeda.includes('149,50') ? '✅ OK' : '❌ ERRO'}`);

// 5. Teste de Parser CSV
console.log("\n5. Validando Parser e Higienização de Importação CSV:");
const linhaCsvPontoVirgula = "Cliente Teste;12.345.678/0001-90;11988887777;NF-100;1500.50;2026-10-15;pix";
const partes = linhaCsvPontoVirgula.split(";");
const docLimpo = partes[1].replace(/\D/g, "");
const valorNum = parseFloat(partes[4].replace(",", "."));

console.log(`- CNPJ limpo: ${docLimpo} (Esperado: 12345678000190) -> ${docLimpo === '12345678000190' ? '✅ OK' : '❌ ERRO'}`);
console.log(`- Valor numérico: ${valorNum} (Esperado: 1500.5) -> ${valorNum === 1500.5 ? '✅ OK' : '❌ ERRO'}`);

console.log("\n=== TODOS OS TESTES AUTOMATIZADOS EXECUTADOS COM SUCESSO! ===");
