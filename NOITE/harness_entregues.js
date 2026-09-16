/* ============================================================
   harness_entregues.js — KPI.entreguesHoje (G4)

   Teste de regressão do cartão "Entregue hoje no seu escopo".
   Exigência da bomba "sem mock, sem órfão": o número da tela tem de
   ter fórmula provada, e a prova tem de quebrar sozinha se alguém
   mexer. Aqui o board é montado à mão — nada de Firestore, nada de
   DOM — e cada caso diz a conta esperada.

   Rodar: node NOITE/harness_entregues.js
   ============================================================ */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');

var RAIZ = path.join(__dirname, '..');
var sandbox = { window: {}, console: console };
sandbox.window.window = sandbox.window;
sandbox.self = sandbox.window;
vm.createContext(sandbox);
['recorrencia.js', 'kpi.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), sandbox, { filename: f });
});
var KPI = sandbox.window.KPI;
if (!KPI || typeof KPI.entreguesHoje !== 'function') {
  console.error('KPI.entreguesHoje não existe — o motor não carregou.');
  process.exit(1);
}

var HOJE = '2026-09-16';
var n = 0, falhas = [];
function ok(rotulo, obtido, esperado) {
  n += 1;
  var a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a !== b) { falhas.push(rotulo + '\n    esperado: ' + b + '\n    obtido:   ' + a); }
}

/* --- fábrica de ocorrência de board (mesmo formato de buildBoard) --- */
function occ(setor, uid, nome, data, status, relato, relatoEm) {
  return {
    act: { id: 'a_' + uid + '_' + data + '_' + status, setorSigla: setor, responsavelUid: uid, responsavelNome: nome },
    origData: data, effDate: data, status: status,
    responsavel: nome, semResp: !nome, uid: uid,
    ov: relato ? { relato: relato, relatoEm: relatoEm || 1 } : null,
    atrasada: false
  };
}
var ESC_SEC = { SEC: true };
var ESC_TUDO = { SEC: true, PED: true, FIN: true };

/* 1. conta só o dia de hoje */
var b1 = [
  occ('SEC', 'u1', 'Ana', HOJE, 'concluida'),
  occ('SEC', 'u1', 'Ana', '2026-09-15', 'concluida'),   /* ontem: fora */
  occ('SEC', 'u2', 'Bia', HOJE, 'pendente')
];
ok('1 · só hoje entra na conta',
  (function () { var r = KPI.entreguesHoje(b1, ESC_SEC, HOJE); return { p: r.previstas, e: r.entregues, pct: r.pct }; })(),
  { p: 2, e: 1, pct: 50 });

/* 2. pulada não entra NEM no numerador NEM no denominador
      (mesma regra do resto do sistema — critério paralelo é como se perde a confiança) */
var b2 = [
  occ('SEC', 'u1', 'Ana', HOJE, 'concluida'),
  occ('SEC', 'u2', 'Bia', HOJE, 'pulada'),
  occ('SEC', 'u3', 'Cid', HOJE, 'pendente')
];
ok('2 · pulada fica fora das duas contas',
  (function () { var r = KPI.entreguesHoje(b2, ESC_SEC, HOJE); return { p: r.previstas, e: r.entregues, pct: r.pct }; })(),
  { p: 2, e: 1, pct: 50 });

/* 3. escopo do líder não vaza para outro setor */
var b3 = [
  occ('SEC', 'u1', 'Ana', HOJE, 'concluida'),
  occ('PED', 'u9', 'Zeca', HOJE, 'concluida'),
  occ('PED', 'u9', 'Zeca', HOJE, 'pendente')
];
ok('3 · líder do SEC não vê o PED',
  (function () { var r = KPI.entreguesHoje(b3, ESC_SEC, HOJE); return { p: r.previstas, e: r.entregues, nomes: r.pessoas.map(function (x) { return x.nome; }) }; })(),
  { p: 1, e: 1, nomes: ['Ana'] });
ok('3b · gestor com escopo amplo vê os dois setores',
  (function () { var r = KPI.entreguesHoje(b3, ESC_TUDO, HOJE); return { p: r.previstas, e: r.entregues }; })(),
  { p: 3, e: 2 });

/* 4. dia sem nada previsto: previstas 0 e pct null (NUNCA 0% — 0% diria
      "falhou", e não houve nada a fazer. A tela usa previstas=0 para não
      desenhar o cartão). */
ok('4 · dia vazio devolve pct null, não 0',
  (function () { var r = KPI.entreguesHoje([], ESC_SEC, HOJE); return { p: r.previstas, e: r.entregues, pct: r.pct }; })(),
  { p: 0, e: 0, pct: null });

/* 5. ordem: mais entregas primeiro; empate resolve por nome pt-BR */
var b5 = [
  occ('SEC', 'u2', 'Bia', HOJE, 'concluida'),
  occ('SEC', 'u2', 'Bia', HOJE, 'concluida'),
  occ('SEC', 'u3', 'Ana', HOJE, 'concluida'),
  occ('SEC', 'u4', 'Ávila', HOJE, 'concluida')
];
ok('5 · ordena por quantidade, depois nome pt-BR (Á antes de B)',
  KPI.entreguesHoje(b5, ESC_SEC, HOJE).pessoas.map(function (p) { return p.nome + ':' + p.quantas; }),
  ['Bia:2', 'Ana:1', 'Ávila:1']);

/* 6. relato: fica o MAIS RECENTE da pessoa */
var b6 = [
  occ('SEC', 'u1', 'Ana', HOJE, 'concluida', 'relato antigo', 100),
  occ('SEC', 'u1', 'Ana', HOJE, 'concluida', 'relato novo', 900)
];
ok('6 · guarda o relato mais recente da pessoa',
  KPI.entreguesHoje(b6, ESC_SEC, HOJE).pessoas[0].relato, 'relato novo');

/* 7. concluída sem relato não inventa texto */
var b7 = [occ('SEC', 'u1', 'Ana', HOJE, 'concluida')];
ok('7 · sem relato devolve string vazia, não undefined',
  KPI.entreguesHoje(b7, ESC_SEC, HOJE).pessoas[0].relato, '');

/* 8. ocorrência sem responsável não derruba nem some */
var b8 = [occ('SEC', null, '', HOJE, 'concluida')];
ok('8 · sem responsável vira "(sem responsável)"',
  (function () { var r = KPI.entreguesHoje(b8, ESC_SEC, HOJE); return { e: r.entregues, nome: r.pessoas[0].nome }; })(),
  { e: 1, nome: '(sem responsável)' });

/* 9. entrada suja não explode */
ok('9 · board nulo devolve zeros',
  (function () { var r = KPI.entreguesHoje(null, ESC_SEC, HOJE); return { p: r.previstas, e: r.entregues }; })(),
  { p: 0, e: 0 });
ok('10 · item nulo dentro do board é ignorado',
  (function () { var r = KPI.entreguesHoje([null, occ('SEC', 'u1', 'Ana', HOJE, 'concluida')], ESC_SEC, HOJE); return r.entregues; })(), 1);

/* 11. o corte de n é respeitado (a tela pede 4) */
var b11 = [];
['Ana', 'Bia', 'Cid', 'Dea', 'Eva', 'Fabio'].forEach(function (nm, i) { b11.push(occ('SEC', 'u' + i, nm, HOJE, 'concluida')); });
ok('11 · devolve no máximo n pessoas, mas conta TODAS no total',
  (function () { var r = KPI.entreguesHoje(b11, ESC_SEC, HOJE, 4); return { total: r.entregues, listadas: r.pessoas.length }; })(),
  { total: 6, listadas: 4 });

/* 12. arredondamento do pct bate com o resto do sistema (Math.round) */
var b12 = [];
for (var i = 0; i < 3; i++) { b12.push(occ('SEC', 'u1', 'Ana', HOJE, i === 0 ? 'concluida' : 'pendente')); }
ok('12 · 1 de 3 = 33%', KPI.entreguesHoje(b12, ESC_SEC, HOJE).pct, 33);

/* --- veredito --- */
if (falhas.length) {
  console.error('\n' + falhas.length + ' de ' + n + ' casos FALHARAM:\n');
  falhas.forEach(function (f) { console.error('  ✗ ' + f); });
  process.exit(1);
}
console.log('harness_entregues: ' + n + ' casos OK');
