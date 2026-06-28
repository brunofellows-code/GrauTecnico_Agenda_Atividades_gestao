/* ============================================================
   Sistema A · Grau Técnico FSA — Cascata de % (lógica de negócio)
   ------------------------------------------------------------
   Regra (Seção 9):
     atividade.pct = média(subtarefas.pct)   (arredondada)
     projeto.pct   = média(atividades.pct)   (arredondada)
   - Default: média simples. Se houver `peso` por item, vira
     soma ponderada automaticamente.
   - Subtarefa aceita `pct` (0–100) OU `done` (boolean).
   - Atividade folha (sem subtarefas) usa o pct próprio.
   - Faixa de cor: ≥67 green · 34–66 amber · <34 red.
   Vanilla puro, sem build. Tipagem por JSDoc.
   ============================================================ */
(function () {
  'use strict';

  /**
   * @typedef {{ pct?:number, done?:boolean, peso?:number }} Subtarefa
   * @typedef {{ pct?:number, peso?:number, subtarefas?:Subtarefa[], sub?:Subtarefa[] }} Atividade
   * @typedef {{ pct?:number, atividades?:Atividade[], tree?:Atividade[] }} Projeto
   */

  /** Limita a 0–100. @param {number} n @returns {number} */
  function clamp(n) { return n < 0 ? 0 : n > 100 ? 100 : n; }

  /**
   * % normalizado de uma subtarefa: usa `pct` se numérico, senão
   * `done` (true=100 / false=0); ausente = 0.
   * @param {Subtarefa} st @returns {number}
   */
  function pctSubtarefa(st) {
    if (!st) { return 0; }
    if (typeof st.pct === 'number') { return clamp(st.pct); }
    if (typeof st.done === 'boolean') { return st.done ? 100 : 0; }
    return 0;
  }

  /**
   * Média ponderada (peso default 1; peso ≤ 0 é ignorado).
   * @param {any[]} itens
   * @param {(x:any)=>number} getVal
   * @param {(x:any)=>(number|undefined)} [getPeso]
   * @returns {number}
   */
  function mediaPond(itens, getVal, getPeso) {
    var somaV = 0, somaP = 0;
    for (var i = 0; i < itens.length; i++) {
      var p = getPeso ? (getPeso(itens[i]) || 1) : 1;
      if (p <= 0) { continue; }
      somaV += getVal(itens[i]) * p;
      somaP += p;
    }
    return somaP > 0 ? somaV / somaP : 0;
  }

  /** Lista de subtarefas da atividade (aceita `subtarefas` ou `sub`). */
  function subsDe(ativ) { return (ativ && (ativ.subtarefas || ativ.sub)) || []; }
  /** Lista de atividades do projeto (aceita `atividades` ou `tree`). */
  function ativsDe(proj) { return (proj && (proj.atividades || proj.tree)) || []; }

  /**
   * % de uma atividade = média(subtarefas). Folha (0 subtarefas) usa
   * o pct próprio da atividade.
   * @param {Atividade} ativ @returns {number}
   */
  function pctAtividade(ativ) {
    if (!ativ) { return 0; }
    var subs = subsDe(ativ);
    if (subs.length === 0) { return clamp(typeof ativ.pct === 'number' ? ativ.pct : 0); }
    return Math.round(mediaPond(subs, pctSubtarefa, function (s) { return s.peso; }));
  }

  /**
   * % de um projeto = média(atividades), recalculando cada atividade.
   * @param {Projeto} proj @returns {number}
   */
  function pctProjeto(proj) {
    if (!proj) { return 0; }
    var ats = ativsDe(proj);
    if (ats.length === 0) { return clamp(typeof proj.pct === 'number' ? proj.pct : 0); }
    return Math.round(mediaPond(ats, pctAtividade, function (a) { return a.peso; }));
  }

  /**
   * Recalcula em cascata e GRAVA `.pct` em cada atividade e no projeto.
   * O projeto usa os pct já arredondados das atividades (Seção 9).
   * @param {Projeto} proj @returns {Projeto} o mesmo objeto, atualizado
   */
  function recalc(proj) {
    if (!proj) { return proj; }
    var ats = ativsDe(proj);
    ats.forEach(function (a) { a.pct = pctAtividade(a); });
    proj.pct = ats.length
      ? Math.round(mediaPond(ats, function (a) { return a.pct; }, function (a) { return a.peso; }))
      : clamp(typeof proj.pct === 'number' ? proj.pct : 0);
    return proj;
  }

  /**
   * Faixa de cor por % (Seção 9): ≥67 green · 34–66 amber · <34 red.
   * @param {number} pct @returns {'green'|'amber'|'red'}
   */
  function pctColor(pct) { return pct >= 67 ? 'green' : pct >= 34 ? 'amber' : 'red'; }

  window.GrautCascade = {
    pctSubtarefa: pctSubtarefa,
    pctAtividade: pctAtividade,
    pctProjeto: pctProjeto,
    recalc: recalc,
    pctColor: pctColor
  };
})();
