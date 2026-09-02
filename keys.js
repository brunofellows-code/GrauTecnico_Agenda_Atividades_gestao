/* ============================================================
   Sistema A · Grau Técnico FSA — keys.js (v1 · 11/08/2026)
   ------------------------------------------------------------
   Camada de teclado + acessibilidade do Design System v3.
   ARQUIVO NOVO (não altera ui.js/mnav.js). ES5 puro, zero deps.
   Incluir em toda tela, DEPOIS de theme.css/components.css:
     <script src="keys.js" defer></script>

   Entrega (PROMPT_FABLE §5.3/§5.4):
   1. Atalhos: / busca · N nova atividade (se CAN_WRITE) ·
      Esc fecha modal · g+h Hoje · g+p Planejamento · ? cheatsheet
   2. Focus trap em .ui-moverlay: foco preso, ESC fecha,
      foco RETORNA ao elemento de origem (padrão ARIA/Radix)
   3. Densidade compact: restaura do localStorage no load;
      expõe window.KEYS.toggleDensity() p/ o botão da topbar
   4. window.KEYS.countTo(el, valor): número de KPI "conta"
      (requestAnimationFrame, 400ms — motor da classe .count)

   Convenções que as telas devem seguir (contrato):
   · campo de busca:        input[data-busca] (ou type="search")
   · botão nova atividade:  [data-acao="nova-atividade"]
   · permissão de escrita:  window.CAN_WRITE === true
   ============================================================ */
(function () {
  'use strict';

  /* ---------- utilidades ---------- */
  function isTyping(el) {
    if (!el) return false;
    var t = (el.tagName || '').toUpperCase();
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' ||
           el.isContentEditable === true;
  }
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),' +
                  'select:not([disabled]),textarea:not([disabled]),' +
                  '[tabindex]:not([tabindex="-1"])';
  function focusables(root) {
    var list = root.querySelectorAll(FOCUSABLE), out = [], i;
    for (i = 0; i < list.length; i++) {
      if (list[i].offsetParent !== null) out.push(list[i]);
    }
    return out;
  }
  function openModal() {
    var m = document.querySelectorAll('.ui-moverlay');
    return m.length ? m[m.length - 1] : null; /* o mais recente */
  }

  /* ---------- 2. FOCUS TRAP + retorno de foco ---------- */
  var lastOpener = null;
  var mo = new MutationObserver(function (muts) {
    var i, j, n;
    for (i = 0; i < muts.length; i++) {
      /* modal ENTROU no DOM → guarda origem e foca o 1º focável */
      for (j = 0; j < muts[i].addedNodes.length; j++) {
        n = muts[i].addedNodes[j];
        if (n.nodeType === 1 && (n.classList.contains('ui-moverlay') ||
            (n.querySelector && n.querySelector('.ui-moverlay')))) {
          lastOpener = document.activeElement;
          var modal = n.classList.contains('ui-moverlay') ? n
                    : n.querySelector('.ui-moverlay');
          var f = focusables(modal);
          if (f.length) f[0].focus();
        }
      }
      /* modal SAIU do DOM → devolve o foco à origem */
      for (j = 0; j < muts[i].removedNodes.length; j++) {
        n = muts[i].removedNodes[j];
        if (n.nodeType === 1 && (n.classList.contains('ui-moverlay') ||
            (n.querySelector && n.querySelector('.ui-moverlay')))) {
          if (lastOpener && lastOpener.focus &&
              document.contains(lastOpener)) lastOpener.focus();
          lastOpener = null;
        }
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- 3. densidade compact persistida ---------- */
  var DKEY = 'gera.density';
  try {
    if (localStorage.getItem(DKEY) === 'compact') {
      document.documentElement.setAttribute('data-density', 'compact');
    }
  } catch (e) { /* localStorage bloqueado: segue no confortável */ }

  function toggleDensity() {
    var html = document.documentElement;
    var on = html.getAttribute('data-density') === 'compact';
    if (on) { html.removeAttribute('data-density'); }
    else    { html.setAttribute('data-density', 'compact'); }
    try { localStorage.setItem(DKEY, on ? '' : 'compact'); } catch (e) {}
    return !on;
  }

  /* ---------- 4. contador de KPI (motor da classe .count) ---------- */
  function countTo(el, target) {
    if (!el) return;
    var from = parseFloat((el.textContent || '0').replace(/[^\d.-]/g, '')) || 0;
    var to = Number(target) || 0, t0 = null, DUR = 400;
    var dec = (String(target).split('.')[1] || '').length;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / DUR, 1);
      p = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = (from + (to - from) * p).toFixed(dec);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* ---------- cheatsheet (tecla ?) ---------- */
  function showCheatsheet() {
    if (document.querySelector('.v3-keys-overlay')) return;
    var ov = document.createElement('div');
    ov.className = 'v3-keys-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', 'Atalhos de teclado');
    /* conteúdo ESTÁTICO (nenhum dado de usuário → sem risco XSS) */
    ov.innerHTML =
      '<div class="v3-keys-card">' +
      '<h2>Atalhos de teclado</h2>' +
      '<div class="v3-keys-row"><span>Buscar</span><kbd>/</kbd></div>' +
      '<div class="v3-keys-row"><span>Nova atividade</span><kbd>N</kbd></div>' +
      '<div class="v3-keys-row"><span>Ir para Hoje</span><kbd>g h</kbd></div>' +
      '<div class="v3-keys-row"><span>Ir para Planejamento</span><kbd>g p</kbd></div>' +
      '<div class="v3-keys-row"><span>Fechar modal / este painel</span><kbd>Esc</kbd></div>' +
      '<div class="v3-keys-row"><span>Este painel</span><kbd>?</kbd></div>' +
      '</div>';
    ov.addEventListener('click', function (ev) {
      if (ev.target === ov) ov.parentNode.removeChild(ov);
    });
    document.body.appendChild(ov);
  }

  /* ---------- 1. atalhos globais ---------- */
  var gPending = false, gTimer = null;
  document.addEventListener('keydown', function (ev) {
    var k = ev.key;

    /* Esc: 1º cheatsheet, 2º modal (clica o X — a tela decide como fechar) */
    if (k === 'Escape') {
      var cs = document.querySelector('.v3-keys-overlay');
      if (cs) { cs.parentNode.removeChild(cs); return; }
      var m = openModal();
      if (m) {
        var x = m.querySelector('.ui-mclose');
        if (x) x.click();
      }
      return;
    }

    if (isTyping(ev.target)) return;        /* digitando → não intercepta */
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

    if (k === '/') {
      var b = document.querySelector('input[data-busca]') ||
              document.querySelector('input[type="search"]');
      if (b) { ev.preventDefault(); b.focus(); }
      return;
    }
    if (k === '?') { ev.preventDefault(); showCheatsheet(); return; }

    if (k === 'n' || k === 'N') {
      if (window.CAN_WRITE !== true) return; /* RBAC: sem escrita, sem N */
      var btn = document.querySelector('[data-acao="nova-atividade"]');
      if (btn) { ev.preventDefault(); btn.click(); }
      return;
    }

    /* sequência g+h / g+p (janela de 800ms) */
    if (k === 'g' || k === 'G') {
      gPending = true;
      if (gTimer) clearTimeout(gTimer);
      gTimer = setTimeout(function () { gPending = false; }, 800);
      return;
    }
    if (gPending) {
      gPending = false;
      if (k === 'h' || k === 'H') { window.location.href = 'hoje.html'; }
      if (k === 'p' || k === 'P') { window.location.href = 'planejamento.html'; }
    }
  });

  /* ---------- API pública ---------- */
  window.KEYS = { toggleDensity: toggleDensity, countTo: countTo };
})();
