/* ============================================================
   GERA · agenda-motor.js — MÓDULO 4 (AGENDA) · lógica pura
   ------------------------------------------------------------
   Sem DOM, sem Firestore, sem rede. Tudo que dá para provar no
   Node mora aqui; a tela (eventos.html) só desenha o resultado.

   O que este arquivo resolve:
   - navegação de tempo (semana e mês), janela de busca e grade;
   - quem foi convidado e o que respondeu, lendo os campos que o
     banco JÁ grava ("convocadosUids", "confirmadosUids",
     "recusas"), nunca campos inventados;
   - a COR do item DERIVADA da origem (nunca gravada no banco):
     convite sem resposta · convite aceito · plano do setor ·
     evento da unidade;
   - recusado fica oculto até pedirem "Mostrar recusados";
   - lista fechada de motivo de recusa (rótulo com acento na
     tela, valor sem acento no banco);
   - quem pode publicar e editar cada item.

   Cor: só nome de token do theme.css. Nenhum hex aqui.
   ES5 puro: sem let/const/arrow/crase/spread/class/async.
   ============================================================ */
(function (root) {
  'use strict';

  var A = {};

  /* =========================================================
     1. DATA — aritmética por dia civil, sem horário de verão
     ========================================================= */

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  A.pad2 = pad2;

  /* 'AAAA-MM-DD' -> {y,m,d} · qualquer outra coisa -> null */
  function parseISO(iso) {
    if (typeof iso !== 'string') { return null; }
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) { return null; }
    var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo < 1 || mo > 12) { return null; }
    if (d < 1 || d > ultimoDiaMes(y, mo)) { return null; }
    return { y: y, m: mo, d: d };
  }
  A.parseISO = parseISO;
  A.isISO = function (iso) { return !!parseISO(iso); };

  function ultimoDiaMes(y, m) {
    if (m === 2) { return ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28; }
    return (m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31;
  }
  A.ultimoDiaMes = ultimoDiaMes;

  function isoDe(y, m, d) { return y + '-' + pad2(m) + '-' + pad2(d); }
  A.isoDe = isoDe;

  /* soma dias em UTC: nunca escorrega por causa de fuso */
  function somaDias(iso, n) {
    var p = parseISO(iso);
    if (!p) { return null; }
    var t = Date.UTC(p.y, p.m - 1, p.d) + (Number(n) || 0) * 86400000;
    var dt = new Date(t);
    return isoDe(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  A.somaDias = somaDias;

  /* 0 = domingo … 6 = sábado */
  function diaSemana(iso) {
    var p = parseISO(iso);
    if (!p) { return -1; }
    return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  }
  A.diaSemana = diaSemana;

  function inicioSemana(iso) {
    var dw = diaSemana(iso);
    if (dw < 0) { return null; }
    return somaDias(iso, -dw);
  }
  A.inicioSemana = inicioSemana;

  function fimSemana(iso) {
    var ini = inicioSemana(iso);
    return ini ? somaDias(ini, 6) : null;
  }
  A.fimSemana = fimSemana;

  /* os 7 dias da semana que contém "iso" */
  A.diasDaSemana = function (iso) {
    var ini = inicioSemana(iso);
    if (!ini) { return []; }
    var out = [], i;
    for (i = 0; i < 7; i++) { out.push(somaDias(ini, i)); }
    return out;
  };

  /* janela que a tela precisa BUSCAR no banco */
  A.janela = function (escopoTempo, ancora) {
    var p = parseISO(ancora);
    if (!p) { return null; }
    if (escopoTempo === 'semana') {
      return { ini: inicioSemana(ancora), fim: fimSemana(ancora) };
    }
    return { ini: isoDe(p.y, p.m, 1), fim: isoDe(p.y, p.m, ultimoDiaMes(p.y, p.m)) };
  };

  /* seta ‹ / › · semana anda 7 dias; mês anda 1 mês com corte no
     último dia (31/01 -> 28/02, não 03/03) */
  A.navegar = function (escopoTempo, ancora, delta) {
    var p = parseISO(ancora);
    if (!p) { return null; }
    var passo = Number(delta) || 0;
    if (escopoTempo === 'semana') { return somaDias(ancora, passo * 7); }
    var total = (p.y * 12) + (p.m - 1) + passo;
    var y = Math.floor(total / 12), m = (total % 12) + 1;
    return isoDe(y, m, Math.min(p.d, ultimoDiaMes(y, m)));
  };

  /* grade do mês: sempre múltiplo de 7, com as bordas dos meses
     vizinhos marcadas como "fora" (célula inerte na tela) */
  A.gradeMes = function (ancora) {
    var p = parseISO(ancora);
    if (!p) { return []; }
    var primeiro = isoDe(p.y, p.m, 1);
    var dow0 = diaSemana(primeiro);
    var nDias = ultimoDiaMes(p.y, p.m);
    var total = Math.ceil((dow0 + nDias) / 7) * 7;
    var out = [], i, iso;
    for (i = 0; i < total; i++) {
      iso = somaDias(primeiro, i - dow0);
      out.push({ iso: iso, dia: parseISO(iso).d, fora: (i < dow0 || i - dow0 >= nDias) });
    }
    return out;
  };

  /* desktop grande abre na SEMANA (padrão Google/Outlook/Notion);
     tela estreita abre no MÊS, que cabe melhor */
  A.escopoTempoPadrao = function (largura) {
    return (Number(largura) || 0) >= 1280 ? 'semana' : 'mes';
  };

  var DOW_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  A.DOW_CURTO = DOW_CURTO;
  A.MESES = MESES;

  A.rotuloDia = function (iso) {
    var p = parseISO(iso);
    if (!p) { return '—'; }
    return DOW_CURTO[diaSemana(iso)] + ' ' + pad2(p.d) + '/' + pad2(p.m);
  };

  /* título da faixa navegada */
  A.rotuloPeriodo = function (escopoTempo, ancora) {
    var p = parseISO(ancora);
    if (!p) { return '—'; }
    if (escopoTempo !== 'semana') { return MESES[p.m - 1] + ' de ' + p.y; }
    var a = parseISO(inicioSemana(ancora)), b = parseISO(fimSemana(ancora));
    if (a.m === b.m) { return pad2(a.d) + ' a ' + pad2(b.d) + ' de ' + MESES[a.m - 1]; }
    return pad2(a.d) + ' de ' + MESES[a.m - 1] + ' a ' + pad2(b.d) + ' de ' + MESES[b.m - 1];
  };

  /* =========================================================
     2. CONVITE — lê os campos que o banco já grava
     ---------------------------------------------------------
     convidados  : convocadosUids  (nome já em uso em reunioes)
                   convidadosUids  aceito como sinônimo
     disse "vou" : confirmadosUids
     recusou     : recusas[uid] = { motivo, detalhe, ts }
     ========================================================= */

  var MOTIVOS_RECUSA = [
    { valor: 'compromisso_trabalho', rotulo: 'Compromisso de trabalho' },
    { valor: 'atendimento_aluno', rotulo: 'Atendimento a aluno' },
    { valor: 'ausencia_justificada', rotulo: 'Ausência justificada' },
    { valor: 'outro', rotulo: 'Outro' }
  ];
  A.MOTIVOS_RECUSA = MOTIVOS_RECUSA;
  var LIMITE_DETALHE = 280;
  A.LIMITE_DETALHE = LIMITE_DETALHE;

  A.rotuloMotivo = function (valor) {
    var i;
    for (i = 0; i < MOTIVOS_RECUSA.length; i++) {
      if (MOTIVOS_RECUSA[i].valor === valor) { return MOTIVOS_RECUSA[i].rotulo; }
    }
    return valor ? String(valor) : '—';
  };

  /* lista fechada + "Outro" exige uma linha de explicação */
  A.motivoValido = function (motivo, detalhe) {
    var achou = false, i;
    for (i = 0; i < MOTIVOS_RECUSA.length; i++) {
      if (MOTIVOS_RECUSA[i].valor === motivo) { achou = true; }
    }
    if (!achou) { return { ok: false, erro: 'Escolha o motivo na lista.' }; }
    var d = (detalhe == null ? '' : String(detalhe)).replace(/^\s+|\s+$/g, '');
    if (motivo === 'outro' && !d) { return { ok: false, erro: 'Explique o motivo "Outro" em uma linha.' }; }
    if (d.length > LIMITE_DETALHE) { return { ok: false, erro: 'O detalhe passa de ' + LIMITE_DETALHE + ' caracteres.' }; }
    return { ok: true, erro: null, detalhe: d || null };
  };

  function arr(v) { return Object.prototype.toString.call(v) === '[object Array]' ? v : []; }

  function convidadosDe(item) {
    if (!item) { return []; }
    var a = arr(item.convocadosUids);
    if (a.length) { return a; }
    return arr(item.convidadosUids);
  }
  A.convidadosDe = convidadosDe;

  A.foiConvidado = function (item, uid) {
    if (!uid) { return false; }
    return convidadosDe(item).indexOf(uid) !== -1;
  };

  /* 'nao_convidado' | 'vou' | 'nao_vou' | 'sem_resposta' */
  function statusConvite(item, uid) {
    if (!item || !uid) { return 'nao_convidado'; }
    var recusas = item.recusas || {};
    var convidado = convidadosDe(item).indexOf(uid) !== -1;
    if (recusas[uid]) { return 'nao_vou'; }
    if (arr(item.confirmadosUids).indexOf(uid) !== -1) { return 'vou'; }
    return convidado ? 'sem_resposta' : 'nao_convidado';
  }
  A.statusConvite = statusConvite;

  A.minhaRecusa = function (item, uid) {
    if (!item || !uid) { return null; }
    return (item.recusas || {})[uid] || null;
  };

  /* contagem para quem convidou: ✓ vou · ✗ não vou · ? sem resposta */
  A.contagemConvites = function (item) {
    var conv = convidadosDe(item);
    var conf = arr(item && item.confirmadosUids);
    var rec = (item && item.recusas) || {};
    var vou = 0, naoVou = 0, sem = 0, i, uid;
    for (i = 0; i < conv.length; i++) {
      uid = conv[i];
      if (rec[uid]) { naoVou++; }
      else if (conf.indexOf(uid) !== -1) { vou++; }
      else { sem++; }
    }
    return { convidados: conv.length, vou: vou, naoVou: naoVou, semResposta: sem };
  };

  /* lembrete do sino: convite sem resposta faltando menos de 24 h.
     "agoraMs" e "inicioMs" entram prontos — o motor não lê relógio. */
  A.precisaLembrete = function (item, uid, agoraMs, inicioMs) {
    if (statusConvite(item, uid) !== 'sem_resposta') { return false; }
    var falta = Number(inicioMs) - Number(agoraMs);
    return falta > 0 && falta <= 86400000;
  };

  /* =========================================================
     3. ORIGEM E COR (D8) — derivadas, nunca gravadas
     ---------------------------------------------------------
     ctx = { uid, escopo: 'unidade'|'setor', setores: {SIGLA:true} }
     Precedência: convite ganha de plano, plano ganha de unidade.
     ========================================================= */

  function ehDoMeuSetor(item, ctx) {
    if (!item || !ctx) { return false; }
    var sig = item.siglaSetor || item.setorSigla || null;
    if (!sig) { return false; }
    return !!(ctx.setores && ctx.setores[sig]);
  }
  A.ehDoMeuSetor = ehDoMeuSetor;

  function origemDe(item, ctx) {
    var uid = ctx && ctx.uid;
    var st = statusConvite(item, uid);
    if (st === 'sem_resposta') { return 'convite_sem_resposta'; }
    if (st === 'vou') { return 'convite_vou'; }
    if (st === 'nao_vou') { return 'convite_recusado'; }
    if (item && item.planoId && ehDoMeuSetor(item, ctx)) { return 'plano_setor'; }
    return 'unidade';
  }
  A.origemDe = origemDe;

  /* token = nome de variável do theme.css (sem hex aqui).
     estilo: 'contorno' (só borda) · 'solido' (preenchido) ·
     'riscado' (recusado, quando o usuário pede para ver). */
  var ESTILO = {
    convite_sem_resposta: { token: 'red', estilo: 'contorno', marca: '?', rotulo: 'Convite sem resposta' },
    convite_vou: { token: 'doing', estilo: 'solido', marca: '✓', rotulo: 'Você disse que vai' },
    convite_recusado: { token: 'muted2', estilo: 'riscado', marca: '✗', rotulo: 'Você recusou' },
    plano_setor: { token: 'green', estilo: 'solido', marca: '▸', rotulo: 'Plano do seu setor' },
    unidade: { token: 'muted2', estilo: 'solido', marca: '•', rotulo: 'Agenda da unidade' }
  };

  A.corDe = function (origem) {
    var e = ESTILO[origem] || ESTILO.unidade;
    return { token: e.token, estilo: e.estilo, marca: e.marca, rotulo: e.rotulo, origem: ESTILO[origem] ? origem : 'unidade' };
  };

  A.corDoItem = function (item, ctx) { return A.corDe(origemDe(item, ctx)); };

  /* legenda fixa da agenda do setor, na ordem em que aparece */
  A.legenda = function () {
    var ordem = ['convite_sem_resposta', 'convite_vou', 'plano_setor', 'unidade'];
    var out = [], i;
    for (i = 0; i < ordem.length; i++) { out.push(A.corDe(ordem[i])); }
    return out;
  };

  /* =========================================================
     4. FILTRO DA TELA
     ========================================================= */

  /* recusado some; só volta com "Mostrar recusados" (riscado) */
  function visivel(item, ctx, mostrarRecusados) {
    if (!item) { return false; }
    if (item.cancelado === true || item.ativo === false) { return false; }
    if (origemDe(item, ctx) === 'convite_recusado' && !mostrarRecusados) { return false; }
    if (ctx && ctx.escopo === 'setor') {
      /* na agenda do setor entra o que é do setor + o que me convidaram */
      if (statusConvite(item, ctx.uid) !== 'nao_convidado') { return true; }
      return ehDoMeuSetor(item, ctx);
    }
    return true;
  }
  A.visivel = visivel;

  A.filtrar = function (lista, ctx, mostrarRecusados) {
    var out = [], i;
    lista = arr(lista);
    for (i = 0; i < lista.length; i++) {
      if (visivel(lista[i], ctx, mostrarRecusados)) { out.push(lista[i]); }
    }
    return out;
  };

  function chaveOrdem(item) {
    return (item.data || '') + ' ' + (item.hora || '99:99') + ' ' + (item.titulo || '');
  }

  A.ordenar = function (lista) {
    return arr(lista).slice().sort(function (a, b) {
      var ka = chaveOrdem(a), kb = chaveOrdem(b);
      return ka < kb ? -1 : (ka > kb ? 1 : 0);
    });
  };

  A.porDia = function (lista) {
    var mapa = {}, i, it;
    lista = A.ordenar(lista);
    for (i = 0; i < lista.length; i++) {
      it = lista[i];
      if (!it || !it.data) { continue; }
      if (!mapa[it.data]) { mapa[it.data] = []; }
      mapa[it.data].push(it);
    }
    return mapa;
  };

  /* caixa "Convites esperando resposta" do topo */
  A.convitesPendentes = function (lista, uid) {
    var out = [], i;
    lista = arr(lista);
    for (i = 0; i < lista.length; i++) {
      if (lista[i] && lista[i].cancelado !== true && lista[i].ativo !== false
        && statusConvite(lista[i], uid) === 'sem_resposta') { out.push(lista[i]); }
    }
    return A.ordenar(out);
  };

  /* =========================================================
     5. CATEGORIA (D6) — ícone junto da cor, nunca cor sozinha
     ========================================================= */

  var CATEGORIAS = [
    { valor: 'palestra', rotulo: 'Palestra', icone: '🎤' },
    { valor: 'reuniao_integrada', rotulo: 'Reunião integrada', icone: '🤝' },
    { valor: 'evento', rotulo: 'Evento', icone: '📌' },
    { valor: 'calendario_escolar', rotulo: 'Calendário escolar', icone: '🏫' }
  ];
  A.CATEGORIAS = CATEGORIAS;

  A.categoriaDe = function (item) {
    var v = item && item.categoria;
    var i;
    for (i = 0; i < CATEGORIAS.length; i++) {
      if (CATEGORIAS[i].valor === v) { return CATEGORIAS[i]; }
    }
    return CATEGORIAS[2]; /* sem categoria gravada = "Evento" */
  };

  A.categoriaValida = function (v) {
    var i;
    for (i = 0; i < CATEGORIAS.length; i++) { if (CATEGORIAS[i].valor === v) { return true; } }
    return false;
  };

  /* =========================================================
     6. PERMISSÃO (D6) — a borda real fica nas Regras; aqui é
     só o que a tela mostra, espelhando o mesmo critério.
     ========================================================= */

  function setoresDoUsuario(user) {
    var mapa = {}, i, lista;
    if (!user) { return mapa; }
    if (user.perfil === 'lider') {
      lista = arr(user.setoresLiderados);
      for (i = 0; i < lista.length; i++) { if (lista[i]) { mapa[lista[i]] = true; } }
    } else if (user.setor) {
      mapa[user.setor] = true;
    }
    return mapa;
  }
  A.setoresDoUsuario = setoresDoUsuario;

  A.podePublicar = function (user) {
    if (!user) { return false; }
    if (user.perfil === 'gestor') { return true; }
    if (user.perfil === 'lider') { return arr(user.setoresLiderados).length > 0; }
    return false;
  };

  /* '*' = qualquer setor (gestor) */
  A.setoresQuePublica = function (user) {
    if (!user) { return []; }
    if (user.perfil === 'gestor') { return ['*']; }
    if (user.perfil === 'lider') { return arr(user.setoresLiderados).slice(); }
    return [];
  };

  /* líder edita só evento do próprio setor que ELE criou; gestor edita tudo */
  A.podeEditar = function (user, evento) {
    if (!user || !evento) { return false; }
    if (user.perfil === 'gestor') { return true; }
    if (user.perfil !== 'lider') { return false; }
    var sig = evento.siglaSetor || evento.setorSigla || null;
    var meus = setoresDoUsuario(user);
    var criador = evento.criadoPorUid || evento.criadoPor || null;
    return !!(sig && meus[sig] && criador && criador === user.uid);
  };

  /* item vindo de plano não se edita na agenda: muda no Planejamento (D7) */
  A.editavelAqui = function (evento) { return !(evento && evento.planoId); };

  /* =========================================================
     7. GRAVAÇÃO DE RESPOSTA — só monta o patch; quem grava é a tela
     ========================================================= */

  A.patchVou = function (item, uid) {
    var conf = arr(item && item.confirmadosUids).slice();
    if (conf.indexOf(uid) === -1) { conf.push(uid); }
    var patch = { confirmadosUids: conf };
    var rec = (item && item.recusas) || {};
    if (rec[uid]) {
      var limpo = {}, k;
      for (k in rec) { if (Object.prototype.hasOwnProperty.call(rec, k) && k !== uid) { limpo[k] = rec[k]; } }
      patch.recusas = limpo;
    }
    return patch;
  };

  A.patchNaoVou = function (item, uid, motivo, detalhe, agoraMs) {
    var v = A.motivoValido(motivo, detalhe);
    if (!v.ok) { return { erro: v.erro, patch: null }; }
    var conf = [], i, antes = arr(item && item.confirmadosUids);
    for (i = 0; i < antes.length; i++) { if (antes[i] !== uid) { conf.push(antes[i]); } }
    var rec = {}, k, orig = (item && item.recusas) || {};
    for (k in orig) { if (Object.prototype.hasOwnProperty.call(orig, k)) { rec[k] = orig[k]; } }
    rec[uid] = { motivo: motivo, detalhe: v.detalhe, ts: Number(agoraMs) || 0 };
    return { erro: null, patch: { confirmadosUids: conf, recusas: rec } };
  };

  /* =========================================================
     export
     ========================================================= */
  root.GrautAgenda = A;
  if (typeof module !== 'undefined' && module.exports) { module.exports = A; }
})(typeof window !== 'undefined' ? window : this);
