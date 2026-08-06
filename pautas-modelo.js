/* ============================================================
   Sistema A · Grau Técnico FSA — PAUTAS-MODELO (fonte única)
   ------------------------------------------------------------
   Transcrição fiel de "Pautas_Reuniao_Socios_Gestor.docx" (as 3
   reuniões recorrentes de Sócios × Gestor Operacional). Consumido
   por projetos.html (tela de Reuniões) para nascer a reunião já
   com os blocos, o tempo de cada um e a saída esperada.

   POR QUE BLOCO COM TEMPO E SAÍDA (benchmark, não chute):
   Ninety/EOS (Level 10 Meeting), Bloom Growth, Spinach e
   Hypercontext usam pauta de blocos FIXOS com tempo alocado por
   bloco e cronômetro que sinaliza estouro. O que muda de semana
   para semana é o conteúdo, nunca a estrutura — é isso que faz a
   reunião caber no tempo. O documento do Bruno já seguia esse
   padrão; aqui ele vira dado.

   CONTRATO — LEIA ANTES DE MEXER.
   1. 'n' é a ordem do bloco e é a CHAVE de gravação
      (reunioes.pautaBlocos[].n). Reordenar renumera e desconecta
      o que já foi gravado. Editar texto in-place: PODE.
      Bloco novo entra no FIM.
   2. 'min' é o tempo ORÇADO do bloco. A soma dos blocos tem de
      bater com 'duracaoMin' — projetos.html avisa se não bater.
      Mudar 'min' é mudar o contrato da reunião: só com decisão.
   3. 'saida' é o entregável do bloco, não um comentário. Se um
      bloco não tem saída verificável, ele não é bloco: é assunto.
   4. 'preparo' são os dados que precisam chegar PRONTOS antes.
      A reunião que começa sem eles vira reunião de coleta de
      dado — o bloco de abertura não tem número para abrir.
   5. Este arquivo NÃO inventa pauta para tipo de reunião que não
      tem modelo escrito (líderes, instrutor, departamento etc.).
      Esses nascem sem bloco e são montados na tela. Preencher com
      texto genérico seria mentir sobre a rotina que existe.
   ============================================================ */
(function (w) {
  'use strict';

  var MODELOS = [
    {
      tipo: 'socio_fin',
      label: 'Bruno × Gestor (semanal · fin/adm)',
      foco: 'Financeiro · Administrativo · Qualidade · CRA · Cliente',
      cadencia: 'Toda quinta, 16h',
      diaSemana: 4,          /* 0=domingo … 4=quinta */
      horaPrevista: '16:00',
      duracaoMin: 60,
      modo: 'Remoto (Meet) — exceto semanas presenciais de Bruno',
      preparoPrazo: 'até 1h antes',
      preparo: [
        'Planilha KPI da semana (.xlsx) — inadimplência, baixa, faladas, vendas, NC',
        'Aderência PEF acumulada do mês + lista de NCs em aberto',
        'Status financeiro: caixa, contas a pagar 7 dias, adimplência franqueadora',
        'Reclame Aqui/Google novas avaliações + resposta sugerida'
      ],
      blocos: [
        { n: 1, titulo: 'Abertura — PEF da semana', min: 5,
          pauta: 'Aderência PEF da semana + ranking Diamante/Ouro. Validar nº atual e gap para 95%.',
          saida: '% aderência registrada na planilha' },
        { n: 2, titulo: 'CRA', min: 10,
          pauta: 'Inadimplência GT/GP, baixa bancária do dia, recuperação inativos (LFI/CAU), evasão CRA.',
          saida: 'Plano CRA da semana c/ 1 ação corretiva por gap' },
        { n: 3, titulo: 'Secretaria / Financeiro', min: 10,
          pauta: 'Folha (5º DU), NF, provisionamento, contas a pagar, adimplência c/ franqueadora (royalties/FP/apostilas).',
          saida: 'Status: OK / pendência identificada' },
        { n: 4, titulo: 'Qualidade + Amigo Auditor', min: 10,
          pauta: 'Pós-Venda do dia, cancelamentos tentados de reverter, auditoria cruzada da semana.',
          saida: 'Lista de reversões + NCs do PEF' },
        { n: 5, titulo: 'Cliente', min: 10,
          pauta: 'NPS, eNPS, Reclame Aqui, Google, Pesquisa Institucional. Comentários negativos da semana.',
          saida: 'Plano de resposta aos comentários' },
        { n: 6, titulo: 'Pedagógico Administrativo', min: 5,
          pauta: 'Faltas, impressões de prova, controle de aulas, instrutores.',
          saida: 'Ações enviadas ao Líder Pedagógico' },
        { n: 7, titulo: 'Pessoas', min: 5,
          pauta: 'PDI dos líderes em curso, demissões/contratações, certificação UNICORPORATIVA.',
          saida: 'Próximo PDI/avaliação agendada' },
        { n: 8, titulo: 'Encerramento', min: 5, encerramento: true,
          pauta: '3 decisões e 3 ações da semana, com prazo e responsável.',
          saida: 'Ata no SULTS + envio WhatsApp aos sócios' }
      ]
    },
    {
      tipo: 'socio_com',
      label: 'Tiago × Gestor (semanal · comercial)',
      foco: 'Comercial GT+GP · Pedagógico Saúde · Agência Emprego · Marketing',
      cadencia: 'Toda terça, 16h',
      diaSemana: 2,
      horaPrevista: '16:00',
      duracaoMin: 60,
      modo: 'Remoto — exceto semanas presenciais de Tiago',
      preparoPrazo: 'até 1h antes',
      preparo: [
        'Funil comercial da semana (cadastros → matrículas) por vendedor e por marca',
        '% meta de vendas GT/GP + ranking interno + posição no grupo G1',
        'Relatório Atacama da semana + sugestão de remanejamento',
        'Status estágios (alunos aptos × encaminhados) + Agência (vagas × contratados)'
      ],
      blocos: [
        { n: 1, titulo: 'Abertura — meta de vendas', min: 5,
          pauta: '% meta de vendas GT/GP da semana + acumulado do mês + ranking do grupo G1.',
          saida: 'Gap em R$ e em matrículas' },
        { n: 2, titulo: 'Funil', min: 15,
          pauta: 'Cadastros, faladas (25/dia/vendedor), agendamentos, atendimentos, fechamento. Conversão por vendedor.',
          saida: 'Top 1 vendedor + bottom 1 + plano para o bottom' },
        { n: 3, titulo: 'Mídia digital', min: 10,
          pauta: 'Investimento Atacama no range + custo por lead + páginas de captação ativas.',
          saida: 'Investimento da semana seguinte + criativos novos' },
        { n: 4, titulo: 'Planejamento comercial mensal (5W2H)', min: 10,
          pauta: '3-5 ações vivas no SGC, status de cada uma, aprendizado.',
          saida: 'Próxima ação + dia de execução' },
        { n: 5, titulo: 'Pedagógico Saúde', min: 10,
          pauta: 'Estágios (Enf/Farma/Radio), parcerias ATEX, contratos. % alunos encaminhados ≥ 80%.',
          saida: 'Lista de gargalos de estágio + ação' },
        { n: 6, titulo: 'Agência Emprego', min: 5,
          pauta: 'Vagas divulgadas, alunos contratados, novas parcerias (mensal). Feira de Empregabilidade.',
          saida: '# novas parcerias + status Feira (1ª/2ª)' },
        { n: 7, titulo: 'Pós-venda comercial', min: 5,
          pauta: '1ª parcela ≥ 75%, evasão CAC/NC/LFI, ações do Líder Comercial pós-matrícula.',
          saida: '% 1ª parc. e plano para o gap' },
        { n: 8, titulo: 'Encerramento', min: 5, encerramento: true,
          pauta: '3 decisões e 3 ações da semana, com prazo e responsável.',
          saida: 'Ata no SULTS + envio WhatsApp' }
      ]
    },
    {
      tipo: 'mensal_estrategica',
      label: 'Bruno + Tiago + Gestor (mensal estratégica)',
      foco: 'Fechamento do mês · PEF · Financeiro · Planejamento · Pessoas · Estratégico',
      cadencia: 'Primeira terça do mês, 14h–16h30',
      diaSemana: 2,
      horaPrevista: '14:00',
      duracaoMin: 150,
      modo: 'Preferencial presencial (se Bruno ou Tiago em FSA na semana)',
      preparoPrazo: '48h antes',
      preparo: [
        'Dashboard mensal: KPIs de todos os 5 setores + PEF consolidado'
      ],
      blocos: [
        { n: 1, titulo: 'Fechamento do mês anterior', min: 20,
          pauta: 'KPIs por setor (Com, CRA, Ped, Sec, Qual) × meta. Ranking nacional G1.',
          saida: 'Resultado consolidado e posição no grupo' },
        { n: 2, titulo: 'Aderência PEF do mês', min: 20,
          pauta: '% geral + itens com NC abertos + plano de fechamento. Risco Diamante/Ouro/Prata.',
          saida: 'Lista de NCs priorizada pelo peso PEF' },
        { n: 3, titulo: 'Financeiro mensal', min: 25,
          pauta: 'DRE, fluxo de caixa 30/60/90, royalties pagos, despesas vs orçamento, margem.',
          saida: 'Caixa + ações financeiras prioritárias' },
        { n: 4, titulo: 'Planejamento do mês seguinte', min: 30,
          pauta: 'Vendas (Tiago), Atacama, ações 5W2H, calendário pedagógico, campanhas.',
          saida: 'Planejamento inserido no SGC até dia 28' },
        { n: 5, titulo: 'Avaliação dos 5 líderes', min: 20,
          pauta: 'PDI em curso, feedback do gestor, salários, promoções/desligamentos.',
          saida: 'Decisão sobre cada líder' },
        { n: 6, titulo: 'Grau Social', min: 10,
          pauta: 'Status Feira (1ª 25/abr, 2ª 24/out), Bolsas (10/ano), Doação Sangue (50%/sem).',
          saida: 'Próxima data + responsável + ação' },
        { n: 7, titulo: 'Pendências da Franqueadora', min: 10,
          pauta: 'Reunião de franqueado do mês, treinamentos, comunicações do núcleo.',
          saida: 'Quem participa + leitura prévia' },
        { n: 8, titulo: 'Visitas a FSA do próximo mês', min: 10,
          pauta: 'Calendário Bruno × Tiago, agenda de cada visita, prioridades.',
          saida: 'Calendário atualizado + agenda das visitas' },
        { n: 9, titulo: 'Estratégico / Pareto', min: 15,
          pauta: '1 decisão grande do mês (investimento, contratação, virada de processo).',
          saida: 'Decisão tomada + plano de execução' },
        { n: 10, titulo: 'Encerramento', min: 10, encerramento: true,
          pauta: 'Ata, prazos, próximas reuniões agendadas, KPI mãe que vai liderar o mês.',
          saida: 'Ata no SULTS + envio aos 3' }
      ]
    }
  ];

  /* ---------- API mínima consumida por projetos.html ---------- */

  function modeloDe(tipo) {
    for (var i = 0; i < MODELOS.length; i++) {
      if (MODELOS[i].tipo === tipo) { return MODELOS[i]; }
    }
    return null;
  }

  /* Cópia PROFUNDA dos blocos, já no formato gravado no Firestore.
     Sem isto, duas reuniões do mesmo tipo compartilhariam o mesmo
     objeto em memória e marcar um bloco como feito marcaria o do
     vizinho. */
  function blocosNovos(tipo) {
    var m = modeloDe(tipo);
    if (!m) { return []; }
    var out = [];
    for (var i = 0; i < m.blocos.length; i++) {
      var b = m.blocos[i];
      out.push({
        n: b.n,
        titulo: b.titulo,
        pauta: b.pauta,
        min: b.min,
        saida: b.saida,
        encerramento: !!b.encerramento,
        notas: '',
        feito: false,
        tempoRealSeg: 0
      });
    }
    return out;
  }

  function preparoNovo(tipo) {
    var m = modeloDe(tipo);
    if (!m) { return []; }
    var out = [];
    for (var i = 0; i < m.preparo.length; i++) {
      out.push({ texto: m.preparo[i], pronto: false });
    }
    return out;
  }

  /* Soma orçada dos blocos — usada pela tela para conferir se o
     modelo continua fechando com a duração declarada. */
  function somaMin(blocos) {
    var t = 0;
    for (var i = 0; i < (blocos || []).length; i++) { t += (blocos[i].min || 0); }
    return t;
  }

  w.PAUTAS_MODELO = MODELOS;
  w.PautaModelo = {
    lista: MODELOS,
    de: modeloDe,
    blocosNovos: blocosNovos,
    preparoNovo: preparoNovo,
    somaMin: somaMin
  };
}(window));
