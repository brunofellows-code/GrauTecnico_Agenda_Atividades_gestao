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
  var LIVE = { 'Hoje': 'hoje.html', 'Atividades': 'atividades.html', 'Performance': 'performance.html', 'Setores': 'setores.html', 'Usuários': 'usuarios.html' };

  /* ---------- iniciais a partir do nome ---------- */
  function initialsOf(name) {
    var s = String(name || '').trim();
    if (!s) { return 'U'; }
    var parts = s.split(/\s+/);
    if (parts.length === 1) { return parts[0].slice(0, 2).toUpperCase(); }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
    var perfil = (data && data.perfil) || 'Visualizador';
    user = {
      uid: authUser.uid,
      email: (data && data.email) || authUser.email || '',
      nome: nome,
      perfil: perfil,
      /* aliases para UI.sidebar (espera name/profile/initials) */
      name: nome,
      profile: perfil,
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
