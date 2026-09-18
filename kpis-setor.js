/* ============================================================
   Sistema A · Grau Técnico FSA — KPIs POR SETOR (fonte única)
   ------------------------------------------------------------
   Os indicadores que cada setor persegue, com a META OFICIAL, tirados do
   00-CHECKLIST-REUNIAO-INTEGRADA.md (metas GT/GP, degraus) e dos manuais
   de setor. Consumido pelo planejamento.html: todo item do plano aponta o
   indicador que ele move, e o plano mostra quais indicadores do setor
   ficaram sem item no mês.

   CONTRATO — LEIA ANTES DE MEXER.
   1. 'chave' é gravada no item do plano (item.indicador). Renomear a chave
      desconecta os itens já gravados; editar 'nome' e 'meta': PODE.
   2. 'meta' é texto porque é texto na fonte (4,8%; 25/8/1–2; 6–8 min).
      Mudar meta = mudar o contrato do setor: só com decisão registrada.
   3. Setor sem lista aqui ganha só o indicador livre ('outro').
   4. 'sentido' ('maior'/'menor'), 'unidade' e 'metaNum' entraram em 18/09 para o NÚMERO
      MEDIDO do mês: dizem para que lado é bom e qual é o alvo quando a meta oficial tem um
      número só. Meta composta fica com metaNum null e o texto continua mandando.
   5. ES5 puro. Dado, nunca lógica.
   ============================================================ */
(function (w) {
  'use strict';
  var KPIS = {
    PED: [
      { chave: 'ped_evasao', nome: 'Evasão da semana', meta: 'GT 4,8% · GP 5%', sentido: 'menor', unidade: '%', metaNum: 4.8 },
      { chave: 'ped_faltas_2d', nome: 'Faltas lançadas em até 2 dias', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'ped_ligacao_falta', nome: 'Ligação a cada falta nos 2 primeiros meses', meta: '100% das turmas', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'ped_reversao_cancel', nome: 'Cancelamentos revertidos pela Coordenação', meta: 'todos passam pela Coordenação', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'ped_nc_revertidos', nome: 'NC revertidos antes de virar CAC', meta: 'reverter antes do CAC', sentido: 'maior', unidade: '%', metaNum: null },
      { chave: 'ped_turma_minima', nome: 'Turmas iniciadas com 15 alunos ou menos', meta: '0', sentido: 'menor', unidade: 'un', metaNum: 0 },
      { chave: 'ped_satisfacao', nome: 'Score semanal de satisfação e instrutor', meta: 'sem instrutor reincidente', sentido: 'maior', unidade: 'pts', metaNum: null },
      { chave: 'ped_estagio', nome: 'Convênios, seguros e horas de estágio em dia', meta: '100% arquivado', sentido: 'maior', unidade: '%', metaNum: 100 }
    ],
    CRA: [
      { chave: 'cra_inadimplencia', nome: 'Inadimplência de ativos', meta: 'GT 9,3% · GP 11%', sentido: 'menor', unidade: '%', metaNum: 9.3 },
      { chave: 'cra_lfi_parcelas', nome: 'LFI negociados com todas as parcelas no mês', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'cra_recuperados', nome: 'Recuperados', meta: '5%', sentido: 'maior', unidade: '%', metaNum: 5 },
      { chave: 'cra_primeiras', nome: '1ªs parcelas pagas × projeção', meta: '75% (degrau 68%)', sentido: 'maior', unidade: '%', metaNum: 75 },
      { chave: 'cra_ativos_pagantes', nome: 'Ativos pagantes / recebimento', meta: '88%', sentido: 'maior', unidade: '%', metaNum: 88 },
      { chave: 'cra_spc', nome: 'SPC/Serasa atualizado', meta: '2 parcelas ou 1 com 60 dias', sentido: 'maior', unidade: '%', metaNum: null },
      { chave: 'cra_acordos', nome: 'Acordos de pontualidade apresentados até o dia 30/31', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 }
    ],
    CSA: [
      { chave: 'csa_regua', nome: 'Matriculados com contatos D+1, D+5 e D+10', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'csa_nps', nome: 'NPS da semana', meta: '75 (degrau 50–55)', sentido: 'maior', unidade: 'pts', metaNum: 75 },
      { chave: 'csa_tma', nome: 'TMA', meta: '6–8 min', sentido: 'menor', unidade: 'min', metaNum: 8 },
      { chave: 'csa_fcr', nome: 'FCR', meta: '~88%', sentido: 'maior', unidade: '%', metaNum: 88 },
      { chave: 'csa_48h', nome: 'Insatisfações respondidas em até 48 h', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'csa_indicacoes', nome: 'Matrículas por indicação (receita indireta)', meta: 'cruzar com Comercial/Financeiro', sentido: 'maior', unidade: 'un', metaNum: null },
      { chave: 'csa_relatorios', nome: 'Planilha unificada / relatórios diários enviados', meta: 'todo dia', sentido: 'maior', unidade: '%', metaNum: 100 }
    ],
    COM: [
      { chave: 'com_raiox', nome: 'Raio-X diário', meta: '25 faladas · 8 potenciais · 1–2 matrículas', sentido: 'maior', unidade: 'un', metaNum: null },
      { chave: 'com_conversao', nome: 'Conversão de potenciais', meta: '~50%', sentido: 'maior', unidade: '%', metaNum: 50 },
      { chave: 'com_turmas_90', nome: 'Turmas à venda com 90 dias de antecedência', meta: 'meta dos próximos meses coberta', sentido: 'maior', unidade: '%', metaNum: null },
      { chave: 'com_contratos', nome: 'Contratos assinados sem pendência de documento', meta: '100% antes da folha', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'com_meta_cac', nome: 'Meta de vendas / CAC', meta: 'CAC 12%', sentido: 'menor', unidade: '%', metaNum: 12 },
      { chave: 'com_pendentes', nome: 'Pendentes e potenciais acumulados de um dia para o outro', meta: '0', sentido: 'menor', unidade: 'un', metaNum: 0 }
    ],
    SEC: [
      { chave: 'sec_conciliacao', nome: 'Conciliação bancária e de cartões', meta: 'diária, sem divergência', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'sec_remessa', nome: 'Baixas do retorno e remessa enviada', meta: 'todo dia', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'sec_folha', nome: 'Folha paga e documentos ao contador', meta: 'até o 5º dia útil', sentido: 'menor', unidade: 'dias', metaNum: 5 },
      { chave: 'sec_sistec', nome: 'SISTEC/Censo em dia', meta: '100% das turmas', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'sec_digitalizacao', nome: 'Matrículas com documentos digitalizados', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'sec_backup', nome: 'Backup off-line do Acadweb/Qualinfo', meta: 'semanal', sentido: 'maior', unidade: 'un', metaNum: null },
      { chave: 'sec_requerimentos', nome: 'Requerimentos com as assinaturas obrigatórias', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'sec_franqueadora', nome: 'Adimplência com a Franqueadora', meta: 'em dia', sentido: 'maior', unidade: '%', metaNum: 100 }
    ],
    AGE: [
      { chave: 'age_empresas', nome: 'Empresas parceiras novas na semana', meta: 'listagem ativa', sentido: 'maior', unidade: 'un', metaNum: null },
      { chave: 'age_vagas', nome: 'Vagas encaminhadas com 3 candidatos', meta: '100%', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'age_contratados', nome: 'Alunos contratados (com foto)', meta: '2%', sentido: 'maior', unidade: '%', metaNum: 2 },
      { chave: 'age_talentos', nome: 'Currículos novos no Banco de Talentos', meta: 'sem perfil não atendido', sentido: 'maior', unidade: 'un', metaNum: null },
      { chave: 'age_feira', nome: 'Feira de Empregabilidade no cronograma', meta: '60 dias antes · 10 empresas · 2 processos', sentido: 'maior', unidade: 'un', metaNum: null },
      { chave: 'age_vpo', nome: 'VPOs válidas e palestras realizadas', meta: 'ata + foto + 10 alunos', sentido: 'maior', unidade: 'un', metaNum: null }
    ],
    GES: [
      { chave: 'ges_pef', nome: 'Aderência PEF', meta: '95%', sentido: 'maior', unidade: '%', metaNum: 95 },
      { chave: 'ges_integrada', nome: 'Integrada com plano de ação e responsável', meta: 'toda semana', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'ges_franqueadora', nome: 'Adimplência com a Franqueadora', meta: 'em dia', sentido: 'maior', unidade: '%', metaNum: 100 },
      { chave: 'ges_indicadores', nome: 'Leitura diária de Meus Indicadores e da evasão', meta: 'diária', sentido: 'maior', unidade: '%', metaNum: 100 }
    ]
  };
  var LIVRE = { chave: 'outro', nome: 'Outro indicador (escreva na linha)', meta: '', sentido: null, unidade: null, metaNum: null };
  function de(sigla) {
    var s = String(sigla || '').toUpperCase();
    return (KPIS[s] || []).slice().concat([LIVRE]);
  }
  function porChave(chave) {
    var k, i;
    for (k in KPIS) { if (Object.prototype.hasOwnProperty.call(KPIS, k)) { for (i = 0; i < KPIS[k].length; i++) { if (KPIS[k][i].chave === chave) { return KPIS[k][i]; } } } }
    return chave === 'outro' ? LIVRE : null;
  }
  w.KPIS_SETOR = KPIS;
  w.KpisSetor = { de: de, porChave: porChave, LIVRE: LIVRE };
}(window));
