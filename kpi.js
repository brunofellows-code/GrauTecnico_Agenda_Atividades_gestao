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

  /* ---------- F1-C · ESCOPO DE VISIBILIDADE POR PAPEL — 4 NÍVEIS (RBAC de conteúdo) ----------
     Predicado PURO: esta atividade é visível para este usuário?
       gestor           -> tudo.
       líder de RAIZ     -> a raiz que lidera + TODOS os subsetores filhos dela
                            (coordenador do setor inteiro).
       líder de SUBSETOR -> só o subsetor que lidera (nada das genéricas do pai).
       usuário           -> só se é o responsável (responsavelUid === uid).
     A atividade "todos os setores" conta como visível para qualquer líder.
     Acoplamento por SIGLA (Princípio 18); zero leitura extra de banco.

     Contrato do dado (HEAD 68fa849): a atividade grava setorSigla/setorSiglas (raiz)
     e, opcional, subsetorSigla; o subsetor é um doc de 'setores' com setorPaiSigla != null. */

  /* Expande as siglas lideradas para o CONJUNTO efetivo que o líder enxerga:
     - sigla RAIZ     -> inclui a própria + toda sigla cujo setorPaiSigla === ela.
     - sigla SUBSETOR -> inclui só ela (subsetor não tem filhos).
     Devolve um mapa { sigla: true } (busca O(1)). */
  function escopoLider(lidSiglas, setores) {
    var set = {};
    var lid = Array.isArray(lidSiglas) ? lidSiglas : [];
    var sets = Array.isArray(setores) ? setores : [];
    for (var i = 0; i < lid.length; i++) {
      var sig = lid[i];
      if (!sig) { continue; }
      set[sig] = true;
      for (var j = 0; j < sets.length; j++) {
        if (sets[j] && sets[j].setorPaiSigla === sig) { set[sets[j].sigla] = true; }
      }
    }
    return set;
  }

  function visivelPara(act, user, setores) {
    if (!user) { return false; }
    if (user.perfil === 'gestor') { return true; }
    if (user.perfil === 'lider') {
      var lid = Array.isArray(user.setoresLiderados) ? user.setoresLiderados : [];
      if (!lid.length) { return false; }
      if (act && act.todosSetores) { return true; }
      var esc = escopoLider(lid, setores);
      /* raiz(es) da atividade caem no escopo? (líder de raiz cobre as suas) */
      var sigs = setoresDe(act, setores);
      for (var i = 0; i < sigs.length; i++) { if (esc[sigs[i]]) { return true; } }
      /* subsetor exato da atividade cai no escopo? (líder de subsetor cobre só o seu) */
      if (act && act.subsetorSigla && esc[act.subsetorSigla]) { return true; }
      return false;
    }
    if (user.perfil === 'usuario') {
      return !!(act && act.responsavelUid && user.uid && act.responsavelUid === user.uid);
    }
    return false; /* papel desconhecido -> nada (fail-safe) */
  }

  /* Recorta um contexto de KPI.carregar() ao escopo do usuário: filtra board
     E ativ pelo MESMO predicado, de modo que porSetor, totais, carga, aging e
     ranking por pessoa saiam todos coerentes com o escopo. Gestor -> devolve o
     ctx intacto (custo zero). Não muta o ctx original (devolve cópia rasa). */
  function recortarContexto(ctx, user) {
    if (!ctx || !user || user.perfil === 'gestor') { return ctx; }
    var setores = ctx.setores;
    return {
      board: (ctx.board || []).filter(function (o) { return visivelPara(o.act, user, setores); }),
      ativ: (ctx.ativ || []).filter(function (a) { return visivelPara(a, user, setores); }),
      setores: ctx.setores, janela: ctx.janela, hoje: ctx.hoje, periodo: ctx.periodo
    };
  }

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
          uid: act.responsavelUid || null,   /* N3: chave da pessoa (FK real p/ usuarios) */
          ov: ov,                            /* N3: override (iniciadaEm/concluidaEm p/ ciclo e prazo) */
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
    /* F1-D: previstas VENCIDAS = já deviam ter acontecido (effDate < hoje). O que vence
       HOJE ainda não é atraso às 9h — partida fria não pode punir com 0% falso. */
    var prevVencidas = prevAteHoje.filter(function (o) { return R.compareISO(o.effDate, hoje) < 0; });
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
    function bkt(sig) { return setorMap[sig] || (setorMap[sig] = { sig: sig, previstas: 0, prevVencidas: 0, concluidas: 0, atrasadas: 0, agingSoma: 0, carga: 0 }); }
    ateHoje.forEach(function (o) {
      var sigs = setoresDe(o.act, setores); if (!sigs.length) { sigs = ['—']; }
      sigs.forEach(function (sig) {
        var b = bkt(sig);
        if (o.status !== 'pulada') { b.previstas++; if (R.compareISO(o.effDate, hoje) < 0) { b.prevVencidas++; } if (o.status === 'concluida') { b.concluidas++; } }
        if (o.atrasada) { b.atrasadas++; b.agingSoma += R.diasEntre(o.effDate, hoje); }
      });
    });
    /* N2: carga (abertas, incl. futuras da janela) por setor — insumo do score/gargalo */
    abertas.forEach(function (o) {
      var sigs = setoresDe(o.act, setores); if (!sigs.length) { sigs = ['—']; }
      sigs.forEach(function (sig) { bkt(sig).carga++; });
    });
    var porSetor = Object.keys(setorMap).map(function (k) {
      var b = setorMap[k];
      b.aderencia = b.previstas ? Math.round(b.concluidas / b.previstas * 100) : null;
      b.agingMedio = b.atrasadas ? Math.round(b.agingSoma / b.atrasadas * 10) / 10 : 0;
      return b;
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
        previstasVencidas: prevVencidas.length, /* F1-D: base honesta da partida fria */
        ativSemResp: (ativ || []).filter(function (x) { return !x.responsavelUid; }).length, /* F1-D: backlog sem dono (séries) */
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

  /* ============================================================
     N2 · MATEMÁTICA VALIDADA (27/27 no harness_n2.js) — merge.
     Corpo IDÊNTICO ao kpi_ext_n2.js; só o prefixo muda (KPI._),
     conforme o contrato do ARCH_N2N3N4_NOTURNO.md.
     ============================================================ */
  var K = window.KPI;
  K.visivelPara = visivelPara;              /* F1-B: predicado de visibilidade por papel (F1-C: subsetor) */
  K.recortarContexto = recortarContexto;    /* F1-B: recorte de ctx (board+ativ) ao escopo do papel */
  K.escopoLider = escopoLider;              /* F1-C: expande siglas lideradas (raiz -> + filhos) */

  /* SCORE DE SETOR 0–100 · pesos DECLARADOS no "i": aderência 50 ·
     atrasadas 30 · aging 20.
       compA = aderência (%)
       compB = 100 − min(100, %atrasadas)      (menor = melhor)
       compC = 100 − aging×12,5, piso 0        (0d=100 · 4d=50 · 8d+=0)
       score = arred(0,5·A + 0,3·B + 0,2·C)
     Semáforo: ≥80 ok · 60–79 warn · <60 bad */
  K._score = function (aderPct, pctAtrasadas, agingMedio) {
    var a = Math.max(0, Math.min(100, Number(aderPct) || 0));
    var b = 100 - Math.max(0, Math.min(100, Number(pctAtrasadas) || 0));
    var c = Math.max(0, 100 - (Number(agingMedio) || 0) * 12.5);
    var s = Math.round(0.5 * a + 0.3 * b + 0.2 * c);
    var tom = s >= 80 ? 'ok' : (s >= 60 ? 'warn' : 'bad');
    return { score: s, tom: tom, compA: a, compB: b, compC: Math.round(c) };
  };

  /* Mediana simples (régua de carga do detector). */
  K._mediana = function (arr) {
    if (!arr || !arr.length) { return 0; }
    var v = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(v.length / 2);
    return (v.length % 2) ? v[m] : (v[m - 1] + v[m]) / 2;
  };

  /* DETECTOR DE GARGALO · regra EXPLÍCITA:
       gargalo se aderência < 80
       OU (atrasadas > 0 E aging ≥ 4d E carga > 1,5 × mediana)
     Entrada: [{sigla, ader, atrasadas, agingMedio, carga}]
     Saída:   [{sigla, motivo}] — texto pronto p/ Plano de ação */
  K._gargalos = function (setores) {
    var out = [];
    if (!setores || !setores.length) { return out; }
    var cargas = [];
    for (var i = 0; i < setores.length; i++) { cargas.push(Number(setores[i].carga) || 0); }
    var med = K._mediana(cargas);
    var teto = 1.5 * med;
    for (var j = 0; j < setores.length; j++) {
      var s = setores[j];
      var ader = Number(s.ader) || 0;
      var atr = Number(s.atrasadas) || 0;
      var ag = Number(s.agingMedio) || 0;
      var cg = Number(s.carga) || 0;
      if (ader < 80) {
        out.push({ sigla: s.sigla, motivo: 'aderência ' + ader + '% < 80%' });
      } else if (atr > 0 && ag >= 4 && cg > teto) {
        out.push({ sigla: s.sigla, motivo: atr + ' atrasada(s) · aging ' +
          String(ag).replace('.', ',') + 'd ≥ 4d · carga ' + cg + ' > 1,5×mediana (' +
          String(teto).replace('.', ',') + ')' });
      }
    }
    return out;
  };

  /* Data − N dias (dia civil LOCAL — Salvador). */
  K._dataMenos = function (iso, dias) {
    var p = iso.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() - dias);
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  };

  /* TENDÊNCIA · Δ vs 7 dias, sobre snapshots diários.
     base = snapshot mais recente com data ≤ hoje−7d; sem base →
     suficiente:false + coletando 'X/7'. NUNCA inventa tendência. */
  K._trend = function (snapshots, chave, hoje) {
    var lista = (snapshots || []).slice().sort(function (a, b) {
      return a.data < b.data ? -1 : (a.data > b.data ? 1 : 0);
    });
    var corte = K._dataMenos(hoje, 7);
    var base = null, atual = null;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].data <= corte) { base = lista[i]; }
      if (lista[i].data <= hoje) { atual = lista[i]; }
    }
    if (!base || !atual) {
      var n = Math.min(lista.length, 7);
      return { suficiente: false, coletando: n + '/7', delta7: null, valorHoje: atual ? atual[chave] : null };
    }
    return {
      suficiente: true,
      coletando: null,
      valorHoje: atual[chave],
      valorBase: base[chave],
      dataBase: base.data,
      delta7: Math.round(((Number(atual[chave]) || 0) - (Number(base[chave]) || 0)) * 10) / 10
    };
  };

  /* Formata o Δ com semântica invertível (ClearPoint):
     menorMelhor=true (atrasadas, aging, reprog): queda = ok. */
  K._deltaFmt = function (delta, menorMelhor) {
    if (delta === null || delta === undefined) { return { texto: '—', tom: 'flat' }; }
    var d = Number(delta) || 0;
    var txt = (d > 0 ? '+' : '') + String(d).replace('.', ',');
    if (d === 0) { return { texto: '0', tom: 'flat' }; }
    var bom = menorMelhor ? (d < 0) : (d > 0);
    return { texto: txt, tom: bom ? 'ok' : 'bad' };
  };

  /* SPARKLINE · atributo points de <polyline> a partir dos ÚLTIMOS
     ≤14 valores; série constante → linha no meio; <2 pts → ''. */
  K._sparkPoints = function (valores, w, h) {
    var v = (valores || []).slice(-14);
    if (v.length < 2) { return ''; }
    var pad = 2, min = v[0], max = v[0], i;
    for (i = 1; i < v.length; i++) {
      if (v[i] < min) { min = v[i]; }
      if (v[i] > max) { max = v[i]; }
    }
    var span = max - min;
    var pts = [];
    for (i = 0; i < v.length; i++) {
      var x = pad + (i / (v.length - 1)) * (w - 2 * pad);
      var y = (span === 0) ? h / 2 : (h - pad) - ((v[i] - min) / span) * (h - 2 * pad);
      pts.push((Math.round(x * 10) / 10) + ',' + (Math.round(y * 10) / 10));
    }
    return pts.join(' ');
  };

  /* ============================================================
     N2 · SNAPSHOTS DIÁRIOS — coleção kpi_snapshots (1 doc/dia,
     id = YYYY-MM-DD; campo `data` duplica o id de propósito para
     permitir where('data','>=',X)+orderBy('data')+limit sem range
     em documentId). Acoplamento por SIGLA (Princípio 18).
     ============================================================ */

  /* Monta o payload do snapshot a partir do modelo de computar(). */
  K.snapshotDoc = function (m) {
    var porSetor = {};
    m.porSetor.forEach(function (s) {
      if (s.sig === '—') { return; }
      porSetor[s.sig] = {
        ader: s.aderencia == null ? null : s.aderencia,
        atrasadas: s.atrasadas,
        agingMedio: s.agingMedio || 0,
        carga: s.carga || 0
      };
    });
    var t = m.totais;
    var ultima = m.throughput.length ? m.throughput[m.throughput.length - 1] : null;
    var thrSem = (ultima && ultima.semana === semanaChave(m.hoje)) ? ultima.n : 0;
    return {
      data: m.hoje,
      aderencia: m.aderencia == null ? null : m.aderencia, /* null = sem previstas (honesto; nunca 0 falso) */
      atrasadas: t.atrasadas,
      pctAtrasadas: t.abertas ? Math.round(t.atrasadas / t.abertas * 100) : 0,
      agingMedio: Math.round(m.agingMedio * 10) / 10,
      abertas: t.abertas,
      andamento: t.andamento,
      throughputSemana: thrSem,
      reprogPct: m.reprogPct,
      /* F1-J: CONTAGENS de risco na foto (Crítico/Em risco) — tendência Δ7d
         da lente sem jamais persistir score por atividade (derivado). Quem
         chama anexa m.riscoCriticos/m.riscoEmRisco; ausente = null (honesto). */
      riscoCriticos: m.riscoCriticos == null ? null : m.riscoCriticos,
      riscoEmRisco: m.riscoEmRisco == null ? null : m.riscoEmRisco,
      porSetor: porSetor
    };
  };

  /* Gravação IDEMPOTENTE (getDoc antes de setDoc; nunca update).
     Quem chama decide o perfil (Admin/Editor) e trata a falha —
     falha de gravação NÃO pode quebrar o dashboard. */
  K.gravarSnapshotHoje = function (m, uid) {
    return fb().then(function (c) {
      var f = c.f, ref = f.doc(c.db, 'kpi_snapshots', m.hoje);
      return f.getDoc(ref).then(function (snap) {
        if (snap.exists()) { return { gravado: false, motivo: 'ja-existe' }; }
        var payload = Object.assign(K.snapshotDoc(m), {
          criadoEm: f.serverTimestamp(),
          criadoPorUid: uid || null
        });
        return f.setDoc(ref, payload).then(function () { return { gravado: true }; });
      });
    });
  };

  /* ============================================================
     N3 · PERFORMANCE POR PESSOA — agrega o board JÁ EXPANDIDO por
     carregar()/buildBoard (PROIBIDO re-expandir a recorrência).
     Chave = responsavelUid (FK real); nome vem denormalizado da
     atividade (responsavelNome) — zero leitura extra de usuarios.
     Datas comparadas por DIA CIVIL LOCAL (Salvador, UTC-3).
     ============================================================ */
  K.computarPorPessoa = function (ctx) {
    var board = ctx.board, hoje = ctx.hoje, setores = ctx.setores;
    var corte28 = K._dataMenos(hoje, 28);
    var map = {};
    function pb(uid, nome) {
      var k = uid || '(sem)';
      return map[k] || (map[k] = {
        uid: uid || null, nome: uid ? (nome || '(sem nome)') : '(sem responsável)',
        total: 0, previstas: 0, prevVencidas: 0, concluidasAteHoje: 0, concluidasTotal: 0,
        noPrazo: 0, atrasadas: 0, agingSoma: 0, carga: 0, reprogramadas: 0,
        cicloSomaMs: 0, pares: 0, thr4n: 0, sigs: {}
      });
    }
    board.forEach(function (o) {
      var p = pb(o.uid, o.responsavel);
      p.total++;
      setoresDe(o.act, setores).forEach(function (sig) { p.sigs[sig] = true; });
      var ateHoje = R.compareISO(o.effDate, hoje) <= 0;
      if (ateHoje && o.status !== 'pulada') {
        p.previstas++;
        if (R.compareISO(o.effDate, hoje) < 0) { p.prevVencidas++; }
        if (o.status === 'concluida') { p.concluidasAteHoje++; }
      }
      if (o.status === 'concluida') {
        p.concluidasTotal++;
        var ov = o.ov || {};
        if (ov.concluidaEm) {
          /* conclusão no prazo: dia civil LOCAL da conclusão ≤ data efetiva */
          var diaConcl = R.toISO(new Date(Number(ov.concluidaEm)));
          if (R.compareISO(diaConcl, o.effDate) <= 0) { p.noPrazo++; }
          /* tempo de ciclo: SÓ com o par completo — nunca inventa */
          if (ov.iniciadaEm) { p.cicloSomaMs += (Number(ov.concluidaEm) - Number(ov.iniciadaEm)); p.pares++; }
        }
        if (ateHoje && R.compareISO(o.effDate, corte28) > 0) { p.thr4n++; }
      }
      if (o.status === 'reprogramada') { p.reprogramadas++; }
      if (o.status === 'pendente' || o.status === 'em_andamento' || o.status === 'reprogramada') { p.carga++; }
      if (o.atrasada) { p.atrasadas++; p.agingSoma += R.diasEntre(o.effDate, hoje); }
    });
    var pessoas = [], semResp = null;
    Object.keys(map).forEach(function (k) {
      var p = map[k];
      p.ader = p.previstas ? Math.round(p.concluidasAteHoje / p.previstas * 100) : null;
      p.pctNoPrazo = p.concluidasTotal ? Math.round(p.noPrazo / p.concluidasTotal * 100) : null;
      p.cicloDias = p.pares ? Math.round(p.cicloSomaMs / p.pares / 86400000 * 10) / 10 : null;
      p.agingMedio = p.atrasadas ? Math.round(p.agingSoma / p.atrasadas * 10) / 10 : 0;
      p.reprogPct = p.total ? Math.round(p.reprogramadas / p.total * 100) : 0;
      p.thr4 = Math.round(p.thr4n / 4 * 10) / 10;
      p.pctAtrasadas = p.carga ? Math.round(p.atrasadas / p.carga * 100) : 0;
      if (p.ader == null) { p.score = null; p.tom = 'flat'; }         /* sem previstas → sem score (honesto) */
      else if (p.prevVencidas === 0) { p.score = null; p.tom = 'flat'; p.coletando = true; } /* F1-D: partida fria — nada venceu ainda; medir amanhã, não punir hoje */
      else { var sc = K._score(p.ader, p.pctAtrasadas, p.agingMedio); p.score = sc.score; p.tom = sc.tom; p.comp = sc; }
      p.setores = Object.keys(p.sigs).sort();
      delete p.sigs;
      if (!p.uid) { semResp = p; } else { pessoas.push(p); }
    });
    pessoas.sort(function (a, b) {                                     /* pior score primeiro = onde agir */
      if (a.score == null && b.score == null) { return b.carga - a.carga; }
      if (a.score == null) { return 1; }
      if (b.score == null) { return -1; }
      return a.score - b.score;
    });
    return { pessoas: pessoas, semResp: semResp, hoje: hoje, periodo: ctx.periodo, janela: ctx.janela, setores: setores };
  };

  /* Leitura da tendência: últimos 20 dias (where em `data`, mesmo
     campo do orderBy → índice simples, sem índice composto).
     Falha (ex.: regras ainda não publicadas) degrada para [] —
     a tela mostra "coletando 0/7" e segue viva. */
  /* N3: últimas ações — UMA query global (orderBy ts desc + limit 200),
     agrupada por uid no cliente. Evita o índice composto (uid+ts) que a
     forma where(uid)+orderBy(ts) exigiria criar no Console. Campo `ts`
     CONFERIDO no atividade_log real (Date.now() ms). Falha → []. */
  K.lerLogRecente = function () {
    return fb().then(function (c) {
      var f = c.f;
      var q = f.query(f.collection(c.db, 'atividade_log'), f.orderBy('ts', 'desc'), f.limit(200));
      return f.getDocs(q).then(function (s) { var a = []; s.forEach(function (d) { a.push(d.data()); }); return a; });
    }).catch(function (e) {
      if (window.console && console.warn) { console.warn('[kpi] atividade_log indisponível:', (e && e.message) || e); }
      return [];
    });
  };

  K.lerSnapshots = function (hojeISO) {
    return fb().then(function (c) {
      var f = c.f;
      var q = f.query(
        f.collection(c.db, 'kpi_snapshots'),
        f.where('data', '>=', K._dataMenos(hojeISO, 20)),
        f.orderBy('data'),
        f.limit(20)
      );
      return f.getDocs(q).then(function (s) {
        var a = []; s.forEach(function (d) { a.push(d.data()); }); return a;
      });
    }).catch(function (e) {
      if (window.console && console.warn) { console.warn('[kpi] snapshots indisponíveis (tendência fica em coleta):', (e && e.message) || e); }
      return [];
    });
  };
  /* ============================================================
     F1-D · HELPERS PUROS (append) — testados no harness.
     ============================================================ */

  /* Usuários visíveis no picker de responsável, por papel.
     gestor  -> todos os ativos.
     líder   -> quem tem `setor` (lotação) dentro do escopo expandido
                (raiz liderada + subsetores filhos) + ele mesmo.
                Usuário sem `setor` definido fica FORA do picker do líder
                (não dá para provar o escopo) — exceto o próprio líder.
     usuario -> ninguém (a tela nem abre o modal; fail-safe).       */
  K.usuariosNoEscopo = function (usuarios, user, setores) {
    var list = Array.isArray(usuarios) ? usuarios : [];
    if (!user) { return []; }
    if (user.perfil === 'gestor') { return list.slice(); }
    if (user.perfil === 'lider') {
      var esc = escopoLider(user.setoresLiderados, setores || []);
      return list.filter(function (u) {
        if (u && u.uid && user.uid && u.uid === user.uid) { return true; }
        return !!(u && u.setor && esc[u.setor]);
      });
    }
    return [];
  };

  /* Agrupa as ocorrências SEM horário do dia por setor-RAIZ (Hoje).
     Multi-homing: a MESMA ocorrência aparece em cada raiz marcada
     (o check é um só — o objeto é compartilhado, nunca duplicado).
     Ordem dos grupos: ordem do cadastro de setores; órfãos/sem setor
     por último. Ordem interna: camada (socio→gestor→operacional;
     ausente = operacional) e depois título (pt-BR).                 */
  var CAMADA_PESO = { socio: 0, gestor: 1, operacional: 2 };
  K.gruposDoDia = function (semHora, setores) {
    var sets = Array.isArray(setores) ? setores : [];
    var raizes = sets.filter(function (s) { return s && !s.setorPaiSigla && s.ativo; });
    var ordem = {}; raizes.forEach(function (s, i) { ordem[s.sigla] = i; });
    function raizDe(sig) {
      var s = sets.filter(function (x) { return x.sigla === sig; })[0];
      if (!s) { return sig; }
      return s.setorPaiSigla ? s.setorPaiSigla : s.sigla;
    }
    var map = {}, keys = [];
    (semHora || []).forEach(function (o) {
      var sigs = setoresDe(o.act, sets).map(raizDe);
      if (!sigs.length) { sigs = ['—']; }
      var vistos = {};
      sigs.forEach(function (sig) {
        if (vistos[sig]) { return; } vistos[sig] = true;
        if (!map[sig]) { map[sig] = { sig: sig, items: [], feitas: 0 }; keys.push(sig); }
        map[sig].items.push(o);
        if (o.status === 'concluida') { map[sig].feitas++; }
      });
    });
    keys.sort(function (a, b) {
      var oa = (a in ordem) ? ordem[a] : 900 + (a === '—' ? 99 : 0);
      var ob = (b in ordem) ? ordem[b] : 900 + (b === '—' ? 99 : 0);
      if (oa !== ob) { return oa - ob; }
      return a < b ? -1 : (a > b ? 1 : 0);
    });
    keys.forEach(function (k) {
      map[k].items.sort(function (x, y) {
        var cx = CAMADA_PESO[(x.act && x.act.camada) || 'operacional']; if (cx == null) { cx = 2; }
        var cy = CAMADA_PESO[(y.act && y.act.camada) || 'operacional']; if (cy == null) { cy = 2; }
        if (cx !== cy) { return cx - cy; }
        return ((x.act && x.act.titulo) || '').localeCompare((y.act && y.act.titulo) || '', 'pt-BR');
      });
    });
    return keys.map(function (k) { return map[k]; });
  };

  /* Menor dataInicio entre atividades recorrentes ativas — âncora do
     banner "medição inicia em DD/MM". null se não derivável.        */
  K.minDataInicio = function (ativ) {
    var min = null;
    (ativ || []).forEach(function (a) {
      if (!a || a.recorrencia === 'unico' || !a.dataInicio) { return; }
      if (min === null || a.dataInicio < min) { min = a.dataInicio; }
    });
    return min;
  };
})();

/* ============================================================
   F1-E · HELPERS PUROS (append) — reuniões que fecham o ciclo.
   Testados no harness_f1e.js. Zero query nova aqui: só matemática
   e classificação sobre dados já carregados pelas telas.
   ============================================================ */
(function () {
  'use strict';
  var K = window.KPI;
  var R = window.GrautRecorrencia;

  /* Classifica m.porSetor para a PAUTA honesta (F1-E · 0.1):
       morta     -> sigla que não existe ATIVA em `setores` (dado órfão);
       coletando -> setor ativo com previstas na janela mas NADA vencido
                    ainda (prevVencidas === 0) — medir amanhã, não punir hoje;
       abaixo    -> setor ativo, com previsto vencido, aderência < banda.
     Retorna { abaixo:[], coletando:[], mortas:[sigla] }. Puro.        */
  K.pautaSetores = function (porSetor, setores, banda) {
    var b = (banda == null) ? 80 : banda;
    var ativas = {};
    (setores || []).forEach(function (s) { if (s && s.ativo !== false && s.sigla) { ativas[s.sigla] = true; } });
    var out = { abaixo: [], coletando: [], mortas: [] };
    (porSetor || []).forEach(function (s) {
      if (!s || s.sig === '—') { return; }
      if (!ativas[s.sig]) { out.mortas.push(s.sig); return; }
      if (!s.previstas) { return; }
      if ((s.prevVencidas || 0) === 0) { out.coletando.push(s); return; }
      if (s.aderencia != null && s.aderencia < b) { out.abaixo.push(s); }
    });
    return out;
  };

  /* BANDA ISO (F1-E · 4.1): quantos snapshots CONSECUTIVOS, do mais
     recente para trás, têm aderência do setor < banda. Snapshot sem o
     setor ou com ader null QUEBRA a sequência (nunca inventa). Com
     menos de 2 fotos, "obrigatória" é impossível por definição. Puro. */
  K.bandaConsecutiva = function (snapshots, sig, banda) {
    var b = (banda == null) ? 80 : banda;
    var lista = (snapshots || []).slice().sort(function (a, c) {
      return a.data < c.data ? -1 : (a.data > c.data ? 1 : 0);
    });
    var n = 0;
    for (var i = lista.length - 1; i >= 0; i--) {
      var ps = lista[i] && lista[i].porSetor;
      var row = ps && ps[sig];
      if (!row || row.ader == null || row.ader >= b) { break; }
      n++;
    }
    return { n: n, obrigatoria: n >= 2, atencao: n === 1, fotos: lista.length };
  };

  /* CONVOCAÇÃO AUTOMÁTICA por tipo de reunião (F1-E · B1).
     usuarios = lista de ativos {uid, nome, perfil, setor, setoresLiderados}.
     PREMISSA (registrada no HANDOFF): não há marcador "sócio" no doc de
     usuários — sócio = quem lidera ou é lotado na sigla 'SOC'.
     O criador entra SEMPRE (é quem conduz). Dedup por uid. Puro.       */
  function ehSocio(u) {
    if (!u) { return false; }
    var lid = Array.isArray(u.setoresLiderados) ? u.setoresLiderados : [];
    return lid.indexOf('SOC') >= 0 || u.setor === 'SOC';
  }
  K.convocadosPorTipo = function (tipo, usuarios, setores, criador, setorSigla) {
    var list = Array.isArray(usuarios) ? usuarios : [];
    var picked = {}, out = [];
    function add(u) {
      if (!u || !u.uid || picked[u.uid]) { return; }
      picked[u.uid] = true; out.push({ uid: u.uid, nome: u.nome || '(sem nome)' });
    }
    if (criador && criador.uid) { add({ uid: criador.uid, nome: criador.nome || criador.name }); }
    if (tipo === 'lideres' || tipo === 'integrada') {
      list.forEach(function (u) { if (u.perfil === 'lider' || u.perfil === 'gestor') { add(u); } });
      if (tipo === 'integrada') { list.forEach(function (u) { if (ehSocio(u)) { add(u); } }); }
    } else if (tipo === 'departamento' && setorSigla) {
      var esc = K.escopoLider([setorSigla], setores || []);
      list.forEach(function (u) {
        var lid = Array.isArray(u.setoresLiderados) ? u.setoresLiderados : [];
        var lideraSetor = false;
        for (var i = 0; i < lid.length; i++) {
          if (lid[i] === setorSigla) { lideraSetor = true; break; }
          var escU = K.escopoLider([lid[i]], setores || []);
          if (escU[setorSigla]) { lideraSetor = true; break; }
        }
        if (lideraSetor) { add(u); return; }
        if (u.setor && esc[u.setor]) { add(u); }
      });
    }
    else if (tipo === 'resultado_mensal') {
      /* F1-G · D1 = letra (a): líderes + gestores. Benchmark: reunião mensal
         de resultados no mercado (business review) é o LÍDER apresentando ao
         GESTOR — mesma régua da reunião de líderes. Decidido em delegação
         noturna (16/07); mudar de novo = trocar este ramo. */
      list.forEach(function (u) { if (u.perfil === 'lider' || u.perfil === 'gestor') { add(u); } });
    }
    /* 'instrutor' e 'lideres_turma': só o criador (externos entram à mão). */
    return out;
  };
  K.ehSocio = ehSocio;

  /* STATUS DERIVADO da decisão convertida (F1-E · 4.2) — lê a ocorrência
     da atividade-filha (única = 1 ocorrência do board). NUNCA gravado.
       sem atividadeId: aberta:false -> 'resolvida' · senão 'aberta'
       com atividadeId e occ:
         concluida + concluidaEm(dia) <= effDate -> 'no_prazo'
         concluida + concluidaEm(dia) >  effDate -> 'atraso'
         concluida sem concluidaEm               -> 'feita'
         aberta   + effDate < hoje               -> 'vencida'
         senão                                   -> 'aberta'
       com atividadeId e SEM occ (fora da janela) -> 'aberta' (declarado). */
  K.statusDecisao = function (dec, occ, hoje) {
    if (!dec) { return { chave: 'aberta', rotulo: 'em aberto' }; }
    if (!dec.atividadeId) {
      return dec.aberta === false
        ? { chave: 'resolvida', rotulo: 'resolvida na reunião' }
        : { chave: 'aberta', rotulo: 'em aberto' };
    }
    if (!occ) { return { chave: 'aberta', rotulo: 'em aberto' }; }
    if (occ.status === 'concluida') {
      var ov = occ.ov || {};
      if (!ov.concluidaEm) { return { chave: 'feita', rotulo: 'feita' }; }
      var dia = R.toISO(new Date(Number(ov.concluidaEm)));
      return R.compareISO(dia, occ.effDate) <= 0
        ? { chave: 'no_prazo', rotulo: 'feita no prazo' }
        : { chave: 'atraso', rotulo: 'feita com atraso' };
    }
    if (R.compareISO(occ.effDate, hoje) < 0) { return { chave: 'vencida', rotulo: 'vencida' }; }
    return { chave: 'aberta', rotulo: 'em aberto' };
  };

  /* ATRASO DA REUNIÃO (F1-E · B2, sem dinheiro): minutos entre a hora
     prevista e a hora de início real ('HH:MM'). Negativo = adiantada.
     Entrada inválida -> null (nunca inventa). Puro.                    */
  K.minutosEntreHoras = function (hPrev, hReal) {
    var rx = /^([01]\d|2[0-3]):([0-5]\d)$/;
    var a = rx.exec(String(hPrev || '')), b = rx.exec(String(hReal || ''));
    if (!a || !b) { return null; }
    return (Number(b[1]) * 60 + Number(b[2])) - (Number(a[1]) * 60 + Number(a[2]));
  };

  /* TRUNCAR para mailto (F1-E · 3.3): corpo acima do teto seguro perde a
     cauda e ganha o aviso — o resumo completo vive no GERA. Puro.      */
  K.truncarCorpo = function (texto, max) {
    var t = String(texto || '');
    var m = max || 1800;
    var aviso = '\n…resumo completo no GERA.';
    if (t.length <= m) { return t; }
    return t.slice(0, Math.max(0, m - aviso.length)) + aviso;
  };

  /* ============================================================
     F1-F · REUNIÕES-COCKPIT — helpers PUROS (harness_f1f.js)
     ============================================================ */

  /* STATUS DERIVADO da reunião (F1-F · B7) — nunca gravado.
       encerradaEm                    -> 'encerrada'
       horaInicioReal (sem encerrar)  -> 'andamento'
       senão                          -> 'agendada'               */
  K.statusReuniao = function (r) {
    if (r && r.encerradaEm) { return { chave: 'encerrada', rotulo: 'Encerrada' }; }
    if (r && r.horaInicioReal) { return { chave: 'andamento', rotulo: 'Em andamento' }; }
    return { chave: 'agendada', rotulo: 'Agendada' };
  };

  /* ROLLFORWARD 2.0 (F1-F · B5): decisões NÃO FECHADAS de reuniões
     ANTERIORES do MESMO ESCOPO reaparecem na reunião alvo.
       anterior     = data estritamente menor que a do alvo.
       mesmo escopo = mesmo tipo
                      + mesmo setorSigla (quando tipo departamento)
                      + mesmo projetoId (null conta como igual).
       não fechada  = statusDe(dec) em {aberta, vencida} — INCLUI a
         decisão convertida em atividade ainda não feita (a v1 só
         olhava d.aberta e perdia exatamente essas).
     statusDe é injetado (o chamador resolve a ocorrência da
     atividade-filha) — a função fica pura e testável no harness. */
  K.rollforward2 = function (reunioes, alvo, statusDe) {
    var out = [];
    if (!alvo || !alvo.data) { return out; }
    (reunioes || []).forEach(function (r) {
      if (!r || r.id === alvo.id) { return; }
      if ((r.data || '') >= alvo.data) { return; }
      if ((r.tipo || null) !== (alvo.tipo || null)) { return; }
      if (alvo.tipo === 'departamento' && (r.setorSigla || null) !== (alvo.setorSigla || null)) { return; }
      if ((r.projetoId || null) !== (alvo.projetoId || null)) { return; }
      (r.decisoes || []).forEach(function (d, idx) {
        var st = statusDe(d);
        if (st && (st.chave === 'aberta' || st.chave === 'vencida')) {
          out.push({ dec: d, reuniao: r, idx: idx, st: st });
        }
      });
    });
    out.sort(function (a, b) { return (a.reuniao.data || '').localeCompare(b.reuniao.data || ''); });
    return out;
  };

  /* VENCIDAS EM ABERTO FORA DA JANELA (F1-F · B2, emenda 1): o board
     'band' corta em hoje−45 — atividade ÚNICA com prazo mais antigo
     (caso real: 400 dias) sumiria do painel de execução. Esta varredura
     cobre o buraco SEM omissão silenciosa:
       entra: recorrencia 'unico' + data < jIni + ativo != false.
       status: resolvido pelas MESMAS regras do board
               (R.ocorrenciasNaJanela na data única + occs antigas).
       sai:   só o ABERTO vencido — concluída, pulada e reprogramada
              p/ hoje ou futuro NÃO entram (dataOverride respeitado).
     Rotinas recorrentes ficam FORA de propósito: débito histórico de
     rotina é medido pela ADERÊNCIA, não item a item — declarado no i. */
  K.vencidasUnicasAntigas = function (ativ, occAntigas, jIni, hoje) {
    var byAtiv = {};
    (occAntigas || []).forEach(function (o) {
      if (o && o.atividadeId) { (byAtiv[o.atividadeId] = byAtiv[o.atividadeId] || []).push(o); }
    });
    var out = [];
    (ativ || []).forEach(function (act) {
      if (!act || act.recorrencia !== 'unico' || !act.data) { return; }
      if (act.ativo === false) { return; }
      if (R.compareISO(act.data, jIni) >= 0) { return; } /* na janela: o board já cobre */
      var occs = R.ocorrenciasNaJanela(act, act.data, act.data, byAtiv[act.id] || [], hoje);
      occs.forEach(function (oc) {
        var ov = oc.override || null;
        var eff = (ov && ov.dataOverride) || oc.data;
        var aberto = (oc.status === 'pendente' || oc.status === 'reprogramada' || oc.status === 'em_andamento');
        if (aberto && R.compareISO(eff, hoje) < 0) {
          out.push({ act: act, origData: oc.data, effDate: eff, status: oc.status,
            responsavel: (act.responsavelNome || '').trim(), semResp: !(act.responsavelNome || '').trim(),
            uid: act.responsavelUid || null, ov: ov, atrasada: true, foraJanela: true });
        }
      });
    });
    return out;
  };

  /* ============================================================
     F1-G · SCORE DE DESEMPENHO 50/30/20 + RANKING 3 LENTES +
     PLANOS DE AÇÃO VIVOS. Matemática validada no harness_f1g.js.
     ============================================================ */

  /* Pesos do score (calibráveis em 1 linha — decisão F1-G: constante
     no código; vira doc de config só se a calibração virar rotina). */
  K.PESOS_SCORE = { ader: 0.5, prazo: 0.3, residual: 0.2 };

  /* Atraso residual = do que JÁ VENCEU, quanto continua aberto.
     atrasadas ÷ previstas vencidas × 100. prevVencidas 0 -> null
     (partida fria F1-D: nada venceu ainda, não punir com 0 falso). */
  K.residualPct = function (atrasadas, prevVencidas) {
    if (!prevVencidas) { return null; }
    return Math.round(atrasadas / prevVencidas * 100);
  };

  /* Score composto 50% aderência / 30% no prazo / 20% (100 − residual).
     Componente sem dado (null) sai do cálculo e os pesos são
     RENORMALIZADOS sobre os presentes (padrão de índice composto;
     nunca inventa 0 nem 100). ader null -> score null (sem base).
     Devolve { score, tom, comp:{ader,prazo,residual}, usados[] }. */
  K.scoreDesempenho = function (ader, pctNoPrazo, residual) {
    if (ader == null) { return null; }
    var P = K.PESOS_SCORE;
    var partes = [{ k: 'ader', v: ader, p: P.ader }];
    if (pctNoPrazo != null) { partes.push({ k: 'prazo', v: pctNoPrazo, p: P.prazo }); }
    if (residual != null) { partes.push({ k: 'residual', v: 100 - residual, p: P.residual }); }
    var somaP = 0, i;
    for (i = 0; i < partes.length; i++) { somaP += partes[i].p; }
    var acc = 0, usados = [];
    for (i = 0; i < partes.length; i++) {
      acc += partes[i].v * (partes[i].p / somaP);
      usados.push(partes[i].k);
    }
    var score = Math.round(acc);
    if (score < 0) { score = 0; } if (score > 100) { score = 100; }
    var tom = score >= 80 ? 'ok' : score >= 60 ? 'warn' : 'bad';
    return { score: score, tom: tom, comp: { ader: ader, prazo: pctNoPrazo, residual: residual }, usados: usados };
  };

  /* Ranking nas 3 lentes (SETOR / LÍDER / USUÁRIO) numa única
     passada do board. Multi-setor conta em CADA setor (declarado
     no "i"). Líder: ocorrência conta se o setor dela está no
     escopo do líder (raiz -> + filhos, mesmo escopoLider do RBAC).
     usuarios: lista da coleção (p/ lente líder); pode ser []. */
  K.computarRanking = function (ctx, usuarios) {
    var board = ctx.board, hoje = ctx.hoje, setores = ctx.setores;
    function novo(chave, nome) {
      return { chave: chave, nome: nome, previstas: 0, prevVencidas: 0,
               concluidasAteHoje: 0, concluidasTotal: 0, noPrazo: 0, atrasadas: 0 };
    }
    var porU = {}, porS = {}, porL = {};
    var lids = [];
    (Array.isArray(usuarios) ? usuarios : []).forEach(function (u) {
      var ls = Array.isArray(u.setoresLiderados) ? u.setoresLiderados : [];
      if (u && u.uid && ls.length && u.ativo !== false) {
        lids.push({ uid: u.uid, nome: u.nome || '(sem nome)', esc: K.escopoLider(ls, setores) });
      }
    });
    function conta(b, o, ateHoje, venceu, conclAte) {
      if (ateHoje && o.status !== 'pulada') {
        b.previstas++;
        if (venceu) { b.prevVencidas++; }
        if (conclAte) { b.concluidasAteHoje++; }
      }
      if (o.status === 'concluida') {
        b.concluidasTotal++;
        var ov = o.ov || {};
        if (ov.concluidaEm) {
          var diaConcl = R.toISO(new Date(Number(ov.concluidaEm)));
          if (R.compareISO(diaConcl, o.effDate) <= 0) { b.noPrazo++; }
        }
      }
      if (o.atrasada) { b.atrasadas++; }
    }
    board.forEach(function (o) {
      var ateHoje = R.compareISO(o.effDate, hoje) <= 0;
      var venceu = R.compareISO(o.effDate, hoje) < 0;
      var conclAte = ateHoje && o.status === 'concluida';
      var ku = o.uid || '(sem)';
      conta(porU[ku] || (porU[ku] = novo(o.uid, o.uid ? (o.responsavel || '(sem nome)') : '(sem responsável)')), o, ateHoje, venceu, conclAte);
      var sigs = K.setoresDe(o.act, setores); if (!sigs.length) { sigs = ['—']; }
      sigs.forEach(function (sig) {
        conta(porS[sig] || (porS[sig] = novo(sig, K.nomeSetor(sig, setores))), o, ateHoje, venceu, conclAte);
      });
      lids.forEach(function (L) {
        var meu = false;
        for (var i = 0; i < sigs.length; i++) { if (L.esc[sigs[i]]) { meu = true; break; } }
        if (!meu) { return; }
        conta(porL[L.uid] || (porL[L.uid] = novo(L.uid, L.nome)), o, ateHoje, venceu, conclAte);
      });
    });
    function fecha(map, keepSem) {
      var out = [];
      Object.keys(map).forEach(function (k) {
        var b = map[k];
        if (!keepSem && k === '(sem)') { return; }
        b.ader = b.previstas ? Math.round(b.concluidasAteHoje / b.previstas * 100) : null;
        b.pctNoPrazo = b.concluidasTotal ? Math.round(b.noPrazo / b.concluidasTotal * 100) : null;
        b.residual = K.residualPct(b.atrasadas, b.prevVencidas);
        var sc = K.scoreDesempenho(b.ader, b.pctNoPrazo, b.residual);
        if (sc && b.prevVencidas === 0) { b.coletando = true; }
        b.score = sc ? sc.score : null; b.tom = sc ? sc.tom : 'flat'; b.usados = sc ? sc.usados : [];
        out.push(b);
      });
      out.sort(function (a, bb) {                 /* ranking clássico: MELHOR primeiro */
        if (a.score == null && bb.score == null) { return bb.previstas - a.previstas; }
        if (a.score == null) { return 1; }
        if (bb.score == null) { return -1; }
        return bb.score - a.score;
      });
      return out;
    }
    return { usuarios: fecha(porU, false), setores: fecha(porS, true), lideres: fecha(porL, false), hoje: hoje };
  };

  /* ---------- PLANOS DE AÇÃO VIVOS (F1-G · Bloco 2) ----------
     Plano APONTA para atividades (atividadeIds[]) — reusa o motor;
     nada de segundo motor de execução (decisão F1-G, padrão
     Jira/Easy Agile: action item vira issue do backlog).
     Progresso: por atividade vinculada, prog = concluídas ÷
     previstas até hoje (ocorrências do board). pct do plano =
     média dos progs das atividades COM previstas. Nenhuma com
     previstas -> pct null ("coletando"). Atividade sem ocorrência
     na janela -> excluída do cálculo e sinalizada foraJanela. */
  K.pctPlano = function (atividadeIds, board, hoje) {
    var ids = {}, i;
    var lista = Array.isArray(atividadeIds) ? atividadeIds : [];
    for (i = 0; i < lista.length; i++) { ids[lista[i]] = { prev: 0, concl: 0, visto: false }; }
    board.forEach(function (o) {
      var b = ids[o.act && o.act.id];
      if (!b) { return; }
      b.visto = true;
      if (R.compareISO(o.effDate, hoje) <= 0 && o.status !== 'pulada') {
        b.prev++;
        if (o.status === 'concluida') { b.concl++; }
      }
    });
    var soma = 0, n = 0, fora = 0;
    for (i = 0; i < lista.length; i++) {
      var b2 = ids[lista[i]];
      if (!b2.visto) { fora++; continue; }
      if (!b2.prev) { continue; }
      soma += b2.concl / b2.prev; n++;
    }
    return { pct: n ? Math.round(soma / n * 100) : null, comPrevistas: n, foraJanela: fora, total: lista.length };
  };

  /* Status DERIVADO do plano (nunca gravado): concluído (pct 100) ·
     vencido (prazo < hoje) · em risco (faltam <= 5 dias e pct < 70) ·
     no prazo · coletando (pct null). Regra explícita no "i". */
  K.statusPlano = function (plano, pct, hoje) {
    if (pct != null && pct >= 100) { return { chave: 'concluido', rotulo: 'Concluído', tom: 'ok' }; }
    var prazo = plano && plano.prazo;
    if (prazo && R.compareISO(prazo, hoje) < 0) { return { chave: 'vencido', rotulo: 'Vencido', tom: 'bad' }; }
    if (pct == null) { return { chave: 'coletando', rotulo: 'Coletando', tom: 'flat' }; }
    if (prazo && R.diasEntre(hoje, prazo) <= 5 && pct < 70) { return { chave: 'em_risco', rotulo: 'Em risco', tom: 'warn' }; }
    return { chave: 'no_prazo', rotulo: 'No prazo', tom: 'ok' };
  };
})();

/* ============================================================
   F1-H · HELPERS PUROS (append) — supervisor determinístico,
   risco dinâmico e Pareto das atrasadas. Testados no
   harness_f1h.js. Zero query nova: só matemática sobre dados
   já carregados pelas telas.
   ============================================================ */
(function () {
  'use strict';
  var K = window.KPI;
  var R = window.GrautRecorrencia;

  /* ---------- D1 · SUGESTÃO DETERMINÍSTICA DE SUPERVISOR ----------
     Padrão Jira/Asana: aprovação/acompanhamento vai para o supervisor
     acima do executor (campo de usuário, editável). Cadeia por camada:
       operacional -> líder do SUBSETOR -> líder do SETOR-RAIZ -> gestor
       gestor      -> outro gestor (par; "sócio" não existe como perfil)
       socio       -> null (topo da árvore — ninguém acima)
     Nunca sugere o próprio responsável (auto-supervisão); pool vazio
     após remover o responsável -> sobe um nível. Determinístico:
     ordena por nome pt-BR e desempata por uid. É SUGESTÃO — a tela
     deixa trocar ou limpar (campo nullable).                        */
  function ordUser(a, b) {
    var n = ((a && a.nome) || '').localeCompare((b && b.nome) || '', 'pt-BR');
    if (n !== 0) { return n; }
    return ((a && a.uid) || '') < ((b && b.uid) || '') ? -1 : 1;
  }
  K.sugerirSupervisor = function (act, usuarios, setores) {
    var camada = (act && act.camada) || 'operacional';
    if (camada === 'socio') { return null; }
    var ativos = (Array.isArray(usuarios) ? usuarios : [])
      .filter(function (u) { return u && u.uid && u.ativo !== false; })
      .sort(ordUser);
    var respUid = (act && act.responsavelUid) || null;
    function lideresDe(sig) {
      if (!sig) { return []; }
      return ativos.filter(function (u) {
        return u.perfil === 'lider' && Array.isArray(u.setoresLiderados) && u.setoresLiderados.indexOf(sig) !== -1;
      });
    }
    var gestores = ativos.filter(function (u) { return u.perfil === 'gestor'; });
    var cadeia = (camada === 'gestor')
      ? [gestores]
      : [lideresDe(act && act.subsetorSigla), lideresDe(act && act.setorSigla), gestores];
    for (var i = 0; i < cadeia.length; i++) {
      var pool = cadeia[i].filter(function (u) { return u.uid !== respUid; });
      if (pool.length) { return { uid: pool[0].uid, nome: pool[0].nome || '' }; }
    }
    return null;
  };

  /* ---------- D2 · RISCO DINÂMICO (lente da Inteligência) ----------
     score = pesoPrioridade × fatorAging × fatorReprog.
     - pesoPrioridade: P1=5 … P5=1 (rótulo do PEF importado); ausente /
       não-parseável = 3 (default "médio", padrão Jira).
     - fatorAging: MESMAS faixas do gráfico de aging (coerência):
       0d=1,0 · 1–3d=1,2 · 4–7d=1,5 · 8–15d=2,0 · 15+d=3,0.
     - fatorReprog: 1 + 0,5 × reprogramadas da atividade na janela
       (teto 3,0).
     Faixas do score (máx 45): ≥15 Crítico · ≥7,5 Em risco · <7,5
     Observação. Só entra quem tem SINAL DINÂMICO (atraso>0 OU
     reprog>0) — prioridade parada não é risco dinâmico.
     Mitigação: SOMENTE act.mitigacao (importada do PEF); nunca
     inventada aqui.                                                 */
  K.parsePrioridade = function (str) {
    var m = /P([1-5])/.exec(String(str || ''));
    if (!m) { return { p: null, peso: 3 }; }
    var n = parseInt(m[1], 10);
    return { p: 'P' + n, peso: 6 - n };
  };
  K.fatorAging = function (dias) {
    var d = Number(dias) || 0;
    if (d <= 0) { return 1; }
    if (d <= 3) { return 1.2; }
    if (d <= 7) { return 1.5; }
    if (d <= 15) { return 2; }
    return 3;
  };
  K.fatorReprog = function (n) {
    var f = 1 + 0.5 * (Number(n) || 0);
    return f > 3 ? 3 : f;
  };
  K.riscoAtividades = function (board, hoje) {
    var map = {}, out = [];
    (Array.isArray(board) ? board : []).forEach(function (o) {
      var a = o && o.act;
      if (!a || !a.id) { return; }
      var b = map[a.id] || (map[a.id] = { act: a, maxAtraso: 0, reprog: 0 });
      if (o.atrasada) {
        var d = R.diasEntre(o.effDate, hoje);
        if (d > b.maxAtraso) { b.maxAtraso = d; }
      }
      if (o.status === 'reprogramada') { b.reprog++; }
    });
    Object.keys(map).forEach(function (id) {
      var b = map[id];
      if (b.maxAtraso <= 0 && b.reprog <= 0) { return; }
      var pr = K.parsePrioridade(b.act.prioridade);
      var fa = K.fatorAging(b.maxAtraso);
      var fr = K.fatorReprog(b.reprog);
      var score = Math.round(pr.peso * fa * fr * 10) / 10;
      out.push({
        act: b.act, prio: pr.p, peso: pr.peso,
        maxAtraso: b.maxAtraso, reprog: b.reprog,
        fatorAging: fa, fatorReprog: fr, score: score,
        faixa: score >= 15 ? 'critico' : score >= 7.5 ? 'em_risco' : 'observacao',
        mitigacao: b.act.mitigacao || null
      });
    });
    out.sort(function (x, y) {
      return (y.score - x.score) ||
        ((x.act.titulo || '').localeCompare(y.act.titulo || '', 'pt-BR'));
    });
    return out;
  };

  /* ---------- D3 · PARETO DAS ATRASADAS POR SETOR ----------
     Padrão Juran/Kaizen: categorias em ordem decrescente + %
     acumulado; "vital few" = setores até (e incluindo) a barra que
     CRUZA os 80 %. Recebe m.porSetor (multi-setor já conta em cada
     raiz, mesma regra dos demais gráficos). null se não há
     atrasadas.                                                      */
  K.paretoAtrasadas = function (porSetor) {
    var itens = (Array.isArray(porSetor) ? porSetor : [])
      .filter(function (s) { return s && s.atrasadas > 0; })
      .map(function (s) { return { sig: s.sig, atrasadas: s.atrasadas }; })
      .sort(function (a, b) { return (b.atrasadas - a.atrasadas) || (a.sig < b.sig ? -1 : 1); });
    var total = 0;
    itens.forEach(function (x) { total += x.atrasadas; });
    if (!total) { return null; }
    var acum = 0, cruzou = false;
    itens.forEach(function (x) {
      acum += x.atrasadas;
      x.pct = Math.round(x.atrasadas / total * 100);
      x.acumPct = Math.round(acum / total * 100);
      x.vital = !cruzou;
      if (!cruzou && x.acumPct >= 80) { cruzou = true; }
    });
    return { total: total, itens: itens };
  };
})();

/* ============================================================
   F1-I · HELPERS PUROS (append) — streak pessoal 80% e
   escalonamento D-5/D-3/D-0 dos planos. Testados no
   harness_f1i.js. Zero query aqui.
   ============================================================ */
(function () {
  'use strict';
  var K = window.KPI;
  var R = window.GrautRecorrencia;

  /* ---------- STREAK PESSOAL (C5, decisões travadas) ----------
     Deriva do MESMO board (zero query): ocorrências do uid, por dia
     civil, excluindo puladas. Dia CONTA se previstas>0 e
     feitas/previstas >= 0,8 (regra 80%). Dia sem nada previsto é
     PULADO (folga/feriado não quebra — auto-perdão). O dia de HOJE
     ainda aberto não quebra: se hoje não fechou, a contagem começa
     de ontem. Teto natural = início da janela do board.
     Devolve { dias, hojePrev, hojeFeitas, hojeFechado }.          */
  K.streak80 = function (board, uid, hoje) {
    var porDia = {};
    (Array.isArray(board) ? board : []).forEach(function (o) {
      if (!o || !o.act || o.act.responsavelUid !== uid) { return; }
      if (o.status === 'pulada') { return; }
      if (!o.effDate || R.compareISO(o.effDate, hoje) > 0) { return; }
      var b = porDia[o.effDate] || (porDia[o.effDate] = { prev: 0, feitas: 0 });
      b.prev++;
      if (o.status === 'concluida') { b.feitas++; }
    });
    var hj = porDia[hoje] || { prev: 0, feitas: 0 };
    function fecha(d) { return d.prev > 0 && (d.feitas / d.prev) >= 0.8; }
    var dias = 0;
    var cursor = hoje;
    if (hj.prev > 0 && fecha(hj)) { dias++; }
    /* anda para trás a partir de ontem; para no 1º dia COM previstas que não fechou */
    var guard = 0;
    cursor = R.addDias(cursor, -1);
    while (guard++ < 60) {
      var d = porDia[cursor];
      if (d && d.prev > 0) {
        if (fecha(d)) { dias++; } else { break; }
      }
      /* dia sem nada previsto: pula sem quebrar */
      var temMaisAntigo = false;
      for (var k2 in porDia) { if (R.compareISO(k2, cursor) < 0) { temMaisAntigo = true; break; } }
      if (!temMaisAntigo && (!d || !d.prev)) { break; }
      cursor = R.addDias(cursor, -1);
    }
    return { dias: dias, hojePrev: hj.prev, hojeFeitas: hj.feitas,
      hojeFechado: hj.prev > 0 && hj.feitas === hj.prev };
  };

  /* ---------- ESCALONAMENTO D-5 / D-3 / D-0 (spec travada) ----------
     Plano de ação não entregue: D-5 alerta o DONO/líder · D-3 escala
     à GESTÃO · D-0 (vencido) vira NÃO-CONFORMIDADE. NUNCA bloqueia —
     só muda de dono e de cor. Determinístico e derivado (nada gravado):
       pct >= 100            -> null (entregue)
       prazo < hoje          -> D0  (não-conformidade, red)
       faltam <= 3 e pct<70  -> D3  (gestão, red)
       faltam <= 5 e pct<70  -> D5  (dono, amber)
       senão                 -> null                                  */
  K.escalonamentoPlano = function (plano, pct, hoje) {
    if (pct != null && pct >= 100) { return null; }
    var prazo = plano && plano.prazo;
    if (!prazo || !R.isISO(prazo)) { return null; }
    if (R.compareISO(prazo, hoje) < 0) {
      return { nivel: 'D0', quem: 'nc', rotulo: 'Não-conformidade (venceu)', tom: 'red' };
    }
    var faltam = R.diasEntre(hoje, prazo);
    var p = pct == null ? 0 : pct;
    if (faltam <= 3 && p < 70) { return { nivel: 'D3', quem: 'gestao', rotulo: 'Escalado à gestão (D-3)', tom: 'red' }; }
    if (faltam <= 5 && p < 70) { return { nivel: 'D5', quem: 'dono', rotulo: 'Alerta ao dono (D-5)', tom: 'amber' }; }
    return null;
  };
})();
