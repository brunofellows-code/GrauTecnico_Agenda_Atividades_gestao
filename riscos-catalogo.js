/* ============================================================
   Sistema A · Grau Técnico FSA — CATÁLOGO DE RISCOS (fonte Única)
   ------------------------------------------------------------
   Os 67 riscos das matrizes P×I dos 6 manuais de setor
   (1c-MATRIZ-RISCO-MITIGACAO.md). Consumido por riscos.html
   (matriz 5×5) e por planejamento.html (sugestão de item
   estratégico). Antes existia uma cópia em cada tela; foram
   unificadas aqui para que nunca mais divirjam.

   CONTRATO — APPEND-ONLY. LEIA ANTES DE MEXER.
   1. A chave de cada risco no Firestore é 'rm' + o ÍNDICE da
      linha. Reordenar, inserir no meio ou remover uma linha
      RENUMERA todas as seguintes e desconecta os registros já
      gravados do risco a que pertenciam.
      → Editar texto in-place: PODE. Mudar a ORDEM: NUNCA.
      → Risco novo entra no FIM. Risco extinto NÃO é removido:
        marque-o no próprio texto, mas mantenha a linha.
   2. p e i (Probabilidade × Impacto) vêm das matrizes dos
      manuais. Mudar p/i é mudar a severidade oficial: só com
      decisão registrada — nunca para "melhorar" o visual.
   3. planejamento.html GRAVA o texto de r no documento
      (origemRisco.risco). Corrigir o texto aqui NÃO corrige o
      que já foi salvo lá.
   4. ind é KRI *leading*: mede a ATIVIDADE preventiva sob
      controle do dono do risco — nunca o resultado de negócio
      (evasão, inadimplência, receita, NPS), que é do Sistema B.
   ============================================================ */
(function (w) {
  'use strict';

  var CATALOGO = [
  {p:5,i:5,s:"Central Rel.",r:"Acordo de LFI fechado com parcela caindo fora do mês da negociação (vira MT no dia seguinte)",m:"Fechar o acordo de LFI só com parcelas dentro do próprio mês da negociação",ind:"Acordos fechados com parcela fora do mês vigente; acordos sem conferência no fechamento do mês"},
  {p:4,i:5,s:"Central Rel.",r:"Cobrança diária não executada e acordos não fechados até o dia 30/31",m:"Cobrança diária (ligações/WhatsApp/SMS) e acordos até dia 30/31",ind:"Ligações/WhatsApp/SMS de cobrança não registrados no dia; acordos pendentes de fechamento"},
  {p:4,i:5,s:"Central Rel.",r:"Aumento de NC/CAC/LFI sem tratativa (turmas que iniciam na penúltima semana)",m:"Atenção a turmas que iniciam na penúltima semana; acordos de LFI; reversão de NC com o Pedagógico",ind:"Turmas iniciadas na penúltima semana sem tratativa registrada; NC sem reversão registrada com o Pedagógico"},
  {p:4,i:4,s:"Central Rel.",r:"Acordo de LFI fechado fora do prazo (após o penúltimo dia) ou com parcela fora do mês",m:"Fechar acordos que recebam o total no dia/mês; acordar LFI até penúltimo dia",ind:"Acordos fechados após o penúltimo dia; acordos com parcela fora do mês vigente"},
  {p:3,i:4,s:"Central Rel.",r:"Cancelamento/reorganização da 1ª parcela após o dia 1º sem acompanhamento",m:"Acompanhar 1ªs parcelas na planilha da franqueadora; reverter NC antes de virar CAC",ind:"1ªs parcelas não conferidas na planilha da franqueadora; NC não revertido antes de virar CAC"},
  {p:3,i:4,s:"Central Rel.",r:"Autorização de desconto de pontualidade não sai a tempo (acordo não fecha até 30/31)",m:"Apresentar acordos à gestão até o dia 30/31 / penúltimo dia",ind:"Acordos não apresentados à gestão até o penúltimo dia; acordos pendentes de autorização"},
  {p:3,i:3,s:"Central Rel.",r:"Recebimento fora da unidade atrasa a baixa no sistema",m:"Preferência de recebimento na unidade para baixa imediata",ind:"Recebimentos feitos fora da unidade sem baixa no mesmo dia"},
  {p:3,i:4,s:"Central Rel.",r:"Falha em verificar diariamente o relatório Analítico (LFI/NC/CAC não resolvidos)",m:"Rotina diária de verificação do Situação do Aluno Analítico",ind:"Dias sem a verificação diária do relatório registrada; casos pendentes de tratativa acumulando de um dia para o outro"},
  {p:5,i:5,s:"Pedagógico",r:"Faltas não tratadas nos 2 primeiros meses de curso (sem ligação a cada falta)",m:"Controle diário de faltosos; ligação a cada falta nos 2 primeiros meses; lançar retorno no histórico e planilha",ind:"Faltas consecutivas sem ligação registrada; retorno não lançado no histórico/planilha"},
  {p:3,i:5,s:"Pedagógico",r:"Descredenciamento do curso por falha em estágio (sem convênio, seguro ou registro de horas)",m:"Registro das horas, convênios e ativação do seguro; supervisão semanal; arquivo dos documentos comprobatórios (atas, apólice)",ind:"Fiscalização MP/Secretaria de Educação; documentação incompleta de estágio"},
  {p:4,i:4,s:"Pedagógico",r:"Faltas lançadas fora do prazo (>2 dias) distorcendo indicadores",m:"Lançamento pelo instrutor no mesmo dia; conferência ADM em até 2 dias; reconferência da ata pelo Pedagógico",ind:"Lançamentos fora do prazo de 2 dias; conferência ADM e reconferência da ata não realizadas"},
  {p:3,i:4,s:"Pedagógico",r:"Turma iniciada com preenchimento insuficiente (≤15 alunos ou <90%)",m:"Não iniciar turma ≤15; colocar em minicurso se <90%; realocar/devolver dinheiro; respeitar limites de entrada",ind:"Preenchimento vs. capacidade da sala (análise semanal)"},
  {p:3,i:4,s:"Pedagógico",r:"Aluno LAC não regularizado no prazo de 7 dias (perda de conclusão)",m:"Prevenção de pendências; inserir aluno/lançar nota em ≤7 dias; requerimento assinado",ind:"Coluna pendência acadêmica PV/PR/PF (15 dias antes do fim)"},
  {p:3,i:4,s:"Pedagógico",r:"Cancelamento dado baixa sem passar antes pela Coordenação Pedagógica",m:"Todo cancelamento passa antes pelo Pedagógico; pessoa dedicada à reversão; ligação periódica a cancelados",ind:"Cancelamentos que não passaram pelo Pedagógico antes da baixa; cancelados sem ligação de reversão registrada"},
  {p:3,i:3,s:"Pedagógico",r:"Divergência entre o vendido e o entregue (informação incorreta na venda)",m:"Coordenação acompanha atendimentos no salão de vendas; treinamento da equipe comercial",ind:"Atendimentos no salão de vendas não acompanhados pela Coordenação; equipe comercial sem treinamento no período"},
  {p:2,i:5,s:"Pedagógico",r:"Comercialização indevida de Radiologia/Especialização sem pré-requisito (dano ao aluno e à Franquia)",m:"Exigir histórico de ensino médio (Radiologia) ou técnico concluído (Especialização); adendo assinado",ind:"Matrícula sem documentação comprobatória"},
  {p:3,i:3,s:"Pedagógico",r:"Queda de qualidade das aulas / instrutor mal avaliado",m:"Assistir aulas semanalmente; avaliação mensal de instrutores; café pedagógico e treinamento semestral",ind:"Aulas não assistidas pela coordenação na semana; avaliação mensal do instrutor não aplicada"},
  {p:3,i:3,s:"Pedagógico",r:"Pesquisa de satisfação não apurada ou sem retorno ao aluno no ciclo quinzenal",m:"Apuração quinzenal/semanal (score); retorno em mural; Degustando com a coordenação",ind:"Apuração quinzenal não realizada; mural sem retorno; Degustando não executado"},
  {p:3,i:3,s:"Pedagógico",r:"Falta de instrutor sem substituição",m:"Substituição imediata; palestra de mercado como contingência; cancelar aula só em último caso",ind:"Ausência de instrutor sem substituição registrada no mesmo dia"},
  {p:4,i:5,s:"CSA",r:"Aluno sem acompanhamento nos 10 primeiros dias (falha na régua D0–D+10)",m:"Cronograma ativo por coorte; visualização em tempo real do status de cada aluno; roteiros D+1/D+5/D+10 obrigatórios",ind:"Contatos de pós-venda não finalizados no relatório diário"},
  {p:4,i:5,s:"CSA",r:"Cancelamento atendido sem escuta ativa e sem contraproposta sob medida",m:"Tratativa consultiva com escuta ativa e contraproposta sob medida (turno/turma, negociação, Agência, trancamento)",ind:"Atendimentos de cancelamento sem contraproposta registrada (turno/turma, negociação, Agência, trancamento)"},
  {p:4,i:4,s:"CSA",r:"Caso de ouvidoria sem retorno ao aluno dentro de 48h",m:"Registro em ouvidoria e acionamento imediato de Pedagógico/Administrativo; SLA de 48h",ind:"Casos de ouvidoria sem retorno registrado em 48h; casos sem acionamento do Pedagógico/Administrativo"},
  {p:3,i:4,s:"CSA",r:"Demanda repassada entre setores em vez de resolvida no atendimento (\"jogo de empurra\")",m:"Perfis ACADWEB corretos; capacitação cruzada (CRA aprende Pedagógico/Adm.); padrão de atendimento",ind:"Encaminhamentos entre setores para a mesma demanda; perfis ACADWEB incorretos; equipe sem capacitação cruzada"},
  {p:3,i:4,s:"CSA",r:"Expectativa comercial desalinhada gerando frustração no pós",m:"Alinhamento de expectativas nos 10 primeiros dias; integração D+1; feedback ao Comercial",ind:"Alinhamento de expectativas não feito nos 10 primeiros dias; integração D+1 não realizada"},
  {p:3,i:4,s:"CSA",r:"Registro incompleto no ACADWEB / planilha diária não enviada",m:"Manual de redação de observações; tag padronizada; e-mail obrigatório fim de expediente",ind:"Lacunas na planilha unificada; ausência do e-mail diário"},
  {p:3,i:3,s:"CSA",r:"Escala de reforço não montada para as janelas de pico (09–10h e 17–18h)",m:"Reforço de colaboradores nas janelas de maior fluxo; escala de revezamento",ind:"Janela de pico sem reforço na escala; fila visível na área de espera"},
  {p:3,i:3,s:"CSA",r:"Dupla abordagem ao aluno (CSA x CRA) na negociação de débito",m:"Delimitar limites de negociação da CSA e cobrança ativa da CRA; réguas autorizadas pela diretoria",ind:"Negociações de débito fora dos limites definidos para CSA/CRA; réguas de cobrança sem autorização da diretoria"},
  {p:2,i:4,s:"CSA",r:"Documento oficial travado no fluxo Pedagógico → Administrativo",m:"Fluxo documental com validação em duas instâncias e prazos; livro de registro de diplomas",ind:"Documentos parados além do prazo em uma das duas instâncias; livro de registro de diplomas sem baixa"},
  {p:2,i:4,s:"CSA",r:"Perfis/permissões ACADWEB mal configurados no go-live",m:"Testes de homologação antes do go-live; vinculação aos grupos corretos",ind:"Homologação não executada antes do go-live; vinculação aos grupos/perfis não conferida"},
  {p:3,i:2,s:"CSA",r:"Perda de dados/percepção por baixa adesão às pesquisas (QR Code)",m:"Incentivo ao QR Code ao fim do atendimento; acompanhamento do volume por colaborador",ind:"QR Code não oferecido ao fim do atendimento; volume por PA/colaborador não acompanhado no período"},
  {p:2,i:3,s:"CSA",r:"Baixa adesão do aluno ao App GRAU / Portal (mantém fluxo presencial)",m:"Campanha de comunicação, visitas às salas, orientação ativa no atendimento",ind:"Visitas às salas e campanha de orientação não realizadas no período"},
  {p:4,i:5,s:"Agência",r:"Poucas empresas parceiras → falta de vagas (\"elo mais forte\" rompido)",m:"Pesquisa de mercado contínua; prospecção de novas parcerias todo mês; Minuta padrão (Apêndice A); ligações/e-mails ativos",ind:"Ligações/e-mails de prospecção não registrados no mês; pesquisa de mercado não realizada"},
  {p:4,i:5,s:"Agência",r:"Rotina de captação de vagas não executada (contato com empresas, banco de talentos, registro fotográfico)",m:"Rotina de captação + banco de talentos atualizado + registro fotográfico obrigatório",ind:"Encaminhamentos sem registro fotográfico; banco de talentos sem atualização no mês"},
  {p:4,i:4,s:"Agência",r:"Banco de Talentos desatualizado → sem candidatos no perfil solicitado",m:"Coleta contínua (salas, redes sociais, site, AcadWeb, sala da Agência); organização por curso/módulo/sexo",ind:"Banco de Talentos sem atualização no período; coleta de currículos não realizada nas salas/redes"},
  {p:3,i:4,s:"Agência",r:"Assessor sobrecarregado com outra função após 500 alunos",m:"Aplicar regra do manual: dedicação exclusiva a partir de 500 alunos",ind:"Alunos ativos acima de 500 com o assessor ainda acumulando funções"},
  {p:3,i:3,s:"Agência",r:"Vaga cadastrada incorretamente no AcadWeb → não aparece no app",m:"Checagem do cadastro; padronização do lançamento no Sistema de Gestão",ind:"Vagas lançadas sem checagem do cadastro; divergência sistema × mural"},
  {p:3,i:4,s:"Agência",r:"Encaminhamento de aluno inelegível (frequência <75%, nota <7,0, inadimplente, <16 anos)",m:"Validar critérios de encaminhamento antes do envio; conferência com Pedagógico e Financeiro",ind:"Encaminhamentos sem conferência dos critérios registrada (Pedagógico e Financeiro)"},
  {p:3,i:3,s:"Agência",r:"Estagiário sem acompanhamento mensal (Ficha D) → insatisfação/rompimento",m:"Ligações e e-mails mensais; orientar empresa sobre preenchimento e envio da Ficha D",ind:"Nº de estagiários sem ficha/contato no mês"},
  {p:3,i:3,s:"Agência",r:"Registro fotográfico do encaminhamento não coletado no ato",m:"Coletar foto autorizada no ato do encaminhamento; incluir na rotina de fechamento",ind:"Encaminhamentos sem foto autorizada no sistema; rotina de fechamento sem conferência da foto"},
  {p:3,i:3,s:"Agência",r:"Feira de Empregabilidade fraca (<10 empresas ou <2 processos seletivos)",m:"Iniciar organização 60 dias antes; confirmar ≥10 empresas e ≥2 processos seletivos; assessoria de imprensa",ind:"Empresas confirmadas e processos seletivos fechados no marco de 30 dias antes do evento (mínimo 10 e 2)"},
  {p:2,i:4,s:"Agência",r:"Quebra de sigilo de dados de candidatos/alunos (Apêndices B e C)",m:"Sigilo profissional (competência exigida do assessor); guarda em armário/arquivo e sistema",ind:"Fichas/pastas fora do armário trancado; acesso ao sistema sem perfil autorizado"},
  {p:3,i:5,s:"ADM/Fin",r:"Divergência/desvio no caixa não detectada (caixa x sistema)",m:"Fechar e conferir caixa (dinheiro/cartão/despesas) e conciliar no mínimo semanalmente, sem exceção; assinar relatório",ind:"Fechamento de caixa atrasado; divergências recorrentes"},
  {p:4,i:5,s:"ADM/Fin",r:"Rotina de prevenção e cobrança não executada (5 dias antes do vencimento, ligações diárias, conferência de baixas)",m:"Prevenção 5 dias antes do vencimento; ligações diárias; conferência de baixas; SPC/Serasa; acordos; reuniões semanais com pedagógico",ind:"Prevenção pré-vencimento não registrada; baixas não conferidas; alunos frequentando com pendência"},
  {p:3,i:3,s:"ADM/Fin",r:"Boleto não registrado pago pelo aluno gera tarifa/multa alta",m:"Enviar arquivo remessa como última atividade do dia; não entregar boleto antes do registro",ind:"Arquivo remessa não enviado como última atividade do dia; boleto entregue antes do registro"},
  {p:2,i:5,s:"ADM/Fin",r:"Fraude na expedição de diploma por mau uso da senha do Sistec/MEC",m:"Restringir senha do Sistec apenas ao gestor; guarda responsável; conferir alunos no Sistec x gestão",ind:"Senha compartilhada; divergência Sistec x gestão"},
  {p:2,i:5,s:"ADM/Fin",r:"Folha paga após o 5º dia útil / passivo trabalhista",m:"Conferir, validar cálculo e pagar até o 5º dia útil; enviar documentos ao contador no prazo",ind:"Documentos atrasados à contabilidade"},
  {p:2,i:5,s:"ADM/Fin",r:"Perda do banco de dados (falha/infecção) sem backup válido",m:"Backup off-line semanal em HD externo/máquina desconectada; exceção de antivírus para Acadweb",ind:"Backup não realizado; antivírus bloqueando sistema"},
  {p:2,i:5,s:"ADM/Fin",r:"Uso de apostila paralela (crime contra direitos autorais / infração ao contrato)",m:"Pedido de MD pelo site conforme sistema; controle rigoroso de estoque; termo de recusa",ind:"Estoque de MD divergente; apostila fora do padrão"},
  {p:3,i:4,s:"ADM/Fin",r:"Erro de conciliação bancária/cartão não identificado",m:"Conciliação Extrato x Sistema x Operadora no mínimo semanal",ind:"Conciliação não realizada na semana"},
  {p:3,i:3,s:"ADM/Fin",r:"Matrícula on-line lançada sem crédito confirmado em conta",m:"Verificar crédito em conta/maquineta antes de liberar; contrato assinado na mesma semana",ind:"Matrícula lançada sem comprovante; contrato não assinado"},
  {p:2,i:4,s:"ADM/Fin",r:"Mudança de situação/redatamento indevido no sistema",m:"Ações restritas ao Líder ADM/Gestor; requerimento assinado por aluno, gestor e líder",ind:"Ação sem requerimento assinado"},
  {p:3,i:3,s:"ADM/Fin",r:"Documentação de matrícula incompleta/não digitalizada",m:"Digitalização semanal obrigatória; pasta de pendências acompanhada com o comercial",ind:"Digitalização semanal não realizada; pendências sem baixa junto ao comercial no mês"},
  {p:2,i:4,s:"ADM/Fin",r:"Cadastro/atualização do Sistec e Censo em atraso",m:"Acompanhar cadastro conforme comunicado do Inep; conferir turmas Sistec x gestão",ind:"Turmas não cadastradas no prazo oficial"},
  {p:4,i:5,s:"Gestor",r:"Faltas não lançadas e LFR sem negociação na 2ª falta",m:"Leitura diária das perdas/faltas ofensoras; Reunião Integrada; prevenção LFR (2ª falta); reunião Agência x setores",ind:"Faltas pendentes de lançamento; LFR sem tratativa; Reunião Integrada não realizada"},
  {p:4,i:5,s:"Gestor",r:"Parcelas de 1 a 2 meses em atraso sem acompanhamento da Central",m:"Central acompanha 1-2 parcelas em atraso; pós-venda; SPC/SERASA; controle de redatamento",ind:"Parcelas 1-2 meses em atraso sem tratativa registrada; pós-venda não executado"},
  {p:3,i:5,s:"Gestor",r:"Redatamento de parcelas liberado fora de adiamento de turma ou sem autorização do gestor",m:"Liberar redatamento só em adiamento de turma e mediante autorização do gestor",ind:"Nº de redatamentos fora de adiamento de turma"},
  {p:3,i:5,s:"Gestor",r:"Contratos sem assinatura / pendência de documentação",m:"Auditoria quinzenal COM+ADM; sanar pendências dentro do mês da matrícula",ind:"Auditoria quinzenal COM+ADM não realizada; pendências não sanadas dentro do mês da matrícula"},
  {p:2,i:5,s:"Gestor",r:"Curso operando com portaria/parecer vencido",m:"Acompanhamento semestral de prazos via portarias/pareceres",ind:"Acompanhamento semestral de prazos não realizado; portaria/parecer a menos de 90 dias do vencimento"},
  {p:2,i:5,s:"Gestor",r:"Descumprimento de Censo Escolar / SISTEC (prazo do Governo Federal)",m:"Garantir que Pedagógico e ADM cumpram os prazos; acompanhar cadastro de turmas no SISTEC",ind:"Turmas não cadastradas no SISTEC; prazo do Censo sem confirmação de cumprimento por Pedagógico e ADM"},
  {p:3,i:4,s:"Gestor",r:"Divergência de caixa (físico x sistema) / falha de conciliação",m:"Conciliação bancária diária e fechamento de caixa (Acadweb vs. operadora/extrato)",ind:"Diferença no fechamento diário de caixa"},
  {p:4,i:4,s:"Gestor",r:"Raio-X comercial diário não validado (25/8/1-2)",m:"Validar Raio-X diário (25/8/1-2); não acumular pendentes; abrir turmas com 90 dias",ind:"Raio-X diário não validado; contatos/atendimentos abaixo do mínimo; potenciais pendentes acumulando"},
  {p:2,i:5,s:"Gestor",r:"Folha não paga até o 5º dia útil / falhas trabalhistas (banco de horas, EPI)",m:"Conferir contracheques; pagar até 5º dia útil; controlar banco de horas e termo de EPI",ind:"Pendências na conferência da folha"},
  {p:2,i:5,s:"Gestor",r:"Perda de dados do Acadweb (backup Qualinfo não realizado)",m:"Verificar backup diário da pasta C://Qualinfo (disco externo/nuvem); exceções de antivírus",ind:"Ausência de registro de backup"},
  {p:3,i:4,s:"Gestor",r:"Turmas insuficientes à venda para os próximos meses",m:"Acompanhar cronograma de turmas à venda; abrir novas com 90 dias; usar minicurso",ind:"Cronograma de turmas à venda com lacuna nos próximos 90 dias"},
  {p:3,i:4,s:"Gestor",r:"Falta de plano de ação integrado entre setores",m:"Plano de ação da gestão contemplando o de cada líder; Reunião Integrada semanal",ind:"Reuniões sem plano de ação/registro de congruência"},
  {p:3,i:3,s:"Gestor",r:"Evidências de captação e supervisão de parcerias não cobradas do assessor",m:"Cobrar evidências de captação; reunião de retenção; supervisão de parcerias",ind:"Ausência de evidências de vagas/encaminhamentos; reunião de retenção não realizada"},
  {p:3,i:3,s:"Gestor",r:"Comentários negativos da pesquisa sem plano de ação no ciclo quinzenal",m:"Leitura quinzenal + plano de ação sobre comentários negativos",ind:"Leitura quinzenal não realizada; comentários negativos recorrentes sem plano"}
  ];

  /* Os 6 setores dos manuais, na ordem em que a matriz os exibe. */
  var SETORES = ['Central Rel.', 'Pedagógico', 'Gestor', 'ADM/Fin', 'Agência', 'CSA'];

  /* Guarda-corpo: uma edição que quebre o catálogo falha AQUI, alto e
     cedo, em vez de virar tela silenciosamente incompleta. */
  var i, r;
  if (CATALOGO.length !== 67) {
    throw new Error('riscos-catalogo.js: esperados 67 riscos, encontrados ' + CATALOGO.length + '.');
  }
  for (i = 0; i < CATALOGO.length; i++) {
    r = CATALOGO[i];
    if (!r || !r.r || !r.m || !r.ind) {
      throw new Error('riscos-catalogo.js: risco ' + i + ' sem texto, mitigação ou indicador.');
    }
    if (!(r.p >= 1 && r.p <= 5 && r.i >= 1 && r.i <= 5)) {
      throw new Error('riscos-catalogo.js: risco ' + i + ' com P×I fora da escala 1-5.');
    }
    if (SETORES.indexOf(r.s) === -1) {
      throw new Error('riscos-catalogo.js: risco ' + i + ' no setor desconhecido "' + r.s + '".');
    }
  }

  w.RISCOS_CATALOGO = CATALOGO;
  w.RISCOS_SETORES = SETORES;
}(window));
