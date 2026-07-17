/* ============================================================
   harness_f1g.js · Sessão F1-G — validação à mão (Node, zero rede)
   ------------------------------------------------------------
   Cobre: KPI.scoreDesempenho (50/30/20 + renormalização),
   KPI.residualPct, KPI.computarRanking (3 lentes), KPI.pctPlano,
   KPI.statusPlano e a integridade do CATALOGO (95 itens da ATA).
   Fixtures de board seguem o contrato F1-F: act com titulo +
   setorSigla (o validar()/setoresDe derruba expansão sem eles).
   Rodar: node harness_f1g.js
   ============================================================ */
'use strict';

/* ---------- stubs mínimos (mesmo padrão do harness_f1f) ---------- */
global.window = global;
window.GrautRecorrencia = {
  hojeISO: function () { return '2026-07-16'; },
  toISO: function (d) {
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  },
  fromISO: function (iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); },
  compareISO: function (a, b) { return a < b ? -1 : a > b ? 1 : 0; },
  diasEntre: function (a, b) {
    var A = window.GrautRecorrencia.fromISO(a), B = window.GrautRecorrencia.fromISO(b);
    return Math.round((B - A) / 86400000);
  },
  addDias: function (iso, n) {
    var d = window.GrautRecorrencia.fromISO(iso); d.setDate(d.getDate() + n);
    return window.GrautRecorrencia.toISO(d);
  },
  isISO: function (s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); },
  ocorrenciasNaJanela: function () { return []; },
  validar: function () { return []; }
};

require('./kpi.js');
require('./catalogo.js');
var K = window.KPI;
var C = window.CATALOGO;

var ok = 0, fail = 0;
function t(nome, got, want) {
  var g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('PASS ' + nome); }
  else { fail++; console.log('FAIL ' + nome + '\n  got:  ' + g + '\n  want: ' + w); }
}

var HOJE = '2026-07-16';

/* ============================================================
   1) residualPct — validado à mão
   ============================================================ */
t('residualPct: 3 atrasadas de 10 vencidas = 30', K.residualPct(3, 10), 30);
t('residualPct: 0 atrasadas = 0', K.residualPct(0, 8), 0);
t('residualPct: nada venceu -> null (partida fria)', K.residualPct(0, 0), null);

/* ============================================================
   2) scoreDesempenho — contas feitas à mão
   ader 80, prazo 90, residual 20:
     0.5*80 + 0.3*90 + 0.2*(100-20) = 40 + 27 + 16 = 83
   ============================================================ */
var s1 = K.scoreDesempenho(80, 90, 20);
t('score completo: 83 (40+27+16)', s1.score, 83);
t('score completo: usa os 3 componentes', s1.usados, ['ader', 'prazo', 'residual']);
t('score completo: tom ok (>=80)', s1.tom, 'ok');

/* sem residual (null): renormaliza 0.5/0.3 -> 0.625/0.375
   0.625*80 + 0.375*90 = 50 + 33.75 = 83.75 -> 84 */
var s2 = K.scoreDesempenho(80, 90, null);
t('score sem residual: renormaliza p/ 84', s2.score, 84);
t('score sem residual: usados = ader+prazo', s2.usados, ['ader', 'prazo']);

/* só aderência: score = ader */
var s3 = K.scoreDesempenho(70, null, null);
t('score só aderência: 70', s3.score, 70);
t('score só aderência: tom warn (60..79)', s3.tom, 'warn');

/* ader null -> sem base -> null */
t('score sem aderência: null (nunca inventa)', K.scoreDesempenho(null, 90, 10), null);

/* pior caso: 0/0/100 -> 0.5*0+0.3*0+0.2*0 = 0, tom bad */
var s4 = K.scoreDesempenho(0, 0, 100);
t('score fundo do poço: 0 / bad', [s4.score, s4.tom], [0, 'bad']);

/* ============================================================
   3) computarRanking — fixture com contrato F1-F (titulo+setorSigla)
   Cenário validado à mão:
   - Ana (uid a1), PED: 2 previstas vencidas, 1 concluída no prazo,
     1 atrasada -> ader 50, prazo 100, residual 50
     score = 0.5*50 + 0.3*100 + 0.2*50 = 25+30+10 = 65
   - Beto (uid b1), SEC: 1 prevista vencida, 1 concluída FORA do
     prazo -> ader 100, prazo 0, residual 0
     score = 50 + 0 + 20 = 70
   - Multi-setor: a ocorrência de Caio conta em PED E SEC.
   - Líder Lia lidera PED (raiz) -> pega Ana + Caio.
   ============================================================ */
var SET = [
  { sigla: 'PED', nome: 'Pedagógico', setorPaiSigla: null, ativo: true },
  { sigla: 'SEC', nome: 'Secretaria', setorPaiSigla: null, ativo: true }
];
function occ(uid, nome, sig, eff, status, conclEmISO, extraSigs) {
  var act = { id: 'A_' + uid + '_' + eff + '_' + status, titulo: 'x', setorSigla: sig };
  if (extraSigs) { act.setorSiglas = [sig].concat(extraSigs); }
  return {
    act: act, origData: eff, effDate: eff, status: status,
    responsavel: nome, semResp: !nome, uid: uid,
    ov: conclEmISO ? { concluidaEm: window.GrautRecorrencia.fromISO(conclEmISO).getTime() } : null,
    atrasada: (status === 'pendente' || status === 'em_andamento' || status === 'reprogramada') && eff < HOJE
  };
}
var BOARD = [
  occ('a1', 'Ana', 'PED', '2026-07-10', 'concluida', '2026-07-10'), /* no prazo */
  occ('a1', 'Ana', 'PED', '2026-07-12', 'pendente', null),          /* atrasada  */
  occ('b1', 'Beto', 'SEC', '2026-07-11', 'concluida', '2026-07-13'),/* fora do prazo */
  occ('c1', 'Caio', 'PED', '2026-07-20', 'pendente', null, ['SEC']) /* futura, multi-setor */
];
var USUARIOS = [
  { uid: 'lia', nome: 'Lia', ativo: true, setoresLiderados: ['PED'] }
];
var ctx = { board: BOARD, hoje: HOJE, setores: SET };
var RK = K.computarRanking(ctx, USUARIOS);

var ana = RK.usuarios.filter(function (x) { return x.chave === 'a1'; })[0];
t('ranking Ana: ader 50', ana.ader, 50);
t('ranking Ana: prazo 100', ana.pctNoPrazo, 100);
t('ranking Ana: residual 50', ana.residual, 50);
t('ranking Ana: score 65', ana.score, 65);

var beto = RK.usuarios.filter(function (x) { return x.chave === 'b1'; })[0];
t('ranking Beto: ader 100 · prazo 0 · residual 0', [beto.ader, beto.pctNoPrazo, beto.residual], [100, 0, 0]);
t('ranking Beto: score 70', beto.score, 70);

t('ranking usuários: MELHOR primeiro (Beto 70 > Ana 65)',
  RK.usuarios.slice(0, 2).map(function (x) { return x.chave; }), ['b1', 'a1']);

/* Caio: só futura -> previstas 0 -> score null, vai pro fim */
var caio = RK.usuarios.filter(function (x) { return x.chave === 'c1'; })[0];
t('ranking Caio: sem previstas -> score null', caio.score, null);
t('ranking Caio: null vai pro fim', RK.usuarios[RK.usuarios.length - 1].chave, 'c1');

/* setores: PED = ocorrências de Ana (2) + Caio (1 futura).
   previstas 2, vencidas 2, concluídas 1 -> ader 50, residual 50.
   SEC = Beto (1) + Caio multi (1 futura): ader 100, residual 0. */
var ped = RK.setores.filter(function (x) { return x.chave === 'PED'; })[0];
var sec = RK.setores.filter(function (x) { return x.chave === 'SEC'; })[0];
t('ranking PED: previstas 2 · ader 50 · residual 50', [ped.previstas, ped.ader, ped.residual], [2, 50, 50]);
t('ranking SEC: multi-setor conta aqui também (2 occ, 1 prevista)', [sec.previstas, sec.ader], [1, 100]);

/* líder Lia (PED): pega Ana(2) + Caio(1) = mesmos números do PED */
t('ranking líder Lia: espelha o escopo PED', [RK.lideres.length, RK.lideres[0].chave, RK.lideres[0].previstas, RK.lideres[0].score], [1, 'lia', 2, 65]);

/* bucket (sem responsável) NÃO entra no ranking de usuários */
var comSem = K.computarRanking({ board: BOARD.concat([occ(null, '', 'PED', '2026-07-01', 'pendente', null)]), hoje: HOJE, setores: SET }, []);
t('ranking usuários: bucket sem-uid fica fora', comSem.usuarios.some(function (x) { return x.chave === null; }), false);

/* ============================================================
   4) pctPlano — validado à mão
   Plano com A1 (2 previstas, 1 concluída = 50%) e A2 (1 prevista,
   1 concluída = 100%) -> média (0.5+1)/2 = 75%. A3 fora da janela.
   ============================================================ */
function occP(actId, eff, status) {
  return { act: { id: actId, titulo: 'x', setorSigla: 'PED' }, effDate: eff, origData: eff, status: status, uid: 'z', responsavel: 'Z', ov: null, atrasada: false };
}
var BOARD_P = [
  occP('A1', '2026-07-10', 'concluida'), occP('A1', '2026-07-14', 'pendente'),
  occP('A2', '2026-07-12', 'concluida'),
  occP('A2', '2026-07-30', 'pendente') /* futura: NÃO é prevista até hoje */
];
var pr = K.pctPlano(['A1', 'A2', 'A3'], BOARD_P, HOJE);
t('pctPlano: média 75% (50% + 100%)', pr.pct, 75);
t('pctPlano: 2 medindo · 1 fora da janela · 3 no total', [pr.comPrevistas, pr.foraJanela, pr.total], [2, 1, 3]);

/* pulada não conta como prevista */
var pr2 = K.pctPlano(['A9'], [occP('A9', '2026-07-10', 'pulada')], HOJE);
t('pctPlano: só puladas -> pct null (coletando)', pr2.pct, null);

/* ============================================================
   5) statusPlano — todas as chaves
   ============================================================ */
t('statusPlano: 100% -> concluído', K.statusPlano({ prazo: '2026-07-01' }, 100, HOJE).chave, 'concluido');
t('statusPlano: prazo passado -> vencido', K.statusPlano({ prazo: '2026-07-15' }, 40, HOJE).chave, 'vencido');
t('statusPlano: pct null -> coletando', K.statusPlano({ prazo: '2026-07-30' }, null, HOJE).chave, 'coletando');
t('statusPlano: faltam 5d e 60% -> em risco', K.statusPlano({ prazo: '2026-07-21' }, 60, HOJE).chave, 'em_risco');
t('statusPlano: faltam 5d e 80% -> no prazo', K.statusPlano({ prazo: '2026-07-21' }, 80, HOJE).chave, 'no_prazo');
t('statusPlano: faltam 20d e 10% -> no prazo (cedo)', K.statusPlano({ prazo: '2026-08-05' }, 10, HOJE).chave, 'no_prazo');

/* ============================================================
   6) CATÁLOGO — integridade do dado congelado da ATA
   ============================================================ */
t('catálogo: 95 ações', C.itens.length, 95);
var ids = {}; var dup = 0;
C.itens.forEach(function (it) { if (ids[it.id]) { dup++; } ids[it.id] = true; });
t('catálogo: ids únicos', dup, 0);
var SIGS_OK = { PED: 1, SEC: 1, CRA: 1, GES: 1, CSA: 1, COM: 1, SOC: 1 };
var SUBS_OK = { PAD: 1, PAT: 1, ENF: 1, RAD: 1, ADM: 1, FIN: 1, BEM: 1, TI: 1, MAN: 1, AGE: 1, PVE: 1, RET: 1, EVA: 1, FAL: 1 };
var ruim = C.itens.filter(function (it) {
  if (it.setorSigla !== null && !SIGS_OK[it.setorSigla]) { return true; }
  if (it.subsetorSigla !== null && !SUBS_OK[it.subsetorSigla]) { return true; }
  return !it.titulo || !it.id || !it.categoriaATA;
});
t('catálogo: toda sigla existe na taxonomia (ou null) + campos obrigatórios', ruim.length, 0);
t('catálogo: regra "ligação a faltosos" -> CSA/FAL presente',
  C.itens.some(function (it) { return it.subsetorSigla === 'FAL'; }), true);
t('catálogo: regra "pós-venda = ligações" -> CSA/PVE com 7 ações',
  C.itens.filter(function (it) { return it.subsetorSigla === 'PVE'; }).length, 7);
t('catálogo: FINANCEIRO -> SEC/FIN (9 ações)',
  C.itens.filter(function (it) { return it.subsetorSigla === 'FIN'; }).length, 9);
t('catálogo: lista de setores do seletor', C.setores, ['COM', 'CSA', 'GES', 'PED', 'SEC']);

/* ============================================================
   7) D1 · convocadosPorTipo resultado_mensal = líderes + gestores
   ============================================================ */
var US = [
  { uid: 'l1', nome: 'Lia', perfil: 'lider' },
  { uid: 'g1', nome: 'Gil', perfil: 'gestor' },
  { uid: 'u1', nome: 'Ugo', perfil: 'usuario' }
];
var cv = K.convocadosPorTipo('resultado_mensal', US, [], { uid: 'c1', nome: 'Bruno' }, null);
t('D1: resultado_mensal convoca criador + líderes + gestores',
  cv.map(function (u) { return u.uid; }), ['c1', 'l1', 'g1']);

console.log('');
console.log(ok + ' PASS · ' + fail + ' FAIL');
if (fail) { process.exit(1); }
console.log('== HARNESS F1-G: 100% VALIDADO À MÃO ==');
