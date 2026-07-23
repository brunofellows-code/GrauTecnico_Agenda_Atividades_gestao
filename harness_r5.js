/* ============================================================
   HARNESS R5 — Planejamento fase 2 (kpi.js)
   Custo PREVISTO na alçada (fallback legado) · estado formal
   derivado (planejamentoStatus) · Pareto de motivos.
   Números conferidos À MÃO (comentário em cada caso).
   Rodar: node harness_r5.js
   ============================================================ */
'use strict';
global.window = {};
require('./kpi.js');
var K = window.KPI;
var P = 0, F = 0;
function t(nome, got, exp) {
  var g = JSON.stringify(got), e = JSON.stringify(exp);
  if (g === e) { P++; console.log('PASS ' + nome); }
  else { F++; console.log('FAIL ' + nome + '\n  got: ' + g + '\n  exp: ' + e); }
}

/* ---------- planejamentoItemTravado — alçada pelo PREVISTO ---------- */
/* legado puro: valorCentavos 30000 (> 20000), sem assinaturas -> trava. */
t('alçada: legado valorCentavos 30000 trava', K.planejamentoItemTravado({ valorCentavos: 30000 }), true);
/* novo puro: valorPrevistoCentavos 30000 -> trava. */
t('alçada: previsto 30000 trava', K.planejamentoItemTravado({ valorPrevistoCentavos: 30000 }), true);
/* precedência: previsto 10000 vence o legado 30000 -> 10000 <= 20000 -> livre. */
t('alçada: previsto 10000 vence legado 30000 (livre)', K.planejamentoItemTravado({ valorPrevistoCentavos: 10000, valorCentavos: 30000 }), false);
/* precedência 2: previsto 30000 vence legado 100 -> trava. */
t('alçada: previsto 30000 vence legado 100 (trava)', K.planejamentoItemTravado({ valorPrevistoCentavos: 30000, valorCentavos: 100 }), true);
/* previsto 0 é VALOR VÁLIDO e vence o legado (0 != null) -> 0 <= 20000 -> livre. */
t('alçada: previsto 0 explícito vence legado 30000 (livre)', K.planejamentoItemTravado({ valorPrevistoCentavos: 0, valorCentavos: 30000 }), false);
/* limite exato R$200,00 no campo novo -> livre; 20001 -> trava. */
t('alçada: previsto 20000 exato = livre', K.planejamentoItemTravado({ valorPrevistoCentavos: 20000 }), false);
t('alçada: previsto 20001 = trava', K.planejamentoItemTravado({ valorPrevistoCentavos: 20001 }), true);
/* assinaturas: só gestor -> segue travado; as duas -> libera. */
t('alçada: previsto 30000 só gestor = travado', K.planejamentoItemTravado({ valorPrevistoCentavos: 30000, aprovGestor: { uid: 'a' } }), true);
t('alçada: previsto 30000 gestor+sócio = libera', K.planejamentoItemTravado({ valorPrevistoCentavos: 30000, aprovGestor: { uid: 'a' }, aprovSocio: { uid: 'b' } }), false);
/* sem nenhum campo de valor -> v=0 -> livre. */
t('alçada: sem valor nenhum = livre', K.planejamentoItemTravado({}), false);

/* ---------- planejamentoStatus — estado DERIVADO ---------- */
t('status: null = rascunho (fail-safe)', K.planejamentoStatus(null), 'rascunho');
t('status: sem entregueEm = rascunho', K.planejamentoStatus({}), 'rascunho');
t('status: entregue sem ciência = submetido', K.planejamentoStatus({ entregueEm: 123 }), 'submetido');
t('status: entregue + só gestor = submetido', K.planejamentoStatus({ entregueEm: 123, aprovGestor: { uid: 'a' } }), 'submetido');
t('status: entregue + só sócio = submetido', K.planejamentoStatus({ entregueEm: 123, aprovSocio: { uid: 'b' } }), 'submetido');
t('status: entregue + as duas ciências = aprovado', K.planejamentoStatus({ entregueEm: 123, aprovGestor: { uid: 'a' }, aprovSocio: { uid: 'b' } }), 'aprovado');
/* ciência sem entrega não promove (a UI nem oferece; a função é fail-safe). */
t('status: ciências sem entrega = rascunho', K.planejamentoStatus({ aprovGestor: { uid: 'a' }, aprovSocio: { uid: 'b' } }), 'rascunho');

/* ---------- paretoMotivos ---------- */
t('pareto: lista vazia = []', K.paretoMotivos([]), []);
t('pareto: null = [] (fail-safe)', K.paretoMotivos(null), []);
/* A×3 mas 1 removido -> A:2 · B:1 · o não-naoFeito (C) sai. */
t('pareto: conta só naoFeito vivo', K.paretoMotivos([
  { naoFeito: true, motivo: 'A' },
  { naoFeito: true, motivo: 'B' },
  { naoFeito: true, motivo: 'A' },
  { naoFeito: false, motivo: 'C' },
  { naoFeito: true, motivo: 'A', removido: true }
]), [{ motivo: 'A', n: 2 }, { motivo: 'B', n: 1 }]);
/* sem motivo gravado -> balde declarado. */
t('pareto: sem motivo vira "Sem motivo registrado"', K.paretoMotivos([{ naoFeito: true }]), [{ motivo: 'Sem motivo registrado', n: 1 }]);
/* empate (n=1 e n=1) -> alfabético pt-BR: Arara antes de Zebra. */
t('pareto: empate desempata alfabético', K.paretoMotivos([
  { naoFeito: true, motivo: 'Zebra' },
  { naoFeito: true, motivo: 'Arara' }
]), [{ motivo: 'Arara', n: 1 }, { motivo: 'Zebra', n: 1 }]);
/* ordena por n desc: B×3 antes de A×1. */
t('pareto: ordena do maior para o menor', K.paretoMotivos([
  { naoFeito: true, motivo: 'B' }, { naoFeito: true, motivo: 'B' }, { naoFeito: true, motivo: 'B' },
  { naoFeito: true, motivo: 'A' }
]), [{ motivo: 'B', n: 3 }, { motivo: 'A', n: 1 }]);

/* ---------- integração: nota com pause pelo campo NOVO ---------- */
/* 2 itens: (1) aberto travado pelo PREVISTO 30000 (pause, sai do denominador);
   (2) realizado 10/07 com previsto 10/07 (no prazo).
   Denominador = 1 · aderência 1/1 = 100 (peso 50 -> 50) · no prazo 1/1 = 100
   (peso 30 -> 30) · sem atraso -> componente 100 (peso 20 -> 20) · nota 100. */
var notaNovo = K.planejamentoNota([
  { quandoPrevisto: '2026-07-20', quandoRealizado: null, naoFeito: false, valorPrevistoCentavos: 30000 },
  { quandoPrevisto: '2026-07-10', quandoRealizado: '2026-07-10', naoFeito: false }
]);
t('nota: pause pelo previsto novo (nota 100, 1 pausado)', [notaNovo.nota, notaNovo.previstos, notaNovo.pausadosAprovacao], [100, 1, 1]);
/* paridade: o MESMO cenário com o campo legado dá o MESMO resultado. */
var notaLeg = K.planejamentoNota([
  { quandoPrevisto: '2026-07-20', quandoRealizado: null, naoFeito: false, valorCentavos: 30000 },
  { quandoPrevisto: '2026-07-10', quandoRealizado: '2026-07-10', naoFeito: false }
]);
t('nota: paridade legado × novo no pause', [notaLeg.nota, notaLeg.previstos, notaLeg.pausadosAprovacao], [100, 1, 1]);

console.log('');
console.log(P + ' PASS · ' + F + ' FAIL');
if (F === 0) { console.log('== HARNESS R5: 100% VALIDADO À MÃO =='); }
process.exit(F === 0 ? 0 : 1);
