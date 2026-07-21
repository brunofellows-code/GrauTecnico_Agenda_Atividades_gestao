/* ============================================================
   GERA · lentes.js — R3 · Bloco 1 · "1 motor, 3 lentes"
   ------------------------------------------------------------
   Motor ÚNICO das 3 lentes de tela (desenho travado na R3):

     EU FAÇO     (azul --doing)   "O que eu tenho que fazer?"
     EU COBRO    (laranja --orange) "O que — e quem — eu cobro?"
     OS NÚMEROS  (verde --green)  "Como vai?"

   Como funciona (zero lógica de negócio aqui — só EXIBIÇÃO):
   - Cada tela marca seus blocos JÁ EXISTENTES com data-lente
     ("eufaco" | "eucobro" | "numeros"; aceita múltiplas, ex.:
     data-lente="eucobro numeros").
   - GrautLentes.mount(...) desenha a barra de lentes (legenda de
     1 linha + abas com selo de cor + cabeçalho com frase de
     propósito) e alterna a visibilidade dos blocos marcados.
   - A tela chama GrautLentes.aplicar() ao FIM de cada paint()
     (os blocos renascem a cada render — a lente reaplica).
   - Persistência da lente escolhida: localStorage por tela
     ('gera_lente_' + tela), por aparelho.

   Lentes por perfil (tabela travada da R3):
   - usuario          → EU FAÇO + OS NÚMEROS (não tem equipe)
   - lider / gestor   → as 3 lentes
   - sócio-gestor     → tratado como gestor; o rótulo da 1ª lente
     vira "MINHA PAUTA" quando o doc do usuário tiver perfil cru
     contendo "sócio"/"socio" (não há marcador dedicado no
     cadastro hoje — pendência registrada no HANDOFF R3).

   Contratos: ES5 puro · aspas simples · zero hex (só var(--*) do
   theme.css) · arquivo NOVO (ui.js/components.css intocados) ·
   nenhuma query — não toca no Firestore.
   ============================================================ */
(function () {
  'use strict';

  var DEF = {
    eufaco: {
      label: 'EU FAÇO', cor: '--doing', halo: '--haloDoing',
      pergunta: 'O que eu tenho que fazer?',
      frase: 'Minhas demandas e rotinas — o que depende de mim agora.'
    },
    eucobro: {
      label: 'EU COBRO', cor: '--orange', halo: '--haloOrange',
      pergunta: 'O que — e quem — eu cobro?',
      frase: 'A equipe pessoa a pessoa: carga, quem travou e o que escalar.'
    },
    numeros: {
      label: 'OS NÚMEROS', cor: '--green', halo: '--haloGreen',
      pergunta: 'Como vai?',
      frase: 'Os indicadores do recorte — rotina em dia, ritmo e atrasadas.'
    }
  };
  var ORDEM = ['eufaco', 'eucobro', 'numeros'];

  var CURRENT = null; /* { tela, user, set, id, opts, wrap, tabsEl, headEl, emptyEl } */

  /* sócio-gestor: detectado pelo valor CRU do doc (sem marcador dedicado ainda) */
  function isSocio(user) {
    var raw = String((user && user.perfilRaw) || '');
    return /s[óo]cio/i.test(raw);
  }

  /* conjunto de lentes do perfil (tabela travada) */
  function setFor(user) {
    var p = (user && user.perfil) || 'usuario';
    if (p === 'usuario') { return ['eufaco', 'numeros']; }
    return ['eufaco', 'eucobro', 'numeros'];
  }

  function labelDe(id, user) {
    if (id === 'eufaco' && isSocio(user)) { return 'MINHA PAUTA'; }
    return DEF[id].label;
  }
  function perguntaDe(id, user) {
    if (id === 'eufaco' && isSocio(user)) { return 'O que está na minha pauta?'; }
    return DEF[id].pergunta;
  }

  function storeKey(tela) { return 'gera_lente_' + tela; }
  function lerGuardada(tela, set, padrao) {
    var v = '';
    try { v = localStorage.getItem(storeKey(tela)) || ''; } catch (e) { }
    if (v && set.indexOf(v) !== -1) { return v; }
    if (padrao && set.indexOf(padrao) !== -1) { return padrao; }
    return set[0];
  }
  function guardar(tela, id) {
    try { localStorage.setItem(storeKey(tela), id); } catch (e) { }
  }

  /* ---------- estilos (uma vez; só tokens) ---------- */
  var CSS_OK = false;
  function injectCSS() {
    if (CSS_OK) { return; }
    CSS_OK = true;
    var css = ''
      + '.glen-wrap{margin:0 0 14px}'
      + '.glen-leg{font-size:11px;font-weight:700;letter-spacing:.02em;color:var(--muted2);'
      + 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}'
      + '.glen-leg .glen-dot{width:8px;height:8px}'
      + '.glen-bar{display:flex;gap:8px;flex-wrap:wrap}'
      + '.glen-tab{display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:12.5px;'
      + 'font-weight:800;letter-spacing:.04em;color:var(--muted);background:var(--s1);'
      + 'border:1px solid var(--border);border-radius:11px;padding:9px 14px;cursor:pointer}'
      + '.glen-tab.on{color:var(--text);border-color:var(--glen-cor);background:var(--glen-halo)}'
      + '.glen-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex:none;background:var(--glen-cor)}'
      + '.glen-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-top:10px;'
      + 'padding:9px 12px;border-left:3px solid var(--glen-cor);background:var(--s1);'
      + 'border-radius:0 10px 10px 0}'
      + '.glen-head b{font-size:12px;letter-spacing:.05em;color:var(--text)}'
      + '.glen-head .q{font-size:12.5px;font-weight:700;color:var(--muted)}'
      + '.glen-head .f{font-size:12px;color:var(--muted2)}'
      + '.glen-empty{margin-top:12px;padding:16px;border:1px dashed var(--border);border-radius:12px;'
      + 'color:var(--muted);font-size:13px;line-height:1.5}'
      + '@media(max-width:900px){.glen-bar{overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px}'
      + '.glen-tab{white-space:nowrap}}';
    var st = document.createElement('style');
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  /* ---------- pintura da barra ---------- */
  function pintarBarra() {
    if (!CURRENT) { return; }
    var c = CURRENT;
    c.tabsEl.innerHTML = '';
    c.set.forEach(function (id) {
      var d = DEF[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'glen-tab' + (c.id === id ? ' on' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c.id === id ? 'true' : 'false');
      b.style.cssText = '--glen-cor:var(' + d.cor + ');--glen-halo:var(' + d.halo + ')';
      var dot = document.createElement('span'); dot.className = 'glen-dot';
      b.appendChild(dot);
      b.appendChild(document.createTextNode(labelDe(id, c.user)));
      b.title = perguntaDe(id, c.user);
      b.addEventListener('click', function () { setLente(id); });
      c.tabsEl.appendChild(b);
    });
    var d2 = DEF[c.id];
    c.headEl.style.cssText = '--glen-cor:var(' + d2.cor + ')';
    c.headEl.innerHTML = '';
    var selo = document.createElement('span'); selo.className = 'glen-dot';
    selo.style.cssText = '--glen-cor:var(' + d2.cor + ')';
    c.headEl.appendChild(selo);
    var bb = document.createElement('b'); bb.textContent = labelDe(c.id, c.user);
    c.headEl.appendChild(bb);
    var q = document.createElement('span'); q.className = 'q'; q.textContent = perguntaDe(c.id, c.user);
    c.headEl.appendChild(q);
    var f = document.createElement('span'); f.className = 'f'; f.textContent = d2.frase;
    c.headEl.appendChild(f);
  }

  /* ---------- aplicar a lente aos blocos marcados ---------- */
  function aplicar() {
    var id = CURRENT ? CURRENT.id : 'eufaco';
    var nodes = document.querySelectorAll('[data-lente]');
    var visiveis = 0;
    Array.prototype.forEach.call(nodes, function (el) {
      var tags = ' ' + String(el.getAttribute('data-lente') || '') + ' ';
      var mostra = tags.indexOf(' ' + id + ' ') !== -1;
      /* preserva display inline original (ex.: flex) — cacheado no 1º toque */
      if (el.__glenDisp === undefined) {
        el.__glenDisp = (el.style.display && el.style.display !== 'none') ? el.style.display : '';
      }
      el.style.display = mostra ? el.__glenDisp : 'none';
      if (mostra) { visiveis++; }
    });
    /* estado vazio da lente (telas com estado vazio próprio montam com vazio:false) */
    if (CURRENT && CURRENT.emptyEl) {
      if (CURRENT.opts.vazio === false) {
        CURRENT.emptyEl.style.display = 'none';
      } else {
        var d = DEF[id];
        CURRENT.emptyEl.textContent = labelDe(id, CURRENT.user) + ' — ' + d.frase +
          ' Nada neste recorte por enquanto.';
        CURRENT.emptyEl.style.display = visiveis === 0 ? '' : 'none';
      }
    }
  }

  function setLente(id) {
    if (!CURRENT || CURRENT.set.indexOf(id) === -1 || CURRENT.id === id) { return; }
    CURRENT.id = id;
    guardar(CURRENT.tela, id);
    pintarBarra();
    aplicar();
    if (typeof CURRENT.opts.onChange === 'function') {
      try { CURRENT.opts.onChange(id); } catch (e) { /* não derruba a tela */ }
    }
  }

  /* ---------- montagem ----------
     opts: { tela, user, before | container, padrao, onChange, vazio } */
  function mount(opts) {
    if (!opts || !opts.tela) { return null; }
    if (document.getElementById('gera-lentes')) { return window.GrautLentes; }
    injectCSS();
    var user = opts.user || {};
    var set = setFor(user);
    var id = lerGuardada(opts.tela, set, opts.padrao);

    var wrap = document.createElement('div');
    wrap.className = 'glen-wrap';
    wrap.id = 'gera-lentes';

    /* legenda de 1 linha (ensina o código de cor) */
    var leg = document.createElement('div');
    leg.className = 'glen-leg';
    leg.appendChild(document.createTextNode('Lentes da tela:'));
    set.forEach(function (lid, i) {
      var dot = document.createElement('span');
      dot.className = 'glen-dot';
      dot.style.cssText = '--glen-cor:var(' + DEF[lid].cor + ')';
      leg.appendChild(dot);
      leg.appendChild(document.createTextNode(
        labelDe(lid, user).toLowerCase() + (i < set.length - 1 ? ' ·' : ' — toque para trocar.')));
    });
    wrap.appendChild(leg);

    var tabs = document.createElement('div');
    tabs.className = 'glen-bar';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Lentes da tela');
    wrap.appendChild(tabs);

    var head = document.createElement('div');
    head.className = 'glen-head';
    wrap.appendChild(head);

    var empty = document.createElement('div');
    empty.className = 'glen-empty';
    empty.style.display = 'none';
    wrap.appendChild(empty);

    CURRENT = { tela: opts.tela, user: user, set: set, id: id, opts: opts,
      wrap: wrap, tabsEl: tabs, headEl: head, emptyEl: empty };

    if (opts.before && opts.before.parentNode) {
      opts.before.parentNode.insertBefore(wrap, opts.before);
    } else if (opts.container) {
      opts.container.appendChild(wrap);
    } else {
      document.body.appendChild(wrap);
    }
    pintarBarra();
    aplicar();
    return window.GrautLentes;
  }

  window.GrautLentes = {
    DEF: DEF,
    ORDEM: ORDEM,
    isSocio: isSocio,
    setFor: setFor,
    mount: mount,
    aplicar: aplicar,
    set: setLente,
    ativa: function () { return CURRENT ? CURRENT.id : 'eufaco'; }
  };
})();
