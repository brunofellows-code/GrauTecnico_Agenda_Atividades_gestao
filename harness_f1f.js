/* HARNESS F1-F — helpers puros do kpi.js (reuniões-cockpit).
   Esperados calculados À MÃO no ARCH da sessão F1-F. Roda em Node:
   stubs mínimos de window + recorrencia.js real.                  */
'use strict';
global.window = {};
require('./recorrencia.js');
require('./kpi.js');
var K = global.window.KPI;
var ok = 0, fail = 0;
function t(nome, got, exp) {
  var g = JSON.stringify(got), e = JSON.stringify(exp);
  if (g === e) { ok++; console.log('PASS', nome); }
  else { fail++; console.log('FAIL', nome, '\n  got', g, '\n  exp', e); }
}

/* ---------- statusReuniao (B7) ---------- */
t('reuniao sem hora e sem encerrar = agendada', K.statusReuniao({}).chave, 'agendada');
t('reuniao com horaInicioReal = andamento', K.statusReuniao({ horaInicioReal: '09:00' }).chave, 'andamento');
t('reuniao encerrada = encerrada', K.statusReuniao({ encerradaEm: 123 }).chave, 'encerrada');
t('encerrada GANHA de andamento', K.statusReuniao({ horaInicioReal: '09:00', encerradaEm: 5 }).chave, 'encerrada');

/* ---------- rollforward2 (B5) ---------- */
/* statusDe injetado: lookup por texto (à mão). */
var STATUS_DE = {
  d1: { chave: 'aberta' }, d2: { chave: 'vencida' }, d3: { chave: 'resolvida' },
  d4: { chave: 'aberta' }, d5: { chave: 'aberta' }, d6: { chave: 'aberta' },
  d7: { chave: 'aberta' }, d8: { chave: 'no_prazo' }
};
function stDe(d) { return STATUS_DE[d.texto]; }
var REUNS = [
  { id: 'a', tipo: 'lideres', data: '2026-07-01', projetoId: null,
    decisoes: [{ texto: 'd1' }, { texto: 'd2' }, { texto: 'd3' }, { texto: 'd8' }] },
  { id: 'b', tipo: 'departamento', setorSigla: 'PED', data: '2026-07-02', projetoId: null, decisoes: [{ texto: 'd4' }] },
  { id: 'c', tipo: 'departamento', setorSigla: 'SEC', data: '2026-07-03', projetoId: null, decisoes: [{ texto: 'd5' }] },
  { id: 'd', tipo: 'lideres', data: '2026-07-20', projetoId: null, decisoes: [{ texto: 'd6' }] },
  { id: 'e', tipo: 'lideres', data: '2026-07-05', projetoId: 'p1', decisoes: [{ texto: 'd7' }] }
];
/* alvo líderes 10/07 sem projeto: entra só A (d1 aberta + d2 vencida);
   d3 resolvida e d8 no_prazo NÃO; D é posterior; E é de outro projeto. */
var r1 = K.rollforward2(REUNS, { id: 'x', tipo: 'lideres', data: '2026-07-10', projetoId: null }, stDe);
t('rollforward líderes: 2 itens (aberta + vencida; resolvida/no_prazo ficam de fora)',
  r1.map(function (i) { return i.dec.texto; }), ['d1', 'd2']);
t('rollforward carrega o status derivado (d2 = vencida)', r1[1].st.chave, 'vencida');
t('rollforward carrega a reunião de origem (data)', r1[0].reuniao.data, '2026-07-01');
/* alvo departamento PED: só B (C é de SEC). */
var r2 = K.rollforward2(REUNS, { id: 'y', tipo: 'departamento', setorSigla: 'PED', data: '2026-07-10', projetoId: null }, stDe);
t('rollforward departamento respeita o setor (PED pega d4, SEC fica fora)',
  r2.map(function (i) { return i.dec.texto; }), ['d4']);
/* alvo anterior a tudo: nada rola. */
t('reunião mais antiga que todas não recebe rollforward',
  K.rollforward2(REUNS, { id: 'z', tipo: 'departamento', setorSigla: 'SEC', data: '2026-07-01', projetoId: null }, stDe).length, 0);
/* alvo do projeto p1: só E (A é sem projeto). */
var r4 = K.rollforward2(REUNS, { id: 'w', tipo: 'lideres', data: '2026-07-10', projetoId: 'p1' }, stDe);
t('rollforward respeita o projeto (p1 pega d7; sem-projeto fica fora)',
  r4.map(function (i) { return i.dec.texto; }), ['d7']);
/* mesma data (empate) = NÃO é anterior. */
t('reunião do MESMO dia não rola (anterior = data estritamente menor)',
  K.rollforward2(REUNS, { id: 'q', tipo: 'lideres', data: '2026-07-01', projetoId: null }, stDe).length, 0);

/* ---------- vencidasUnicasAntigas (B2 · emenda 1) ---------- */
var J_INI = '2026-06-01', HOJE = '2026-07-16';
/* titulo+setorSigla obrigatórios: sem eles o validar() do recorrencia.js
   devolve expansão vazia (achado do harness — fixture tem que ser real). */
var ATIV = [
  { id: 'u1', titulo: 'U1', setorSigla: 'PED', recorrencia: 'unico', data: '2025-06-10', ativo: true, responsavelNome: 'Ana', responsavelUid: 'a1' },
  { id: 'u2', titulo: 'U2', setorSigla: 'PED', recorrencia: 'unico', data: '2025-06-10', ativo: true },
  { id: 'u3', titulo: 'U3', setorSigla: 'PED', recorrencia: 'unico', data: '2025-06-10', ativo: true },
  { id: 'u4', titulo: 'U4', setorSigla: 'PED', recorrencia: 'unico', data: '2025-06-10', ativo: true },
  { id: 'u5', titulo: 'U5', setorSigla: 'PED', recorrencia: 'diario', dataInicio: '2025-01-01', ativo: true },
  { id: 'u6', titulo: 'U6', setorSigla: 'PED', recorrencia: 'unico', data: '2026-06-20', ativo: true },
  { id: 'u7', titulo: 'U7', setorSigla: 'PED', recorrencia: 'unico', data: '2025-06-10', ativo: false }
];
var OCCA = [
  { atividadeId: 'u2', data: '2025-06-10', status: 'concluida', concluidaEm: 1750000000000 },
  { atividadeId: 'u3', data: '2025-06-10', status: 'reprogramada', dataOverride: '2026-08-01' },
  { atividadeId: 'u4', data: '2025-06-10', status: 'reprogramada', dataOverride: '2026-07-01' }
];
var v = K.vencidasUnicasAntigas(ATIV, OCCA, J_INI, HOJE);
t('varredura antiga: entram u1 (nunca tocada) e u4 (reprogramada p/ passado)',
  v.map(function (o) { return o.act.id; }), ['u1', 'u4']);
t('u1: efetiva = data original (406 dias de atraso reaparecem)', v[0].effDate, '2025-06-10');
t('u4: efetiva = dataOverride (2026-07-01, ainda vencida)', v[1].effDate, '2026-07-01');
t('item da varredura vem marcado foraJanela (banner declara a fonte)', v[0].foraJanela, true);
t('item da varredura vem marcado atrasada', v[0].atrasada, true);
t('concluída (u2), futura (u3), recorrente (u5), na janela (u6) e inativa (u7) ficam FORA',
  v.length, 2);

/* ---------- convocadosPorTipo · resultado_mensal (default provisório c) ---------- */
var USERS_X = [
  { uid: 'l1', nome: 'Lia', perfil: 'lider' },
  { uid: 'g1', nome: 'Gil', perfil: 'gestor' },
  { uid: 's1', nome: 'Sol', perfil: 'gestor', socio: true }
];
var cv = K.convocadosPorTipo('resultado_mensal', USERS_X, [], { uid: 'c1', nome: 'Bruno' }, null);
t('resultado_mensal (default c): convoca SÓ o criador — ajuste manual no modal',
  cv.map(function (u) { return u.uid; }), ['c1']);
t('resultado_mensal: nome do criador preservado', cv[0].nome, 'Bruno');

console.log('');
console.log(ok + ' PASS · ' + fail + ' FAIL');
if (fail) { process.exit(1); }
