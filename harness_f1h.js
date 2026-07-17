/* ============================================================
   harness_f1h.js · Sessão F1-H — validação à mão (Node, zero rede)
   ------------------------------------------------------------
   Cobre: KPI.sugerirSupervisor (cadeia determinística por camada),
   KPI.parsePrioridade / fatorAging / fatorReprog / riscoAtividades
   (score = prioridade × aging × reprog) e KPI.paretoAtrasadas
   (80/20 com corte no acumulado).
   Rodar: node harness_f1h.js
   ============================================================ */
'use strict';

/* ---------- stubs mínimos (mesmo padrão do harness_f1g) ---------- */
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
var K = window.KPI;

var PASS = 0, FAIL = 0;
function ok(cond, msg) {
  if (cond) { PASS++; console.log('PASS ' + msg); }
  else { FAIL++; console.log('FAIL ' + msg); }
}

/* ============================================================
   1) sugerirSupervisor — cadeia determinística
   Fixture de usuários (nomes em ordem alfabética proposital):
   - Ana   (gestor)
   - Bruno (gestor)
   - Carla (lider, lidera ['FAL'])          -> líder do subsetor FAL
   - Diego (lider, lidera ['CPS'])          -> líder da raiz CPS
   - Edu   (usuario)
   Setores: CPS raiz; FAL subsetor de CPS.
   ============================================================ */
var USUARIOS = [
  { uid: 'u-ana', nome: 'Ana', perfil: 'gestor' },
  { uid: 'u-bru', nome: 'Bruno', perfil: 'gestor' },
  { uid: 'u-car', nome: 'Carla', perfil: 'lider', setoresLiderados: ['FAL'] },
  { uid: 'u-die', nome: 'Diego', perfil: 'lider', setoresLiderados: ['CPS'] },
  { uid: 'u-edu', nome: 'Edu', perfil: 'usuario' }
];
var SETORES = [
  { sigla: 'CPS', nome: 'CP&S', ativo: true },
  { sigla: 'FAL', nome: 'Faltosos', setorPaiSigla: 'CPS', ativo: true }
];

var s;
/* 1.1 operacional COM subsetor -> líder do subsetor (Carla) */
s = K.sugerirSupervisor({ camada: 'operacional', setorSigla: 'CPS', subsetorSigla: 'FAL', responsavelUid: 'u-edu' }, USUARIOS, SETORES);
ok(s && s.uid === 'u-car', 'operacional + subsetor FAL → Carla (líder do subsetor): ' + (s && s.nome));

/* 1.2 operacional SEM subsetor -> líder da raiz (Diego) */
s = K.sugerirSupervisor({ camada: 'operacional', setorSigla: 'CPS', subsetorSigla: null, responsavelUid: 'u-edu' }, USUARIOS, SETORES);
ok(s && s.uid === 'u-die', 'operacional sem subsetor → Diego (líder da raiz): ' + (s && s.nome));

/* 1.3 responsável é o PRÓPRIO líder do subsetor -> sobe p/ líder da raiz */
s = K.sugerirSupervisor({ camada: 'operacional', setorSigla: 'CPS', subsetorSigla: 'FAL', responsavelUid: 'u-car' }, USUARIOS, SETORES);
ok(s && s.uid === 'u-die', 'responsável = líder do subsetor → sobe p/ Diego: ' + (s && s.nome));

/* 1.4 setor sem líder nenhum -> gestor (Ana, 1º por nome) */
s = K.sugerirSupervisor({ camada: 'operacional', setorSigla: 'PED', subsetorSigla: null, responsavelUid: 'u-edu' }, USUARIOS, SETORES);
ok(s && s.uid === 'u-ana', 'setor sem líder → gestor Ana (1º por nome pt-BR): ' + (s && s.nome));

/* 1.5 camada gestor, responsável = Ana -> Bruno (outro gestor) */
s = K.sugerirSupervisor({ camada: 'gestor', setorSigla: 'CPS', responsavelUid: 'u-ana' }, USUARIOS, SETORES);
ok(s && s.uid === 'u-bru', 'camada gestor, resp Ana → Bruno (par): ' + (s && s.nome));

/* 1.6 camada gestor com UM gestor só (o responsável) -> null */
s = K.sugerirSupervisor({ camada: 'gestor', responsavelUid: 'u-ana' },
  [{ uid: 'u-ana', nome: 'Ana', perfil: 'gestor' }], SETORES);
ok(s === null, 'camada gestor, único gestor é o resp → null (sem auto-supervisão)');

/* 1.7 camada socio -> null (topo) */
s = K.sugerirSupervisor({ camada: 'socio', setorSigla: 'CPS', responsavelUid: 'u-edu' }, USUARIOS, SETORES);
ok(s === null, 'camada socio → null (topo da árvore)');

/* 1.8 usuário inativo NUNCA é sugerido */
s = K.sugerirSupervisor({ camada: 'operacional', setorSigla: 'CPS', subsetorSigla: 'FAL', responsavelUid: 'u-edu' },
  [{ uid: 'u-car', nome: 'Carla', perfil: 'lider', setoresLiderados: ['FAL'], ativo: false },
   { uid: 'u-die', nome: 'Diego', perfil: 'lider', setoresLiderados: ['CPS'] }], SETORES);
ok(s && s.uid === 'u-die', 'líder inativo pulado → Diego: ' + (s && s.nome));

/* 1.9 determinismo: 2 gestores empatados por contexto → menor nome vence sempre */
var s1 = K.sugerirSupervisor({ camada: 'gestor', responsavelUid: 'u-edu' }, USUARIOS, SETORES);
var s2 = K.sugerirSupervisor({ camada: 'gestor', responsavelUid: 'u-edu' }, USUARIOS.slice().reverse(), SETORES);
ok(s1 && s2 && s1.uid === s2.uid && s1.uid === 'u-ana', 'determinístico: ordem de entrada não muda o resultado (Ana)');

/* ============================================================
   2) parsePrioridade / fatorAging / fatorReprog — validado à mão
   ============================================================ */
ok(K.parsePrioridade('P1 (Impacto Alto / Risco Alto)').peso === 5, 'P1 → peso 5');
ok(K.parsePrioridade('P2 (Impacto Alto / Risco Médio)').peso === 4, 'P2 → peso 4');
ok(K.parsePrioridade('P5 (Impacto Baixo / Risco Baixo)').peso === 1, 'P5 → peso 1');
ok(K.parsePrioridade('').peso === 3 && K.parsePrioridade('').p === null, 'vazio → peso 3 (default médio), p=null');
ok(K.parsePrioridade('alta').peso === 3, 'não-parseável → peso 3');

ok(K.fatorAging(0) === 1, 'aging 0d → 1,0');
ok(K.fatorAging(3) === 1.2, 'aging 3d → 1,2');
ok(K.fatorAging(4) === 1.5, 'aging 4d → 1,5');
ok(K.fatorAging(7) === 1.5, 'aging 7d → 1,5');
ok(K.fatorAging(8) === 2, 'aging 8d → 2,0');
ok(K.fatorAging(15) === 2, 'aging 15d → 2,0');
ok(K.fatorAging(16) === 3, 'aging 16d → 3,0');

ok(K.fatorReprog(0) === 1, 'reprog 0 → 1,0');
ok(K.fatorReprog(2) === 2, 'reprog 2 → 1+0,5×2 = 2,0');
ok(K.fatorReprog(10) === 3, 'reprog 10 → teto 3,0');

/* ============================================================
   3) riscoAtividades — conta feita à mão:
   A1: P1(5) · atraso máx 10d (fator 2,0) · 1 reprog (fator 1,5)
       → 5 × 2 × 1,5 = 15,0 → CRÍTICO
   A2: sem prioridade(3) · atraso 2d (1,2) · 0 reprog (1,0)
       → 3 × 1,2 × 1 = 3,6 → OBSERVAÇÃO
   A3: P2(4) · sem atraso · 2 reprog (2,0) → 4 × 1 × 2 = 8,0 → EM RISCO
   A4: sem sinal dinâmico → FORA da lente
   ============================================================ */
var HOJE = '2026-07-16';
var A1 = { id: 'a1', titulo: 'Rotina 1', setorSigla: 'CPS', prioridade: 'P1 (Impacto Alto / Risco Alto)', mitigacao: 'Plano B do PEF' };
var A2 = { id: 'a2', titulo: 'Rotina 2', setorSigla: 'PED' };
var A3 = { id: 'a3', titulo: 'Rotina 3', setorSigla: 'SEC', prioridade: 'P2 (Impacto Alto / Risco Médio)' };
var A4 = { id: 'a4', titulo: 'Rotina 4', setorSigla: 'COM', prioridade: 'P1' };
var BOARD = [
  { act: A1, effDate: '2026-07-06', atrasada: true, status: 'pendente' },      /* 10d */
  { act: A1, effDate: '2026-07-12', atrasada: true, status: 'pendente' },      /* 4d (não é o máx) */
  { act: A1, effDate: '2026-07-15', atrasada: false, status: 'reprogramada' }, /* 1 reprog */
  { act: A2, effDate: '2026-07-14', atrasada: true, status: 'pendente' },      /* 2d */
  { act: A3, effDate: '2026-07-20', atrasada: false, status: 'reprogramada' },
  { act: A3, effDate: '2026-07-22', atrasada: false, status: 'reprogramada' },
  { act: A4, effDate: '2026-07-16', atrasada: false, status: 'pendente' }
];
var R1 = K.riscoAtividades(BOARD, HOJE);
ok(R1.length === 3, 'lente traz 3 atividades (A4 sem sinal fica fora): ' + R1.length);
ok(R1[0].act.id === 'a1' && R1[0].score === 15 && R1[0].faixa === 'critico',
  'A1: 5×2,0×1,5 = 15 → Crítico (score ' + R1[0].score + ')');
ok(R1[0].maxAtraso === 10 && R1[0].reprog === 1, 'A1: atraso máx 10d · 1 reprog');
ok(R1[0].mitigacao === 'Plano B do PEF', 'A1: mitigação vem SÓ do PEF importado');
ok(R1[1].act.id === 'a3' && R1[1].score === 8 && R1[1].faixa === 'em_risco',
  'A3: 4×1×2,0 = 8 → Em risco (score ' + R1[1].score + ')');
ok(R1[2].act.id === 'a2' && R1[2].score === 3.6 && R1[2].faixa === 'observacao',
  'A2: 3×1,2×1 = 3,6 → Observação (score ' + R1[2].score + ')');
ok(R1[2].mitigacao === null, 'A2 sem mitigação no PEF → null (nunca inventada)');
ok(K.riscoAtividades([], HOJE).length === 0, 'board vazio → lente vazia');

/* ============================================================
   4) paretoAtrasadas — conta feita à mão:
   A=8, B=1, C=1 (total 10) → A: 80% acum 80% VITAL (cruza) ·
   B: acum 90% não-vital · C: acum 100% não-vital.
   ============================================================ */
var P1 = K.paretoAtrasadas([
  { sig: 'A', atrasadas: 8 }, { sig: 'B', atrasadas: 1 }, { sig: 'C', atrasadas: 1 },
  { sig: 'D', atrasadas: 0 }
]);
ok(P1.total === 10 && P1.itens.length === 3, 'Pareto: total 10, setores com atrasadas = 3 (D=0 fora)');
ok(P1.itens[0].sig === 'A' && P1.itens[0].acumPct === 80 && P1.itens[0].vital === true, 'A: 8/10 → acum 80% · vital');
ok(P1.itens[1].sig === 'B' && P1.itens[1].acumPct === 90 && P1.itens[1].vital === false, 'B: acum 90% · não-vital');
ok(P1.itens[2].vital === false, 'C: não-vital');

/* 4.1 distribuição uniforme: 4 setores de 5 → vitais A(25) B(50) C(75) D(100 cruza) */
var P2 = K.paretoAtrasadas([
  { sig: 'A', atrasadas: 5 }, { sig: 'B', atrasadas: 5 }, { sig: 'C', atrasadas: 5 }, { sig: 'D', atrasadas: 5 }
]);
ok(P2.itens[2].vital === true && P2.itens[3].vital === true, 'uniforme: D (que cruza 80%) ainda é vital');
ok(K.paretoAtrasadas([{ sig: 'A', atrasadas: 0 }]) === null, 'sem atrasadas → null (card não pinta)');

/* 4.2 desempate estável por sigla quando o nº de atrasadas empata */
var P3 = K.paretoAtrasadas([{ sig: 'Z', atrasadas: 3 }, { sig: 'A', atrasadas: 3 }]);
ok(P3.itens[0].sig === 'A', 'empate 3×3 → ordem por sigla (A antes de Z)');

console.log('\n' + PASS + ' PASS · ' + FAIL + ' FAIL');
if (FAIL) { process.exit(1); }
console.log('== HARNESS F1-H: 100% VALIDADO À MÃO ==');
