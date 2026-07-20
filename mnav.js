/* ============================================================
   GERA · mnav.js — navegação mobile (barra de abas inferior)
   ------------------------------------------------------------
   F1-K: no celular (≤900px) a sidebar some — esta barra é a
   navegação, no padrão universal de app (Todoist/Asana/Linear
   mobile: 4 abas + "Mais"). Desktop: invisível, zero efeito.

   Contratos respeitados:
   - ui.js e components.css INTOCADOS (arquivo novo, estilos
     próprios injetados só com tokens var(--*), zero hex).
   - RBAC ESPELHADO do guard.js (mesmos rótulos LIVE e a mesma
     regra: gestor vê tudo; líder e usuário veem o recorte).
     A borda REAL de escrita continua nas Regras do Firestore —
     isto é só exibição, igual à sidebar.
   - ES5 puro. Sem dependência: se Guard não existir (login),
     não faz nada.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Guard || !window.Guard.onReady) { return; }

  /* mesmos destinos do guard.js (rótulo → arquivo) */
  var LIVE = {
    'Hoje': 'hoje.html', 'Projetos': 'projetos.html', 'Eventos': 'eventos.html',
    'Atividades': 'atividades.html', 'Importar': 'importacao.html',
    'Inteligência': 'inteligencia.html', 'Performance': 'performance.html',
    'Glossário': 'glossario.html', 'Riscos': 'riscos.html',
    'Setores': 'setores.html', 'Usuários': 'usuarios.html'
  };
  /* mesma regra de exibição do guard.js (gestor fora do mapa = vê tudo) */
  var NAV_BY_PERFIL = {
    lider: { 'Hoje': 1, 'Atividades': 1, 'Projetos': 1, 'Eventos': 1, 'Inteligência': 1, 'Performance': 1, 'Glossário': 1 },
    usuario: { 'Hoje': 1, 'Atividades': 1, 'Projetos': 1, 'Eventos': 1, 'Glossário': 1 }
  };
  var ICONS = {
    'Hoje': '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    'Atividades': '<path d="M17 2l4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>',
    'Eventos': '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    'Inteligência': '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"></path>',
    'Projetos': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    'Performance': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>',
    'Glossário': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
    'Riscos': '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4M12 17h.01"></path>',
    'Importar': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5M12 15V3"></path>',
    'Setores': '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
    'Usuários': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'Mais': '<circle cx="5" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="19" cy="12" r="1.6"></circle>'
  };
  function svg(label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[label] || ICONS['Mais']) + '</svg>';
  }
  function ativo(label) {
    var f = LIVE[label];
    return !!f && window.location.pathname.indexOf(f.split('#')[0]) >= 0;
  }
  function podeVer(perfil, label) {
    var mapa = NAV_BY_PERFIL[perfil];
    if (!mapa) { return true; } /* gestor = tudo (mesma regra do guard) */
    return !!mapa[label];
  }

  window.Guard.onReady(function (USER) {
    if (document.getElementById('gera-mnav')) { return; }
    var perfil = (USER && USER.perfil) || 'usuario';

    /* abas fixas (4 + Mais); usuário não vê Inteligência → entra Projetos */
    var primarios = ['Hoje', 'Atividades', 'Eventos', 'Inteligência'].filter(function (l) { return podeVer(perfil, l); });
    if (primarios.length < 4) {
      ['Projetos', 'Glossário', 'Performance'].forEach(function (l) {
        if (primarios.length < 4 && podeVer(perfil, l) && primarios.indexOf(l) === -1) { primarios.push(l); }
      });
    }
    var todos = Object.keys(LIVE).filter(function (l) { return podeVer(perfil, l); });
    var extras = todos.filter(function (l) { return primarios.indexOf(l) === -1; });

    /* ---------- estilos (tokens; só ≤900px; abaixo dos modais z=60) ---------- */
    var css = ''
      + '#gera-mnav{display:none}'
      + '#gera-msheet,#gera-msback{display:none}'
      + '@media(max-width:900px){'
      + 'body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}'
      + '#gera-mnav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:55;'
      + 'background:var(--s1);border-top:1px solid var(--border);'
      + 'padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));'
      + 'box-shadow:0 -6px 18px rgba(0,0,0,.25)}'
      + '#gera-mnav .mn-b{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;'
      + 'background:none;border:0;padding:4px 2px;font:inherit;font-size:10px;font-weight:800;'
      + 'letter-spacing:.01em;color:var(--muted2);cursor:pointer;border-radius:10px}'
      + '#gera-mnav .mn-b.on{color:var(--brand)}'
      + '#gera-msback.on{display:block;position:fixed;inset:0;z-index:56;background:rgba(0,0,0,.45)}'
      + '#gera-msheet.on{display:block;position:fixed;left:0;right:0;bottom:0;z-index:57;'
      + 'background:var(--s1);border-top:1px solid var(--border);border-radius:16px 16px 0 0;'
      + 'padding:10px 14px calc(16px + env(safe-area-inset-bottom,0px));'
      + 'box-shadow:0 -10px 30px rgba(0,0,0,.35)}'
      + '#gera-msheet .ms-grab{width:38px;height:4px;border-radius:3px;background:var(--border);margin:2px auto 10px}'
      + '#gera-msheet .ms-it{display:flex;align-items:center;gap:12px;width:100%;background:none;border:0;'
      + 'padding:12px 6px;font:inherit;font-size:14px;font-weight:700;color:var(--text);cursor:pointer;'
      + 'border-top:1px solid var(--border);text-align:left}'
      + '#gera-msheet .ms-it:first-of-type{border-top:0}'
      + '#gera-msheet .ms-it.on{color:var(--brand)}'
      + '#gera-msheet .ms-sair{color:var(--red)}'
      + '}';
    var st = document.createElement('style');
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);

    /* ---------- sheet "Mais" ---------- */
    var back = document.createElement('div'); back.id = 'gera-msback';
    var sheet = document.createElement('div'); sheet.id = 'gera-msheet';
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Mais telas');
    function fechaSheet() { back.classList.remove('on'); sheet.classList.remove('on'); }
    back.addEventListener('click', fechaSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fechaSheet(); } });
    var grab = document.createElement('div'); grab.className = 'ms-grab'; sheet.appendChild(grab);
    extras.forEach(function (l) {
      var it = document.createElement('button');
      it.type = 'button'; it.className = 'ms-it' + (ativo(l) ? ' on' : '');
      it.innerHTML = svg(l) + '<span></span>';
      it.lastChild.textContent = l;
      it.addEventListener('click', function () {
        fechaSheet();
        if (!ativo(l)) { window.location.href = LIVE[l]; }
      });
      sheet.appendChild(it);
    });
    var sair = document.createElement('button');
    sair.type = 'button'; sair.className = 'ms-it ms-sair';
    sair.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5M21 12H9"></path></svg><span></span>';
    sair.lastChild.textContent = 'Sair';
    sair.addEventListener('click', function () {
      fechaSheet();
      if (window.Guard && window.Guard.signOut) { window.Guard.signOut(); }
    });
    sheet.appendChild(sair);

    /* ---------- barra ---------- */
    var bar = document.createElement('nav');
    bar.id = 'gera-mnav';
    bar.setAttribute('aria-label', 'Navegação principal (celular)');
    primarios.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mn-b' + (ativo(l) ? ' on' : '');
      b.innerHTML = svg(l) + '<span></span>';
      b.lastChild.textContent = l === 'Inteligência' ? 'Intel.' : (l === 'Atividades' ? 'Ativid.' : l);
      b.setAttribute('aria-label', l);
      b.addEventListener('click', function () { if (!ativo(l)) { window.location.href = LIVE[l]; } });
      bar.appendChild(b);
    });
    var mais = document.createElement('button');
    mais.type = 'button'; mais.className = 'mn-b';
    mais.innerHTML = svg('Mais') + '<span></span>';
    mais.lastChild.textContent = 'Mais';
    mais.setAttribute('aria-label', 'Mais telas');
    mais.addEventListener('click', function () { back.classList.add('on'); sheet.classList.add('on'); });
    bar.appendChild(mais);

    document.body.appendChild(back);
    document.body.appendChild(sheet);
    document.body.appendChild(bar);
  });
})();
