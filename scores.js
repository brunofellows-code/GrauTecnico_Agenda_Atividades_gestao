/* ============================================================
   Sistema A · GERA — scores.js (v1 · Lote 2 · 12/08/2026)
   ------------------------------------------------------------
   MOTOR DE SCORES — funções PURAS (entra array, sai número/objeto;
   zero Firebase, zero DOM). ARQUIVO NOVO: não toca kpi.js (1.636
   linhas preservadas). kpi.js/telas consomem via window.SCORES.
   ES5 puro. Fórmulas = PROMPT_FABLE_TURBO §4.1/§4.3 + limiares
   da CALIBRACAO_PLANILHAS. Casos de teste validados à mão em
   teste-scores.js (GATE 2 do PROTOCOLO_QUALIDADE).

   PREMISSA DECLARADA (mestre não especificou o peso):
   gargaloSetor = média das pessoas PONDERADA pelo nº de
   atividades ativas de cada uma (quem carrega mais trabalho
   pesa mais no diagnóstico do setor).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- helpers de data (ISO yyyy-mm-dd, sem timezone) ---------- */
  function diasEntre(isoA, isoB) { /* B - A em dias inteiros */
    var a = new Date(isoA + 'T00:00:00'), b = new Date(isoB + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  /* ============================================================
     1. STATUS DERIVADO (CALIBRACAO §1 — fim do status digitado)
     item: { status:'aberta'|'andamento'|'feita', dtPrevista? }
     retorna: 'feita' | 'atrasada' | 'hoje' | status original
     ============================================================ */
  function derivarStatus(item, hojeISO) {
    if (item.status === 'feita') return 'feita';
    if (item.dtPrevista) {
      var d = diasEntre(item.dtPrevista, hojeISO);
      if (d > 0) return 'atrasada';           /* prevista < hoje */
      if (d === 0) return 'hoje';
    }
    return item.status || 'aberta';
  }

  /* ============================================================
     2. SCORE DE URGÊNCIA (mestre §4.1 — card "ATAQUE AGORA")
     score = diasAtraso×3 + bloqueiaOutros×5 + prioridadeAlta×2
             + venceHoje×4
     it: { diasAtraso, bloqueiaOutros(qtd), prioridadeAlta(bool),
           venceHoje(bool) }
     ============================================================ */
  function urgencia(it) {
    return (it.diasAtraso || 0) * 3 +
           (it.bloqueiaOutros || 0) * 5 +
           (it.prioridadeAlta ? 2 : 0) +
           (it.venceHoje ? 4 : 0);
  }

  /* ============================================================
     3. SCORE DE GARGALO (mestre §4.1)
     pessoa: { atrasadas, paradas, bloqueiam, diasSemAtualizar,
               feitasNoPrazo, ativas }
     ============================================================ */
  function gargaloPessoa(p) {
    return (p.atrasadas || 0) * 3 +
           (p.paradas || 0) * 2 +
           (p.bloqueiam || 0) * 5 +
           (p.diasSemAtualizar || 0) * 1 -
           (p.feitasNoPrazo || 0) * 2;
  }
  function gargaloSetor(pessoas) { /* média ponderada por 'ativas' */
    var somaPeso = 0, soma = 0, i, peso;
    for (i = 0; i < pessoas.length; i++) {
      peso = pessoas[i].ativas || 1;
      soma += gargaloPessoa(pessoas[i]) * peso;
      somaPeso += peso;
    }
    return somaPeso ? Math.round((soma / somaPeso) * 10) / 10 : 0;
  }

  /* ============================================================
     4. RANKING SEMANAL (mestre §4.3 — Top 3 público + posição)
     pessoa: { uid, nome, feitasNoPrazo, feitasAdiantadas,
               presencas, planosEmDia, atrasadas, paradas,
               atividadesNoPeriodo }
     Regras: mínimo 3 atividades no período · desc por score ·
     empate = menos atrasadas na frente · bottom NUNCA sai daqui
     (função só retorna top3 + posição pedida — RBAC por design).
     ============================================================ */
  function scoreRanking(p) {
    return (p.feitasNoPrazo || 0) * 2 +
           (p.feitasAdiantadas || 0) * 3 +
           (p.presencas || 0) * 1 +
           (p.planosEmDia || 0) * 1 -
           (p.atrasadas || 0) * 2 -
           (p.paradas || 0) * 1;
  }
  function ranking(pessoas, uidConsulta) {
    var eleg = [], i, p;
    for (i = 0; i < pessoas.length; i++) {
      p = pessoas[i];
      if ((p.atividadesNoPeriodo || 0) >= 3) {
        eleg.push({ uid: p.uid, nome: p.nome,
                    score: scoreRanking(p), atrasadas: p.atrasadas || 0 });
      }
    }
    eleg.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.atrasadas - b.atrasadas;           /* desempate */
    });
    var pos = 0;
    for (i = 0; i < eleg.length; i++) {
      if (eleg[i].uid === uidConsulta) { pos = i + 1; break; }
    }
    return { top3: eleg.slice(0, 3),
             posicao: pos, total: eleg.length };  /* bottom não sai */
  }

  /* ============================================================
     5. VARIANCE PREVISTO×REALIZADO (mestre §3.5.2 + CALIBRACAO §3)
     limiares default ±5 (verde) / ±15 (âmbar); custom por plano.
     pct assinado: + = estourou, − = abaixo do previsto.
     ============================================================ */
  function variance(previsto, realizado, limiarVerde, limiarAmbar) {
    var lv = (limiarVerde == null) ? 5 : limiarVerde;
    var la = (limiarAmbar == null) ? 15 : limiarAmbar;
    if (!previsto) return { pct: 0, cor: 'verde' };
    var pct = Math.round(((realizado - previsto) / previsto) * 1000) / 10;
    var abs = Math.abs(pct);
    return { pct: pct,
             cor: abs <= lv ? 'verde' : (abs <= la ? 'ambar' : 'vermelho') };
  }

  /* ============================================================
     6. ROLL-UP (pré-computado no write — CALIBRACAO §3)
     itens[]: { custoPrev, custoReal, horasPrev, horasReal, status }
     ============================================================ */
  function rollup(itens) {
    var r = { custoPrev: 0, custoReal: 0, horasPrev: 0, horasReal: 0,
              feitos: 0, total: itens.length }, i, it;
    for (i = 0; i < itens.length; i++) {
      it = itens[i];
      r.custoPrev += it.custoPrev || 0;
      r.custoReal += it.custoReal || 0;
      r.horasPrev += it.horasPrev || 0;
      r.horasReal += it.horasReal || 0;
      if (it.status === 'feita') r.feitos++;
    }
    return r;
  }

  /* ============================================================
     7. COCKPIT (mestre §4.2) — agregador PURO: recebe arrays já
     carregados (busca no Firestore fica na camada da tela/kpi.js).
     RBAC POR DESIGN: perfil 'usuario' recebe gargalos:null e
     pendências só do próprio uid — mesmo que a tela peça errado.
     dados: { atividades[], reunioesHoje[], planos[], pessoas[] }
     ============================================================ */
  function cockpit(dados, perfil, uid, setorSigla, hojeISO) {
    var i, a, st;
    var atv = { total: 0, feitas: 0, pendentes: 0, atrasadas: 0, paradas: 0 };
    var pend = [];
    for (i = 0; i < dados.atividades.length; i++) {
      a = dados.atividades[i];
      /* escopo por perfil */
      if (perfil === 'usuario' && a.donoUid !== uid) continue;
      if (perfil === 'lider' && a.setorSigla !== setorSigla) continue;
      atv.total++;
      st = derivarStatus(a, hojeISO);
      if (st === 'feita') { atv.feitas++; continue; }
      atv.pendentes++;
      if (st === 'atrasada') atv.atrasadas++;
      if (a.semMovimento) atv.paradas++;
      pend.push({ ref: a, score: urgencia({
        diasAtraso: st === 'atrasada' ? diasEntre(a.dtPrevista, hojeISO) : 0,
        bloqueiaOutros: a.bloqueiaOutros || 0,
        prioridadeAlta: a.prioridade === 'alta',
        venceHoje: st === 'hoje' }) });
    }
    pend.sort(function (x, y) { return y.score - x.score; });

    var garg = null;
    if (perfil === 'gestor' || perfil === 'lider') {
      var pes = [], setores = {}, s;
      for (i = 0; i < dados.pessoas.length; i++) {
        s = dados.pessoas[i];
        if (perfil === 'lider' && s.setorSigla !== setorSigla) continue;
        pes.push({ uid: s.uid, nome: s.nome, setorSigla: s.setorSigla,
                   score: gargaloPessoa(s) });
        if (!setores[s.setorSigla]) setores[s.setorSigla] = [];
        setores[s.setorSigla].push(s);
      }
      pes.sort(function (x, y) { return y.score - x.score; });
      var gs = [];
      for (s in setores) {
        if (setores.hasOwnProperty(s)) {
          gs.push({ setorSigla: s, score: gargaloSetor(setores[s]) });
        }
      }
      gs.sort(function (x, y) { return y.score - x.score; });
      garg = { pessoas: pes.slice(0, 3), setores: gs.slice(0, 3) };
    }

    return {
      atividades: atv,
      pendencias: pend.slice(0, perfil === 'usuario' ? 3 : 5),
      gargalos: garg,                              /* null p/ usuario */
      ranking: ranking(dados.pessoas || [], uid)
    };
  }

  /* ---------- API pública ---------- */
  window.SCORES = {
    derivarStatus: derivarStatus,
    urgencia: urgencia,
    gargaloPessoa: gargaloPessoa,
    gargaloSetor: gargaloSetor,
    scoreRanking: scoreRanking,
    ranking: ranking,
    variance: variance,
    rollup: rollup,
    cockpit: cockpit,
    _diasEntre: diasEntre                          /* exposto p/ teste */
  };
})();
