/* harness R3 · Bloco 1 — lógica pura do lentes.js (setFor/isSocio/ativa) */
global.window = global;                 /* lentes.js publica em window */
require('./lentes.js');
var L = global.GrautLentes;
function eq(a, b, msg) {
  var ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja !== jb) { console.error('FALHA:', msg, '→', ja, '≠', jb); process.exitCode = 1; }
  else { console.log('ok ·', msg); }
}
eq(L.setFor({ perfil: 'usuario' }), ['eufaco', 'numeros'], 'usuário = EU FAÇO + OS NÚMEROS');
eq(L.setFor({ perfil: 'lider' }), ['eufaco', 'eucobro', 'numeros'], 'líder = 3 lentes');
eq(L.setFor({ perfil: 'gestor' }), ['eufaco', 'eucobro', 'numeros'], 'gestor = 3 lentes');
eq(L.setFor(null), ['eufaco', 'numeros'], 'sem user = trata como usuário (fail-safe)');
eq(L.isSocio({ perfilRaw: 'sócio' }), true, 'perfilRaw "sócio" → sócio');
eq(L.isSocio({ perfilRaw: 'Socio-Gestor' }), true, 'perfilRaw "Socio-Gestor" → sócio');
eq(L.isSocio({ perfilRaw: 'gestor' }), false, 'gestor comum não é sócio');
eq(L.isSocio({}), false, 'sem perfilRaw → não é sócio');
eq(L.ativa(), 'eufaco', 'sem mount → lente padrão eufaco (fail-safe dos predicados)');
console.log('harness_r3: fim.');
