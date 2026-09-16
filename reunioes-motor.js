/* ============================================================
   reunioes-motor.js — a lógica da aba Reuniões, sem tela e sem banco.
   ------------------------------------------------------------
   Por que existe: a reunião de terça tem regras que hoje moram
   espalhadas dentro de projetos.html (2.567 linhas). Aqui ficam as
   que dá para provar no Node: seções e tempos da série, rolagem do
   que não foi feito, contagem de convite, nota do fechamento, texto
   da ata e a data da próxima instância.

   Padrões adotados (ver NOITE/reunioes_REFERENCIAS.md):
     - EOS/Level 10: pauta fixa com tempo por seção; o que está fora
       do rumo vira ASSUNTO em vez de virar debate no meio do ritmo.
     - Fellow: item aberto ROLA para a próxima reunião da série; na
       terceira vez ele deixa de ser lembrete e vira assunto.

   Regras de casa:
     - ES5 puro, zero build, nada de let/const/arrow/crase/spread.
     - Função pura: não toca DOM, não toca Firestore, não usa Date.now
       escondido (quem chama passa a data de hoje).
     - Nomes de campo são os que o banco JÁ grava (confirmadosUids,
       recusas, presentes, pautaItens) — ver NOITE/DUVIDAS.md D-01/D-03.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- séries: o nome do prompt × o tipo que já existe ----------
     O banco grava `tipo` desde a F1-F (projetos.html:440). Renomear
     mudaria dado gravado, então a série é DERIVADA do tipo.            */
  var SERIE_POR_TIPO = {
    lideres: 'lideres_semanal',
    resultado_mensal: 'fechamento_mensal',
    departamento: 'equipe_quinzenal',
    instrutor: 'turma_instrutores_mensal',
    lideres_turma: 'turma_instrutores_mensal'
  };

  var SECOES = {
    /* Terça, 60 min — o desenho do prompt, seção a seção. */
    lideres_semanal: [
      { chave: 'abertura', rotulo: 'Abertura', min: 5 },
      { chave: 'ritmo', rotulo: 'Ritmo da semana', min: 10 },
      { chave: 'planos', rotulo: 'Planos do mês', min: 5 },
      { chave: 'acoes', rotulo: 'Ações da semana passada', min: 5 },
      { chave: 'assunto', rotulo: 'Assuntos', min: 30 },
      { chave: 'fechamento', rotulo: 'Fechamento', min: 5 }
    ],
    /* Fechamento do mês: a seção de planos deixa de ser farol e passa a
       ser "feito / não feito + motivo" (o mês acabou, não há o que prever). */
    fechamento_mensal: [
      { chave: 'abertura', rotulo: 'Abertura', min: 5 },
      { chave: 'ritmo', rotulo: 'Ritmo do mês', min: 10 },
      { chave: 'planos', rotulo: 'Planos do mês: feito ou não feito', min: 15, fechamento: true },
      { chave: 'acoes', rotulo: 'Ações do mês', min: 5 },
      { chave: 'assunto', rotulo: 'Assuntos', min: 20 },
      { chave: 'fechamento', rotulo: 'Fechamento', min: 5 }
    ],
    equipe_quinzenal: [
      { chave: 'ritmo', rotulo: 'Ritmo do setor', min: 10 },
      { chave: 'acoes', rotulo: 'Ações', min: 10 },
      { chave: 'assunto', rotulo: 'Assuntos', min: 25 },
      { chave: 'fechamento', rotulo: 'Fechamento', min: 5 }
    ],
    turma_instrutores_mensal: [
      { chave: 'acoes', rotulo: 'Ações', min: 10 },
      { chave: 'assunto', rotulo: 'Assuntos', min: 25 },
      { chave: 'fechamento', rotulo: 'Fechamento', min: 5 }
    ],
    /* Avulsa e as três de sócios: quem manda são os blocos escritos em
       pautas-modelo.js. Aqui fica só o mínimo para a tela não nascer muda. */
    avulsa: [
      { chave: 'abertura', rotulo: 'Abertura', min: 5 },
      { chave: 'assunto', rotulo: 'Assuntos', min: 40 },
      { chave: 'fechamento', rotulo: 'Fechamento', min: 5 }
    ]
  };

  var MOTIVOS_RECUSA = ['compromisso_trabalho', 'atendimento_aluno', 'ausencia_justificada', 'outro'];
  var SEMANAS_ATE_VIRAR_ASSUNTO = 3;   /* Fellow: na 3ª vez para de ser lembrete */
  var META_ACOES = 0.9;                /* Level 10: meta de 90% das ações feitas */
  var NOTA_QUE_EXIGE_SUGESTAO = 8;     /* abaixo de 8 pede "o que faria ser 10" */

  function serieDe(tipo) {
    return SERIE_POR_TIPO[tipo] || 'avulsa';
  }
  function secoesDe(tipo) {
    return (SECOES[serieDe(tipo)] || SECOES.avulsa).slice();
  }
  function duracaoDe(tipo) {
    var soma = 0;
    secoesDe(tipo).forEach(function (s) { soma += s.min; });
    return soma;
  }
  /* serieId agrupa as instâncias: tipo + setor (departamento tem uma série
     por setor; os demais, uma só na escola). */
  function serieIdDe(reuniao) {
    var t = (reuniao && reuniao.tipo) || 'avulsa';
    var sig = (reuniao && reuniao.setorSigla) || '';
    return sig ? (t + ':' + sig) : t;
  }

  /* ---------- datas civis (mesma doutrina do recorrencia.js: string,
     sem fuso, aritmética em horário local) ---------- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fromISO(iso) {
    var p = String(iso).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function toISO(dt) {
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  }
  function addDias(iso, n) {
    var d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d);
  }
  function primeiraTerca(ano, mes1a12) {
    var d = new Date(ano, mes1a12 - 1, 1);
    while (d.getDay() !== 2) { d.setDate(d.getDate() + 1); }
    return toISO(d);
  }
  /* Data da próxima instância da série. Nasce ao FECHAR a ata da anterior
     (o prompt), então a conta é sempre "a partir desta reunião". */
  function proximaData(tipo, dataISO) {
    if (!dataISO) { return null; }
    var s = serieDe(tipo);
    if (s === 'lideres_semanal') { return addDias(dataISO, 7); }
    if (s === 'equipe_quinzenal') { return addDias(dataISO, 14); }
    if (s === 'fechamento_mensal') {
      var d = fromISO(dataISO);
      var ano = d.getFullYear(), mes = d.getMonth() + 2;
      if (mes > 12) { mes = 1; ano += 1; }
      return primeiraTerca(ano, mes);
    }
    if (s === 'turma_instrutores_mensal') {
      /* Mesmo dia do mês seguinte, com clamp em mês curto (31/10 -> 30/11).
         Trabalha com ÍNDICE de mês (0..11) do começo ao fim: misturar índice
         com número do mês foi exatamente o bug que o harness pegou. */
      var d2 = fromISO(dataISO);
      var ano2 = d2.getFullYear();
      var idx = d2.getMonth() + 1;
      if (idx > 11) { idx = 0; ano2 += 1; }
      var dia = d2.getDate();
      var ultimo = new Date(ano2, idx + 1, 0).getDate();
      return toISO(new Date(ano2, idx, dia > ultimo ? ultimo : dia));
    }
    return null; /* avulsa não tem próxima automática */
  }

  /* ---------- convite: derivado de confirmadosUids + recusas ----------
     Sem resposta é AUSÊNCIA de entrada nos dois — nunca um valor gravado. */
  function statusConvite(reuniao, uid) {
    var r = reuniao || {};
    var conf = r.confirmadosUids || [];
    var i;
    for (i = 0; i < conf.length; i++) {
      if (conf[i] === uid) { return 'vou'; }
    }
    if ((r.recusas || {})[uid]) { return 'nao_vou'; }
    return 'sem_resposta';
  }
  function contagemConvites(reuniao) {
    var r = reuniao || {};
    var uids = r.convocadosUids || [];
    var out = { vou: 0, naoVou: 0, semResposta: 0, total: uids.length };
    uids.forEach(function (u) {
      var s = statusConvite(r, u);
      if (s === 'vou') { out.vou += 1; } else if (s === 'nao_vou') { out.naoVou += 1; } else { out.semResposta += 1; }
    });
    return out;
  }
  function motivoRecusaValido(motivo, detalhe) {
    if (MOTIVOS_RECUSA.indexOf(motivo) === -1) { return { ok: false, erro: 'Escolha um motivo da lista.' }; }
    var d = String(detalhe == null ? '' : detalhe).trim();
    if (motivo === 'outro' && !d) { return { ok: false, erro: 'Motivo "Outro" precisa de uma linha explicando.' }; }
    if (d.length > 280) { return { ok: false, erro: 'Detalhe passa de 280 caracteres.' }; }
    return { ok: true };
  }

  /* ---------- ata pendente: quem conduziu deve, não o sistema ---------- */
  function semAta(reuniao, hojeISO) {
    var r = reuniao || {};
    if (r.encerradaEm) { return false; }
    return !!(r.data && hojeISO && r.data < hojeISO);
  }

  /* ---------- rolagem (Fellow) ----------
     Item que não foi feito volta na próxima instância com o contador +1.
     Na terceira vez ele para de ser lembrete e VIRA ASSUNTO: lembrar de
     novo não está funcionando, então a reunião precisa resolver a causa. */
  function rolarItens(itens) {
    var out = [];
    (itens || []).forEach(function (it) {
      var st = it.status || 'aberta';
      if (st === 'feita' || st === 'resolvida' || st === 'descartada') { return; }
      var n = (typeof it.semanasRolando === 'number' ? it.semanasRolando : 0) + 1;
      var novo = {};
      var k;
      for (k in it) { if (Object.prototype.hasOwnProperty.call(it, k)) { novo[k] = it[k]; } }
      novo.semanasRolando = n;
      novo.status = 'aberta';
      if (n >= SEMANAS_ATE_VIRAR_ASSUNTO) {
        novo.secao = 'assunto';
        novo.viraAssunto = true;
      }
      out.push(novo);
    });
    return out;
  }
  function percentFeitas(itens) {
    var lista = (itens || []).filter(function (it) { return (it.secao || 'acoes') === 'acoes'; });
    if (!lista.length) { return { feitas: 0, total: 0, pct: null, bate: null, meta: META_ACOES }; }
    var feitas = lista.filter(function (it) { return it.status === 'feita'; }).length;
    var pct = feitas / lista.length;
    return { feitas: feitas, total: lista.length, pct: pct, bate: pct >= META_ACOES, meta: META_ACOES };
  }

  /* ---------- nota do fechamento (Level 10) ---------- */
  function validarNota(nota, sugestao) {
    var n = Number(nota);
    if (!(n >= 1 && n <= 10)) { return { ok: false, erro: 'A nota vai de 1 a 10.' }; }
    var s = String(sugestao == null ? '' : sugestao).trim();
    if (n < NOTA_QUE_EXIGE_SUGESTAO && !s) {
      return { ok: false, erro: 'Nota abaixo de 8 precisa dizer o que faria ser 10.' };
    }
    if (s.length > 280) { return { ok: false, erro: 'Sugestão passa de 280 caracteres.' }; }
    return { ok: true };
  }
  function mediaNotas(notas) {
    var mapa = notas || {};
    var soma = 0, n = 0, sugestoes = [];
    var k;
    for (k in mapa) {
      if (Object.prototype.hasOwnProperty.call(mapa, k)) {
        var v = mapa[k] || {};
        var num = Number(v.nota);
        if (num >= 1 && num <= 10) { soma += num; n += 1; }
        var sg = String(v.sugestao == null ? '' : v.sugestao).trim();
        if (sg) { sugestoes.push(sg); }
      }
    }
    return { media: n ? Math.round((soma / n) * 10) / 10 : null, responderam: n, sugestoes: sugestoes };
  }

  /* ---------- pauta: nunca dois itens abertos para a mesma origem ----------
     Regra do prompt (D3). Rules não conseguem consultar a coleção, então a
     trava mora aqui e é usada antes de gravar.                              */
  function chaveOrigem(serieId, refTipo, refId) {
    return String(serieId) + '|' + String(refTipo) + '|' + String(refId);
  }
  function jaTemAberta(sugestoes, serieId, refTipo, refId) {
    var alvo = chaveOrigem(serieId, refTipo, refId);
    var achou = false;
    (sugestoes || []).forEach(function (s) {
      if (s && s.status === 'aberta' && chaveOrigem(s.serieId, s.refTipo, s.refId) === alvo) { achou = true; }
    });
    return achou;
  }

  /* ---------- ata em 1 clique ----------
     Texto determinístico, sem IA: presentes, ausentes com motivo, decisões,
     demandas com dono e prazo, e a média das notas.                        */
  function nomeDe(mapaNomes, uid) {
    return (mapaNomes && mapaNomes[uid]) || uid;
  }
  function ataTexto(reuniao, opts) {
    var r = reuniao || {};
    var o = opts || {};
    var nomes = o.nomes || {};
    var linhas = [];
    var titulo = r.titulo || 'Reunião';
    linhas.push(titulo + ' — ' + (r.data || ''));
    if (r.conduzidaPor) { linhas.push('Conduziu: ' + nomeDe(nomes, r.conduzidaPor)); }
    linhas.push('');

    var presentes = r.presentes || [];
    linhas.push('PRESENTES (' + presentes.length + ')');
    if (!presentes.length) { linhas.push('- (ninguém marcado)'); }
    presentes.forEach(function (p) {
      linhas.push('- ' + (typeof p === 'string' ? nomeDe(nomes, p) : (p.nome || nomeDe(nomes, p.uid))));
    });
    linhas.push('');

    var recusas = r.recusas || {};
    var ausentes = [];
    var k;
    for (k in recusas) {
      if (Object.prototype.hasOwnProperty.call(recusas, k)) {
        var rec = recusas[k] || {};
        var mot = rec.motivo || rec.motivoTexto || 'sem motivo';
        var det = rec.detalhe ? (' — ' + rec.detalhe) : '';
        ausentes.push('- ' + nomeDe(nomes, k) + ': ' + mot + det);
      }
    }
    linhas.push('AUSENTES COM AVISO (' + ausentes.length + ')');
    if (!ausentes.length) { linhas.push('- (nenhum)'); }
    ausentes.forEach(function (l) { linhas.push(l); });
    linhas.push('');

    var decisoes = r.decisoes || [];
    linhas.push('DECISÕES (' + decisoes.length + ')');
    if (!decisoes.length) { linhas.push('- (nenhuma)'); }
    decisoes.forEach(function (d) {
      linhas.push('- ' + (d.texto || d.titulo || '(sem texto)') + (d.donoUid ? (' · dono: ' + nomeDe(nomes, d.donoUid)) : ''));
    });
    linhas.push('');

    var demandas = o.demandas || [];
    linhas.push('DEMANDAS (' + demandas.length + ')');
    if (!demandas.length) { linhas.push('- (nenhuma)'); }
    demandas.forEach(function (d) {
      linhas.push('- ' + (d.texto || '(sem texto)') + ' · ' + nomeDe(nomes, d.destinoUid) + ' · até ' + (d.prazo || 'sem prazo'));
    });
    linhas.push('');

    var m = mediaNotas(r.notas);
    linhas.push('NOTA DA REUNIÃO: ' + (m.media == null ? '(ninguém deu nota)' : (m.media + ' (' + m.responderam + ' resposta' + (m.responderam === 1 ? '' : 's') + ')')));
    if (m.sugestoes.length) {
      linhas.push('O que faria ser 10:');
      m.sugestoes.forEach(function (s) { linhas.push('- ' + s); });
    }
    var pf = percentFeitas(r.pautaItens);
    if (pf.total) {
      linhas.push('');
      linhas.push('Ações da vez anterior: ' + pf.feitas + ' de ' + pf.total + ' feitas (' + Math.round(pf.pct * 100) + '%).');
    }
    return linhas.join('\n');
  }

  root.ReunioesMotor = {
    /* constantes */
    SECOES: SECOES,
    MOTIVOS_RECUSA: MOTIVOS_RECUSA,
    META_ACOES: META_ACOES,
    SEMANAS_ATE_VIRAR_ASSUNTO: SEMANAS_ATE_VIRAR_ASSUNTO,
    /* série e seções */
    serieDe: serieDe,
    serieIdDe: serieIdDe,
    secoesDe: secoesDe,
    duracaoDe: duracaoDe,
    proximaData: proximaData,
    /* convite */
    statusConvite: statusConvite,
    contagemConvites: contagemConvites,
    motivoRecusaValido: motivoRecusaValido,
    /* condução */
    semAta: semAta,
    rolarItens: rolarItens,
    percentFeitas: percentFeitas,
    validarNota: validarNota,
    mediaNotas: mediaNotas,
    /* pauta */
    chaveOrigem: chaveOrigem,
    jaTemAberta: jaTemAberta,
    /* ata */
    ataTexto: ataTexto,
    /* datas (úteis para a tela e para o teste) */
    addDias: addDias,
    primeiraTerca: primeiraTerca
  };
}(typeof window !== 'undefined' ? window : this));
