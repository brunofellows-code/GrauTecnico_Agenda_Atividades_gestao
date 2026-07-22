/* ============================================================
   HARNESS R4 · BLOCO 3 — Planejamento do Setor (kpi.js)
   Números conferidos À MÃO (comentário em cada caso).
   Rodar: node harness_r4.js
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

/* ---------- planejamentoPrazo ---------- */
/* competência 2026-08 -> deadline 2026-07-25 (dia 25 do mês anterior). */
var pz = K.planejamentoPrazo('2026-08', '2026-07-10', null);
t('prazo: deadline = dia 25 do mês anterior', pz.deadline, '2026-07-25');
t('prazo: 10/07 -> faltam 15 dias, fase ok', [pz.diasParaPrazo, pz.fase], [15, 'ok']);
/* dia 20 -> faltam 5 -> d5 (alerta líder). 25−20=5, 5>5 falso -> d5 ✓ */
t('prazo: dia 20 = D-5 (alerta líder)', K.planejamentoPrazo('2026-08', '2026-07-20', null).fase, 'd5');
/* dia 22 -> faltam 3 -> 3>3 falso, 3>0 -> d3 (alerta gestão). ✓ */
t('prazo: dia 22 = D-3 (alerta gestão)', K.planejamentoPrazo('2026-08', '2026-07-22', null).fase, 'd3');
/* dia 25 -> faltam 0 -> d0 (flag NC). ✓  dia 30 -> −5 -> d0 (segue flag, nunca bloqueia). */
t('prazo: dia 25 = D-0 (flag)', K.planejamentoPrazo('2026-08', '2026-07-25', null).fase, 'd0');
t('prazo: atrasado segue d0 (nunca bloqueia)', K.planejamentoPrazo('2026-08', '2026-07-30', null).fase, 'd0');
t('prazo: entregue vence tudo', K.planejamentoPrazo('2026-08', '2026-07-30', 1721000000000).fase, 'entregue');
/* virada de ano: comp 2027-01 -> deadline 2026-12-25. */
t('prazo: janeiro ancora em dezembro', K.planejamentoPrazo('2027-01', '2026-12-01', null).deadline, '2026-12-25');

/* ---------- planejamentoItemTravado (alçada R$200) ---------- */
t('alçada: R$200,00 exatos = autonomia (não trava)', K.planejamentoItemTravado({ valorCentavos: 20000 }), false);
t('alçada: sem valor = não trava', K.planejamentoItemTravado({ valorCentavos: null }), false);
t('alçada: R$200,01 sem assinatura = trava', K.planejamentoItemTravado({ valorCentavos: 20001 }), true);
t('alçada: só líder assinou = segue travado', K.planejamentoItemTravado({ valorCentavos: 50000, aprovLider: { uid: 'a' } }), true);
t('alçada: líder + gestor = libera', K.planejamentoItemTravado({ valorCentavos: 50000, aprovLider: { uid: 'a' }, aprovGestor: { uid: 'b' } }), false);

/* ---------- planejamentoNota (50/30/20) ---------- */
/* Caso conferido à mão:
   5 itens: 4 realizados (i1 no prazo, i2 no prazo, i3 +2d, i4 +5d), 1 aberto.
   aderência   = 4/5   = 80
   no prazo    = 2/4   = 50
   atrasos     = [2,5] média 3.5 -> 100×(1−3.5/7)=50
   nota = 80×0.5 + 50×0.3 + 50×0.2 = 40+15+10 = 65 */
var IT = [
  { quandoPrevisto: '2026-08-05', quandoRealizado: '2026-08-05' },
  { quandoPrevisto: '2026-08-10', quandoRealizado: '2026-08-08' },
  { quandoPrevisto: '2026-08-12', quandoRealizado: '2026-08-14' },
  { quandoPrevisto: '2026-08-20', quandoRealizado: '2026-08-25' },
  { quandoPrevisto: '2026-08-28', quandoRealizado: null }
];
var n1 = K.planejamentoNota(IT);
t('nota: caso base (mão: 40+15+10=65)', [n1.nota, n1.aderencia, n1.noPrazoPct, n1.atrasoPct], [65, 80, 50, 50]);
t('nota: média de atraso 3.5d', n1.mediaDiasAtraso, 3.5);
/* tudo no prazo: 100/100/100 -> 100. */
t('nota: mês perfeito = 100', K.planejamentoNota([
  { quandoPrevisto: '2026-08-05', quandoRealizado: '2026-08-01' },
  { quandoPrevisto: '2026-08-09', quandoRealizado: '2026-08-09' }
]).nota, 100);
/* nada realizado: 0×0.5+0+0 = 0. */
t('nota: nada realizado = 0', K.planejamentoNota([{ quandoPrevisto: '2026-08-05', quandoRealizado: null }]).nota, 0);
/* atraso >= 7 dias zera o componente: 1 item realizado +10d ->
   ader 100(50) + noPrazo 0(0) + atraso max(0,1−10/7)=0 -> 50. */
t('nota: atraso 10d estoura o teto de 7 (componente 0) -> 50',
  K.planejamentoNota([{ quandoPrevisto: '2026-08-05', quandoRealizado: '2026-08-15' }]).nota, 50);
/* item removido (soft) sai do denominador. */
t('nota: item removido não conta', K.planejamentoNota([
  { quandoPrevisto: '2026-08-05', quandoRealizado: '2026-08-05' },
  { quandoPrevisto: '2026-08-06', quandoRealizado: null, removido: true }
]).nota, 100);
t('nota: sem itens = null (não ranqueia)', K.planejamentoNota([]), null);

console.log('\n' + P + ' PASS · ' + F + ' FAIL');
process.exit(F ? 1 : 0);
