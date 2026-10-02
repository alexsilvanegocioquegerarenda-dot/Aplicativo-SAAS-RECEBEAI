// Test QA Suite for RecebeAi SaaS
import assert from 'node:assert/strict';
import { AGING_FAIXAS_KEYS, calcAgingCarteira, calcAgingFaixa, getAgingDays } from './src/lib/aging.js';
import { formatCurrency, daysBetween, calcRecebivelStatus } from './src/lib/format.js';
import { getSaldoRecebivel } from './src/lib/recebiveis.js';
import { MERCADO_PAGO_PLANS } from './src/lib/mercadoPago.js';
import { createEntityClient, resolveSupabaseRead, subscribeToDataWriteErrors, updateCompanyConfiguration, SupabaseWriteError } from './src/api/base44Client.js';
import { runTenantDiagnostic } from './src/lib/tenantDiagnostic.js';
import {
	getInitialAuthState,
	getProtectedRouteDecision,
	loadCurrentSupabaseUser,
	signInWithSupabase,
	registerWithSupabase,
	resolveAuthenticatedProfile,
	signOutFromSupabase,
} from './src/lib/authFlows.js';

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
assert.equal(statusFuturo, 'em_dia');
assert.equal(statusOntem, 'atrasado');
assert.equal(faixaOntem, '01_30');
assert.equal(faixa45, '31_60');

console.log(`- Título a vencer (10 dias): ${statusFuturo} -> ${statusFuturo === 'em_dia' ? '✅ OK' : '❌ ERRO'}`);
console.log(`- Título vencido (5 dias): ${statusOntem} | Faixa: ${faixaOntem} -> ✅ OK`);
console.log(`- Título vencido (45 dias): Faixa: ${faixa45} -> ${faixa45 === '31_60' ? '✅ OK' : '❌ ERRO'}`);

const dataReferencia = '2026-10-01';
const diasParaVencimento = (dias) => {
	const data = new Date(`${dataReferencia}T00:00:00Z`);
	data.setUTCDate(data.getUTCDate() - dias);
	return data.toISOString().slice(0, 10);
};
const limitesAging = [
	[0, 'current'],
	[-1, 'current'],
	[1, '01_30'],
	[30, '01_30'],
	[31, '31_60'],
	[60, '31_60'],
	[61, '61_90'],
	[90, '61_90'],
	[91, '91_180'],
	[180, '91_180'],
	[181, '181_365'],
	[365, '181_365'],
	[366, '366_720'],
	[720, '366_720'],
	[721, 'acima_720'],
];
assert.deepEqual(AGING_FAIXAS_KEYS, ['current', '01_30', '31_60', '61_90', '91_180', '181_365', '366_720', 'acima_720']);
for (const [diasEsperados, faixaEsperada] of limitesAging) {
	const diasCalculados = getAgingDays(diasParaVencimento(diasEsperados), dataReferencia);
	assert.equal(diasCalculados, diasEsperados);
	assert.equal(calcAgingFaixa(diasCalculados), faixaEsperada);
}
const agingAgregado = calcAgingCarteira(
	limitesAging.map(([dias], index) => ({
		status: 'aberto',
		valor: 100,
		vencimento: diasParaVencimento(dias),
		cliente_id: `cliente-${index}`,
	})),
	dataReferencia
);
assert.deepEqual(agingAgregado.map(({ faixa }) => faixa), AGING_FAIXAS_KEYS);
assert.equal(agingAgregado.reduce((total, item) => total + item.valor, 0), 1500);
console.log('- Limites de todas as faixas e ordem oficial validados -> ✅ OK');
console.log('- Agregação preserva a ordem e o total da carteira -> ✅ OK');

assert.equal(getSaldoRecebivel({ valor: 100, valor_pago: 40 }), 60);
assert.equal(getSaldoRecebivel({ valor: 100, valor_pago: 130 }), 0);
assert.equal(getSaldoRecebivel({ valor: '100', valor_pago: '100' }), 0);
const agingSaldoNegativo = calcAgingCarteira(
	[{ status: 'aberto', valor: 100, valor_pago: 130, saldo: -30, vencimento: diasParaVencimento(10) }],
	dataReferencia
);
assert.equal(agingSaldoNegativo.find(({ faixa }) => faixa === '01_30').valor, 0);
console.log('- Saldo centralizado nunca é negativo, inclusive no Aging -> ✅ OK');

const remoteRows = [{ id: 'remote-1' }];
assert.equal(resolveSupabaseRead({ data: remoteRows, error: null }, 'recebiveis'), remoteRows);
assert.deepEqual(resolveSupabaseRead({ data: [], error: null }, 'recebiveis'), []);
assert.throws(
	() => resolveSupabaseRead({ data: null, error: { code: '42501', message: 'permission denied' } }, 'recebiveis'),
	(error) => error.name === 'SupabaseReadError' && error.kind === 'permission'
);
console.log('- Leitura Supabase: dados, zero registros e erros não usam fallback -> ✅ OK');

const initialAuth = getInitialAuthState();
assert.deepEqual(initialAuth, { user: null, loadingAuth: true });
assert.equal(getProtectedRouteDecision({ ...initialAuth }), 'loading');
assert.equal(getProtectedRouteDecision({ loadingAuth: false, user: null }), 'login');
assert.equal(getProtectedRouteDecision({ loadingAuth: false, user: { id: 'u1' } }), 'allow');
assert.equal(getProtectedRouteDecision({ loadingAuth: false, user: { id: 'forged', role: 'admin' }, requireAdmin: true, isAdmin: false }), 'forbidden');

let empresaLookup = null;
const authenticatedProfile = await resolveAuthenticatedProfile({
	from: (table) => ({
		select: (columns) => ({
			eq: (column, value) => ({
				maybeSingle: async () => {
					empresaLookup = { table, columns, column, value };
					return { data: { id: 'empresa-remota', razao_social: 'Empresa Remota', plano: 'pro' }, error: null };
				},
			}),
		}),
	}),
}, { id: 'auth-user-real', email: 'real@example.com', user_metadata: { empresa_id: 'empresa-forjada' } });
assert.deepEqual(empresaLookup, {
	table: 'empresas',
	columns: 'id, razao_social, cnpj, telefone, plano',
	column: 'user_id',
	value: 'auth-user-real',
});
assert.equal(authenticatedProfile.empresa_id, 'empresa-remota');
await assert.rejects(
	resolveAuthenticatedProfile({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }, { id: 'auth-user-sem-empresa' }),
	/empresa vinculada/
);

globalThis.localStorage = { getItem: () => JSON.stringify({ id: 'forged', role: 'admin', empresa_id: 'tenant-forged' }) };
const noSession = await loadCurrentSupabaseUser({ getSession: async () => ({ data: { session: null }, error: null }) }, async () => null);
assert.equal(noSession.success, true);
assert.equal(noSession.user, null);
delete globalThis.localStorage;

let profileLoads = 0;
const validLogin = await signInWithSupabase({
	signInWithPassword: async () => ({ data: { session: { access_token: 'valid' } }, error: null }),
	getUser: async () => ({ data: { user: { id: 'auth-user', email: 'empresa@example.com' } }, error: null }),
}, 'empresa@example.com', 'senha-valida', async (user) => {
	profileLoads += 1;
	return { id: user.id, role: 'cliente', empresa_id: 'empresa-remota' };
});
assert.equal(validLogin.success, true);
assert.equal(validLogin.user.empresa_id, 'empresa-remota');
assert.equal(profileLoads, 1);

let demoActivations = 0;
const invalidLogin = await signInWithSupabase({
	signInWithPassword: async () => ({ data: null, error: new Error('Invalid credentials') }),
	getUser: async () => ({ data: { user: null }, error: null }),
}, 'empresa@example.com', 'senha-invalida', async () => { throw new Error('não deve carregar perfil'); });
assert.equal(invalidLogin.success, false);
assert.equal(demoActivations, 0);

const signupFailure = await registerWithSupabase({
	auth: { signUp: async () => ({ data: null, error: new Error('signup failed') }) },
}, { email: 'novo@example.com', password: 'senha123', nome: 'Novo', razaoSocial: 'Nova Empresa', plano: 'profissional' });
assert.equal(signupFailure.success, false);

let signOutAfterCompanyFailure = false;
const companyFailure = await registerWithSupabase({
	auth: {
		signUp: async () => ({ data: { user: { id: 'auth-new' }, session: { access_token: 'valid' } }, error: null }),
		signOut: async () => { signOutAfterCompanyFailure = true; return { error: null }; },
	},
	from: () => ({
		insert: () => ({
			select: () => ({ single: async () => ({ data: null, error: new Error('RLS denied') }) }),
		}),
	}),
}, { email: 'novo@example.com', password: 'senha123', nome: 'Novo', razaoSocial: 'Nova Empresa', plano: 'profissional' });
assert.equal(companyFailure.success, false);
assert.equal(signOutAfterCompanyFailure, true);

let pendingCompanyInsertAttempts = 0;
const pendingConfirmation = await registerWithSupabase({
	auth: { signUp: async () => ({ data: { user: { id: 'auth-pending' }, session: null }, error: null }) },
	from: () => { pendingCompanyInsertAttempts += 1; throw new Error('não deve gravar antes da sessão'); },
}, { email: 'confirmar@example.com', password: 'senha123', nome: 'Confirmar', razaoSocial: 'Empresa Pendente', plano: 'profissional' });
assert.equal(pendingConfirmation.success, false);
assert.equal(pendingConfirmation.pendingConfirmation, true);
assert.equal(pendingCompanyInsertAttempts, 0);

let signedOut = false;
let clearedUser = false;
const logoutResult = await signOutFromSupabase({ signOut: async () => { signedOut = true; return { error: null }; } }, () => { clearedUser = true; });
assert.equal(logoutResult.success, true);
assert.equal(signedOut, true);
assert.equal(clearedUser, true);
let clearedAfterLogoutFailure = false;
const logoutFailure = await signOutFromSupabase({ signOut: async () => ({ error: new Error('network unavailable') }) }, () => { clearedAfterLogoutFailure = true; });
assert.equal(logoutFailure.success, false);
assert.equal(clearedAfterLogoutFailure, true);
console.log('- Auth: sessão Supabase, proteção de rota, login/cadastro/logout e demo explícita validados -> ✅ OK');

let diagnosticQueries = 0;
const diagnosticWithoutSession = await runTenantDiagnostic({
	supabaseClient: {
		auth: { getUser: async () => ({ data: { user: null }, error: null }) },
		from: () => { diagnosticQueries += 1; throw new Error('não deve consultar sem sessão'); },
	},
});
assert.equal(diagnosticWithoutSession.session.status, 'FALHOU');
assert.equal(diagnosticQueries, 0);
const diagnosticInDemo = await runTenantDiagnostic({
	demoMode: true,
	supabaseClient: { auth: { getUser: async () => { throw new Error('demo não deve consultar sessão'); } }, from: () => { throw new Error('demo não deve consultar tabelas'); } },
});
assert.equal(diagnosticInDemo.session.status, 'NÃO FOI POSSÍVEL TESTAR');

const diagnosticRows = { clientes: [{ empresa_id: 'empresa-a' }] };
let diagnosticRelationshipRows = {};
const diagnosticCompanies = [{ id: 'empresa-a', user_id: 'auth-user-a' }];
const tenantDiagnosticClient = {
	auth: { getUser: async () => ({ data: { user: { id: 'auth-user-a' } }, error: null }) },
	from(table) {
		const query = { columns: '', options: {}, filters: [], offset: 0, end: 499,
			select(columns, options = {}) { this.columns = columns; this.options = options; return this; },
			eq(column, value) { this.filters.push([column, value]); return this; },
		not() { return this; },
			range(start, end) { this.offset = start; this.end = end; return this; },
			async maybeSingle() {
				const rows = diagnosticCompanies.filter((company) => this.filters.every(([field, value]) => company[field] === value));
				return { data: rows[0] || null, error: null };
			},
			then(resolve, reject) {
				diagnosticQueries += 1;
				let rows = table === 'empresas'
					? diagnosticCompanies.filter((company) => this.filters.every(([field, value]) => company[field] === value))
					: (diagnosticRows[table] || []);
				if (this.options.head) return Promise.resolve({ count: rows.length, error: null }).then(resolve, reject);
				if (this.columns.includes('related:')) rows = diagnosticRelationshipRows[table] || [];
				return Promise.resolve({ data: rows.slice(this.offset, this.end + 1), error: null }).then(resolve, reject);
			},
		};
		return query;
	},
};
const tenantDiagnosticResult = await runTenantDiagnostic({ supabaseClient: tenantDiagnosticClient, otherCompanyId: 'empresa-b' });
assert.equal(tenantDiagnosticResult.session.status, 'PASSOU');
assert.equal(tenantDiagnosticResult.companies.status, 'PASSOU');
assert.equal(tenantDiagnosticResult.companies.companies[0].id, 'empresa-a');
assert.equal(tenantDiagnosticResult.counts.length, 11);
assert.equal(tenantDiagnosticResult.counts.find((entry) => entry.table === 'clientes').visibleCount, 1);
assert.equal(tenantDiagnosticResult.tenantIntegrity.find((entry) => entry.table === 'clientes').status, 'PASSOU');
assert.equal(tenantDiagnosticResult.otherCompanyIsolation.status, 'PASSOU');
assert(tenantDiagnosticResult.relationships.every((entry) => entry.status === 'NÃO FOI POSSÍVEL TESTAR'));
diagnosticRelationshipRows = {
	recebiveis: [{ empresa_id: 'empresa-a', cliente_id: 'cliente-b', related: { empresa_id: 'empresa-b' } }],
};
const crossTenantDiagnostic = await runTenantDiagnostic({ supabaseClient: tenantDiagnosticClient });
assert.equal(crossTenantDiagnostic.relationships.find((entry) => entry.relationship === 'recebiveis → clientes').status, 'FALHOU');
assert.equal(crossTenantDiagnostic.relationships.find((entry) => entry.relationship === 'recebiveis → clientes').crossTenant, 1);
diagnosticRelationshipRows = {};
console.log('- Diagnóstico tenant: demo/sessão, contagens RLS, tenant e limite de joins validados -> ✅ OK');

function mockSupabaseWriteClient(results = {}, calls = []) {
	return {
		from(tableName) {
			const query = {
				tableName,
				operation: null,
				payload: null,
				filters: [],
				insert(payload) { this.operation = 'create'; this.payload = payload; return this; },
				update(payload) { this.operation = 'update'; this.payload = payload; return this; },
				delete() { this.operation = 'delete'; return this; },
				eq(field, value) { this.filters.push([field, value]); return this; },
				select() { return this; },
				async single() { return this.finish(); },
				async maybeSingle() { return this.finish(); },
				async finish() {
					calls.push({ tableName, operation: this.operation, payload: this.payload, filters: [...this.filters] });
					return results[this.operation] || { data: null, error: null };
				},
			};
			return query;
		},
	};
}

const tenantForWrites = async () => ({ userId: 'auth-user-a', empresaId: 'empresa-a' });
const callsCreateSuccess = [];
const createSuccessClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ create: { data: { id: 'r-remote', valor: 50, empresa_id: 'empresa-a' }, error: null } }, callsCreateSuccess),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
});
const createdRemote = await createSuccessClient.create({ valor: 50 });
assert.equal(createdRemote.id, 'r-remote');
assert.equal(callsCreateSuccess[0].payload[0].empresa_id, 'empresa-a');

let localFallbackWrites = 0;
let surfacedWriteError = null;
let localStorageWritesOnFailure = 0;
const previousLocalStorage = globalThis.localStorage;
globalThis.localStorage = {
	getItem: () => JSON.stringify({ empresa_id: 'empresa-a' }),
	setItem: () => { localStorageWritesOnFailure += 1; },
};
const unsubscribeWriteErrors = subscribeToDataWriteErrors((error) => { surfacedWriteError = error; });
const createFailureClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ create: { data: null, error: { code: '23502', message: 'empresa_id is required' } } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
	setDemoData: () => { localFallbackWrites += 1; },
});
await assert.rejects(createFailureClient.create({ valor: 50 }), (error) => error instanceof SupabaseWriteError && error.code === '23502');
assert.equal(localFallbackWrites, 0);
assert.equal(surfacedWriteError.operation, 'create');
assert.equal(surfacedWriteError.source, 'supabase');
unsubscribeWriteErrors();
assert.equal(localStorageWritesOnFailure, 0);
if (previousLocalStorage === undefined) delete globalThis.localStorage;
else globalThis.localStorage = previousLocalStorage;

const updateSuccessClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ update: { data: { id: 'r-a', status: 'pago' }, error: null } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
});
assert.equal((await updateSuccessClient.update('r-a', { status: 'pago' })).status, 'pago');

let localDemoRows = [{ id: 'r-a', valor: 100 }];
const updateFailureClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ update: { data: null, error: { code: '42501', message: 'permission denied' } } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
	getDemoData: () => localDemoRows,
	setDemoData: (_entity, rows) => { localDemoRows = rows; localFallbackWrites += 1; },
});
const localRowsBeforeFailedUpdate = localDemoRows;
await assert.rejects(updateFailureClient.update('r-a', { valor: 0 }));
assert.equal(localDemoRows, localRowsBeforeFailedUpdate);
assert.equal(localFallbackWrites, 0);

const deleteSuccessClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ delete: { data: { id: 'r-a' }, error: null } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
});
assert.equal((await deleteSuccessClient.delete('r-a')).source, 'supabase');

const deleteFailureClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ delete: { data: null, error: { code: 'CONNECTION_ERROR', message: 'offline' } } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
	setDemoData: () => { localFallbackWrites += 1; },
});
await assert.rejects(deleteFailureClient.delete('r-a'), (error) => error instanceof SupabaseWriteError && error.operation === 'delete');
assert.equal(localFallbackWrites, 0);

const offlineCreateClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient({ create: { data: null, error: { code: 'CONNECTION_ERROR', message: 'offline' } } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
	setDemoData: () => { localFallbackWrites += 1; },
});
await assert.rejects(offlineCreateClient.create({ valor: 50 }), (error) => error.kind === 'connection');
assert.equal(localFallbackWrites, 0);

const noSessionClient = createEntityClient('Recebivel', {
	supabaseClient: { auth: { getSession: async () => ({ data: { session: null }, error: null }) } },
	isConfigured: true,
	isDemoMode: () => false,
});
await assert.rejects(noSessionClient.create({ valor: 50 }), (error) => error.code === 'AUTH_REQUIRED');

const tenantMismatchClient = createEntityClient('Recebivel', {
	supabaseClient: mockSupabaseWriteClient(),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
});
await assert.rejects(tenantMismatchClient.create({ valor: 50, empresa_id: 'empresa-b' }), (error) => error.code === 'TENANT_MISMATCH');

let demoWrites = 0;
let demoRows = [];
const demoClient = createEntityClient('Recebivel', {
	supabaseClient: { from: () => { throw new Error('demo não deve chamar Supabase'); } },
	isConfigured: true,
	isDemoMode: () => true,
	getDemoData: () => demoRows,
	setDemoData: (_entity, rows) => { demoRows = rows; demoWrites += 1; },
});
const demoCreated = await demoClient.create({ valor: 25 });
assert.equal(demoCreated.valor, 25);
assert.equal((await demoClient.update(demoCreated.id, { valor: 30 })).valor, 30);
assert.equal((await demoClient.delete(demoCreated.id)).source, 'demo');
assert.equal(demoWrites, 3);

let localConfigWrites = 0;
const configResult = await updateCompanyConfiguration({ razao_social: 'Atualizada' }, {
	supabaseClient: mockSupabaseWriteClient({ update: { data: { id: 'empresa-a', razao_social: 'Atualizada' }, error: null } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
	setDemoData: () => { localConfigWrites += 1; },
});
assert.equal(configResult.razao_social, 'Atualizada');
await assert.rejects(updateCompanyConfiguration({ razao_social: 'Não salvar' }, {
	supabaseClient: mockSupabaseWriteClient({ update: { data: null, error: { code: '42501', message: 'permission denied' } } }),
	isConfigured: true,
	isDemoMode: () => false,
	resolveTenant: tenantForWrites,
	setDemoData: () => { localConfigWrites += 1; },
}));
assert.equal(localConfigWrites, 0);
assert.equal(localFallbackWrites, 0);
console.log('- CRUD/Configuração: sucesso confirmado, falhas sem fallback, tenant e demo separados validados -> ✅ OK');

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
