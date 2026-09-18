/* ============================================================
   cache.js · Sistema A — Grau Técnico FSA
   ------------------------------------------------------------
   MEMÓRIA CURTA DA ABA. Guarda por alguns minutos o que o banco
   acabou de devolver, para a próxima tela não pedir tudo de novo.

   Por que existe: cada abertura de tela relia setores + atividades
   + ocorrências (~200 leituras). Andar por 5 telas custava ~1.000
   leituras de uma cota diária de 50 mil (plano Spark). Quase tudo
   isso era a MESMA resposta, pedida de novo com segundos de
   diferença.

   Como não fica desatualizado:
     1. prazo curto por coleção (ocorrências 2 min, o resto 10-30);
     2. QUALQUER gravação na aba apaga o que aquela gravação mexeu
        (ver `vigiar`) — quem escreve nunca lê o valor velho;
     3. o botão "Atualizar" força leitura nova (GrautCache.limpar()).

   O que NÃO entra aqui: nada que dependa de regra de permissão
   diferente por tela, e nada de outro usuário — a chave carrega o
   uid e troca de pessoa limpa tudo.

   Guarda em sessionStorage: morre ao fechar a aba, não vaza para
   outra aba nem para outro dia. Se faltar espaço, degrada sozinho
   para memória (a tela continua funcionando, só custa mais leitura).

   Carregar ANTES de kpi.js: <script src="cache.js"></script>
   ============================================================ */
(function (w) {
  'use strict';

  var PRE = 'gc1';
  var MEM = {};      /* espelho em memória: evita re-parsear JSON na mesma página */
  var PEND = {};     /* voos em andamento: dois pedidos iguais viram um só */
  var DONO = '';     /* uid de quem está logado */
  var TETO = 1500000; /* ~1,5 MB por chave: acima disso só memória, não grava */

  function agora() { return Date.now(); }
  function ss() { try { return w.sessionStorage; } catch (e) { return null; } }
  function k(chave) { return PRE + ':' + DONO + ':' + chave; }

  function lerDisco(chave) {
    var s = ss(); if (!s) { return null; }
    try {
      var cru = s.getItem(k(chave));
      if (!cru) { return null; }
      var o = JSON.parse(cru);
      return (o && typeof o.t === 'number') ? o : null;
    } catch (e) { return null; }
  }
  function gravarDisco(chave, o) {
    var s = ss(); if (!s) { return; }
    try {
      var cru = JSON.stringify(o);
      if (cru.length > TETO) { return; }   /* grande demais: fica só em memória */
      s.setItem(k(chave), cru);
    } catch (e) {
      /* cota estourada: limpa o que é nosso e segue sem gravar */
      try { limparTudo(); } catch (e2) {}
    }
  }
  function limparTudo() {
    MEM = {};
    var s = ss(); if (!s) { return; }
    var mortos = [], i;
    for (i = 0; i < s.length; i++) {
      var ch = s.key(i);
      if (ch && ch.indexOf(PRE + ':') === 0) { mortos.push(ch); }
    }
    for (i = 0; i < mortos.length; i++) { try { s.removeItem(mortos[i]); } catch (e) {} }
  }

  /* ---------- API de leitura ---------- */
  /* ler('occ:2026-08-04..2026-10-18', 120, function(){ return promessa; }) */
  function ler(chave, ttlSeg, produtor) {
    var lim = (ttlSeg || 0) * 1000;
    var mem = MEM[chave];
    if (mem && (agora() - mem.t) < lim) { return Promise.resolve(mem.v); }
    var disco = lerDisco(chave);
    if (disco && (agora() - disco.t) < lim) { MEM[chave] = disco; return Promise.resolve(disco.v); }
    if (PEND[chave]) { return PEND[chave]; }
    PEND[chave] = Promise.resolve()
      .then(produtor)
      .then(function (v) {
        var o = { t: agora(), v: v };
        MEM[chave] = o; gravarDisco(chave, o);
        delete PEND[chave];
        return v;
      })
      .catch(function (e) { delete PEND[chave]; throw e; });
    return PEND[chave];
  }

  function limpar(prefixo) {
    if (!prefixo) { return limparTudo(); }
    var s = ss(), mortos = [], ch;
    for (ch in MEM) { if (MEM.hasOwnProperty(ch) && ch.indexOf(prefixo) === 0) { delete MEM[ch]; } }
    if (!s) { return; }
    for (var i = 0; i < s.length; i++) {
      var kk = s.key(i);
      if (kk && kk.indexOf(k(prefixo)) === 0) { mortos.push(kk); }
    }
    for (var j = 0; j < mortos.length; j++) { try { s.removeItem(mortos[j]); } catch (e) {} }
  }

  function idadeMs(chave) {
    var o = MEM[chave] || lerDisco(chave);
    return o ? (agora() - o.t) : null;
  }

  function dono(uid) {
    uid = uid || '';
    if (DONO && DONO !== uid) { limparTudo(); }   /* trocou de pessoa: nada do anterior fica */
    DONO = uid;
    /* varre restos de OUTRO uid na mesma aba (A saiu, B entrou): some tudo que não é do dono */
    var s = ss(); if (!s) { return; }
    var mortos = [], i;
    for (i = 0; i < s.length; i++) {
      var ch = s.key(i) || '';
      if (ch.indexOf(PRE + ':') === 0 && ch.indexOf(PRE + ':' + uid + ':') !== 0) { mortos.push(ch); }
    }
    for (i = 0; i < mortos.length; i++) { try { s.removeItem(mortos[i]); } catch (e) {} }
  }

  /* ---------- quem grava, apaga o que mexeu ---------- */
  /* Mapa coleção → prefixos de cache que aquela coleção alimenta.
     Coleção que não está aqui (atividade_log, reunioes, eventos,
     planejamentos, solicitacoes…) não invalida nada: o log é escrito
     a CADA ação e apagaria o cache inteiro a toda hora. */
  var TOCA = {
    ocorrencias: ['occ'],
    atividades: ['ativ'],
    setores: ['set', 'ativ'],
    usuarios: ['usr']
  };

  var DIAG = { vigiou: 0, gravacoes: [] };   /* só para depurar: window.GrautCache._diag */
  function gravou(colecao) {
    DIAG.gravacoes.push(colecao || '(sem coleção)');
    if (DIAG.gravacoes.length > 50) { DIAG.gravacoes.shift(); }   /* só as últimas: não cresce sem fim */
    var alvos = TOCA[colecao];
    if (!alvos) { return; }
    for (var i = 0; i < alvos.length; i++) { limpar(alvos[i]); }
  }

  function colecaoDe(ref) {
    try {
      var p = (ref && ref.path) || (ref && ref._key && ref._key.path && ref._key.path.toString()) || '';
      return String(p).split('/')[0] || '';
    } catch (e) { return ''; }
  }

  /* Envolve o módulo do Firestore: toda gravação avisa o cache.
     É UM ponto só — não depende de lembrar de chamar em 66 lugares. */
  function vigiar(f) {
    if (!f || f.__vigiado) { return f; }
    var novo = {}, n;
    for (n in f) { novo[n] = f[n]; }        /* cópia: o módulo original é imutável */
    /* apaga ANTES e DEPOIS: antes, para ninguém ler o velho enquanto grava;
       depois, porque uma leitura simultânea poderia ter reenchido no meio. */
    function envolve(nome, alvo) {
      var orig = f[nome];
      if (typeof orig !== 'function') { return; }
      novo[nome] = function (ref) {
        var col = alvo === 'tudo' ? null : colecaoDe(ref);
        if (alvo === 'tudo') { limparTudo(); } else { gravou(col); }
        var r = orig.apply(null, arguments);
        if (r && typeof r.then === 'function') {
          return r.then(function (v) { if (alvo === 'tudo') { limparTudo(); } else { gravou(col); } return v; });
        }
        return r;
      };
    }
    ['setDoc', 'updateDoc', 'deleteDoc', 'addDoc'].forEach(function (n2) { envolve(n2, 'ref'); });
    /* transação e lote não dizem em que coleção mexem: limpa tudo (são raros) */
    ['runTransaction', 'writeBatch'].forEach(function (n3) { envolve(n3, 'tudo'); });
    novo.__vigiado = true;
    DIAG.vigiou++;
    return novo;
  }

  w.GrautCache = {
    ler: ler,
    limpar: limpar,
    limparTudo: limparTudo,
    idadeMs: idadeMs,
    dono: dono,
    gravou: gravou,
    vigiar: vigiar,
    _colecaoDe: colecaoDe,
    _diag: DIAG
  };
}(window));
