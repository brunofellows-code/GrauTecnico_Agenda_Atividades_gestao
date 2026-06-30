/* ============================================================
   Sistema A · Grau Técnico FSA — Motor de Recorrência (Fase 2)
   ------------------------------------------------------------
   Modelo (HANDOFF v7 · "modelo de calendário"):
     - A regra mora na atividade. As OCORRÊNCIAS são CALCULADAS
       na leitura (expandir a regra numa janela) e sobrepostas
       pelos overrides gravados só quando a ocorrência é tocada
       (concluir / pular / reprogramar / editar esta).
     - Ocorrência nunca tocada NÃO tem doc → ausência = pendente.

   5 tipos (decisões travadas):
     diario     — todo dia, de dataInicio até dataFim (ou aberto)
     semanal    — dias da semana em `diasSemana` (0=Dom … 6=Sáb)
     quinzenal  — dias FIXOS 1 e 15 de cada mês
     mensal     — dia `diaMes`; 29–31 CLAMPA p/ o último dia do mês
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
   * @property {'diario'|'semanal'|'quinzenal'|'mensal'|'unico'} recorrencia
   * @property {number[]} [diasSemana]  // semanal: 0..6
   * @property {number}   [diaMes]      // mensal: 1..31
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
    UNICO: 'unico'
  };
  var RECORRENCIAS_VALIDAS = ['diario', 'semanal', 'quinzenal', 'mensal', 'unico'];

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
    if (tipo === RECORRENCIAS.MENSAL) {
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
      guard = 0;
      for (d = ini; compareISO(d, fim) <= 0 && guard < 4000; d = addDias(d, 1)) {
        out.push(d); guard++;
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
    }
    return out;
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
      if (!visto[d] && inRange(d, jIni, jFim)) { datas.push(d); visto[d] = true; }
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
