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

  /* ---------- normalizador de forma ----------
     A lição mais cara desta noite: este motor nasceu esperando o documento
     de ocorrência cru (o.data, o.travadoMotivo), mas quem chama é o board
     do kpi.js, onde a mesma informação mora em outro lugar (o.origData,
     o.ov.travadoMotivo). Do jeito antigo o Pareto contaria zero travas e
     zero ocorrências — em silêncio, que é o pior jeito de errar. Agora as
     duas formas entram, e o teste prova as duas.                          */
  function dataPlanejada(o) {
    return (o && (o.origData || o.data)) || null;
  }
  function dataEfetiva(o) {
    if (!o) { return null; }
    return o.effDate || (o.ov && o.ov.dataOverride) || dataPlanejada(o);
  }
  function travaDe(o) {
    if (!o) { return ''; }
    if (o.travadoMotivo) { return o.travadoMotivo; }
    return (o.ov && o.ov.travadoMotivo) || '';
  }
  function concluidaEmDe(o) {
    if (!o) { return null; }
    if (typeof o.concluidaEm === 'number') { return o.concluidaEm; }
    return (o.ov && typeof o.ov.concluidaEm === 'number') ? o.ov.concluidaEm : null;
  }
  /* Dia civil local de um carimbo em ms — mesma receita do kpi.js. */
  function diaCivil(ms) {
    var d = new Date(ms);
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }

  /* Ordem de precedência. Uma ocorrência conta UMA vez:
       pulada        — decisão explícita de não fazer;
       trava         — impedimento declarado, com motivo de lista fechada;
       fora do prazo — entregou, mas depois do dia combinado;
       atraso        — venceu e continua aberta.
     "Fora do prazo" entrou porque sem ele a rotina que SEMPRE entrega três
     dias tarde aparecia com zero falhas — e era justamente a rotina que
     precisa ir para a reunião de terça. */
  function motivoFalha(o) {
    if (!o) { return null; }
    if (o.status === 'pulada') { return 'pulada'; }
    if (travaDe(o)) { return 'trava'; }
    if (o.status === 'concluida') {
      var ms = concluidaEmDe(o);
      var prazo = dataEfetiva(o);
      return (ms && prazo && diaCivil(ms) > prazo) ? 'fora_do_prazo' : null;
    }
    if (o.atrasada) { return 'atraso'; }
    return null;
  }
  function ehFalha(o) { return motivoFalha(o) !== null; }

  /* Entra na medição a ocorrência que (a) foi planejada do marco zero em
     diante e (b) JÁ VENCEU. Sem o (b) a conta sai diluída: o board traz 30
     dias de futuro, e ocorrência que nem chegou não pode contar como
     "prevista" no denominador. */
  function contaNaMedicao(o, marco, hojeISO) {
    var m = marco || MARCO_ZERO;
    var plan = dataPlanejada(o);
    if (!plan || plan < m) { return false; }
    if (!hojeISO) { return true; }
    return (dataEfetiva(o) || plan) <= hojeISO;
  }

  function maisRepetido(mapa) {
    var melhor = null, n = 0, k;
    for (k in mapa) {
      if (Object.prototype.hasOwnProperty.call(mapa, k) && mapa[k] > n) { n = mapa[k]; melhor = k; }
    }
    return melhor ? { motivo: melhor, vezes: n } : null;
  }

  /* Resumo de UMA atividade a partir das ocorrências dela. */
  function resumoAtividade(ocorrencias, marco, hojeISO) {
    var out = {
      previstas: 0, falhas: 0,
      atrasos: 0, travas: 0, puladas: 0, foraDoPrazo: 0,
      taxa: null, motivos: {}, motivoQueMaisRepete: null
    };
    (ocorrencias || []).forEach(function (o) {
      if (!contaNaMedicao(o, marco, hojeISO)) { return; }
      out.previstas += 1;
      var mot = motivoFalha(o);
      if (!mot) { return; }
      out.falhas += 1;
      if (mot === 'pulada') { out.puladas += 1; }
      else if (mot === 'trava') {
        out.travas += 1;
        var t = travaDe(o);
        out.motivos[t] = (out.motivos[t] || 0) + 1;
      } else if (mot === 'fora_do_prazo') { out.foraDoPrazo += 1; }
      else { out.atrasos += 1; }
    });
    out.taxa = out.previstas ? Math.round((out.falhas / out.previstas) * 100) / 100 : null;
    out.motivoQueMaisRepete = maisRepetido(out.motivos);
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
        taxa: prev ? Math.round((i.falhas / prev) * 100) / 100 : null,
        /* a divisão do que falhou segue junto: é ela que diz se a rotina
           está parando por impedimento, por esquecimento ou por entrega
           fora do dia — três problemas com três remédios diferentes */
        atrasos: i.atrasos || 0,
        travas: i.travas || 0,
        puladas: i.puladas || 0,
        foraDoPrazo: i.foraDoPrazo || 0,
        motivoQueMaisRepete: i.motivoQueMaisRepete || null
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
    var motivo = linha.motivoQueMaisRepete;
    return {
      secao: 'ritmo',
      refTipo: 'ocorrencia',
      refId: linha.chave,
      texto: (setorSigla ? (setorSigla + ' · ') : '') + linha.rotulo +
        ': ' + linha.falhas + ' falha' + (linha.falhas === 1 ? '' : 's') +
        ' em ' + linha.previstas + ' previstas' +
        (linha.taxa != null ? (' (' + Math.round(linha.taxa * 100) + '%)') : '') +
        (motivo ? ('. O que mais travou: ' + rotuloMotivo(motivo.motivo).toLowerCase() + ', ' + motivo.vezes + '×') : '')
    };
  }

  /* Rótulo com acento na tela, valor sem acento no banco. A tela nunca
     inventa o texto do motivo: pede aqui. Motivo fora da lista volta como
     veio, para uma trava antiga não sumir da contagem. */
  var ROTULO_MOTIVO = {
    dependencia: 'Dependência de outra pessoa',
    informacao: 'Falta de informação',
    prioridade: 'Outra prioridade entrou na frente',
    tempo: 'Faltou tempo',
    ferramenta: 'Ferramenta ou material',
    outro: 'Outro'
  };
  function rotuloMotivo(valor) {
    return ROTULO_MOTIVO[valor] || String(valor || '');
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
    itemDePauta: itemDePauta,
    rotuloMotivo: rotuloMotivo,
    /* expostos porque a tela precisa ler o board com o mesmo critério do
       motor — se ela reimplementar isso, os dois divergem em silêncio */
    dataPlanejada: dataPlanejada,
    dataEfetiva: dataEfetiva,
    travaDe: travaDe
  };
}(typeof window !== 'undefined' ? window : this));
