/* ============================================================
   pareto-motor.js — quais atividades mais falham, e por quê.
   ------------------------------------------------------------
   Regra do negócio (decisão 15/09): a medição começa em 16/09 e NÃO é
   retroativa. Ocorrência anterior ao marco zero não entra na conta —
   senão o Pareto do primeiro dia apontaria para a bagunça que o marco
   zero acabou de arrumar.

   Uma ocorrência conta como UMA falha, mesmo que esteja pulada, travada
   e atrasada ao mesmo tempo: contar três vezes faria a mesma atividade
   pesar o triplo e mandaria a reunião de terça para o lugar errado.

   ES5 puro, função pura: não toca DOM, não toca Firestore, não lê a data
   do sistema (quem chama passa o "hoje"). Testável no Node.
   ============================================================ */
(function (root) {
  'use strict';

  var MARCO_ZERO = '2026-09-16';
  var CORTE_ACUMULADO = 80;   /* % acumulado que fecha a lista (Pareto) */
  var MIN_LINHAS = 3;
  var MAX_LINHAS = 10;

  /* Ordem de precedência do motivo. Pulada é decisão explícita de não
     fazer; trava é impedimento declarado; atraso é o resto. */
  function motivoFalha(o) {
    if (!o) { return null; }
    if (o.status === 'pulada') { return 'pulada'; }
    if (o.travadoMotivo) { return 'trava'; }
    if (o.atrasada) { return 'atraso'; }
    return null;
  }
  function ehFalha(o) { return motivoFalha(o) !== null; }
  function contaNaMedicao(o, marco) {
    var m = marco || MARCO_ZERO;
    return !!(o && o.data && o.data >= m);
  }

  /* Resumo de UMA atividade a partir das ocorrências dela. */
  function resumoAtividade(ocorrencias, marco) {
    var out = { previstas: 0, falhas: 0, atrasos: 0, travas: 0, puladas: 0, taxa: null };
    (ocorrencias || []).forEach(function (o) {
      if (!contaNaMedicao(o, marco)) { return; }
      out.previstas += 1;
      var mot = motivoFalha(o);
      if (!mot) { return; }
      out.falhas += 1;
      if (mot === 'pulada') { out.puladas += 1; }
      else if (mot === 'trava') { out.travas += 1; }
      else { out.atrasos += 1; }
    });
    out.taxa = out.previstas ? Math.round((out.falhas / out.previstas) * 100) / 100 : null;
    return out;
  }

  /* Pareto: barras decrescentes + linha de % acumulado.
     Entrada: [{ chave, rotulo, falhas, previstas }] já somado por atividade.
     Corta em 80% do acumulado, com piso de 3 e teto de 10 linhas.          */
  function pareto(itens, opts) {
    var o = opts || {};
    var corte = typeof o.corte === 'number' ? o.corte : CORTE_ACUMULADO;
    var min = typeof o.min === 'number' ? o.min : MIN_LINHAS;
    var max = typeof o.max === 'number' ? o.max : MAX_LINHAS;

    var lista = (itens || []).filter(function (i) { return i && i.falhas > 0; }).map(function (i) {
      var prev = i.previstas || 0;
      return {
        chave: i.chave,
        rotulo: i.rotulo || i.chave,
        falhas: i.falhas,
        previstas: prev,
        taxa: prev ? Math.round((i.falhas / prev) * 100) / 100 : null
      };
    });
    lista.sort(function (a, b) {
      if (b.falhas !== a.falhas) { return b.falhas - a.falhas; }
      if ((b.taxa || 0) !== (a.taxa || 0)) { return (b.taxa || 0) - (a.taxa || 0); }
      return String(a.rotulo).localeCompare(String(b.rotulo), 'pt-BR');
    });

    var total = 0;
    lista.forEach(function (i) { total += i.falhas; });
    if (!total) {
      return {
        linhas: [], total: 0, vazio: true,
        mensagemVazia: 'A medição começou em ' + fmtCurto(o.marco || MARCO_ZERO) + '.',
        formula: formula()
      };
    }

    var acum = 0;
    var linhas = [];
    var i;
    for (i = 0; i < lista.length; i++) {
      acum += lista[i].falhas;
      lista[i].pctAcumulado = Math.round((acum / total) * 100);
      linhas.push(lista[i]);
      if (linhas.length >= max) { break; }
      if (lista[i].pctAcumulado >= corte && linhas.length >= min) { break; }
    }
    return {
      linhas: linhas, total: total, vazio: false,
      cobertura: linhas.length ? linhas[linhas.length - 1].pctAcumulado : 0,
      mensagemVazia: null,
      formula: formula()
    };
  }

  function formula() {
    return {
      titulo: 'Como esta lista é montada',
      linhas: [
        ['Fórmula', 'Falhas por atividade desde o marco zero = atrasos + travas + puladas, contando uma vez por ocorrência. Taxa = falhas ÷ previstas. A lista vai até 80% do acumulado, com no mínimo 3 e no máximo 10 linhas.'],
        ['Dados', 'Ocorrências com data a partir de 16/09, cruzadas com a atividade. Nada é gravado: o número é calculado na hora.'],
        ['Para que serve', 'Mostrar as poucas rotinas que respondem pela maior parte das falhas do setor — é o que entra no ritmo da semana da reunião de terça.']
      ]
    };
  }

  function fmtCurto(iso) {
    var p = String(iso).split('-');
    return p.length === 3 ? (p[2] + '/' + p[1]) : String(iso);
  }

  /* "Levar para a pauta de terça" — o texto e a origem do item, para a tela
     gravar em pauta_sugestoes sem duplicar (a trava de duplicata é do
     reunioes-motor.js: jaTemAberta). */
  function itemDePauta(linha, setorSigla) {
    if (!linha) { return null; }
    return {
      secao: 'ritmo',
      refTipo: 'ocorrencia',
      refId: linha.chave,
      texto: (setorSigla ? (setorSigla + ' · ') : '') + linha.rotulo +
        ': ' + linha.falhas + ' falha' + (linha.falhas === 1 ? '' : 's') +
        ' em ' + linha.previstas + ' previstas' +
        (linha.taxa != null ? (' (' + Math.round(linha.taxa * 100) + '%)') : '')
    };
  }

  root.ParetoMotor = {
    MARCO_ZERO: MARCO_ZERO,
    CORTE_ACUMULADO: CORTE_ACUMULADO,
    MIN_LINHAS: MIN_LINHAS,
    MAX_LINHAS: MAX_LINHAS,
    motivoFalha: motivoFalha,
    ehFalha: ehFalha,
    contaNaMedicao: contaNaMedicao,
    resumoAtividade: resumoAtividade,
    pareto: pareto,
    itemDePauta: itemDePauta
  };
}(typeof window !== 'undefined' ? window : this));
