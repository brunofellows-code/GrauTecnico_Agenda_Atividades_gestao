/* ============================================================
   GERA · mnav.js — R3 · Bloco 1 · menu lateral mobile
   ------------------------------------------------------------
   REESCRITO na R3: a barra de abas inferior (F1-K) sai; entra o
   MENU LATERAL com BOTÃO MÃE (desenho travado da R3). No celular
   (≤900px) um único botão flutuante — embaixo à direita, no
   alcance do polegar — abre um drawer lateral esquerdo com TODAS
   as telas do perfil, agrupadas como na sidebar do desktop.
   Benchmark registrado (busca 21/07): drawer lateral (hamburger)
   é o padrão de apps de produtividade com 6+ destinos e
   hierarquia profunda (Gmail/Slack/Asana — UXPin, Onething);
   botão posicionado embaixo facilita o uso com uma mão.
   Desktop: invisível, zero efeito (a sidebar do ui.js continua).

   Contratos respeitados:
   - ui.js e components.css INTOCADOS (arquivo próprio; estilos
     injetados só com tokens var(--*), zero hex).
   - RBAC ESPELHADO do guard.js (mesmos rótulos LIVE e a mesma
     regra: gestor fora do mapa = vê tudo; líder e usuário veem o
     recorte). Paridade nova: 'Reuniões' entra para o líder, igual
     ao desktop. A borda REAL de escrita segue nas Regras do
     Firestore — isto é só exibição.
   - As tab bars ESTÁTICAS de mock (.hj-tabbar / .pf-tabbar) são
     ocultadas aqui: sem a barra real por cima, elas voltariam a
     aparecer mortas no celular.
   - ES5 puro. Sem dependência: se Guard não existir (login),
     não faz nada.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Guard || !window.Guard.onReady) { return; }

  /* mesmos destinos do guard.js (rótulo → arquivo) */
  var LIVE = {
    'Hoje': 'hoje.html', 'Reuniões': 'projetos.html', 'Planejamento': 'planejamento.html',
    'Eventos': 'eventos.html', 'Atividades': 'atividades.html', 'Cockpit': 'cockpit.html',
    'Importar': 'importacao.html',
    'Inteligência': 'inteligencia.html', 'Performance': 'performance.html',
    'Glossário': 'glossario.html', 'Riscos': 'riscos.html',
    'Setores': 'setores.html', 'Usuários': 'usuarios.html'
  };
  /* mesma regra de exibição do guard.js (gestor fora do mapa = vê tudo) */
  var NAV_BY_PERFIL = {
    lider: { 'Hoje': 1, 'Atividades': 1, 'Reuniões': 1, 'Planejamento': 1, 'Eventos': 1, 'Inteligência': 1, 'Performance': 1, 'Glossário': 1 },
    usuario: { 'Hoje': 1, 'Atividades': 1, 'Planejamento': 1, 'Eventos': 1, 'Glossário': 1 }
  };
  /* mesmos grupos da sidebar do desktop (ui.js + injeções do guard) */
  var GRUPOS = [
    ['PRINCIPAL', ['Hoje', 'Reuniões', 'Planejamento', 'Atividades', 'Eventos']],
    ['GESTÃO', ['Cockpit', 'Importar', 'Inteligência', 'Performance', 'Glossário', 'Riscos']],
    ['CADASTRO', ['Setores', 'Usuários']]
  ];
  var PERFIL_ROTULO = { gestor: 'Gestor', lider: 'Líder', usuario: 'Usuário' };

  var ICONS = {
    'Hoje': '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    'Atividades': '<path d="M17 2l4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>',
    'Eventos': '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    'Inteligência': '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"></path>',
    'Reuniões': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'Planejamento': '<rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 13l2 2 4-4"></path>',
    'Performance': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>',
    'Cockpit': '<path d="M12 20a8 8 0 1 0-8-8"></path><path d="M12 12l4.5-3"></path><circle cx="12" cy="12" r="1.6"></circle>',
    'Glossário': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
    'Riscos': '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4M12 17h.01"></path>',
    'Importar': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5M12 15V3"></path>',
    'Setores': '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
    'Usuários': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'Menu': '<path d="M3 6h18M3 12h18M3 18h18"></path>',
    'Sair': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5M21 12H9"></path>'
  };
  function svg(label, size) {
    var s = size || 20;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[label] || ICONS['Menu']) + '</svg>';
  }
  function ativo(label) {
    var path = window.location.pathname;
    var f = LIVE[label]; /* R4-B2: sem hash — Reunioes e a propria projetos.html */
    return !!f && path.indexOf(f.split('#')[0]) >= 0;
  }
  function podeVer(perfil, label) {
    var mapa = NAV_BY_PERFIL[perfil];
    if (!mapa) { return true; } /* gestor = tudo (mesma regra do guard) */
    return !!mapa[label];
  }
  function initialsOf(name) {
    var s = String(name || '').trim();
    if (!s) { return 'U'; }
    var p = s.split(/\s+/);
    if (p.length === 1) { return p[0].slice(0, 2).toUpperCase(); }
    return (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
  }

  window.Guard.onReady(function (USER) {
    if (document.getElementById('gera-mfab')) { return; }
    var perfil = (USER && USER.perfil) || 'usuario';

    /* ---------- estilos (tokens; só ≤900px; abaixo dos modais z=60) ---------- */
    var css = ''
      + '#gera-mfab,#gera-mdrawer,#gera-mback{display:none}'
      + '@media(max-width:900px){'
      + 'body{padding-bottom:calc(86px + env(safe-area-inset-bottom,0px))}'
      + '.hj-tabbar,.pf-tabbar{display:none !important}' /* mocks estáticas mortas */
      + '#gera-mfab{display:flex;align-items:center;justify-content:center;position:fixed;'
      + 'right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:55;'
      + 'width:54px;height:54px;border-radius:50%;border:0;cursor:pointer;'
      + 'background:var(--cta);color:var(--ctaText);'
      + 'box-shadow:0 10px 26px var(--shadowInk)}'
      + '#gera-mback{position:fixed;inset:0;z-index:57;background:var(--scrim);opacity:0;'
      + 'pointer-events:none;transition:opacity .2s;display:block}'
      + '#gera-mback.on{opacity:1;pointer-events:auto}'
      + '#gera-mdrawer{display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;'
      + 'z-index:58;width:min(80vw,320px);background:var(--sideBg);'
      + 'border-right:1px solid var(--border);transform:translateX(-102%);'
      + 'transition:transform .22s ease;'
      + 'padding:calc(14px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px));'
      + 'box-shadow:14px 0 34px var(--shadowInk)}'
      + '#gera-mdrawer.on{transform:none}'
      + '#gera-mdrawer .gm-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 14px}'
      + '#gera-mdrawer .gm-logo{width:34px;height:34px;border-radius:9px;background:var(--brand);'
      + 'color:var(--onBrand);display:flex;align-items:center;justify-content:center;'
      + 'font-weight:900;font-size:16px}'
      + '#gera-mdrawer .gm-bt{font-size:14px;font-weight:900;letter-spacing:.06em;color:var(--text)}'
      + '#gera-mdrawer .gm-bs{font-size:9.5px;font-weight:800;letter-spacing:.09em;color:var(--muted2)}'
      + '#gera-mdrawer .gm-nav{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}'
      + '#gera-mdrawer .gm-group{font-size:10px;font-weight:900;letter-spacing:.12em;'
      + 'color:var(--muted2);padding:12px 8px 5px}'
      + '#gera-mdrawer .gm-it{display:flex;align-items:center;gap:12px;width:100%;background:none;'
      + 'border:0;border-radius:10px;padding:11px 10px;font:inherit;font-size:14px;font-weight:700;'
      + 'color:var(--muted);cursor:pointer;text-align:left}'
      + '#gera-mdrawer .gm-it.on{color:var(--brand);background:var(--activeBg)}'
      + '#gera-mdrawer .gm-user{display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);'
      + 'padding:12px 8px 4px;margin-top:8px}'
      + '#gera-mdrawer .gm-av{width:34px;height:34px;border-radius:50%;background:var(--s3);'
      + 'color:var(--text);display:flex;align-items:center;justify-content:center;'
      + 'font-size:12px;font-weight:900;flex:none}'
      + '#gera-mdrawer .gm-un{font-size:13px;font-weight:800;color:var(--text);line-height:1.2;'
      + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#gera-mdrawer .gm-up{font-size:10.5px;font-weight:800;letter-spacing:.05em;color:var(--muted2)}'
      + '#gera-mdrawer .gm-sair{color:var(--red);flex:none;background:none;border:0;cursor:pointer;'
      + 'padding:8px;border-radius:9px}'
      + '}';
    var st = document.createElement('style');
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);

    /* ---------- backdrop + drawer ---------- */
    var back = document.createElement('div'); back.id = 'gera-mback';
    var drawer = document.createElement('div'); drawer.id = 'gera-mdrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Menu de navegação');

    function abrir() {
      back.classList.add('on'); drawer.classList.add('on');
      document.body.style.overflow = 'hidden';
    }
    function fechar() {
      back.classList.remove('on'); drawer.classList.remove('on');
      document.body.style.overflow = '';
    }
    back.addEventListener('click', fechar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fechar(); } });

    /* marca (mesma identidade da sidebar) */
    var brand = document.createElement('div'); brand.className = 'gm-brand';
    brand.innerHTML = '<div class="gm-logo">G</div><div style="line-height:1.15">'
      + '<div class="gm-bt">GERA</div><div class="gm-bs">GRAU TÉCNICO FSA</div></div>';
    drawer.appendChild(brand);

    /* navegação agrupada por perfil */
    var nav = document.createElement('nav'); nav.className = 'gm-nav';
    GRUPOS.forEach(function (g) {
      var itens = g[1].filter(function (l) { return !!LIVE[l] && podeVer(perfil, l); });
      if (!itens.length) { return; }
      var gh = document.createElement('div'); gh.className = 'gm-group'; gh.textContent = g[0];
      nav.appendChild(gh);
      itens.forEach(function (l) {
        var it = document.createElement('button');
        it.type = 'button';
        it.className = 'gm-it' + (ativo(l) ? ' on' : '');
        it.innerHTML = svg(l) + '<span></span>';
        it.lastChild.textContent = l;
        it.addEventListener('click', function () {
          fechar();
          if (!ativo(l)) { window.location.href = LIVE[l]; }
        });
        nav.appendChild(it);
      });
    });
    drawer.appendChild(nav);

    /* rodapé: usuário + sair (mesmo comportamento da barra antiga) */
    var uc = document.createElement('div'); uc.className = 'gm-user';
    var av = document.createElement('div'); av.className = 'gm-av';
    av.textContent = (USER && USER.initials) || initialsOf(USER && USER.name);
    uc.appendChild(av);
    var ut = document.createElement('div');
    ut.style.cssText = 'flex:1;min-width:0';
    var un = document.createElement('div'); un.className = 'gm-un'; un.textContent = (USER && USER.name) || 'Usuário';
    var up = document.createElement('div'); up.className = 'gm-up';
    up.textContent = PERFIL_ROTULO[perfil] || (USER && USER.profile) || '';
    ut.appendChild(un); ut.appendChild(up);
    uc.appendChild(ut);
    var sair = document.createElement('button');
    sair.type = 'button'; sair.className = 'gm-sair';
    sair.setAttribute('aria-label', 'Sair'); sair.title = 'Sair';
    sair.innerHTML = svg('Sair');
    sair.addEventListener('click', function () {
      fechar();
      if (window.Guard && window.Guard.signOut) { window.Guard.signOut(); }
    });
    uc.appendChild(sair);
    drawer.appendChild(uc);

    /* botão mãe (FAB) */
    var fab = document.createElement('button');
    fab.type = 'button'; fab.id = 'gera-mfab';
    fab.setAttribute('aria-label', 'Abrir menu');
    fab.title = 'Menu';
    fab.innerHTML = svg('Menu', 24);
    fab.addEventListener('click', abrir);

    document.body.appendChild(back);
    document.body.appendChild(drawer);
    document.body.appendChild(fab);
  });
})();
