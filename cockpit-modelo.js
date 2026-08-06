/* ============================================================
   cockpit-modelo.js — os indicadores do Cockpit como DADO
   ------------------------------------------------------------
   Transcrição fiel de Cockpit_Diario_Gestor.xlsx (abas
   "Cockpit Diário", "Cockpit Semanal", "Cockpit Mensal").
   Nada aqui foi inventado: rótulo, meta e direção saem da
   planilha que o gestor já preenche hoje.

   CONTRATO (não quebrar):
   - `k` é a CHAVE de gravação no Firestore. Renomear `k` quebra
     o histórico já lançado. Rótulo pode mudar; `k` não.
   - `meta` e `dir` juntos definem o semáforo. Um sem o outro
     não significa nada.
   - `dir`: 'maior' = quanto maior melhor · 'menor' = quanto
     menor melhor · 'sim' = booleano, verde só no SIM.
   - Indicador sem meta na planilha entra com meta:null e NÃO
     ganha semáforo. Meta inventada é pior que meta ausente.

   OBSERVAÇÃO SOBRE A PLANILHA (achado, não opinião):
   nas abas Semanal e Mensal a linha META está deslocada uma
   coluna à direita dos cabeçalhos (o rótulo "META" ocupa duas
   células). O alinhamento correto é inequívoco pelo sentido
   — ex.: "≥ 75" só pode ser NPS, "0 novas" só pode ser RA.
   Aqui já está corrigido. No Excel continua torto.

   SEMÁFORO (regra da própria planilha, aba "Como Usar"):
     VERDE ≥ meta · AMARELO entre 80% e 100% · VERMELHO < 80%.
   Essa regra foi escrita para "quanto maior melhor". Para os
   de "quanto menor melhor" ela foi ESPELHADA (verde até a
   meta, âmbar até 20% acima, vermelho acima disso) — porque
   aplicar a regra original em inadimplência daria verde para
   inadimplência alta. Está documentado no "i" de cada card.
   ============================================================ */
(function (w) {
  'use strict';

  /* ---------- 1) DIÁRIO — 12 KPIs, fecha 17h30 ---------- */
  var DIARIO = [
    { k: 'cadastros', label: 'Cadastros', curto: 'Cad', meta: 8, dir: 'maior', tipo: 'num',
      oQueDiz: 'Quantos cadastros novos entraram no dia.',
      paraQue: 'É o topo do funil. Sem cadastro hoje não há matrícula depois — cai aqui, cai tudo lá na frente.' },
    { k: 'faladas', label: 'Faladas / vendedor', curto: 'Faladas', meta: 25, dir: 'maior', tipo: 'num',
      oQueDiz: 'Quantas pessoas cada vendedor efetivamente falou no dia.',
      paraQue: 'Mede esforço, não sorte. Meta de vendas sem faladas é aposta.' },
    { k: 'visitas', label: 'Visitas agendadas', curto: 'Visitas', meta: 5, dir: 'maior', tipo: 'num',
      oQueDiz: 'Quantas visitas ficaram agendadas no dia.',
      paraQue: 'É a matrícula de amanhã. Zero visita hoje = buraco na agenda de 2 a 3 dias.' },
    { k: 'matriculas', label: 'Matrículas do dia', curto: 'Matríc.', meta: 3, dir: 'maior', tipo: 'num',
      oQueDiz: 'Matrículas fechadas no dia.',
      paraQue: 'É o resultado. Os outros quatro KPIs comerciais existem para este número acontecer.' },
    { k: 'baixaBanco', label: 'Baixa bancária até 10h', curto: 'Baixa 10h', meta: 'SIM', dir: 'sim', tipo: 'sn',
      oQueDiz: 'A baixa bancária foi processada até as 10h? SIM ou NÃO.',
      paraQue: 'Sem baixa, a régua de cobrança dispara contra quem JÁ pagou. Um NÃO aqui gera reclamação no dia seguinte.' },
    { k: 'inadGT', label: 'Inadimplência GT', curto: 'Inad GT', meta: 9.3, dir: 'menor', tipo: 'pct',
      oQueDiz: 'Percentual de inadimplência da Grau Técnico.',
      paraQue: 'Dinheiro vendido que não entrou. Sobe devagar e só aparece tarde — por isso é diário.' },
    { k: 'inadGP', label: 'Inadimplência GP', curto: 'Inad GP', meta: 11, dir: 'menor', tipo: 'pct',
      oQueDiz: 'Percentual de inadimplência da Grau Pós.',
      paraQue: 'Mesmo raciocínio da GT, com meta própria — a carteira e o ticket são outros.' },
    { k: 'primeiraParcela', label: '1ª parcela paga', curto: '1ª Parc.', meta: 75, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Percentual de matrículas novas que pagaram a 1ª parcela.',
      paraQue: 'Matrícula que não paga a primeira não é matrícula, é cadastro. Este KPI separa venda de número.' },
    { k: 'metaVendas', label: '% da meta de vendas', curto: '% Meta', meta: 100, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Quanto do previsto de vendas já foi atingido.',
      paraQue: 'É o placar acumulado. Diz se dá para recuperar no mês ou se já é hora de mudar a tática.' },
    { k: 'ncContatados', label: 'NC contatados / total', curto: 'NC', meta: 100, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Percentual dos não-comparecentes (NC) que foram contatados.',
      paraQue: 'NC não contatado vira evasão silenciosa. A meta é 100% porque não existe "metade do aluno".' },
    { k: 'cancelamentos', label: 'Cancelamentos do dia', curto: 'Cancel.', meta: 0, dir: 'menor', tipo: 'num',
      oQueDiz: 'Quantos cancelamentos aconteceram no dia.',
      paraQue: 'É evasão em tempo real. Meta zero: cada linha aqui é um aluno perdido com nome e sobrenome.' },
    { k: 'reversoes', label: 'Reversões tratadas', curto: 'Revers.', meta: 'SIM', dir: 'sim', tipo: 'sn',
      oQueDiz: 'Os cancelamentos do dia tiveram tentativa de reversão? SIM ou NÃO.',
      paraQue: 'Cancelamento é fato; reversão é ação. Este KPI cobra a ação, não o fato.' }
  ];

  /* ---------- 2) SEMANAL — 5 KPIs, fecha sexta 17h ---------- */
  var SEMANAL = [
    { k: 'nps', label: 'NPS da semana', curto: 'NPS', meta: 75, dir: 'maior', tipo: 'num',
      oQueDiz: 'Nota de recomendação apurada na semana.',
      paraQue: 'É o único KPI que fala pelo aluno. Cai antes da evasão aparecer no financeiro.' },
    { k: 'raNovas', label: 'RA novas', curto: 'RA', meta: 0, dir: 'menor', tipo: 'num',
      oQueDiz: 'Quantas reclamações novas entraram no Reclame Aqui.',
      paraQue: 'Meta zero. Uma RA nova é uma falha que já passou por todos os filtros internos e chegou na rua.' },
    { k: 'avisadosPreVenc', label: '% avisados pré-vencimento', curto: 'Pré-venc.', meta: 95, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Percentual de alunos avisados ANTES do vencimento da parcela.',
      paraQue: 'É a única alavanca barata contra inadimplência. Avisar depois é cobrança; avisar antes é serviço.' },
    { k: 'convLeadMatricula', label: 'Conversão lead → matrícula', curto: 'Conv.', meta: 8, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Percentual dos leads da semana que viraram matrícula.',
      paraQue: 'Separa problema de volume de problema de qualidade: pouco lead ou lead ruim são remédios diferentes.' },
    { k: 'aderenciaPEF', label: 'Aderência ao PEF', curto: 'PEF', meta: 95, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Percentual de aderência ao Plano de Execução da Franquia.',
      paraQue: 'É o KPI que abre a reunião semanal com os sócios. Mede se a rotina combinada foi cumprida.' }
  ];

  /* ---------- 3) MENSAL — 8 indicadores, fecha até dia 5 ---------- */
  var MENSAL = [
    { k: 'evasaoGT', label: 'Evasão real GT', curto: 'Evasão GT', meta: 4.8, dir: 'menor', tipo: 'pct',
      oQueDiz: 'Evasão efetivamente consolidada da Grau Técnico no mês.',
      paraQue: 'É o número que o cancelamento diário antecipa. Fecha a conta do que os KPIs diários avisaram.' },
    { k: 'evasaoGP', label: 'Evasão real GP', curto: 'Evasão GP', meta: 5.0, dir: 'menor', tipo: 'pct',
      oQueDiz: 'Evasão efetivamente consolidada da Grau Pós no mês.',
      paraQue: 'Mesma leitura da GT, com meta própria.' },
    { k: 'lacGT', label: 'LAC GT', curto: 'LAC GT', meta: 1.0, dir: 'menor', tipo: 'pct',
      oQueDiz: 'Indicador LAC da Grau Técnico no mês.',
      paraQue: 'Meta ≤ 1,0. Indicador de rede — é por ele que a franqueadora compara unidades.' },
    { k: 'lacGP', label: 'LAC GP', curto: 'LAC GP', meta: 1.0, dir: 'menor', tipo: 'pct',
      oQueDiz: 'Indicador LAC da Grau Pós no mês.',
      paraQue: 'Meta ≤ 1,0, mesma leitura da GT.' },
    { k: 'npsGT', label: 'NPS GT', curto: 'NPS GT', meta: 75, dir: 'maior', tipo: 'num',
      oQueDiz: 'NPS consolidado da Grau Técnico no mês.',
      paraQue: 'Confirma (ou desmente) o NPS semanal, que é amostra menor.' },
    { k: 'npsGP', label: 'NPS GP', curto: 'NPS GP', meta: 75, dir: 'maior', tipo: 'num',
      oQueDiz: 'NPS consolidado da Grau Pós no mês.',
      paraQue: 'Mesma leitura da GT.' },
    { k: 'raNota', label: 'Nota no Reclame Aqui', curto: 'RA nota', meta: 7.5, dir: 'maior', tipo: 'num',
      oQueDiz: 'Nota da unidade no Reclame Aqui.',
      paraQue: 'É reputação pública: entra na decisão de quem ainda nem falou com a escola.' },
    { k: 'aderenciaPEFmes', label: 'Aderência ao PEF (mês)', curto: 'PEF mês', meta: 95, dir: 'maior', tipo: 'pct',
      oQueDiz: 'Aderência ao PEF consolidada no mês.',
      paraQue: 'Abre a reunião mensal estratégica. É a média do que foi medido toda semana.' }
  ];

  var CICLOS = {
    diario: { k: 'diario', label: 'Diário', kpis: DIARIO, quando: 'todo dia, 17h30',
      destino: 'grupo de WhatsApp dos sócios' },
    semanal: { k: 'semanal', label: 'Semanal', kpis: SEMANAL, quando: 'sexta, 17h',
      destino: 'reunião semanal com os sócios' },
    mensal: { k: 'mensal', label: 'Mensal', kpis: MENSAL, quando: 'até o dia 5 do mês seguinte',
      destino: 'reunião mensal estratégica (Bruno + Tiago + Gestor)' }
  };

  /* ---------- valor ND (dado indisponível) ----------
     A planilha manda escrever 'ND' e avisar o Bruno. Aqui ND é
     valor de primeira classe: não conta como zero, não pinta
     semáforo e aparece explicitamente na mensagem. Zero e
     "não consegui apurar" são coisas diferentes e a planilha
     não conseguia separar as duas. */
  var ND = 'ND';

  function ehVazio(v) { return v === null || v === undefined || v === ''; }
  function ehND(v) { return String(v).toUpperCase() === ND; }

  /* ---------- semáforo ----------
     retorna 'verde' | 'ambar' | 'vermelho' | 'nd' | 'vazio' */
  function semaforo(kpi, v) {
    if (ehVazio(v)) { return 'vazio'; }
    if (ehND(v)) { return 'nd'; }
    if (kpi.dir === 'sim') { return String(v).toUpperCase() === 'SIM' ? 'verde' : 'vermelho'; }
    if (kpi.meta === null || kpi.meta === undefined) { return 'vazio'; }
    var n = Number(v);
    if (isNaN(n)) { return 'vazio'; }
    var m = Number(kpi.meta);
    if (kpi.dir === 'menor') {
      /* meta 0 não tem percentual (dividir por zero) — vira contagem:
         0 é verde, 1 é âmbar, 2 ou mais é vermelho. */
      if (m === 0) { return n <= 0 ? 'verde' : (n <= 1 ? 'ambar' : 'vermelho'); }
      if (n <= m) { return 'verde'; }
      if (n <= m * 1.2) { return 'ambar'; }
      return 'vermelho';
    }
    if (m === 0) { return n >= 0 ? 'verde' : 'vermelho'; }
    if (n >= m) { return 'verde'; }
    if (n >= m * 0.8) { return 'ambar'; }
    return 'vermelho';
  }

  /* explicação da conta, em português, para o "i" do card */
  function explicaSemaforo(kpi) {
    if (kpi.dir === 'sim') { return 'SIM = verde · NÃO = vermelho. Não tem meio-termo.'; }
    if (kpi.dir === 'menor') {
      if (Number(kpi.meta) === 0) {
        return 'Meta zero: 0 = verde · 1 = âmbar · 2 ou mais = vermelho. Não dá para calcular percentual sobre zero, então a régua é contagem.';
      }
      return 'Quanto MENOR melhor. Verde até ' + fmtMeta(kpi) + ' · âmbar até 20% acima (' + fmtNum(Number(kpi.meta) * 1.2) + ') · vermelho acima disso. A regra da planilha (80-100%) foi espelhada aqui: aplicada ao pé da letra, ela daria verde para inadimplência alta.';
    }
    return 'Quanto MAIOR melhor. Verde a partir de ' + fmtMeta(kpi) + ' · âmbar de 80% da meta (' + fmtNum(Number(kpi.meta) * 0.8) + ') até a meta · vermelho abaixo de 80%. É a regra escrita na aba "Como Usar" da sua planilha.';
  }

  /* ---------- formatação ---------- */
  function fmtNum(n) {
    var v = Math.round(Number(n) * 10) / 10;
    return String(v).replace('.', ',');
  }
  function fmtValor(kpi, v) {
    if (ehVazio(v)) { return '—'; }
    if (ehND(v)) { return ND; }
    if (kpi.tipo === 'sn') { return String(v).toUpperCase(); }
    if (kpi.tipo === 'pct') { return fmtNum(v) + '%'; }
    return fmtNum(v);
  }
  function fmtMeta(kpi) {
    if (kpi.meta === null || kpi.meta === undefined) { return 'sem meta'; }
    if (kpi.dir === 'sim') { return 'SIM'; }
    var s = fmtNum(kpi.meta) + (kpi.tipo === 'pct' ? '%' : '');
    return (kpi.dir === 'menor' ? '≤ ' : '≥ ') + s;
  }

  /* ---------- placar ---------- */
  function placar(ciclo, valores) {
    var kpis = (CICLOS[ciclo] || {}).kpis || [];
    var r = { verde: 0, ambar: 0, vermelho: 0, nd: 0, vazio: 0, total: kpis.length };
    for (var i = 0; i < kpis.length; i++) {
      r[semaforo(kpis[i], (valores || {})[kpis[i].k])]++;
    }
    r.preenchidos = r.total - r.vazio;
    return r;
  }

  /* ---------- mensagem para o grupo ----------
     Substitui a coluna N da planilha ("Mensagem WhatsApp (copiar)").
     Mesma função, sem o risco de copiar a célula da linha errada. */
  var EMOJI = { verde: '🟢', ambar: '🟡', vermelho: '🔴', nd: '⚪', vazio: '⬜' };

  function mensagem(ciclo, valores, rotuloPeriodo) {
    var c = CICLOS[ciclo];
    if (!c) { return ''; }
    var L = [];
    L.push('COCKPIT ' + c.label.toUpperCase() + ' · ' + (rotuloPeriodo || '') + ' — Grau Técnico FSA');
    L.push('');
    var i, kpi, v, s;
    for (i = 0; i < c.kpis.length; i++) {
      kpi = c.kpis[i];
      v = (valores || {})[kpi.k];
      s = semaforo(kpi, v);
      L.push(EMOJI[s] + ' ' + kpi.label + ': ' + fmtValor(kpi, v) + '  (meta ' + fmtMeta(kpi) + ')');
    }
    var p = placar(ciclo, valores);
    L.push('');
    L.push('Placar: ' + p.verde + ' no verde · ' + p.ambar + ' no amarelo · ' + p.vermelho + ' no vermelho'
      + (p.nd ? ' · ' + p.nd + ' sem dado (ND)' : '')
      + (p.vazio ? ' · ' + p.vazio + ' não preenchido' : ''));
    return L.join('\n');
  }

  /* ---------- identidade do período ----------
     O id do documento É o período. Isso torna o lançamento
     idempotente: salvar duas vezes o mesmo dia sobrescreve,
     nunca duplica. */
  function idPeriodo(ciclo, iso) {
    if (ciclo === 'diario') { return 'd_' + iso; }
    if (ciclo === 'mensal') { return 'm_' + iso.slice(0, 7); }
    return 's_' + semanaISO(iso);
  }
  /* semana ISO-8601 (segunda como 1º dia) — mesmo padrão do S01..S12 da planilha */
  function semanaISO(iso) {
    var p = String(iso).split('-');
    var d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])));
    var dow = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dow);
    var ano = d.getUTCFullYear();
    var jan1 = new Date(Date.UTC(ano, 0, 1));
    var sem = Math.ceil(((d - jan1) / 86400000 + 1) / 7);
    return ano + '-S' + (sem < 10 ? '0' + sem : String(sem));
  }
  function rotuloPeriodo(ciclo, iso) {
    var p = String(iso).split('-');
    if (ciclo === 'diario') { return p[2] + '/' + p[1]; }
    if (ciclo === 'mensal') { return p[1] + '/' + p[0]; }
    return 'semana ' + semanaISO(iso).split('-S')[1];
  }

  w.CockpitModelo = {
    ciclos: CICLOS,
    diario: DIARIO,
    semanal: SEMANAL,
    mensal: MENSAL,
    ND: ND,
    ehND: ehND,
    ehVazio: ehVazio,
    semaforo: semaforo,
    explicaSemaforo: explicaSemaforo,
    fmtValor: fmtValor,
    fmtMeta: fmtMeta,
    fmtNum: fmtNum,
    placar: placar,
    mensagem: mensagem,
    idPeriodo: idPeriodo,
    semanaISO: semanaISO,
    rotuloPeriodo: rotuloPeriodo
  };
}(window));
