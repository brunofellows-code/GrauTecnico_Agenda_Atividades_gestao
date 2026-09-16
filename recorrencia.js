/* ============================================================
   Sistema A · Grau Técnico FSA — Motor de Recorrência (Fase 2)
   ------------------------------------------------------------
   Modelo (HANDOFF v7 · "modelo de calendário"):
     - A regra mora na atividade. As OCORRÊNCIAS são CALCULADAS
       na leitura (expandir a regra numa janela) e sobrepostas
       pelos overrides gravados só quando a ocorrência é tocada
       (concluir / pular / reprogramar / editar esta).
     - Ocorrência nunca tocada NÃO tem doc → ausência = pendente.

   7 tipos (decisões travadas):
     diario     — dias úteis: se diasSemana preenchido, só os dias marcados;
                  vazio/ausente = segunda a sexta (decisão 15/09/2026)
     semanal    — dias da semana em `diasSemana` (0=Dom … 6=Sáb)
     quinzenal  — dias FIXOS 1 e 15 de cada mês
     mensal     — dia `diaMes`; 29–31 CLAMPA p/ o último dia do mês
     bimestral  — dia `diaMes`, a cada 2 meses; âncora = mês da dataInicio
     trimestral — dia `diaMes`, a cada 3 meses; âncora = mês da dataInicio
     unico      — uma data; `deslizante` é política de tela (Hoje)

   DATAS = strings civis 'YYYY-MM-DD', SEM fuso. Toda aritmética
   constrói Date em horário LOCAL (new Date(a, m-1, d)) e lê em
   LOCAL — nunca parseia 'YYYY-MM-DD' via new Date(str) (que é
   UTC e cairia no dia anterior em UTC-3 / Salvador). Comparação
   é lexicográfica (string zero-padded == ordem cronológica).

   Vanilla puro, sem build. Tipagem por JSDoc. Lógica pura: não
   toca Firebase nem DOM (testável no Node).
   ============================================================ */
(function () {
  'use strict';

  /**
   * @typedef {'pendente'|'concluida'|'pulada'|'reprogramada'} Status
   * @typedef {{ data:string, status?:Status }} Override  // doc de `ocorrencias`
   * @typedef {Object} Atividade
   * @property {string} [id]
   * @property {string} titulo
   * @property {string} setorSigla
   * @property {'diario'|'semanal'|'quinzenal'|'mensal'|'bimestral'|'trimestral'|'unico'} recorrencia
   * @property {number[]} [diasSemana]  // semanal: 0..6
   * @property {number}   [diaMes]      // mensal/bimestral/trimestral: 1..31
   * @property {string}   [data]        // unico: 'YYYY-MM-DD'
   * @property {boolean}  [deslizante]  // unico: rola em Hoje até concluir
   * @property {string}   [dataInicio]  // âncora (recorrentes)
   * @property {string}   [dataFim]     // null/ausente = aberto
   */

  var STATUS = {
    PENDENTE: 'pendente',
    CONCLUIDA: 'concluida',
    PULADA: 'pulada',
    REPROGRAMADA: 'reprogramada'
  };
  var RECORRENCIAS = {
    DIARIO: 'diario',
    SEMANAL: 'semanal',
    QUINZENAL: 'quinzenal',
    MENSAL: 'mensal',
    BIMESTRAL: 'bimestral',
    TRIMESTRAL: 'trimestral',
    UNICO: 'unico'
  };
  var RECORRENCIAS_VALIDAS = ['diario', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'unico'];

  // ---------------- helpers de data civil (sem fuso) ----------------

  /** @param {number} n */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /** 'YYYY-MM-DD' válido? @param {*} s @returns {boolean} */
  function isISO(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

  /** 'YYYY-MM-DD' → Date LOCAL (meia-noite local). @param {string} iso */
  function fromISO(iso) {
    var p = iso.split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  /** Date → 'YYYY-MM-DD' lendo componentes LOCAIS. @param {Date} dt */
  function toISO(dt) {
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  }
  /** Hoje (local) como 'YYYY-MM-DD'. */
  function hojeISO() { return toISO(new Date()); }

  /** @param {number} a @param {number} m @param {number} d → 'YYYY-MM-DD' */
  function ymd(a, m, d) { return a + '-' + pad2(m) + '-' + pad2(d); }

  /** Soma n dias a uma data ISO. @param {string} iso @param {number} n */
  function addDias(iso, n) {
    var dt = fromISO(iso);
    dt.setDate(dt.getDate() + n);
    return toISO(dt);
  }
  /** Dia da semana 0=Dom..6=Sáb. @param {string} iso */
  function diaSemana(iso) { return fromISO(iso).getDay(); }

  /** Comparação cronológica via string. -1 / 0 / 1. */
  function compareISO(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function inRange(iso, lo, hi) { return iso >= lo && iso <= hi; }
  function minISO(a, b) { return a <= b ? a : b; }
  function maxISO(a, b) { return a >= b ? a : b; }

  /** Último dia do mês (mes 1..12). @param {number} ano @param {number} mes */
  function ultimoDiaMes(ano, mes) { return new Date(ano, mes, 0).getDate(); }
  /** Limita dia ao último do mês (29–31 → 28/29/30). */
  function clampDiaMes(ano, mes, dia) { var u = ultimoDiaMes(ano, mes); return dia > u ? u : dia; }

  /** Dias inteiros de a até b (b - a). Robusto a DST por arredondamento. */
  function diasEntre(aISO, bISO) {
    return Math.round((fromISO(bISO).getTime() - fromISO(aISO).getTime()) / 86400000);
  }
  /** Atraso em dias (hoje - data); negativo = ainda no futuro. */
  function atrasoEmDias(dataISO, hojeRef) { return diasEntre(dataISO, hojeRef || hojeISO()); }

  /** Itera (ano, mes) de iniISO até fimISO, inclusivo. Teto defensivo. */
  function eachMonth(iniISO, fimISO, cb) {
    var a = parseInt(iniISO.slice(0, 4), 10), m = parseInt(iniISO.slice(5, 7), 10);
    var aFim = parseInt(fimISO.slice(0, 4), 10), mFim = parseInt(fimISO.slice(5, 7), 10);
    var guard = 0;
    while ((a < aFim || (a === aFim && m <= mFim)) && guard < 1200) {
      cb(a, m);
      m++; if (m > 12) { m = 1; a++; }
      guard++;
    }
  }

  // ---------------- validação ----------------

  /**
   * Valida a regra. Retorna lista de erros (vazia = ok). A UI deve
   * chamar antes de gravar e antes de expandir.
   * @param {Atividade} ativ @returns {string[]}
   */
  function validar(ativ) {
    var e = [];
    if (!ativ) { return ['atividade ausente']; }
    if (!ativ.titulo || !String(ativ.titulo).trim()) { e.push('titulo obrigatório'); }
    if (!ativ.setorSigla) { e.push('setorSigla obrigatório'); }

    var tipo = ativ.recorrencia;
    if (RECORRENCIAS_VALIDAS.indexOf(tipo) === -1) {
      e.push('recorrencia inválida (use: ' + RECORRENCIAS_VALIDAS.join(' | ') + ')');
      return e; // sem tipo válido não dá pra validar o resto
    }

    if (tipo === RECORRENCIAS.UNICO) {
      if (!isISO(ativ.data)) { e.push('data (YYYY-MM-DD) obrigatória para tipo único'); }
    } else {
      if (!isISO(ativ.dataInicio)) { e.push('dataInicio (YYYY-MM-DD) obrigatória'); }
      if (ativ.dataFim != null && !isISO(ativ.dataFim)) { e.push('dataFim inválida'); }
      if (isISO(ativ.dataInicio) && isISO(ativ.dataFim) && compareISO(ativ.dataFim, ativ.dataInicio) < 0) {
        e.push('dataFim anterior à dataInicio');
      }
    }
    if (tipo === RECORRENCIAS.SEMANAL) {
      if (!Array.isArray(ativ.diasSemana) || ativ.diasSemana.length === 0) {
        e.push('diasSemana obrigatório (ao menos 1 dia, 0=Dom..6=Sáb)');
      } else if (ativ.diasSemana.some(function (d) { return typeof d !== 'number' || d < 0 || d > 6; })) {
        e.push('diasSemana deve conter inteiros de 0 a 6');
      }
    }
    if (tipo === RECORRENCIAS.MENSAL || tipo === RECORRENCIAS.BIMESTRAL || tipo === RECORRENCIAS.TRIMESTRAL) {
      if (typeof ativ.diaMes !== 'number' || ativ.diaMes < 1 || ativ.diaMes > 31) {
        e.push('diaMes deve ser um inteiro de 1 a 31');
      }
    }
    return e;
  }

  // ---------------- expansão da regra ----------------

  /**
   * Datas planejadas (apenas as datas, ordenadas) da atividade no
   * intervalo [jIni, jFim] inclusive, respeitando dataInicio/dataFim.
   * Regra inválida → []. NÃO aplica overrides (use ocorrenciasNaJanela).
   * @param {Atividade} ativ
   * @param {string} jIni 'YYYY-MM-DD'
   * @param {string} jFim 'YYYY-MM-DD'
   * @returns {string[]}
   */
  function expandir(ativ, jIni, jFim) {
    if (validar(ativ).length) { return []; }
    if (!isISO(jIni) || !isISO(jFim) || compareISO(jIni, jFim) > 0) { return []; }

    var tipo = ativ.recorrencia;
    var out = [];

    if (tipo === RECORRENCIAS.UNICO) {
      if (inRange(ativ.data, jIni, jFim)) { out.push(ativ.data); }
      return out;
    }

    // limites efetivos = interseção [dataInicio,dataFim] ∩ [jIni,jFim]
    var ini = maxISO(ativ.dataInicio, jIni);
    var fim = (ativ.dataFim != null) ? minISO(ativ.dataFim, jFim) : jFim;
    if (compareISO(ini, fim) > 0) { return out; }

    var d, guard;
    if (tipo === RECORRENCIAS.DIARIO) {
      /* 15/09/2026: diária = dias marcados; sem dias marcados = segunda a sexta */
      var dDias = (Array.isArray(ativ.diasSemana) && ativ.diasSemana.length) ? ativ.diasSemana : [1, 2, 3, 4, 5];
      guard = 0;
      for (d = ini; compareISO(d, fim) <= 0 && guard < 4000; d = addDias(d, 1)) {
        if (dDias.indexOf(diaSemana(d)) !== -1) { out.push(d); }
        guard++;
      }
    } else if (tipo === RECORRENCIAS.SEMANAL) {
      var dows = ativ.diasSemana;
      guard = 0;
      for (d = ini; compareISO(d, fim) <= 0 && guard < 4000; d = addDias(d, 1)) {
        if (dows.indexOf(diaSemana(d)) !== -1) { out.push(d); }
        guard++;
      }
    } else if (tipo === RECORRENCIAS.QUINZENAL) {
      eachMonth(ini, fim, function (ano, mes) {
        [1, 15].forEach(function (dia) {
          var iso = ymd(ano, mes, dia);
          if (inRange(iso, ini, fim)) { out.push(iso); }
        });
      });
    } else if (tipo === RECORRENCIAS.MENSAL) {
      eachMonth(ini, fim, function (ano, mes) {
        var iso = ymd(ano, mes, clampDiaMes(ano, mes, ativ.diaMes));
        if (inRange(iso, ini, fim)) { out.push(iso); }
      });
    } else if (tipo === RECORRENCIAS.BIMESTRAL || tipo === RECORRENCIAS.TRIMESTRAL) {
      // Como o mensal, mas só nos meses múltiplos do passo a partir do mês da
      // dataInicio (âncora): bimestral = a cada 2, trimestral = a cada 3.
      var passo = (tipo === RECORRENCIAS.TRIMESTRAL) ? 3 : 2;
      var aI = parseInt(ativ.dataInicio.slice(0, 4), 10), mI = parseInt(ativ.dataInicio.slice(5, 7), 10);
      var idxA = aI * 12 + (mI - 1);
      eachMonth(ini, fim, function (ano, mes) {
        var delta = (ano * 12 + (mes - 1)) - idxA;
        if (delta >= 0 && delta % passo === 0) {
          var iso = ymd(ano, mes, clampDiaMes(ano, mes, ativ.diaMes));
          if (inRange(iso, ini, fim)) { out.push(iso); }
        }
      });
    }
    return out;
  }

  // ---------------- reativação (16/09/2026) ----------------

  /* Cópia rasa sem Object.assign: o motor fica ES5 estrito e não depende de
     nada que um navegador velho da secretaria possa não ter. */
  function copiaRasa(o) {
    var c = {}, k;
    for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { c[k] = o[k]; } }
    return c;
  }

  /* Status que ainda pedem ação. Doc sem status é a trava gravada pelo Hoje
     ("Travei nesta"): o status continua sendo o derivado, pendente. */
  function statusAberto(ov) {
    var st = ov && ov.status;
    return !st || st === STATUS.PENDENTE || st === STATUS.REPROGRAMADA || st === 'em_andamento';
  }

  /* Ocorrência GRAVADA, ABERTA, planejada ANTES da última reativação e que a
     regra atual não gera mais (órfã). Não entra na janela.
     Cenário que motivou: diária de segunda a sexta travada no Hoje em 16/09,
     com a ocorrência de 18/09 reprogramada para 25/09 no mesmo dia; inativada
     em 17/09 e ativada de novo em 15/10. Ativar leva a dataInicio para 15/10
     (inicioAoReativar) e as datas sem documento somem da conta — mas os dois
     documentos continuavam entrando como órfãos: 2 atrasadas e 2 falhas no
     Pareto de uma atividade que estava desligada, contra a regra do Bruno de
     16/09 ("reativar não conta o período inativo como falha"). Só vale para
     quem tem reativadaEm (as outras atividades não mudam em nada). O que foi
     CONCLUÍDO ou PULADO antes continua na janela: é histórico, não atraso.
     Se alguém editar a dataInicio para trás, essas datas voltam a ser da regra
     (não são mais órfãs) e contam normalmente — foi escolha explícita. */
  function abertaAntesDaReativacao(ativ, dataISO, ov) {
    if (!ativ || !isISO(ativ.reativadaEm) || compareISO(dataISO, ativ.reativadaEm) >= 0) { return false; }
    return statusAberto(ov);
  }

  /* Primeiro dia, na âncora do bimestral/trimestral, de onde a série pode
     voltar sem perder o ciclo. Mês da âncora = mês da dataInicio original.
     Mesmo mês de hoje com a ocorrência ainda por vir → hoje; senão → dia 1 do
     próximo mês do ciclo (dia 1, e não o dia da ocorrência, para que editar o
     diaMes depois não pule o mês por acidente). */
  function inicioNaAncora(inicioOriginal, diaMes, passo, hoje) {
    var idxA = parseInt(inicioOriginal.slice(0, 4), 10) * 12 + (parseInt(inicioOriginal.slice(5, 7), 10) - 1);
    var idxH = parseInt(hoje.slice(0, 4), 10) * 12 + (parseInt(hoje.slice(5, 7), 10) - 1);
    for (var k = 0; k <= passo * 2; k++) {
      var idx = idxH + k;
      if ((idx - idxA) % passo !== 0) { continue; }
      var ano = Math.floor(idx / 12), mes = (idx % 12) + 1;
      if (compareISO(ymd(ano, mes, clampDiaMes(ano, mes, diaMes)), hoje) >= 0) {
        return (idx === idxH) ? hoje : ymd(ano, mes, 1);
      }
    }
    return hoje; /* inalcançável com passo 2 ou 3; defensivo */
  }

  /**
   * De onde a série volta a contar quando uma atividade INATIVA é ativada.
   *
   * Cenário que motivou (reproduzido em 16/09): diária de segunda a sexta
   * desligada de 17/09 a 15/10. Reativar gravava só { ativo:true }; o motor
   * expande a regra desde a dataInicio e toda data passada sem documento vira
   * pendente e atrasada — a atividade voltava com 20 atrasadas, aderência de 5%
   * e 20 falhas no Pareto. Decisão do Bruno (16/09): reativar NÃO conta o
   * período inativo como falha ou atraso.
   *
   * Regra:
   *  - diária, semanal, quinzenal, mensal: dataInicio = max(dataInicio, hoje);
   *  - bimestral, trimestral: o primeiro mês de hoje em diante que respeite a
   *    âncora (o ciclo a cada 2/3 meses não pode escorregar);
   *  - única: data de hoje em diante fica como está; data passada (ou sem
   *    data) exige data nova — quem chama pede à pessoa e chama de novo com a
   *    data escolhida em `data`;
   *  - fim já passado (nenhuma ocorrência de hoje até a dataFim): exige fim
   *    novo ou nenhum — mesma mecânica, com `dataFim`.
   * Pura: não muda a atividade recebida, não grava nada, não lê relógio se
   * receber hojeRef.
   *
   * @param {Atividade} ativ  a atividade como está gravada
   * @param {string} [hojeRef]  'YYYY-MM-DD' (default: hoje local)
   * @returns {{ok:boolean,
   *            motivo:(null|'unica_passada'|'unica_sem_data'|'fim_passado'|'regra_invalida'),
   *            patch:Object, proxima:(string|null), erros:string[]}}
   *   patch = só os campos de data que mudam ({} quando nada muda);
   *   proxima = primeira ocorrência de hoje em diante com o patch aplicado.
   */
  function inicioAoReativar(ativ, hojeRef) {
    var hoje = isISO(hojeRef) ? hojeRef : hojeISO();
    var r = { ok: false, motivo: null, patch: {}, proxima: null, erros: [] };
    if (!ativ) { r.motivo = 'regra_invalida'; r.erros = ['atividade ausente']; return r; }
    var tipo = ativ.recorrencia;

    if (tipo === RECORRENCIAS.UNICO) {
      if (!isISO(ativ.data)) { r.motivo = 'unica_sem_data'; return r; }
      if (compareISO(ativ.data, hoje) < 0) { r.motivo = 'unica_passada'; return r; }
      r.erros = validar(ativ);
      if (r.erros.length) { r.motivo = 'regra_invalida'; return r; }
      r.ok = true; r.proxima = ativ.data;
      return r;
    }

    /* o resto da regra (tipo, dias, dia do mês) tem de valer por si: data de
       início e fim são justamente o que esta função decide */
    var sonda = copiaRasa(ativ);
    sonda.dataInicio = isISO(ativ.dataInicio) ? ativ.dataInicio : hoje;
    sonda.dataFim = null;
    r.erros = validar(sonda);
    if (r.erros.length) { r.motivo = 'regra_invalida'; return r; }

    var inicio;
    if (isISO(ativ.dataInicio) && compareISO(ativ.dataInicio, hoje) >= 0) {
      inicio = ativ.dataInicio; /* ainda não começou: nada a corrigir */
    } else if (!isISO(ativ.dataInicio)) {
      inicio = hoje;
    } else if (tipo === RECORRENCIAS.BIMESTRAL || tipo === RECORRENCIAS.TRIMESTRAL) {
      inicio = inicioNaAncora(ativ.dataInicio, ativ.diaMes, tipo === RECORRENCIAS.TRIMESTRAL ? 3 : 2, hoje);
    } else {
      inicio = hoje;
    }

    var nova = copiaRasa(ativ);
    nova.dataInicio = inicio;
    if (nova.dataFim != null && (!isISO(nova.dataFim) || compareISO(nova.dataFim, inicio) < 0)) {
      r.motivo = 'fim_passado'; r.erros = validar(nova); return r;
    }
    var prox = proximas(nova, hoje, 1);
    if (!prox.length) { r.motivo = 'fim_passado'; return r; }

    if (inicio !== ativ.dataInicio) { r.patch.dataInicio = inicio; }
    r.ok = true; r.erros = []; r.proxima = prox[0];
    return r;
  }

  // ---------------- overlay (expansão + overrides) ----------------

  /**
   * Indexa um array de docs de `ocorrencias` por data → { 'YYYY-MM-DD': doc }.
   * @param {Override[]} docs @returns {Object<string,Override>}
   */
  function indexarOverrides(docs) {
    var map = {};
    (docs || []).forEach(function (o) { if (o && o.data) { map[o.data] = o; } });
    return map;
  }

  /**
   * Ocorrências da janela = datas planejadas + overrides, com status.
   * Inclui overrides "órfãos" que caiam na janela (histórico real fora
   * da expansão atual, ex.: a regra mudou depois de uma conclusão).
   * @param {Atividade} ativ
   * @param {string} jIni
   * @param {string} jFim
   * @param {Object<string,Override>|Override[]} overrides  obj por data OU array de docs
   * @param {string} [hojeRef]  'YYYY-MM-DD' (default: hoje local) — para testes
   * @returns {{atividadeId:string|null, data:string, status:Status,
   *            atrasada:boolean, origem:'atividade', override:(Override|null)}[]}
   */
  function ocorrenciasNaJanela(ativ, jIni, jFim, overrides, hojeRef) {
    var ovs = Array.isArray(overrides) ? indexarOverrides(overrides) : (overrides || {});
    var hoje = hojeRef || hojeISO();

    var datas = expandir(ativ, jIni, jFim);
    var visto = {};
    datas.forEach(function (d) { visto[d] = true; });
    Object.keys(ovs).forEach(function (d) {
      if (visto[d] || !inRange(d, jIni, jFim)) { return; }
      if (abertaAntesDaReativacao(ativ, d, ovs[d])) { return; } /* 16/09: ver a função */
      datas.push(d); visto[d] = true;
    });
    datas.sort(); // string zero-padded → cronológica

    return datas.map(function (d) {
      var ov = ovs[d] || null;
      var status = (ov && ov.status) ? ov.status : STATUS.PENDENTE;
      return {
        atividadeId: (ativ && ativ.id) || null,
        data: d,
        status: status,
        atrasada: status === STATUS.PENDENTE && compareISO(d, hoje) < 0,
        origem: 'atividade',
        override: ov
      };
    });
  }

  /**
   * Próximas N datas planejadas em (ou após) `aPartirDe`. Varre janelas
   * deslizantes de 1 ano (teto 20 anos) e para na dataFim quando houver.
   * @param {Atividade} ativ @param {string} aPartirDe @param {number} [n=1]
   * @returns {string[]}
   */
  function proximas(ativ, aPartirDe, n) {
    n = n || 1;
    if (validar(ativ).length || !isISO(aPartirDe)) { return []; }

    if (ativ.recorrencia === RECORRENCIAS.UNICO) {
      return compareISO(ativ.data, aPartirDe) >= 0 ? [ativ.data] : [];
    }

    var out = [];
    var ini = aPartirDe;
    var passos = 0;
    while (out.length < n && passos < 20) {
      var fim = addDias(ini, 366);
      if (ativ.dataFim != null && compareISO(fim, ativ.dataFim) > 0) { fim = ativ.dataFim; }
      var ds = expandir(ativ, ini, fim);
      for (var i = 0; i < ds.length && out.length < n; i++) {
        if (compareISO(ds[i], aPartirDe) >= 0) { out.push(ds[i]); }
      }
      if (ativ.dataFim != null && compareISO(fim, ativ.dataFim) >= 0) { break; }
      ini = addDias(fim, 1);
      passos++;
    }
    return out;
  }

  // ---------------- ocorrências ----------------

  /**
   * docId determinístico/idempotente da ocorrência: re-tocar a mesma
   * data atualiza o MESMO doc, nunca duplica.
   * @param {string} atividadeId @param {string} dataISO
   */
  function docIdOcorrencia(atividadeId, dataISO) { return String(atividadeId) + '_' + dataISO; }

  // ---------------- API pública ----------------

  window.GrautRecorrencia = {
    STATUS: STATUS,
    RECORRENCIAS: RECORRENCIAS,
    RECORRENCIAS_VALIDAS: RECORRENCIAS_VALIDAS,
    // núcleo
    validar: validar,
    expandir: expandir,
    ocorrenciasNaJanela: ocorrenciasNaJanela,
    proximas: proximas,
    indexarOverrides: indexarOverrides,
    docIdOcorrencia: docIdOcorrencia,
    inicioAoReativar: inicioAoReativar,   /* 16/09: ativar sem atraso falso */
    // helpers de data (úteis para kpi.js e as telas)
    hojeISO: hojeISO,
    addDias: addDias,
    compareISO: compareISO,
    inRange: inRange,
    diasEntre: diasEntre,
    atrasoEmDias: atrasoEmDias,
    diaSemana: diaSemana,
    ultimoDiaMes: ultimoDiaMes,
    clampDiaMes: clampDiaMes,
    toISO: toISO,
    fromISO: fromISO,
    isISO: isISO
  };
})();
