/* ============================================================
   harness_f1l.js · F1-L — placar da reunião validado à mão
   (mesmos buckets do cabeçalho das abas REUNIÃO INTEGRADA /
   LÍDERES da planilha ATA). Rodar: node harness_f1l.js
   ============================================================ */
'use strict';
global.window = global;
window.GrautRecorrencia = {
  hojeISO: function () { return '2026-07-17'; },
  toISO: function (d) { function z(n){return (n<10?'0':'')+n;} return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()); },
  fromISO: function (iso) { var p=iso.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); },
  compareISO: function (a,b) { return a<b?-1:a>b?1:0; },
  diasEntre: function (a,b) { var A=window.GrautRecorrencia.fromISO(a),B=window.GrautRecorrencia.fromISO(b); return Math.round((B-A)/86400000); },
  addDias: function (iso,n) { var d=window.GrautRecorrencia.fromISO(iso); d.setDate(d.getDate()+n); return window.GrautRecorrencia.toISO(d); },
  isISO: function (s) { return /^\d{4}-\d{2}-\d{2}$/.test(s||''); },
  ocorrenciasNaJanela: function(){return [];}, validar: function(){return [];}
};
require('./kpi.js');
var K = window.KPI, PASS=0, FAIL=0;
function ok(c,m){ if(c){PASS++;console.log('PASS '+m);} else {FAIL++;console.log('FAIL '+m);} }

var H='2026-07-17';
function ts(iso){ return window.GrautRecorrencia.fromISO(iso).getTime(); }
/* fixtures: 7 decisões cobrindo todos os baldes da ATA
   d1 feita NO PRAZO   (prazo 15, concluída dia 14)  -> realizada+noPrazo
   d2 feita COM ATRASO (prazo 10, concluída dia 12)  -> realizada+comAtraso
   d3 resolvida na reunião (sem atividade, aberta:false) -> realizada
   d4 EM ANDAMENTO (prazo 20, occ em_andamento)      -> andamento
   d5 PLANEJADA (prazo 25, pendente)                 -> planejada
   d6 VENCIDA (prazo 15, pendente)                   -> vencida
   d7 VENCE HOJE (prazo 17=hoje, pendente)           -> planejada + venceHoje */
var OCC = {
  a1: { effDate: '2026-07-15', status: 'concluida', ov: { concluidaEm: ts('2026-07-14') } },
  a2: { effDate: '2026-07-10', status: 'concluida', ov: { concluidaEm: ts('2026-07-12') } },
  a4: { effDate: '2026-07-20', status: 'em_andamento' },
  a5: { effDate: '2026-07-25', status: 'pendente' },
  a6: { effDate: '2026-07-15', status: 'pendente' },
  a7: { effDate: '2026-07-17', status: 'pendente' }
};
function getOcc(id){ return OCC[id] || null; }
var DECS = [
  { texto: 'd1', atividadeId: 'a1' },
  { texto: 'd2', atividadeId: 'a2' },
  { texto: 'd3', aberta: false },
  { texto: 'd4', atividadeId: 'a4' },
  { texto: 'd5', atividadeId: 'a5' },
  { texto: 'd6', atividadeId: 'a6' },
  { texto: 'd7', atividadeId: 'a7' }
];
var p = K.placarReuniao(DECS, getOcc, H);
ok(p.total === 7, 'total 7 (é ' + p.total + ')');
ok(p.realizadas === 3, 'Realizadas = 3 (d1 no prazo + d2 atraso + d3 resolvida) → ' + p.realizadas);
ok(p.noPrazo === 1, 'no prazo = 1 (d1) → ' + p.noPrazo);
ok(p.comAtraso === 1, 'com atraso = 1 (d2) → ' + p.comAtraso);
ok(p.andamento === 1, 'Em andamento = 1 (d4) → ' + p.andamento);
ok(p.planejadas === 2, 'Planejadas = 2 (d5 + d7) → ' + p.planejadas);
ok(p.vencidas === 1, 'Vencidas = 1 (d6) → ' + p.vencidas);
ok(p.venceHoje === 1, 'Vence hoje = 1 (d7) → ' + p.venceHoje);
ok(p.realizadas + p.andamento + p.planejadas + p.vencidas === p.total, 'baldes exclusivos somam o total');
ok(K.placarReuniao([], getOcc, H) === null, 'sem decisões → null (placar não pinta)');
ok(K.placarReuniao(null, getOcc, H) === null, 'null-safe');
/* decisão com atividade e SEM occ no board (janela) → aberta/planejada, nunca inventa */
var p2 = K.placarReuniao([{ texto: 'x', atividadeId: 'fora-da-janela' }], getOcc, H);
ok(p2.planejadas === 1 && p2.realizadas === 0, 'occ fora da janela → planejada (nunca inventa status)');

console.log('\n' + PASS + ' PASS · ' + FAIL + ' FAIL');
if (FAIL) { process.exit(1); }
console.log('== HARNESS F1-L: 100% VALIDADO À MÃO ==');
