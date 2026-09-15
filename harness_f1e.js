/* HARNESS F1-E — helpers puros do kpi.js (reuniões).
   Esperados calculados À MÃO no ARCH da sessão. Roda em Node:
   stubs mínimos de window + recorrencia.js real.                */
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

/* ---------- pautaSetores (0.1) ---------- */
var SETS = [
  { sigla: 'PED', nome: 'Pedagógico', ativo: true },
  { sigla: 'SEC', nome: 'Secretaria', ativo: true },
  { sigla: 'CRA', nome: 'CRA', ativo: true },
  { sigla: 'GES', nome: 'Gestão', ativo: true },
  { sigla: 'QLD', nome: 'Qualidade', ativo: false }
];
var POR = [
  { sig: 'PED', previstas: 10, prevVencidas: 5, aderencia: 70 },
  { sig: 'SEC', previstas: 8, prevVencidas: 0, aderencia: 5 },
  { sig: 'QLD', previstas: 3, prevVencidas: 3, aderencia: 0 },
  { sig: '—', previstas: 2, prevVencidas: 2, aderencia: 0 },
  { sig: 'CRA', previstas: 4, prevVencidas: 2, aderencia: 90 },
  { sig: 'GES', previstas: 0, prevVencidas: 0, aderencia: null }
];
var ps = K.pautaSetores(POR, SETS, 80);
t('pauta.abaixo = só PED (SEC coleta, QLD morta, CRA ok)', ps.abaixo.map(function (s) { return s.sig; }), ['PED']);
t('pauta.coletando = SEC (previsto sem vencido)', ps.coletando.map(function (s) { return s.sig; }), ['SEC']);
t('pauta.mortas = QLD (inativa no cadastro)', ps.mortas, ['QLD']);

/* ---------- bandaConsecutiva (4.1) ---------- */
var SNAPS = [
  { data: '2026-07-13', porSetor: { PED: { ader: 70 }, SEC: { ader: 60 }, CRA: { ader: 70 }, GES: {} } },
  { data: '2026-07-14', porSetor: { PED: { ader: 75 }, SEC: { ader: 50 }, CRA: { ader: 70 } } },
  { data: '2026-07-15', porSetor: { PED: { ader: 79 }, CRA: { ader: 85 }, GES: { ader: 60 } } }
];
t('banda PED 3 dias <80 = obrigatória', K.bandaConsecutiva(SNAPS, 'PED', 80), { n: 3, obrigatoria: true, atencao: false, fotos: 3 });
t('banda SEC ausente no último = quebra (n=0)', K.bandaConsecutiva(SNAPS, 'SEC', 80).n, 0);
t('banda CRA último >=80 = n=0', K.bandaConsecutiva(SNAPS, 'CRA', 80).n, 0);
t('banda GES só 1 abaixo = atenção', K.bandaConsecutiva(SNAPS, 'GES', 80), { n: 1, obrigatoria: false, atencao: true, fotos: 3 });
t('banda com 1 foto nunca é obrigatória', K.bandaConsecutiva([{ data: '2026-07-15', porSetor: { PED: { ader: 10 } } }], 'PED', 80).obrigatoria, false);
t('banda ader null quebra a sequência', K.bandaConsecutiva([{ data: '2026-07-15', porSetor: { PED: { ader: null } } }], 'PED', 80).n, 0);

/* ---------- convocadosPorTipo (B1) ---------- */
var SET2 = [
  { sigla: 'PED', ativo: true }, { sigla: 'PAD', setorPaiSigla: 'PED', ativo: true },
  { sigla: 'GES', ativo: true }, { sigla: 'SOC', ativo: true }
];
var US = [
  { uid: 'u1', nome: 'Bruno', perfil: 'gestor', setor: 'GES', setoresLiderados: [] },
  { uid: 'u2', nome: 'Ana', perfil: 'lider', setor: 'PED', setoresLiderados: ['PED'] },
  { uid: 'u3', nome: 'Zé', perfil: 'lider', setor: 'PAD', setoresLiderados: ['PAD'] },
  { uid: 'u4', nome: 'Rita', perfil: 'usuario', setor: 'PAD', setoresLiderados: [] },
  { uid: 'u5', nome: 'Marta', perfil: 'usuario', setor: 'SOC', setoresLiderados: [] },
  { uid: 'u6', nome: 'Caio', perfil: 'lider', setor: 'GES', setoresLiderados: ['SOC'] }
];
function uids(a) { return a.map(function (x) { return x.uid; }); }
t('lideres = criador + líderes + gestor', uids(K.convocadosPorTipo('lideres', US, SET2, { uid: 'u1', nome: 'Bruno' })), ['u1', 'u2', 'u3', 'u6']);
t('integrada = líderes + gestor + sócios', uids(K.convocadosPorTipo('integrada', US, SET2, { uid: 'u1', nome: 'Bruno' })), ['u1', 'u2', 'u3', 'u6', 'u5']);
t('instrutor = só quem criou', uids(K.convocadosPorTipo('instrutor', US, SET2, { uid: 'u2', nome: 'Ana' })), ['u2']);
t('lideres_turma = só quem criou', uids(K.convocadosPorTipo('lideres_turma', US, SET2, { uid: 'u1', nome: 'Bruno' })), ['u1']);
t('departamento PED = líder da raiz + líder e lotados do subsetor', uids(K.convocadosPorTipo('departamento', US, SET2, { uid: 'u1', nome: 'Bruno' }, 'PED')), ['u1', 'u2', 'u3', 'u4']);
t('departamento PAD = líder do pai cobre + líder/lotados do PAD', uids(K.convocadosPorTipo('departamento', US, SET2, { uid: 'u1', nome: 'Bruno' }, 'PAD')), ['u1', 'u2', 'u3', 'u4']);
t('ehSocio por lotação SOC', K.ehSocio(US[4]), true);
t('ehSocio por liderança SOC', K.ehSocio(US[5]), true);
t('ehSocio falso p/ líder comum', K.ehSocio(US[1]), false);

/* ---------- statusDecisao (4.2) ---------- */
var HOJE = '2026-07-16';
function ms(y, m, d) { return new Date(y, m - 1, d, 12, 0, 0).getTime(); }
t('decisão sem atividade aberta', K.statusDecisao({ aberta: true }, null, HOJE).chave, 'aberta');
t('decisão resolvida na reunião', K.statusDecisao({ aberta: false }, null, HOJE).chave, 'resolvida');
t('convertida sem occ na janela = indisponível (R7·B1.4: nunca "em aberto")', K.statusDecisao({ atividadeId: 'a1', aberta: false }, null, HOJE).chave, 'sem_janela');
t('feita no prazo (dia da conclusão <= prazo)', K.statusDecisao({ atividadeId: 'a1' }, { status: 'concluida', effDate: '2026-07-10', ov: { concluidaEm: ms(2026, 7, 10) } }, HOJE).chave, 'no_prazo');
t('feita com atraso (dia > prazo)', K.statusDecisao({ atividadeId: 'a1' }, { status: 'concluida', effDate: '2026-07-10', ov: { concluidaEm: ms(2026, 7, 12) } }, HOJE).chave, 'atraso');
t('feita sem hora registrada = feita (neutro)', K.statusDecisao({ atividadeId: 'a1' }, { status: 'concluida', effDate: '2026-07-10', ov: {} }, HOJE).chave, 'feita');
t('aberta com prazo passado = vencida', K.statusDecisao({ atividadeId: 'a1' }, { status: 'pendente', effDate: '2026-07-10' }, HOJE).chave, 'vencida');
t('aberta com prazo futuro = em aberto', K.statusDecisao({ atividadeId: 'a1' }, { status: 'pendente', effDate: '2026-07-20' }, HOJE).chave, 'aberta');

/* ---------- minutosEntreHoras (B2) ---------- */
t('atraso 17min', K.minutosEntreHoras('09:00', '09:17'), 17);
t('adiantada -10min', K.minutosEntreHoras('09:00', '08:50'), -10);
t('hora inválida = null', K.minutosEntreHoras('9:00', '09:10'), null);
t('hora ausente = null', K.minutosEntreHoras(null, '09:00'), null);

/* ---------- truncarCorpo (3.3) ---------- */
var LONGO = new Array(2001).join('x'); /* 2000 chars */
var tr = K.truncarCorpo(LONGO, 1800);
t('truncado cabe no teto', tr.length <= 1800, true);
t('truncado termina no aviso GERA', tr.slice(-5), 'GERA.');
t('curto passa intacto', K.truncarCorpo('abc', 1800), 'abc');

console.log('\n' + ok + ' PASS · ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
