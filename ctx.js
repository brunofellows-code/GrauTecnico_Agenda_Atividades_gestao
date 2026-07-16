/* ============================================================
   ctx.js · Sistema A — GERA · Grau Técnico FSA
   ------------------------------------------------------------
   F1-D(j) · SELETOR GLOBAL DE SETOR (context switcher).
   Padrão de mercado (Monday "workspace switcher" / ClickUp
   "space"): a pessoa escolhe o setor UMA vez e Hoje, Atividades
   e Inteligência abrem já filtradas — em vez de refiltrar tela
   a tela. Persistência por aparelho em localStorage
   ('gera_setor_ctx'). Os filtros locais de cada tela continuam
   funcionando POR CIMA deste pré-filtro.

   Regras:
   - '' = sem pré-filtro ("Toda a escola" / "Meu escopo").
   - Opções = setores-RAIZ ativos; líder vê só as raízes do
     próprio escopo (raiz liderada, ou raiz-pai do subsetor
     liderado). Gestor vê todas. Usuário comum não vê o seletor
     (o escopo dele já é "as minhas").
   - Valor guardado que saiu do escopo/cadastro → saneado p/ ''.
   - Predicado aplicaAtividade é PURO (testado no harness).

   ES5 puro · zero hex (só var() do theme.css) · zero query nova.
   Carregar após ui.js (usa só DOM padrão; UI é opcional).
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'gera_setor_ctx';

  function get() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }
  function set(sig) {
    try {
      if (sig) { localStorage.setItem(KEY, sig); } else { localStorage.removeItem(KEY); }
    } catch (e) { /* modo privado: segue só em memória via select */ }
  }

  /* Raízes ativas visíveis para o papel. */
  function opcoes(setores, user) {
    var sets = Array.isArray(setores) ? setores : [];
    var raizes = sets.filter(function (s) { return s && s.ativo && !s.setorPaiSigla; });
    if (!user || user.perfil === 'gestor') { return raizes; }
    if (user.perfil === 'lider') {
      var ok = {};
      var lid = Array.isArray(user.setoresLiderados) ? user.setoresLiderados : [];
      lid.forEach(function (sig) {
        var s = sets.filter(function (x) { return x.sigla === sig; })[0];
        if (!s) { return; }
        ok[s.setorPaiSigla ? s.setorPaiSigla : s.sigla] = true;
      });
      return raizes.filter(function (r) { return !!ok[r.sigla]; });
    }
    return []; /* usuário comum: sem seletor */
  }

  /* Valor guardado ainda vale para este papel/cadastro? Senão, ''. */
  function sanear(sig, setores, user) {
    if (!sig) { return ''; }
    var ops = opcoes(setores, user);
    for (var i = 0; i < ops.length; i++) { if (ops[i].sigla === sig) { return sig; } }
    return '';
  }

  /* PREDICADO puro: a atividade pertence ao contexto? (raiz por contrato:
     setorSigla/setorSiglas guardam SIGLA-RAIZ; todosSetores entra sempre). */
  function aplicaAtividade(act, sig) {
    if (!sig) { return true; }
    if (!act) { return false; }
    if (act.todosSetores) { return true; }
    if (act.setorSigla === sig) { return true; }
    if (Array.isArray(act.setorSiglas) && act.setorSiglas.indexOf(sig) !== -1) { return true; }
    return false;
  }

  /* Monta o <select> no container. opts: { setores, user, rotuloTudo, onChange }.
     Devolve o elemento (ou null se o papel não tem seletor / 0-1 opção). */
  function mount(container, opts) {
    if (!container || !opts) { return null; }
    var ops = opcoes(opts.setores, opts.user);
    if (!ops.length) { return null; }
    var atual = sanear(get(), opts.setores, opts.user);
    if (atual !== get()) { set(atual); }

    var wrap = document.createElement('label');
    wrap.className = 'gctx';
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted2)';
    var tag = document.createElement('span');
    tag.textContent = 'Setor';
    wrap.appendChild(tag);

    var sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Contexto de setor (vale para todas as telas)');
    sel.title = 'Pré-filtro global: vale em Hoje, Atividades e Inteligência.';
    sel.style.cssText = 'background:var(--s2);border:1px solid var(--border);color:var(--text);border-radius:9px;padding:7px 10px;font:inherit;font-size:12.5px;font-weight:700;letter-spacing:0;text-transform:none;cursor:pointer;max-width:220px';
    var o0 = document.createElement('option');
    o0.value = '';
    o0.textContent = opts.rotuloTudo || 'Toda a escola';
    sel.appendChild(o0);
    ops.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.sigla;
      o.textContent = s.sigla + ' · ' + (s.nome || s.sigla);
      sel.appendChild(o);
    });
    sel.value = atual;
    sel.addEventListener('change', function () {
      set(sel.value);
      if (typeof opts.onChange === 'function') { opts.onChange(sel.value); }
    });
    wrap.appendChild(sel);
    container.appendChild(wrap);
    return wrap;
  }

  window.GrautCtx = {
    KEY: KEY,
    get: get,
    set: set,
    opcoes: opcoes,
    sanear: sanear,
    aplicaAtividade: aplicaAtividade,
    mount: mount
  };
})();
