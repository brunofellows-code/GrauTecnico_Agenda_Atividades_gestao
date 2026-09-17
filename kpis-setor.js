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
   4. ES5 puro. Dado, nunca lógica.
   ============================================================ */
(function (w) {
  'use strict';
  var KPIS = {
    PED: [
      { chave: 'ped_evasao', nome: 'Evasão da semana', meta: 'GT 4,8% · GP 5%' },
      { chave: 'ped_faltas_2d', nome: 'Faltas lançadas em até 2 dias', meta: '100%' },
      { chave: 'ped_ligacao_falta', nome: 'Ligação a cada falta nos 2 primeiros meses', meta: '100% das turmas' },
      { chave: 'ped_reversao_cancel', nome: 'Cancelamentos revertidos pela Coordenação', meta: 'todos passam pela Coordenação' },
      { chave: 'ped_nc_revertidos', nome: 'NC revertidos antes de virar CAC', meta: 'reverter antes do CAC' },
      { chave: 'ped_turma_minima', nome: 'Turmas iniciadas com 15 alunos ou menos', meta: '0' },
      { chave: 'ped_satisfacao', nome: 'Score semanal de satisfação e instrutor', meta: 'sem instrutor reincidente' },
      { chave: 'ped_estagio', nome: 'Convênios, seguros e horas de estágio em dia', meta: '100% arquivado' }
    ],
    CRA: [
      { chave: 'cra_inadimplencia', nome: 'Inadimplência de ativos', meta: 'GT 9,3% · GP 11%' },
      { chave: 'cra_lfi_parcelas', nome: 'LFI negociados com todas as parcelas no mês', meta: '100%' },
      { chave: 'cra_recuperados', nome: 'Recuperados', meta: '5%' },
      { chave: 'cra_primeiras', nome: '1ªs parcelas pagas × projeção', meta: '75% (degrau 68%)' },
      { chave: 'cra_ativos_pagantes', nome: 'Ativos pagantes / recebimento', meta: '88%' },
      { chave: 'cra_spc', nome: 'SPC/Serasa atualizado', meta: '2 parcelas ou 1 com 60 dias' },
      { chave: 'cra_acordos', nome: 'Acordos de pontualidade apresentados até o dia 30/31', meta: '100%' }
    ],
    CSA: [
      { chave: 'csa_regua', nome: 'Matriculados com contatos D+1, D+5 e D+10', meta: '100%' },
      { chave: 'csa_nps', nome: 'NPS da semana', meta: '75 (degrau 50–55)' },
      { chave: 'csa_tma', nome: 'TMA', meta: '6–8 min' },
      { chave: 'csa_fcr', nome: 'FCR', meta: '~88%' },
      { chave: 'csa_48h', nome: 'Insatisfações respondidas em até 48 h', meta: '100%' },
      { chave: 'csa_indicacoes', nome: 'Matrículas por indicação (receita indireta)', meta: 'cruzar com Comercial/Financeiro' },
      { chave: 'csa_relatorios', nome: 'Planilha unificada / relatórios diários enviados', meta: 'todo dia' }
    ],
    COM: [
      { chave: 'com_raiox', nome: 'Raio-X diário', meta: '25 faladas · 8 potenciais · 1–2 matrículas' },
      { chave: 'com_conversao', nome: 'Conversão de potenciais', meta: '~50%' },
      { chave: 'com_turmas_90', nome: 'Turmas à venda com 90 dias de antecedência', meta: 'meta dos próximos meses coberta' },
      { chave: 'com_contratos', nome: 'Contratos assinados sem pendência de documento', meta: '100% antes da folha' },
      { chave: 'com_meta_cac', nome: 'Meta de vendas / CAC', meta: 'CAC 12%' },
      { chave: 'com_pendentes', nome: 'Pendentes e potenciais acumulados de um dia para o outro', meta: '0' }
    ],
    SEC: [
      { chave: 'sec_conciliacao', nome: 'Conciliação bancária e de cartões', meta: 'diária, sem divergência' },
      { chave: 'sec_remessa', nome: 'Baixas do retorno e remessa enviada', meta: 'todo dia' },
      { chave: 'sec_folha', nome: 'Folha paga e documentos ao contador', meta: 'até o 5º dia útil' },
      { chave: 'sec_sistec', nome: 'SISTEC/Censo em dia', meta: '100% das turmas' },
      { chave: 'sec_digitalizacao', nome: 'Matrículas com documentos digitalizados', meta: '100%' },
      { chave: 'sec_backup', nome: 'Backup off-line do Acadweb/Qualinfo', meta: 'semanal' },
      { chave: 'sec_requerimentos', nome: 'Requerimentos com as assinaturas obrigatórias', meta: '100%' },
      { chave: 'sec_franqueadora', nome: 'Adimplência com a Franqueadora', meta: 'em dia' }
    ],
    AGE: [
      { chave: 'age_empresas', nome: 'Empresas parceiras novas na semana', meta: 'listagem ativa' },
      { chave: 'age_vagas', nome: 'Vagas encaminhadas com 3 candidatos', meta: '100%' },
      { chave: 'age_contratados', nome: 'Alunos contratados (com foto)', meta: '2%' },
      { chave: 'age_talentos', nome: 'Currículos novos no Banco de Talentos', meta: 'sem perfil não atendido' },
      { chave: 'age_feira', nome: 'Feira de Empregabilidade no cronograma', meta: '60 dias antes · 10 empresas · 2 processos' },
      { chave: 'age_vpo', nome: 'VPOs válidas e palestras realizadas', meta: 'ata + foto + 10 alunos' }
    ],
    GES: [
      { chave: 'ges_pef', nome: 'Aderência PEF', meta: '95%' },
      { chave: 'ges_integrada', nome: 'Integrada com plano de ação e responsável', meta: 'toda semana' },
      { chave: 'ges_franqueadora', nome: 'Adimplência com a Franqueadora', meta: 'em dia' },
      { chave: 'ges_indicadores', nome: 'Leitura diária de Meus Indicadores e da evasão', meta: 'diária' }
    ]
  };
  var LIVRE = { chave: 'outro', nome: 'Outro indicador (escreva na linha)', meta: '' };
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
