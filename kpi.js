/* ============================================================
   kpi.js · Sistema A — Grau Técnico FSA
   ------------------------------------------------------------
   MOTOR DE INDICADORES. Não desenha nada: carrega os dados,
   EXPANDE as ocorrências pela MESMA regra do atividades.html
   (via recorrencia.js) e AGREGA os KPIs de gestão.

   Princípio: todo número sai de dado REAL do Firestore. KPIs que
   dependeriam de campos inexistentes (SLA, "bloqueada", lead time
   por criação/conclusão) NÃO são calculados aqui — melhor não ter
   o número do que inventar.

   Uso (a tela faz):
     KPI.carregar('band').then(KPI.computar).then(function (m) { ... });

   Depende de: window.GrautRecorrencia (recorrencia.js) e firebase.js.
   Carregar como módulo comum: <script src="kpi.js"></script> APÓS
   recorrencia.js. (Ele usa import() dinâmico só para o firebase.)
   ============================================================ */
(function () {
  'use strict';

  var R = window.GrautRecorrencia;

  /* ---------- Firestore (mesmo padrão do atividades.html) ---------- */
  var _fb = null;
  function fb() {
    if (!_fb) {
      _fb = Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js')
      ]).then(function (m) { return { db: m[0].db, f: m[1] }; });
    }
    return _fb;
  }
  function ferr(e) {
    var code = (e && e.code) || '';
    if (code === 'permission-denied') { return Object.assign(new Error('Sem permissão para ler os indicadores. Confirme seu perfil e que as Regras do Firestore foram publicadas.'), { code: code }); }
    if (code === 'unavailable' || code === 'failed-precondition' || code === 'deadline-exceeded') { return Object.assign(new Error('Não consegui falar com o banco agora. Verifique a conexão e tente de novo.'), { code: code }); }
    return Object.assign(new Error((e && e.message) || 'Erro ao ler os indicadores.'), { code: code });
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- janela por período (IDÊNTICA à do atividades.html) ---------- */
  function windowFor(p) {
    var hoje = R.hojeISO();
    if (p === 'semana') { return { jIni: hoje, jFim: R.addDias(hoje, 6) }; }
    if (p === 'mes') {
      var y = parseInt(hoje.slice(0, 4), 10), m = parseInt(hoje.slice(5, 7), 10);
      return { jIni: y + '-' + pad2(m) + '-01', jFim: y + '-' + pad2(m) + '-' + pad2(R.ultimoDiaMes(y, m)) };
    }
    /* "band": 45 dias atrás (dá histórico p/ throughput) + 30 à frente */
    return { jIni: R.addDias(hoje, -45), jFim: R.addDias(hoje, 30) };
  }

  /* ---------- leituras (mesmas queries/where/limit do atividades.html) ---------- */
  function listSetores() {
    return fb().then(function (c) {
      return c.f.getDocs(c.f.collection(c.db, 'setores')).then(function (s) {
        var a = []; s.forEach(function (d) { a.push(d.data()); });
        a.sort(function (x, y) { return (x.ordem || 0) - (y.ordem || 0); });
        return a;
      });
    }).catch(function (e) { throw ferr(e); });
  }
  function listAtividadesAtivas() {
    return fb().then(function (c) {
      var f = c.f, q = f.query(f.collection(c.db, 'atividades'), f.where('ativo', '==', true), f.limit(2000));
      return f.getDocs(q).then(function (s) { var a = []; s.forEach(function (d) { a.push(Object.assign({ id: d.id }, d.data())); }); return a; });
    }).catch(function (e) { throw ferr(e); });
  }
  function listOcorrencias(jIni, jFim) {
    return fb().then(function (c) {
      var f = c.f, q = f.query(f.collection(c.db, 'ocorrencias'), f.where('data', '>=', jIni), f.where('data', '<=', jFim), f.limit(3000));
      return f.getDocs(q).then(function (s) { var a = []; s.forEach(function (d) { a.push(d.data()); }); return a; });
    }).catch(function (e) { throw ferr(e); });
  }

  /* ---------- helpers de setor (mesma lógica multi-homing/cor do atividades.html) ---------- */
  function setoresRaiz(setores) { return setores.filter(function (s) { return !s.setorPaiSigla && s.ativo; }); }
  function setoresDe(act, setores) {
    if (act && act.todosSetores) { return setoresRaiz(setores).map(function (s) { return s.sigla; }); }
    if (act && Array.isArray(act.setorSiglas) && act.setorSiglas.length) { return act.setorSiglas.slice(); }
    return (act && act.setorSigla) ? [act.setorSigla] : [];
  }
  function corSetor(sig, setores) {
    var s = setores.filter(function (x) { return x.sigla === sig; })[0];
    if (!s) { return 'setor1'; }
    if (/^setor[1-8]$/.test(s.cor)) { return s.cor; }
    if (s.setorPaiSigla) { return corSetor(s.setorPaiSigla, setores); }
    var o = s.ordem || 1; return 'setor' + (((o - 1) % 8) + 1);
  }
  function nomeSetor(sig, setores) { var s = setores.filter(function (x) { return x.sigla === sig; })[0]; return s ? (s.nome || sig) : sig; }

  /* ---------- EXPANSÃO: board de ocorrências (idêntico ao buildOccurrences) ---------- */
  function buildBoard(ativ, occDocs, w, hoje) {
    var byAtiv = {};
    occDocs.forEach(function (o) { if (o && o.atividadeId) { (byAtiv[o.atividadeId] = byAtiv[o.atividadeId] || []).push(o); } });
    var out = [];
    ativ.forEach(function (act) {
      var ovs = byAtiv[act.id] || [];
      var occs = R.ocorrenciasNaJanela(act, w.jIni, w.jFim, ovs, hoje);
      occs.forEach(function (oc) {
        var ov = oc.override || null;
        var effDate = (ov && ov.dataOverride) || oc.data;
        var aberto = (oc.status === 'pendente' || oc.status === 'reprogramada' || oc.status === 'em_andamento');
        var resp = (act.responsavelNome || '').trim();
        out.push({
          act: act,
          origData: oc.data,
          effDate: effDate,
          status: oc.status,
          responsavel: resp,
          semResp: !resp,
          atrasada: aberto && R.compareISO(effDate, hoje) < 0
        });
      });
    });
    return out;
  }

  /* segunda-feira da semana civil de uma data (chave de agrupamento p/ throughput) */
  function semanaChave(iso) {
    var d = R.fromISO(iso);
    var dow = (d.getDay() + 6) % 7; /* 0 = segunda */
    return R.addDias(iso, -dow);
  }

  /* ---------- COMPUTAÇÃO DOS KPIs (puro: recebe o contexto, devolve números) ---------- */
  function computar(ctx) {
    var board = ctx.board, hoje = ctx.hoje, setores = ctx.setores, ativ = ctx.ativ;

    var ateHoje = board.filter(function (o) { return R.compareISO(o.effDate, hoje) <= 0; });
    var prevAteHoje = ateHoje.filter(function (o) { return o.status !== 'pulada'; });          /* previstas: exclui puladas */
    var conclAteHoje = ateHoje.filter(function (o) { return o.status === 'concluida'; });
    var atrasadas = board.filter(function (o) { return o.atrasada; });
    var andamento = board.filter(function (o) { return o.status === 'em_andamento'; });
    var concluidas = board.filter(function (o) { return o.status === 'concluida'; });
    var puladas = board.filter(function (o) { return o.status === 'pulada'; });
    var reprogramadas = board.filter(function (o) { return o.status === 'reprogramada'; });
    var abertas = board.filter(function (o) { return o.status === 'pendente' || o.status === 'em_andamento' || o.status === 'reprogramada'; });

    /* OMTM: aderência à rotina = concluídas até hoje ÷ previstas até hoje */
    var aderencia = prevAteHoje.length ? Math.round(conclAteHoje.length / prevAteHoje.length * 100) : null;

    /* aging das atrasadas: média + faixas */
    var agingSoma = 0, faixas = { f03: 0, f47: 0, f815: 0, f15: 0 };
    atrasadas.forEach(function (o) {
      var d = R.diasEntre(o.effDate, hoje); agingSoma += d;
      if (d <= 3) { faixas.f03++; } else if (d <= 7) { faixas.f47++; } else if (d <= 15) { faixas.f815++; } else { faixas.f15++; }
    });
    var agingMedio = atrasadas.length ? (agingSoma / atrasadas.length) : 0;

    /* carga por responsável = abertas (pendente + em andamento + reprogramada) por pessoa */
    var cargaMap = {};
    abertas.forEach(function (o) { var r = o.responsavel || '(sem responsável)'; cargaMap[r] = (cargaMap[r] || 0) + 1; });
    var carga = Object.keys(cargaMap).map(function (k) { return { nome: k, n: cargaMap[k] }; }).sort(function (a, b) { return b.n - a.n; });
    var semResp = abertas.filter(function (o) { return o.semResp; }).length;

    /* por setor (multi-homing: conta em cada setor onde a atividade aparece) */
    var setorMap = {};
    function bkt(sig) { return setorMap[sig] || (setorMap[sig] = { sig: sig, previstas: 0, concluidas: 0, atrasadas: 0 }); }
    ateHoje.forEach(function (o) {
      var sigs = setoresDe(o.act, setores); if (!sigs.length) { sigs = ['—']; }
      sigs.forEach(function (sig) {
        var b = bkt(sig);
        if (o.status !== 'pulada') { b.previstas++; if (o.status === 'concluida') { b.concluidas++; } }
        if (o.atrasada) { b.atrasadas++; }
      });
    });
    var porSetor = Object.keys(setorMap).map(function (k) {
      var b = setorMap[k]; b.aderencia = b.previstas ? Math.round(b.concluidas / b.previstas * 100) : null; return b;
    }).sort(function (a, b) {
      if (b.atrasadas !== a.atrasadas) { return b.atrasadas - a.atrasadas; }              /* mais atrasadas primeiro (Pareto) */
      return (a.aderencia == null ? 999 : a.aderencia) - (b.aderencia == null ? 999 : b.aderencia);
    });

    /* throughput por semana = concluídas (com effDate até hoje) agrupadas por semana */
    var semMap = {};
    concluidas.forEach(function (o) {
      if (R.compareISO(o.effDate, hoje) > 0) { return; }
      var k = semanaChave(o.effDate); semMap[k] = (semMap[k] || 0) + 1;
    });
    var throughput = Object.keys(semMap).sort().map(function (k) { return { semana: k, n: semMap[k] }; });

    /* reprogramação (evasão de prazo) = reprogramadas ÷ total de ocorrências da janela */
    var reprogPct = board.length ? Math.round(reprogramadas.length / board.length * 100) : 0;

    return {
      janela: ctx.janela, periodo: ctx.periodo, hoje: hoje, setores: setores,
      totais: {
        ocorrencias: board.length,
        previstasAteHoje: prevAteHoje.length,
        concluidasAteHoje: conclAteHoje.length,
        atrasadas: atrasadas.length,
        andamento: andamento.length,
        concluidas: concluidas.length,
        puladas: puladas.length,
        reprogramadas: reprogramadas.length,
        abertas: abertas.length,
        semResp: semResp,
        atividadesAtivas: ativ.length
      },
      aderencia: aderencia,
      agingMedio: agingMedio,
      faixasAging: faixas,
      carga: carga,
      porSetor: porSetor,
      throughput: throughput,
      reprogPct: reprogPct
    };
  }

  /* ---------- API pública ---------- */
  window.KPI = {
    windowFor: windowFor,
    corSetor: corSetor,
    nomeSetor: nomeSetor,
    setoresDe: setoresDe,
    computar: computar,
    /* usado em testes: expõe a expansão pura */
    _buildBoard: buildBoard,
    carregar: function (periodo) {
      periodo = periodo || 'band';
      var w = windowFor(periodo);
      var hoje = R.hojeISO();
      return Promise.all([listSetores(), listAtividadesAtivas(), listOcorrencias(w.jIni, w.jFim)])
        .then(function (r) {
          var setores = r[0], ativ = r[1], occ = r[2];
          var board = buildBoard(ativ, occ, w, hoje);
          return { board: board, setores: setores, ativ: ativ, janela: w, hoje: hoje, periodo: periodo };
        });
    }
  };
})();
