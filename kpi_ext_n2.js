/* ============================================================================
   kpi_ext_n2.js — MATEMÁTICA PURA do Bloco N2 (validada em harness Node)
   Sistema A · Grau Técnico FSA
   ----------------------------------------------------------------------------
   ⚠ NÃO SUBIR AO GITHUB COMO ARQUIVO SEPARADO.
   Este arquivo é INSUMO DE MERGE: no próximo chat, estas funções entram no
   kpi.js real (produção) com o prefixo já compatível (KPI._score etc.).
   Zero dependência de Firestore/DOM — por isso pôde ser validado esta noite.
   ============================================================================ */
(function () {
  'use strict';
  var EXT = {};

  /* ------------------------------------------------------------------ */
  /* SCORE DE SETOR 0–100 · pesos DECLARADOS no "i": aderência 50 ·      */
  /* atrasadas 30 · aging 20.                                            */
  /*   compA = aderência (%)                                             */
  /*   compB = 100 − min(100, %atrasadas)      (menor = melhor)          */
  /*   compC = 100 − aging×12,5, piso 0        (0d=100 · 4d=50 · 8d+=0)  */
  /*   score = arred(0,5·A + 0,3·B + 0,2·C)                              */
  /* Semáforo: ≥80 ok · 60–79 warn · <60 bad                             */
  /* ------------------------------------------------------------------ */
  EXT._score = function (aderPct, pctAtrasadas, agingMedio) {
    var a = Math.max(0, Math.min(100, Number(aderPct) || 0));
    var b = 100 - Math.max(0, Math.min(100, Number(pctAtrasadas) || 0));
    var c = Math.max(0, 100 - (Number(agingMedio) || 0) * 12.5);
    var s = Math.round(0.5 * a + 0.3 * b + 0.2 * c);
    var tom = s >= 80 ? 'ok' : (s >= 60 ? 'warn' : 'bad');
    return { score: s, tom: tom, compA: a, compB: b, compC: Math.round(c) };
  };

  /* Mediana simples (para a régua de carga do detector). */
  EXT._mediana = function (arr) {
    if (!arr || !arr.length) { return 0; }
    var v = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(v.length / 2);
    return (v.length % 2) ? v[m] : (v[m - 1] + v[m]) / 2;
  };

  /* ------------------------------------------------------------------ */
  /* DETECTOR DE GARGALO · regra EXPLÍCITA (declarada no "i" e no card): */
  /*   gargalo se  aderência < 80                                        */
  /*   OU  (atrasadas > 0  E  aging ≥ 4d  E  carga > 1,5 × mediana)      */
  /* Entrada: [{sigla, ader, atrasadas, agingMedio, carga}]              */
  /* Saída:   [{sigla, motivo}] — motivo em texto pronto p/ Plano de ação */
  /* ------------------------------------------------------------------ */
  EXT._gargalos = function (setores) {
    var out = [];
    if (!setores || !setores.length) { return out; }
    var cargas = [];
    for (var i = 0; i < setores.length; i++) { cargas.push(Number(setores[i].carga) || 0); }
    var med = EXT._mediana(cargas);
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

  /* ------------------------------------------------------------------ */
  /* TENDÊNCIA · Δ vs 7 dias, sobre snapshots diários.                   */
  /* snapshots: [{data:'YYYY-MM-DD', ...}] em QUALQUER ordem.            */
  /* Regra declarada: base = snapshot mais recente com data ≤ hoje−7d.   */
  /* Sem base ≥7d → suficiente:false + coletando 'X/7' (X = dias         */
  /* distintos coletados, teto 7). NUNCA inventa tendência.              */
  /* ------------------------------------------------------------------ */
  EXT._dataMenos = function (iso, dias) {
    var p = iso.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() - dias);
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  };
  EXT._trend = function (snapshots, chave, hoje) {
    var lista = (snapshots || []).slice().sort(function (a, b) {
      return a.data < b.data ? -1 : (a.data > b.data ? 1 : 0);
    });
    var corte = EXT._dataMenos(hoje, 7);
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

  /* Formata o Δ com semântica invertível (benchmark ClearPoint):        */
  /* menorMelhor=true (atrasadas, aging, reprog): queda = ok.            */
  EXT._deltaFmt = function (delta, menorMelhor) {
    if (delta === null || delta === undefined) { return { texto: '—', tom: 'flat' }; }
    var d = Number(delta) || 0;
    var txt = (d > 0 ? '+' : '') + String(d).replace('.', ',');
    if (d === 0) { return { texto: '0', tom: 'flat' }; }
    var bom = menorMelhor ? (d < 0) : (d > 0);
    return { texto: txt, tom: bom ? 'ok' : 'bad' };
  };

  /* ------------------------------------------------------------------ */
  /* SPARKLINE · gera o atributo points de uma <polyline> SVG a partir   */
  /* dos ÚLTIMOS ≤14 valores. Normalização min–max com padding 2px;      */
  /* série constante → linha no meio; <2 pontos → '' (não desenha).      */
  /* ------------------------------------------------------------------ */
  EXT._sparkPoints = function (valores, w, h) {
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

  if (typeof window !== 'undefined') { window.KPIExtN2 = EXT; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = EXT; }
})();
