/* HARNESS N2 — todos os esperados calculados À MÃO antes de rodar */
var EXT = require('./kpi_ext_n2.js');
var falhas = 0;
function eq(nome, obtido, esperado) {
  var o = JSON.stringify(obtido), e = JSON.stringify(esperado);
  if (o === e) { console.log('PASS ' + nome + ' = ' + o); }
  else { falhas++; console.log('FAIL ' + nome + '\n  obtido:   ' + o + '\n  esperado: ' + e); }
}
/* ---- _score (mão): ver comentários ---- */
eq('score 90/0/0  (45+30+20=95 ok)', EXT._score(90,0,0),  {score:95,tom:'ok',compA:90,compB:100,compC:100});
eq('score 75/20/2 (37,5+24+15=76,5→77 warn)', EXT._score(75,20,2), {score:77,tom:'warn',compA:75,compB:80,compC:75});
eq('score 50/60/10 (25+12+0=37 bad)', EXT._score(50,60,10), {score:37,tom:'bad',compA:50,compB:40,compC:0});
eq('score 100/0/8 (50+30+0=80 ok)', EXT._score(100,0,8), {score:80,tom:'ok',compA:100,compB:100,compC:0});
eq('score 0/100/0 (0+0+20=20 bad)', EXT._score(0,100,0), {score:20,tom:'bad',compA:0,compB:0,compC:100});
/* ---- _mediana ---- */
eq('mediana [2,3,6,3] = 3', EXT._mediana([2,3,6,3]), 3);
eq('mediana [1,2,3] = 2', EXT._mediana([1,2,3]), 2);
eq('mediana [5] = 5', EXT._mediana([5]), 5);
eq('mediana [] = 0', EXT._mediana([]), 0);
/* ---- _gargalos (mão: cargas [2,3,6,4] → mediana 3,5 → teto 5,25) ---- */
var set = [
 {sigla:'PED', ader:90, atrasadas:0, agingMedio:0, carga:2},
 {sigla:'SEC', ader:72, atrasadas:1, agingMedio:2, carga:3},
 {sigla:'CRA', ader:85, atrasadas:3, agingMedio:5, carga:6},
 {sigla:'FIN', ader:85, atrasadas:3, agingMedio:5, carga:4}
];
var g = EXT._gargalos(set);
eq('gargalos qtd = 2', g.length, 2);
eq('gargalo 1 = SEC por aderência', g[0], {sigla:'SEC',motivo:'aderência 72% < 80%'});
eq('gargalo 2 = CRA combinado', g[1], {sigla:'CRA',motivo:'3 atrasada(s) · aging 5d ≥ 4d · carga 6 > 1,5×mediana (5,25)'});
eq('gargalos [] = []', EXT._gargalos([]), []);
/* ---- _trend (mão: hoje 02/07 → corte 25/06; base=25/06(74), atual=02/07(83) → Δ=9) ---- */
var snaps = [
 {data:'2026-06-20', ader:70}, {data:'2026-06-24', ader:72}, {data:'2026-06-25', ader:74},
 {data:'2026-06-30', ader:78}, {data:'2026-07-01', ader:80}, {data:'2026-07-02', ader:83}
];
var t = EXT._trend(snaps, 'ader', '2026-07-02');
eq('trend suficiente', t.suficiente, true);
eq('trend Δ7 = 9 (83−74)', t.delta7, 9);
eq('trend dataBase = 2026-06-25', t.dataBase, '2026-06-25');
var poucos = [{data:'2026-06-29',ader:75},{data:'2026-06-30',ader:76},{data:'2026-07-01',ader:77},{data:'2026-07-02',ader:78}];
var t2 = EXT._trend(poucos, 'ader', '2026-07-02');
eq('trend insuficiente → coletando 4/7', {suf:t2.suficiente, col:t2.coletando, d:t2.delta7, v:t2.valorHoje}, {suf:false, col:'4/7', d:null, v:78});
var t3 = EXT._trend([{data:'2026-06-24',ader:74.4},{data:'2026-07-02',ader:82.5}], 'ader', '2026-07-02');
eq('trend decimal Δ = 8,1', t3.delta7, 8.1);
/* ---- _deltaFmt (mão) ---- */
eq('Δ +3 maiorMelhor → ok',  EXT._deltaFmt(3,false),  {texto:'+3',tom:'ok'});
eq('Δ +3 menorMelhor → bad', EXT._deltaFmt(3,true),   {texto:'+3',tom:'bad'});
eq('Δ −2 menorMelhor → ok',  EXT._deltaFmt(-2,true),  {texto:'-2',tom:'ok'});
eq('Δ 0 → flat',             EXT._deltaFmt(0,true),   {texto:'0',tom:'flat'});
eq('Δ null → —',             EXT._deltaFmt(null,false),{texto:'—',tom:'flat'});
eq('Δ 2,5 menorMelhor → bad',EXT._deltaFmt(2.5,true), {texto:'+2,5',tom:'bad'});
/* ---- _sparkPoints (mão: x 2/50/98; y 22/12/2) ---- */
eq('spark [0,50,100] 100x24', EXT._sparkPoints([0,50,100],100,24), '2,22 50,12 98,2');
eq('spark constante → meio', EXT._sparkPoints([5,5,5],100,24), '2,12 50,12 98,12');
eq('spark 1 ponto → vazio', EXT._sparkPoints([7],100,24), '');
var vinte = []; for (var i=0;i<20;i++){ vinte.push(i); }
eq('spark 20 valores → usa 14 pts', EXT._sparkPoints(vinte,100,24).split(' ').length, 14);
console.log(falhas === 0 ? '\n== HARNESS N2: 100% VALIDADO À MÃO ==' : '\n== FALHAS: ' + falhas + ' ==');
process.exit(falhas === 0 ? 0 : 1);
