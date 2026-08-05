/* ============================================================
   guard.js · Sistema A — Grau Técnico FSA  (Fase 1)
   ------------------------------------------------------------
   Trava de sessão COMPARTILHADA por todas as telas internas.
   Carregar SEMPRE como script CLÁSSICO no <head>, logo após
   theme.js e ANTES do <script> da tela:

     <script src="theme.js"></script>
     <script src="guard.js"></script>

   O que faz:
   1) Esconde a tela atrás de um "portão" (#graut-gate) até decidir.
   2) onAuthStateChanged:
        - sem usuário        -> manda pro login (replace).
        - usuário logado      -> lê usuarios/{uid} no Firestore.
            * existe e ativo:true -> LIBERA: publica USER real e
              chama os callbacks registrados por Guard.onReady.
            * senão               -> NEGA: signOut + mensagem.
        - erro de leitura (regras/rede) -> NEGA com mensagem honesta.
   3) Liga a navegação da sidebar (UI.sidebar) e o botão Sair.

   Observação de arquitetura: este arquivo é script clássico, mas o
   Firebase é ESM (módulo). Por isso o SDK entra por import()
   DINÂMICO — que funciona dentro de script clássico — em vez de
   import estático. firebase.js é módulo singleton: reimportar a
   mesma URL devolve o módulo já carregado (sem recriar o app).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- estado interno ---------- */
  var ready = false;      /* acesso liberado? */
  var settled = false;    /* já tomei a decisão terminal? (evita reentrância) */
  var user = null;        /* objeto USER publicado às telas */
  var queue = [];         /* callbacks de Guard.onReady aguardando liberação */
  var authMod = null;     /* módulo firebase-auth (guardado p/ signOut) */
  var authRef = null;     /* instância auth */

  /* destinos LIVE (telas que já existem no repo do Grau).
     Qualquer item da sidebar fora desta lista mostra "em breve". */
  var LIVE = { 'Hoje': 'hoje.html', 'Reuniões': 'projetos.html', 'Planejamento': 'planejamento.html', 'Eventos': 'eventos.html', 'Atividades': 'atividades.html', 'Importar': 'importacao.html', 'Inteligência': 'inteligencia.html', 'Performance': 'performance.html', 'Glossário': 'glossario.html', 'Riscos': 'riscos.html', 'Setores': 'setores.html', 'Usuários': 'usuarios.html' };

  /* Fase 1 RBAC — nav visível por PERFIL (papel novo). Rótulos = data-nav (iguais
     ao LIVE). 'gestor' NÃO entra no mapa => vê tudo. Recorte é por EXIBIÇÃO
     (Caminho C): a borda de escrita real fica nas Regras do Firestore. */
  /* 'Riscos' liberado ao lider: no Modelo das Três Linhas (IIA, 2020) a PRIMEIRA LINHA
     — a gestão operacional — É a dona do risco e de quem executa a mitigação. Esconder a
     matriz de quem responde por ela é o oposto do modelo, e aqui era contradição interna:
     o planejamento já sugere ao líder os riscos do setor dele, então o líder já lê esse
     conteúdo — só não conseguia chegar à matriz pelo menu. 'usuario' segue fora: não é
     dono de risco (a tela é leitura da matriz do manual; a borda real fica nas Regras). */
  var NAV_BY_PERFIL = {
    lider:   { 'Hoje': 1, 'Atividades': 1, 'Reuniões': 1, 'Planejamento': 1, 'Eventos': 1, 'Inteligência': 1, 'Performance': 1, 'Riscos': 1, 'Glossário': 1 },
    usuario: { 'Hoje': 1, 'Atividades': 1, 'Planejamento': 1, 'Eventos': 1, 'Glossário': 1 }
  };

  /* ---------- iniciais a partir do nome ---------- */
  function initialsOf(name) {
    var s = String(name || '').trim();
    if (!s) { return 'U'; }
    var parts = s.split(/\s+/);
    if (parts.length === 1) { return parts[0].slice(0, 2).toUpperCase(); }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /* ---------- perfil (Fase 1 RBAC) ----------
     normalizePerfil: valor do doc -> PAPEL novo (gestor|lider|usuario).
       Legados: Admin->gestor · Editor->lider · demais->usuario.
     capabilityOf: papel -> tier de CAPACIDADE legado (Admin|Editor|Visualizador)
       que as telas já existentes checam via USER.profile. Assim o RBAC troca o
       MODELO sem reescrever as 7 telas que gateiam por 'Admin'/'Editor'
       (patch cirúrgico + não-regressivo; a borda de escrita real segue nas Regras). */
  function normalizePerfil(raw) {
    var p = String(raw || '').trim();
    if (p === 'gestor' || p === 'lider' || p === 'usuario') { return p; }
    if (p === 'Admin') { return 'gestor'; }
    if (p === 'Editor') { return 'lider'; }
    return 'usuario';
  }
  function capabilityOf(perfil) {
    if (perfil === 'gestor') { return 'Admin'; }
    if (perfil === 'lider') { return 'Editor'; }
    return 'Visualizador';
  }

  /* ============================================================
     PORTÃO (gate) — cobre a tela até a decisão de acesso
     O markup estático já está em cada tela (#graut-gate). Aqui só
     controlamos: liberar (remover) ou mostrar mensagem de bloqueio.
     ============================================================ */
  function gate() { return document.getElementById('graut-gate'); }

  function hideGate() {
    var g = gate();
    if (g && g.parentNode) { g.parentNode.removeChild(g); }
    document.documentElement.classList.add('graut-ok');
  }

  /* troca o portão para modo "mensagem" (bloqueio/erro) com um botão
     opcional. Não redireciona sozinho — a mensagem precisa ser lida. */
  function gateMessage(titulo, texto, botaoLabel, botaoFn) {
    var g = gate();
    if (!g) { /* sem portão nesta página: ao menos não deixa conteúdo aberto */ return; }
    g.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'graut-gate__box';
    var t = document.createElement('div');
    t.className = 'graut-gate__title';
    t.textContent = titulo;
    var p = document.createElement('p');
    p.className = 'graut-gate__msg';
    p.textContent = texto;
    box.appendChild(t);
    box.appendChild(p);
    if (botaoLabel) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'graut-gate__btn';
      b.textContent = botaoLabel;
      b.addEventListener('click', botaoFn || function () {});
      box.appendChild(b);
    }
    g.appendChild(box);
  }

  /* ============================================================
     TOAST simples (usado pelos itens "em breve" da navegação)
     ============================================================ */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('graut-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'graut-toast';
      el.className = 'graut-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    /* reflow p/ reiniciar a animação se já estava visível */
    void el.offsetWidth;
    el.classList.add('on');
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  /* ============================================================
     CHROME — liga navegação da sidebar + botão Sair (idempotente)
     Chamado após os callbacks construírem a sidebar no DOM.
     ============================================================ */
  function wireChrome() {
    /* injeta o item "Eventos" na sidebar (ui.js é APPEND-ONLY: o array de
       grupos fica no meio do arquivo; a navegação já é responsabilidade
       deste arquivo via LIVE). Idempotente. */
    (function injectEventos() {
      if (document.querySelector('.ui-nav[data-nav="Eventos"]')) { return; }
      var ref = document.querySelector('.ui-nav[data-nav="Atividades"]');
      if (!ref || !ref.parentNode) { return; }
      var item = document.createElement('div');
      var ativo = window.location.pathname.indexOf('eventos.html') >= 0;
      item.className = 'ui-nav' + (ativo ? ' active' : '');
      item.setAttribute('data-nav', 'Eventos');
      item.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg><span>Eventos</span>';
      ref.parentNode.insertBefore(item, ref.nextSibling);
    })();
    /* F1-E (B5) + R4·B2: injeta "Reuniões" na sidebar. Âncora = item base
       "Projetos" do ui.js (append-only — não dá para removê-lo lá); a poda
       por LIVE (abaixo) remove o "Projetos" logo em seguida e "Reuniões"
       assume o lugar dele. Destino = projetos.html (a tela agora É a casa
       da reunião — "Projeto" não existe). Idempotente.                  */
    (function injectReunioes() {
      if (document.querySelector('.ui-nav[data-nav="Reuniões"]')) { return; }
      var ref = document.querySelector('.ui-nav[data-nav="Projetos"]');
      if (!ref || !ref.parentNode) { return; }
      var item = document.createElement('div');
      var ativo = window.location.pathname.indexOf('projetos.html') >= 0;
      item.className = 'ui-nav' + (ativo ? ' active' : '');
      item.setAttribute('data-nav', 'Reuniões');
      item.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Reuniões</span>';
      ref.parentNode.insertBefore(item, ref.nextSibling);
    })();
    /* R4·B3: injeta "Planejamento" logo após "Reuniões" (injetada acima —
       a âncora sempre existe neste ponto). Visível a TODOS os perfis:
       o Planejamento do Setor é prestação de contas pública (RESUMO §4).
       Idempotente. */
    (function injectPlanejamento() {
      if (document.querySelector('.ui-nav[data-nav="Planejamento"]')) { return; }
      var ref = document.querySelector('.ui-nav[data-nav="Reuniões"]');
      if (!ref || !ref.parentNode) { return; }
      var item = document.createElement('div');
      var ativo = window.location.pathname.indexOf('planejamento.html') >= 0;
      item.className = 'ui-nav' + (ativo ? ' active' : '');
      item.setAttribute('data-nav', 'Planejamento');
      item.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 13l2 2 4-4"></path></svg><span>Planejamento</span>';
      ref.parentNode.insertBefore(item, ref.nextSibling);
    })();
    /* C2: injeta "Glossário" e "Riscos" depois de Performance (mesma regra
       do Eventos — ui.js append-only; navegação mora aqui). Idempotente. */
    (function injectC2() {
      var ref = document.querySelector('.ui-nav[data-nav="Performance"]');
      if (!ref || !ref.parentNode) { return; }
      var defs = [
        ['Glossário', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>'],
        ['Riscos', '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><path d="M12 9v4M12 17h.01"></path>']
      ];
      var after = ref;
      defs.forEach(function (d) {
        if (document.querySelector('.ui-nav[data-nav="' + d[0] + '"]')) { return; }
        var item = document.createElement('div');
        var ativo = window.location.pathname.indexOf(LIVE[d[0]]) >= 0;
        item.className = 'ui-nav' + (ativo ? ' active' : '');
        item.setAttribute('data-nav', d[0]);
        item.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d[1] + '</svg><span>' + d[0] + '</span>';
        after.parentNode.insertBefore(item, after.nextSibling);
        after = item;
      });
    })();
    /* itens de navegação: data-nav = rótulo */
    var navs = document.querySelectorAll('.ui-nav[data-nav]');
    Array.prototype.forEach.call(navs, function (item) {
      if (item.__grautWired) { return; }
      item.__grautWired = true;
      var label = item.getAttribute('data-nav');
      item.style.cursor = 'pointer';
      item.setAttribute('role', 'link');
      item.setAttribute('tabindex', '0');
      var go = function () {
        var href = LIVE[label];
        if (href) {
          if (item.classList.contains('active')) { return; } /* já estou aqui */
          window.location.href = href;
        } else {
          toast('“' + label + '” — em breve.');
        }
      };
      item.addEventListener('click', go);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });

    /* botão Sair: o ícone de logout é o último filho do cartão de usuário */
    var card = document.querySelector('.ui-usercard');
    if (card && !card.__grautWired) {
      card.__grautWired = true;
      var out = card.lastElementChild;
      if (out) {
        out.style.cursor = 'pointer';
        out.setAttribute('role', 'button');
        out.setAttribute('tabindex', '0');
        out.setAttribute('aria-label', 'Sair');
        out.setAttribute('title', 'Sair');
        var doOut = function () { confirmLogout(); };
        out.addEventListener('click', doOut);
        out.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doOut(); }
        });
      }
    }

    /* ---- F1-D(D2): remove itens de navegação SEM destino ----
       `ui.js` é append-only e o array de grupos da sidebar vive no meio do
       arquivo — por isso a poda acontece aqui, onde a navegação já mora.
       Regra: item que não está em LIVE não tem tela; item que clica e não
       responde ensina que o sistema falha (pior que a ausência). Quando a
       tela nascer, basta entrar em LIVE e o item volta sozinho. Idempotente. */
    (function podarSemDestino() {
      var itens = document.querySelectorAll('.ui-nav[data-nav]');
      Array.prototype.forEach.call(itens, function (it) {
        var label = it.getAttribute('data-nav');
        if (!LIVE[label] && it.parentNode) { it.parentNode.removeChild(it); }
      });
    })();

    /* ---- recorte de navegação por perfil (Fase 1 RBAC · exibição) ----
       Remove da sidebar os itens fora do conjunto do perfil. Idempotente.
       'gestor' não está no NAV_BY_PERFIL => nada é removido (vê tudo). */
    (function filtrarNav() {
      var perf = (user && user.perfil) || 'usuario';
      var permit = NAV_BY_PERFIL[perf];
      if (!permit) { return; }
      var itens = document.querySelectorAll('.ui-nav[data-nav]');
      Array.prototype.forEach.call(itens, function (it) {
        var label = it.getAttribute('data-nav');
        if (!permit[label] && it.parentNode) { it.parentNode.removeChild(it); }
      });
    })();
  }

  /* confirmação de saída — usa UI.modal se disponível (mesmo padrão
     do resto do sistema); senão, cai num confirm() nativo. */
  function confirmLogout() {
    if (window.UI && typeof window.UI.modal === 'function' && typeof window.UI.button === 'function') {
      window.UI.modal({
        title: 'Sair do sistema',
        width: 380,
        body: function () {
          var p = document.createElement('p');
          p.setAttribute('style', 'margin:0;color:var(--muted);font-size:14px;line-height:1.55');
          p.textContent = 'Quer encerrar a sessão? Você precisará entrar de novo com e-mail e senha.';
          return p;
        },
        footer: function (close) {
          var cancel = window.UI.button({ label: 'Cancelar', variant: 'ghost', onClick: close });
          var sair = window.UI.button({ label: 'Sair', icon: 'logout', onClick: function () { close(); Guard.signOut(); } });
          return [cancel, sair];
        }
      });
    } else if (window.confirm('Encerrar a sessão?')) {
      Guard.signOut();
    }
  }

  /* ============================================================
     DECISÕES DE ACESSO
     ============================================================ */
  function grant(authUser, data) {
    var nome = (data && data.nome) || (data && data.email) || authUser.email || 'Usuário';
    var perfilRaw = (data && data.perfil) || 'Visualizador';
    var perfil = normalizePerfil(perfilRaw);            /* papel: gestor|lider|usuario */
    var setoresLid = (data && Array.isArray(data.setoresLiderados)) ? data.setoresLiderados.slice() : [];
    var setorU = (data && data.setor) ? String(data.setor) : '';   /* F1-C: setor de lotação (âncora p/ calendário/eventos do usuário) */
    /* R4-EXT: sócio = gestor com o marcador socio:true no doc (RESUMO: sócio-gestor
       não é perfil novo — é gestor + lente). Assina a 2ª alçada (>R$200). */
    var isSocioFlag = (perfil === 'gestor') && !!(data && data.socio === true);
    user = {
      uid: authUser.uid,
      email: (data && data.email) || authUser.email || '',
      nome: nome,
      perfil: perfil,                 /* papel novo — código novo (nav; escopo na Fase 1-B) */
      perfilRaw: perfilRaw,           /* valor cru do doc (pode ser legado) */
      setoresLiderados: setoresLid,   /* siglas que o Líder lidera */
      setor: setorU,                  /* F1-C: sigla do setor do usuário ('' se não definido/legado) */
      socio: isSocioFlag,             /* R4-EXT: assina alçada como sócio */
      /* aliases para UI.sidebar + telas existentes (espera name/profile/initials).
         profile = tier de CAPACIDADE legado (Admin|Editor|Visualizador): as telas
         que checam 'Admin'/'Editor' seguem funcionando sem tocar nelas. */
      name: nome,
      profile: capabilityOf(perfil),
      initials: initialsOf(nome)
    };
    window.GRAUT_USER = user;
    ready = true;
    settled = true;

    /* 1) telas constroem a UI com o usuário real */
    var cbs = queue.slice();
    queue.length = 0;
    cbs.forEach(function (cb) { try { cb(user); } catch (e) { /* não derruba o resto */ } });

    /* 2) liga navegação/Sair na sidebar recém-construída */
    wireChrome();

    /* 3) revela a tela */
    hideGate();
  }

  function deny(titulo, texto) {
    settled = true;
    /* desloga (silencioso) e mostra a mensagem com volta ao login */
    var fin = function () {
      gateMessage(titulo, texto, 'Voltar ao login', function () { window.location.replace('login.html'); });
    };
    if (authMod && authRef) { authMod.signOut(authRef).then(fin).catch(fin); }
    else { fin(); }
  }

  function goLogin() {
    settled = true;
    window.location.replace('login.html');
  }

  /* ============================================================
     API pública
     ============================================================ */
  var Guard = {
    /* registra callback chamado COM o USER quando o acesso é liberado.
       Se já estiver liberado, chama na hora. */
    onReady: function (cb) {
      if (typeof cb !== 'function') { return; }
      if (ready) { cb(user); } else { queue.push(cb); }
    },
    get user() { return user; },
    isReady: function () { return ready; },
    /* F1-D(D3): fonte ÚNICA de visibilidade de navegação — a mesma tabela que
       recorta a sidebar decide os cards da home. Evita a divergência entre as
       duas superfícies (foi exatamente o bug do index "Em breve").
       PURO e testável. Perfil desconhecido/ausente => true (fail-open: mantém
       o comportamento de hoje; o bloqueio real é da rule do Firestore). */
    podeVer: function (label, perfil) {
      var permit = NAV_BY_PERFIL[perfil || (user && user.perfil)];
      if (!permit) { return true; }
      return !!permit[label];
    },
    isGestor: function () { return !!user && user.perfil === 'gestor'; },
    isLider: function () { return !!user && user.perfil === 'lider'; },
    isSocio: function () { return !!user && user.socio === true; },
    isUsuario: function () { return !!user && user.perfil === 'usuario'; },
    signOut: function () {
      settled = true;
      var done = function () { window.location.replace('login.html'); };
      if (authMod && authRef) { authMod.signOut(authRef).then(done).catch(done); }
      else { done(); }
    },
    toast: toast
  };
  window.Guard = Guard;

  /* ============================================================
     BOOT — carrega o SDK e roda a verificação uma única vez
     ============================================================ */
  Promise.all([
    import('./firebase.js'),
    import('https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js')
  ]).then(function (mods) {
    var fb = mods[0];       /* { app, auth, db } */
    authMod = mods[1];      /* firebase-auth */
    var fs = mods[2];       /* firebase-firestore */
    authRef = fb.auth;
    var db = fb.db;

    var handled = false;    /* age só no primeiro estado relevante */
    authMod.onAuthStateChanged(authRef, function (u) {
      if (handled || settled) { return; }
      handled = true;

      if (!u) { goLogin(); return; }

      fs.getDoc(fs.doc(db, 'usuarios', u.uid)).then(function (snap) {
        if (snap.exists()) {
          var d = snap.data() || {};
          if (d.ativo === true) {
            grant(u, d);
          } else {
            deny('Acesso desativado', 'Sua conta existe, mas está desativada. Procure um administrador para reativá-la.');
          }
        } else {
          deny('Acesso não liberado', 'Você ainda não tem acesso a este sistema. Peça a um administrador para cadastrar seu usuário.');
        }
      }).catch(function (e) {
        /* permission-denied (regras ainda não publicadas) ou rede */
        if (window.console && console.error) { console.error('[guard] falha ao ler usuarios/' + u.uid, e); }
        deny('Não foi possível verificar seu acesso',
          'Tentei conferir suas permissões e não consegui agora. Verifique sua conexão e tente de novo; se persistir, avise o administrador.');
      });
    });
  }).catch(function (e) {
    if (window.console && console.error) { console.error('[guard] falha ao carregar o Firebase', e); }
    gateMessage('Falha ao iniciar',
      'Não consegui carregar os componentes de acesso. Atualize a página; se continuar, verifique a conexão.',
      'Tentar de novo', function () { window.location.reload(); });
  });
})();
