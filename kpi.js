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
    function bkt(sig) { return setorMap[sig] || (setorMap[sig] = { sig: sig, previstas: 0, concluidas: 0, atrasadas: 0, agingSoma: 0, carga: 0 }); }
    ateHoje.forEach(function (o) {
      var sigs = setoresDe(o.act, setores); if (!sigs.length) { sigs = ['—']; }
      sigs.forEach(function (sig) {
        var b = bkt(sig);
        if (o.status !== 'pulada') { b.previstas++; if (o.status === 'concluida') { b.concluidas++; } }
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
        total: 0, previstas: 0, concluidasAteHoje: 0, concluidasTotal: 0,
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
})();
