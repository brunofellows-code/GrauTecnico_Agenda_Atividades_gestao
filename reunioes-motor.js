/* ============================================================
   reunioes-motor.js — a lógica da aba Reuniões, sem tela e sem banco.
   ------------------------------------------------------------
   Por que existe: a reunião de terça tem regras que hoje moram
   espalhadas dentro de projetos.html (2.567 linhas). Aqui ficam as
   que dá para provar no Node: seções e tempos da série, rolagem do
   que não foi feito, contagem de convite, nota do fechamento, texto
   da ata e a data da próxima instância. Desde 16/09 também: o ciclo
   de decisões (um critério só para o painel e a pauta), a trava de
   sugestão de pauta repetida e o que fazer com o início não medido.

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
       recusas, presentes, faltas, pautaItens) — ver NOITE/DUVIDAS.md D-01/D-03.
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
    lideres_turma: 'turma_instrutores_mensal',
    /* 16/09 (noite): a Reunião Integrada semanal ganha série própria — os 6
       blocos temáticos do 00-CHECKLIST-REUNIAO-INTEGRADA.md (donos por bloco),
       com o roteiro Level 10 em volta: abertura, o que ficou da anterior,
       placar, temas, fechamento. 80 min. Antes caía em 'avulsa'. */
    integrada: 'integrada_semanal'
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
    integrada_semanal: [
      { chave: 'abertura', rotulo: 'Abertura e presença', min: 5 },
      { chave: 'acoes', rotulo: 'O que ficou da anterior', min: 5 },
      { chave: 'ritmo', rotulo: 'Placar da semana', min: 5 },
      { chave: 'evasao', rotulo: 'Evasão', min: 10, tema: true, donos: 'Pedagógico · CRA · CSA · Agência' },
      { chave: 'inadimplencia', rotulo: 'Inadimplência e recebimento', min: 10, tema: true, donos: 'CRA · ADM/Financeiro' },
      { chave: 'comercial', rotulo: 'Comercial e entrada de receita', min: 10, tema: true, donos: 'Gestor · Comercial · CSA' },
      { chave: 'conformidade', rotulo: 'Conformidade e risco legal', min: 10, tema: true, donos: 'ADM/Financeiro · Pedagógico · Gestor' },
      { chave: 'empregabilidade', rotulo: 'Empregabilidade e satisfação', min: 10, tema: true, donos: 'Agência · Pedagógico · CSA' },
      { chave: 'integracao', rotulo: 'Integração e gestão', min: 10, tema: true, donos: 'Gestor Operacional' },
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

  /* Perguntas de cada bloco temático da Integrada — transcrição condensada do
     checklist (metas incluídas). Marcar ✅/⚠️/❌ é da tela; item fora da meta
     vira decisão com dono e prazo. */
  var PERGUNTAS = {
    evasao: [
      'Evasão da semana e tendência (meta GT 4,8% / GP 5%) — perdas ofensoras: NC, LFR, LFI, CAN, CAC, LAC',
      'Turmas nos 2 primeiros meses com ligação a cada falta',
      '100% das faltas lançadas em até 2 dias e conferidas pelo ADM',
      'Cancelamentos: quantos entraram, quantos passaram pela Coordenação, % de reversão',
      'CSA: matriculados da semana com contatos D+1, D+5 e D+10',
      'NC revertidos com o Pedagógico antes de virar CAC',
      'Turmas iniciando na penúltima semana ou vencimento após o dia 20'
    ],
    inadimplencia: [
      'Inadimplência de ativos GT e GP × meta (9,3% / 11%)',
      'LFI negociados que receberam todas as parcelas no mês',
      'Recuperados frente aos 5%',
      '% de 1ªs parcelas pagas × projeção (meta 75%, degrau 68%)',
      '% de ativos pagantes (meta 88%) — GT e GP',
      'Conciliação bancária e de cartões feita; divergência de caixa justificada',
      'Baixas do arquivo retorno diárias e remessa enviada',
      'SPC/Serasa atualizado; negociações no histórico',
      'Acordos pendentes de desconto de pontualidade até o dia 30/31'
    ],
    comercial: [
      'Raio-X no mínimo diário (25 faladas / 8 potenciais / 1–2 matrículas); conversão perto de 50%',
      'Pendentes e potenciais acumulando de um dia para o outro',
      'Turmas à venda com 90 dias; alguma abaixo de 90% (minicurso) ou com 15 alunos ou menos',
      'Contratos do mês assinados e sem pendência de documento',
      'Meta de vendas / CAC (12%) no ritmo; expectativa alinhada ao que é entregue',
      'Receita indireta (CSA): matrículas por indicação e 1ª parcela'
    ],
    conformidade: [
      'Redatamento de parcela fora de adiamento de turma — foi autorizado?',
      'SISTEC/Censo em dia; senha do Sistec só com o gestor',
      'Curso com portaria ou parecer perto do vencimento',
      'Saúde: convênios, seguros e horas de estágio em dia e arquivados',
      'Folha paga até o 5º dia útil; documentos ao contador no prazo',
      'Backup off-line do Acadweb/Qualinfo feito na semana',
      'Requerimentos com as assinaturas obrigatórias (gestor + líder + aluno)',
      'Matrículas da semana com documentos digitalizados'
    ],
    empregabilidade: [
      'Empresas parceiras novas na semana; ativas na listagem',
      'Vagas encaminhadas com 3 candidatos; contratados com foto (meta 2%)',
      'Banco de Talentos com currículos novos; perfil pedido não atendido',
      'Estagiários acompanhados (Ficha D); sinais de insatisfação da empresa',
      'VPOs válidas (ata + foto + 10 alunos) e palestras realizadas',
      'Cronograma da Feira de Empregabilidade (60 dias antes, 10 empresas, 2 processos)',
      'NPS da semana (oficial 75, degrau 50–55); detratores com ação imediata',
      'TMA de 6–8 min e FCR perto de 88% (CSA); fila nos picos',
      'Pesquisa de satisfação e score semanal; instrutor com avaliação negativa reincidente',
      'Insatisfações respondidas ao aluno em até 48 h'
    ],
    integracao: [
      'A Integrada saiu com plano de ação e responsável',
      'Handoffs do Pedagógico ao Comercial (datas, empresas) e ao ADM (virada de módulos)',
      'CSA × CRA: sobreposição na negociação do mesmo aluno; alçadas claras',
      'Planilha unificada e relatórios diários chegaram à Coordenação e à Gestão',
      'Adimplentes com a Franqueadora',
      'Leitura diária de Meus Indicadores e da evasão'
    ]
  };
  function perguntasDe(tipo, chave) {
    if (serieDe(tipo) !== 'integrada_semanal') { return []; }
    return (PERGUNTAS[chave] || []).slice();
  }

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
    if (s === 'lideres_semanal' || s === 'integrada_semanal') { return addDias(dataISO, 7); }
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

  /* ---------- início real: só vale o que foi medido ----------
     CORREÇÃO (16/09, defeito #44). Encerrar sem ter clicado "Iniciar
     reunião" gravava horaInicioReal = hora prevista (ou a hora do
     encerramento, quando não havia prevista). Cenário: prevista 16:00,
     começou 16:40, ninguém clicou Iniciar, encerraram às 17:30. A tela
     passava a mostrar "Início real 16:00" sem selo de atraso — afirmava
     uma pontualidade que ninguém mediu. Sem hora prevista, gravava 17:30,
     a hora do FECHAMENTO, como início. Agora o campo fica vazio e a tela
     diz "início não registrado": em reunião encerrada, ou cuja data já
     passou, sem início gravado. Reunião de hoje ou futura ainda pode ser
     iniciada, então ali não há o que avisar. */
  function inicioNaoRegistrado(reuniao, hojeISO) {
    var r = reuniao || {};
    if (r.horaInicioReal) { return false; }
    if (r.encerradaEm) { return true; }
    return !!(r.data && hojeISO && r.data < hojeISO);
  }
  /* "Iniciar reunião" só aparece enquanto o clique MEDE alguma coisa.
     Sem o início inventado, uma reunião encerrada e depois reaberta pelo
     gestor voltaria a oferecer o botão; clicado dias depois às 09:10
     (prevista 16:00), gravaria "Adiantada 410 min". Por isso: reunião já
     reaberta (reabertaEm) ou de data que já passou não pode mais ser
     iniciada — o início dela é o que ficou registrado, ou nada. */
  function podeIniciar(reuniao, hojeISO) {
    var r = reuniao || {};
    if (r.encerradaEm || r.horaInicioReal || r.reabertaEm) { return false; }
    return !(r.data && hojeISO && r.data < hojeISO);
  }

  /* ---------- rolagem (Fellow) ----------
     Item que não foi feito volta na próxima instância com o contador +1.
     Na terceira vez ele para de ser lembrete e VIRA ASSUNTO: lembrar de
     novo não está funcionando, então a reunião precisa resolver a causa. */
  function rolarItens(itens) {
    var out = [];
    (itens || []).forEach(function (it) {
      /* CORREÇÃO (noite de 15/09): só rola item que TEM ciclo de vida.
         Nesta tela, item de pauta é gravado como { texto, uid, nome } — sem
         status — e não existe onde marcá-lo como feito. Rolando por padrão,
         100% dos itens eram copiados para a reunião seguinte toda semana e a
         pauta virava um depósito, sem ninguém conseguir limpar. Item sem
         status é recado daquela reunião; compromisso é decisão ou demanda,
         que têm status. Quando a tela ganhar o "marcar como feita", o item
         passa a ter status e volta a rolar sozinho. */
      if (typeof it.status !== 'string' || !it.status) { return; }
      var st = it.status;
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
    /* CORREÇÃO (noite de 15/09): era (it.secao || 'acoes'), então TODO item de
       pauta sem seção entrava como "ação" e a ata dizia "0 de 4 feitas (0%)"
       sobre recados que nunca foram ações. Só conta o que foi marcado ação. */
    var lista = (itens || []).filter(function (it) { return it && it.secao === 'acoes'; });
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

  /* ---------- cascata: a sugestão que a tela GRAVA de verdade ----------
     CORREÇÃO (16/09, defeito #29). A jaTemAberta acima nunca foi chamada
     pela tela, e não acharia nada se fosse: procura status 'aberta' e a
     chave serieId|refTipo|refId, mas o "Encaminhar p/ pauta" grava
     { texto, origem:{reuniaoId}, destinoTipo, destinoSetorSigla,
     status:'pendente' } — a chave desses docs dava
     'undefined|undefined|undefined'. Cenário: duplo clique em "Encaminhar"
     para Departamento/SEC criava duas sugestões pendentes idênticas; as
     duas entravam pré-marcadas na pauta do SEC e o texto gravado saía com
     a mesma linha duas vezes em "2) CASCATA".
     A jaTemAberta fica como está: é o contrato do pareto-motor.js
     (itemDePauta devolve refTipo/refId). Esta compara os campos que a
     tela de fato grava: mesma reunião de origem + mesmo texto + mesmo
     destino. No texto, espaço nas pontas ou repetido não conta (na tela é
     o mesmo texto); maiúscula conta. Aceita ou descartada não trava: pode
     ser encaminhada de novo. */
  function textoDaSugestao(t) {
    return String(t == null ? '' : t).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }
  function mesmaSugestao(a, b) {
    var oa = (a && a.origem) || {};
    var ob = (b && b.origem) || {};
    return (oa.reuniaoId || null) === (ob.reuniaoId || null) &&
      textoDaSugestao(a && a.texto) === textoDaSugestao(b && b.texto) &&
      ((a && a.destinoTipo) || null) === ((b && b.destinoTipo) || null) &&
      ((a && a.destinoSetorSigla) || null) === ((b && b.destinoSetorSigla) || null);
  }
  function jaTemPendente(sugestoes, doc) {
    if (!doc) { return false; }
    var achou = false;
    (sugestoes || []).forEach(function (s) {
      if (s && s.status === 'pendente' && s.ativo !== false && mesmaSugestao(s, doc)) { achou = true; }
    });
    return achou;
  }

  /* ---------- ciclo de decisões: um critério só para painel e pauta ----------
     CORREÇÃO (16/09, defeitos #15 e #16). A mesma decisão tinha três
     leituras na mesma tela:
       - o placar dentro da reunião (kpi.js placarReuniao) punha a decisão
         sem dado da atividade-filha em "fora da janela";
       - o painel "Ciclo de decisões" jogava essa mesma decisão no else e a
         contava como CONCLUÍDA. Cenário: hoje 16/09, decisão virou
         atividade com prazo 20/11, ainda não feita — o painel dizia
         "Decisões concluídas: 1" e a reunião dizia "fora da janela 1";
       - a pauta da raiz olhava só d.aberta === true, e virar atividade
         grava aberta:false. "Refazer escala" (prazo 10/09, convertida, não
         feita) sumia da seção 4 e a pauta dizia "nenhuma decisão aberta"
         enquanto o painel, na mesma tela, mostrava "vencidas: 1".
     Agora painel e pauta leem daqui, com o status derivado que o chamador
     injeta (KPI.statusDecisao + ocorrência da atividade-filha). Status
     que não dá para saber vai para foraJanela: nunca some e nunca conta
     como feita. */
  var CHAVES_CONCLUIDA = { no_prazo: true, atraso: true, feita: true, resolvida: true };
  function cicloDecisoes(reunioes, statusDe) {
    var out = {
      emAberto: [],     /* aberta + vencida, da reunião mais antiga para a mais nova */
      concluidas: [],
      foraJanela: [],
      n: { aberta: 0, vencida: 0, concluida: 0, foraJanela: 0, total: 0 }
    };
    var lista = (reunioes || []).filter(function (r) { return !!r; });
    lista.sort(function (a, b) { return String(a.data || '').localeCompare(String(b.data || '')); });
    lista.forEach(function (r) {
      (r.decisoes || []).forEach(function (d, idx) {
        if (!d || typeof d !== 'object') { return; }   /* sem objeto não há texto, dono nem prazo */
        var st = (typeof statusDe === 'function' ? statusDe(d, r) : null) || {};
        var item = { dec: d, reuniao: r, idx: idx, st: st };
        out.n.total += 1;
        if (st.chave === 'aberta' || st.chave === 'vencida') {
          out.emAberto.push(item);
          out.n[st.chave] += 1;
        } else if (CHAVES_CONCLUIDA[st.chave] === true) {
          out.concluidas.push(item);
          out.n.concluida += 1;
        } else {
          out.foraJanela.push(item);
          out.n.foraJanela += 1;
        }
      });
    });
    return out;
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

    /* CORREÇÃO (16/09, defeito #5): esta seção lia só r.recusas (o "Não
       vou" do convite) e errava para os dois lados.
       (a) João responde "Não vou", vem mesmo assim e é marcado presente: a
           ata o punha em PRESENTES e em AUSENTES ao mesmo tempo. Marcar
           presença não apaga a recusa — e nem deve: ela é o histórico do
           convite, e quem a mexe é o próprio convocado.
       (b) 4 convocados, só Ana presente, 3 faltas justificadas pela chamada
           e nenhuma resposta ao convite: a ata dizia "AUSENTES COM AVISO
           (0) — (nenhum)", porque r.faltas nunca era lido.
       Agora quem está em presentes nunca é ausente; a falta justificada no
       dia entra e vale mais que o convite (é o registro de quem conduziu);
       a mesma pessoa sai uma vez só. Como a seção passou a juntar aviso
       prévio e justificativa do dia, virou AUSENTES COM MOTIVO e cada linha
       diz de onde veio o motivo. Externo não tem uid: a chave é o nome, e o
       nome gravado na falta ("Carlos (externo)") vale antes da chave crua. */
    var presSet = {};
    presentes.forEach(function (p) {
      var pu = typeof p === 'string' ? p : (p && p.uid);
      if (pu) { presSet[pu] = true; }
    });
    var faltas = r.faltas || {};
    var recusas = r.recusas || {};
    var temDono = Object.prototype.hasOwnProperty;
    var ausentes = [];
    var jaListado = {};
    function listarAusentes(mapa, deOnde) {
      var k;
      for (k in mapa) {
        if (temDono.call(mapa, k) && !presSet[k] && !jaListado[k]) {
          jaListado[k] = true;
          var rec = mapa[k] || {};
          var mot = rec.motivo || rec.motivoTexto || 'sem motivo';
          var det = rec.detalhe ? (' — ' + rec.detalhe) : '';
          var origem = deOnde === 'falta'
            ? (temDono.call(recusas, k) ? ' (justificada na chamada · tinha avisado antes)' : ' (justificada na chamada)')
            : ' (avisou antes)';
          ausentes.push('- ' + ((nomes && nomes[k]) || rec.nome || k) + ': ' + mot + det + origem);
        }
      }
    }
    listarAusentes(faltas, 'falta');    /* a chamada do dia vale mais que o convite */
    listarAusentes(recusas, 'recusa');
    linhas.push('AUSENTES COM MOTIVO (' + ausentes.length + ')');
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

    /* CORREÇÃO (noite de 15/09): seção sem nada para mostrar fica FORA da ata.
       Antes, toda ata saía com "DEMANDAS (0) — (nenhuma)" e "NOTA DA REUNIÃO:
       (ninguém deu nota)", porque a tela ainda não passa demanda nem tem onde
       dar nota. Uma ata que afirma, em documento assinado, que a reunião não
       gerou demanda nenhuma — quando gerou — é pior do que uma ata sem a
       seção. O que não existe não é declarado. */
    var demandas = o.demandas || [];
    if (demandas.length) {
      linhas.push('DEMANDAS (' + demandas.length + ')');
      demandas.forEach(function (d) {
        linhas.push('- ' + (d.texto || '(sem texto)') + ' · ' + nomeDe(nomes, d.destinoUid) + ' · até ' + (d.prazo || 'sem prazo'));
      });
      linhas.push('');
    }

    var m = mediaNotas(r.notas);
    if (m.responderam) {
      linhas.push('NOTA DA REUNIÃO: ' + m.media + ' (' + m.responderam + ' resposta' + (m.responderam === 1 ? '' : 's') + ')');
      if (m.sugestoes.length) {
        linhas.push('O que faria ser 10:');
        m.sugestoes.forEach(function (s) { linhas.push('- ' + s); });
      }
    }
    var pf = percentFeitas(r.pautaItens);
    if (pf.total) {
      linhas.push('');
      /* "desta reunião", não "da vez anterior": a lista é a desta instância. */
      linhas.push('Ações desta reunião: ' + pf.feitas + ' de ' + pf.total + ' feitas (' + Math.round(pf.pct * 100) + '%).');
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
    perguntasDe: perguntasDe,
    proximaData: proximaData,
    /* convite */
    statusConvite: statusConvite,
    contagemConvites: contagemConvites,
    motivoRecusaValido: motivoRecusaValido,
    /* condução */
    semAta: semAta,
    inicioNaoRegistrado: inicioNaoRegistrado,
    podeIniciar: podeIniciar,
    rolarItens: rolarItens,
    percentFeitas: percentFeitas,
    validarNota: validarNota,
    mediaNotas: mediaNotas,
    /* pauta */
    chaveOrigem: chaveOrigem,
    jaTemAberta: jaTemAberta,
    jaTemPendente: jaTemPendente,
    /* decisões */
    cicloDecisoes: cicloDecisoes,
    /* ata */
    ataTexto: ataTexto,
    /* datas (úteis para a tela e para o teste) */
    addDias: addDias,
    primeiraTerca: primeiraTerca
  };
}(typeof window !== 'undefined' ? window : this));
