/* ============================================================
   desempenho.js · Sistema A — Grau Técnico FSA
   ------------------------------------------------------------
   UMA RÉGUA SÓ para "previsto × realizado", usada pela reunião e
   pelo planejamento. Não desenha nada: recebe itens já traduzidos
   e devolve o placar, a quebra por peso, os motivos de não ter
   sido feito e a série acumulada.

   Por que existe: a reunião media decisões de um jeito e o plano
   media itens de outro. Duas contas para a mesma pergunta acabam
   em dois números diferentes na mesma mesa — e aí ninguém confia
   em nenhum dos dois.

   O que a tela entrega (item NORMALIZADO):
     { peso:   'vital' | 'importante' | 'rotina' | ''        (sem classificação)
       estado: 'no_prazo' | 'com_atraso' | 'andamento' |
               'aberto'   | 'vencida'    | 'nao_feito' | 'indisponivel'
       motivo: uma das chaves de MOTIVOS (só quando nao_feito) }

   Regras de honestidade:
     - 'indisponivel' (dado fora da janela lida) NUNCA entra como
       cumprido nem como falha: sai do denominador e aparece à parte.
     - item sem classificação não vira 'rotina' no silêncio: fica em
       porPeso.sem e a tela mostra que falta classificar.
     - dois percentuais, porque respondem perguntas diferentes:
         pct        = entregue ÷ total            (onde o mês está)
         pctFechado = entregue ÷ (entregue+falhou) (como foi o que fechou)
       Quem só olha o primeiro no dia 5 acha que está tudo perdido;
       quem só olha o segundo no dia 30 acha que está tudo certo.

   ES5, sem dependência. Roda no navegador e no Node (harness).
   ============================================================ */
(function (raiz) {
  'use strict';

  var PESO_DEF = {
    vital: { rotulo: 'Vital', nivel: 3, ajuda: 'Se isto falhar, o mês falha.' },
    importante: { rotulo: 'Importante', nivel: 2, ajuda: 'Move o indicador, mas o mês sobrevive.' },
    rotina: { rotulo: 'Rotina', nivel: 1, ajuda: 'Tem de acontecer, não muda o jogo.' }
  };
  var PESO_ORDEM = ['vital', 'importante', 'rotina'];
  var TETO_VITAL = 5;   /* mais que isto por mês e "vital" deixa de querer dizer alguma coisa */

  var MOTIVOS = {
    dependencia: 'Dependia de outro setor',
    informacao: 'Faltou informação',
    prioridade: 'Entrou coisa mais urgente',
    tempo: 'Não houve tempo',
    ferramenta: 'Faltou ferramenta ou acesso',
    outro: 'Outro'
  };

  var ESTADOS = {
    no_prazo: { rotulo: 'no prazo', grupo: 'entregue', cor: 'green' },
    com_atraso: { rotulo: 'com atraso', grupo: 'entregue', cor: 'amber' },
    /* entregue SEM saber quando: conta como cumprido, mas não pode inflar o
       "no prazo". É o caso da tarefa marcada como feita sem data de conclusão. */
    entregue: { rotulo: 'entregue', grupo: 'entregue', cor: 'green' },
    andamento: { rotulo: 'em andamento', grupo: 'aberto', cor: 'doing' },
    aberto: { rotulo: 'a fazer', grupo: 'aberto', cor: 'muted' },
    vencida: { rotulo: 'vencida', grupo: 'aberto', cor: 'red' },
    nao_feito: { rotulo: 'não feito', grupo: 'falhou', cor: 'red' },
    indisponivel: { rotulo: 'sem dado', grupo: 'fora', cor: 'muted' }
  };

  function pesoDe(x) {
    var p = x && x.peso;
    if (typeof p !== 'string') { return ''; }
    p = p.replace(/^\s+|\s+$/g, '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(PESO_DEF, p) ? p : '';
  }
  function estadoDe(x) {
    var e = x && x.estado;
    if (typeof e !== 'string') { return 'aberto'; }
    e = e.replace(/^\s+|\s+$/g, '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(ESTADOS, e) ? e : 'aberto';
  }
  function pct(parte, todo) { return todo > 0 ? Math.round((parte / todo) * 100) : null; }

  function zerado() {
    return { total: 0, no_prazo: 0, com_atraso: 0, entregue: 0, andamento: 0, aberto: 0, vencida: 0, nao_feito: 0, indisponivel: 0,
      cumpridos: 0, falhou: 0, emAberto: 0, contam: 0, pct: null, pctNoPrazo: null, pctFechado: null };
  }
  function fecharContas(c) {
    c.cumpridos = c.no_prazo + c.com_atraso + c.entregue;
    c.falhou = c.nao_feito;
    c.emAberto = c.andamento + c.aberto + c.vencida;
    c.contam = c.cumpridos + c.falhou + c.emAberto;   /* 'indisponivel' fica de fora do denominador */
    c.pct = pct(c.cumpridos, c.contam);
    c.pctNoPrazo = pct(c.no_prazo, c.contam);
    c.pctFechado = pct(c.cumpridos, c.cumpridos + c.falhou);
    return c;
  }

  /* ---------- o placar de uma lista ---------- */
  function placar(itens, opts) {
    var o = opts || {};
    var meta = typeof o.meta === 'number' ? o.meta : 90;
    var lista = [];
    var i;
    for (i = 0; i < (itens || []).length; i++) { if (itens[i]) { lista.push(itens[i]); } }

    var geral = zerado();
    var porPeso = { vital: zerado(), importante: zerado(), rotina: zerado(), sem: zerado() };
    var motivosMapa = {};
    var pesoSoma = 0, pesoEntregue = 0;

    for (i = 0; i < lista.length; i++) {
      var it = lista[i];
      var p = pesoDe(it), e = estadoDe(it);
      var alvo = porPeso[p || 'sem'];
      geral.total += 1; geral[e] += 1;
      alvo.total += 1; alvo[e] += 1;
      if (e === 'nao_feito') {
        var m = (it.motivo && Object.prototype.hasOwnProperty.call(MOTIVOS, it.motivo)) ? it.motivo : 'outro';
        motivosMapa[m] = (motivosMapa[m] || 0) + 1;
      }
      /* percentual PONDERADO: vital pesa 3, importante 2, rotina 1; sem classificação pesa 1.
         Fica ao lado do percentual simples, nunca no lugar dele (ver o comentário do cabeçalho). */
      if (e !== 'indisponivel') {
        var nivel = p ? PESO_DEF[p].nivel : 1;
        pesoSoma += nivel;
        if (e === 'no_prazo' || e === 'com_atraso' || e === 'entregue') { pesoEntregue += nivel; }
      }
    }

    fecharContas(geral);
    for (i = 0; i < PESO_ORDEM.length; i++) { fecharContas(porPeso[PESO_ORDEM[i]]); }
    fecharContas(porPeso.sem);

    var motivos = [];
    for (var k in motivosMapa) {
      if (Object.prototype.hasOwnProperty.call(motivosMapa, k)) {
        motivos.push({ chave: k, rotulo: MOTIVOS[k], n: motivosMapa[k] });
      }
    }
    motivos.sort(function (a, b) { return b.n - a.n || (a.rotulo < b.rotulo ? -1 : 1); });

    geral.pctPonderado = pct(pesoEntregue, pesoSoma);
    geral.meta = meta;
    geral.bateuMeta = geral.pct != null && geral.pct >= meta;
    geral.porPeso = porPeso;
    geral.motivos = motivos;
    geral.semClassificacao = porPeso.sem.total;
    geral.vitalDemais = porPeso.vital.total > TETO_VITAL ? porPeso.vital.total : 0;
    geral.vitalEmRisco = porPeso.vital.vencida + porPeso.vital.nao_feito;
    return geral;
  }

  /* ---------- a série: uma coluna por reunião/mês, com o acumulado ----------
     grupos = [{ rotulo, chave, itens }] em ordem cronológica.
     Devolve, para cada grupo, o placar dele E o acumulado até ali — é o
     "gráfico que vai sendo alimentado reunião a reunião". */
  function serie(grupos, opts) {
    var out = [];
    var acum = [];
    for (var i = 0; i < (grupos || []).length; i++) {
      var g = grupos[i] || {};
      var itens = g.itens || [];
      for (var j = 0; j < itens.length; j++) { acum.push(itens[j]); }
      out.push({
        rotulo: g.rotulo || '',
        titulo: g.titulo || '',
        chave: g.chave || String(i),
        n: itens.length,
        placar: placar(itens, opts),
        acumulado: placar(acum.slice(0), opts)
      });
    }
    return out;
  }

  /* ---------- frase única para o topo (a tese da tela) ----------
     Minto: a conclusão primeiro. Quem lê a frase já sabe o que fazer. */
  function tese(p) {
    if (!p || !p.contam) { return 'Nada previsto ainda.'; }
    var v = p.porPeso.vital;
    if (v.total && (v.vencida + v.nao_feito) > 0) {
      return (v.vencida + v.nao_feito) + ' de ' + v.total + ' vitais não saíram — é por aí que começa.';
    }
    if (p.pct != null && p.pct < p.meta) {
      return p.pct + '% cumprido, abaixo da meta de ' + p.meta + '%.';
    }
    if (p.com_atraso > p.no_prazo) {
      return 'Meta batida, mas a maioria saiu com atraso (' + p.com_atraso + ' de ' + p.cumpridos + ').';
    }
    return p.pct + '% cumprido — no ritmo.';
  }

  var API = {
    PESO_DEF: PESO_DEF,
    PESO_ORDEM: PESO_ORDEM,
    TETO_VITAL: TETO_VITAL,
    MOTIVOS: MOTIVOS,
    ESTADOS: ESTADOS,
    pesoDe: pesoDe,
    estadoDe: estadoDe,
    placar: placar,
    serie: serie,
    tese: tese
  };

  raiz.GrautDesempenho = API;
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
}(typeof window !== 'undefined' ? window : this));
