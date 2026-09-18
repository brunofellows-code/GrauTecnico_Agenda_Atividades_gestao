/* ============================================================
   busca.js — BUSCA ÚNICA (⌘K / Ctrl+K) · Sistema A · Grau Técnico FSA
   ------------------------------------------------------------
   18/09/2026. Padrão de mercado (a barra de comando do Akiflow, o ⌘K do
   Linear/Notion): achar QUALQUER coisa do sistema em dois segundos, sem
   lembrar em que aba ela mora.

   O QUE PROCURA: atividades, itens do plano do mês, reuniões, eventos da
   agenda e pessoas. Cada resultado abre a tela certa, no lugar certo.

   RECORTE POR PERFIL (ESTADO §9-b — a mesma regra de todas as telas):
     gestor/sócio  → a unidade inteira
     líder         → os setores que lidera + o que é dele
     usuário       → só o que é dele ou do setor onde está lotado
   O recorte é aplicado AQUI, na montagem do índice; a busca nunca mostra o
   que a tela de origem não mostraria.

   CUSTO DE LEITURA: o índice é montado UMA vez por aba (guardado em
   sessionStorage por 30 min) e só quando a pessoa abre a busca. Quem nunca
   usar não paga leitura nenhuma. São ~5 consultas curtas, com teto.

   ES5 puro. Sem dependência. Carregado depois do guard.js.
   ============================================================ */
(function (w, d) {
  'use strict';

  var CACHE_MS = 30 * 60 * 1000;
  var CHAVE_CACHE = 'gera_busca_indice';
  var TETO = { atividades: 400, planejamentos: 40, reunioes: 60, eventos: 60, usuarios: 200 };

  var INDICE = null, CARREGANDO = false, ABERTO = false, SEL = 0, RESULTADOS = [];
  var caixa = null, campo = null, lista = null, rodape = null;

  /* ---------- Firestore (mesmo padrão das telas) ---------- */
  var _fb = null;
  function fb() {
    if (!_fb) {
      _fb = Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js')
      ]).then(function (m) { return { db: m[0].db, f: m[1] }; });
    }
    return _fb;
  }

  function user() { return (w.Guard && w.Guard.user) || null; }
  function perfil() { var u = user(); return (u && u.perfil) || 'usuario'; }
  function uid() { var u = user(); return (u && u.uid) || ''; }
  function meusSetores() {
    var u = user(), m = {};
    ((u && u.setoresLiderados) || []).forEach(function (s) { if (s) { m[s] = true; } });
    return m;
  }
  function meuSetor() { var u = user(); return (u && u.setor) || ''; }
  function ehGestor() { return perfil() === 'gestor'; }
  function ehLider() { return perfil() === 'lider'; }

  /* ---------- recorte por perfil ---------- */
  function setorVisivel(sig) {
    if (!sig) { return true; }
    if (ehGestor()) { return true; }
    if (ehLider() && meusSetores()[sig]) { return true; }
    return sig === meuSetor();
  }
  function meuUid(x) { return x && x === uid(); }

  /* ---------- montagem do índice ---------- */
  function mapDocs(sn) { var a = []; sn.forEach(function (x) { a.push(Object.assign({ id: x.id }, x.data())); }); return a; }

  function lerCache() {
    try {
      var cru = w.sessionStorage.getItem(CHAVE_CACHE);
      if (!cru) { return null; }
      var o = JSON.parse(cru);
      if (!o || o.uid !== uid() || (Date.now() - o.em) > CACHE_MS) { return null; }
      return o.itens;
    } catch (e) { return null; }
  }
  function gravarCache(itens) {
    try { w.sessionStorage.setItem(CHAVE_CACHE, JSON.stringify({ uid: uid(), em: Date.now(), itens: itens })); }
    catch (e) { /* sem sessionStorage: a busca segue, só relê na próxima abertura */ }
  }

  function compAtual() { var h = new Date(); var m = h.getMonth() + 1; return h.getFullYear() + '-' + (m < 10 ? '0' + m : m); }
  function compShift(c, n) {
    var y = parseInt(c.slice(0, 4), 10), m = parseInt(c.slice(5, 7), 10) + n;
    y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1;
    return y + '-' + (m < 10 ? '0' + m : m);
  }

  function montarIndice() {
    var doCache = lerCache();
    if (doCache) { INDICE = doCache; return Promise.resolve(INDICE); }
    if (CARREGANDO) { return CARREGANDO; }
    CARREGANDO = fb().then(function (c) {
      var f = c.f, db = c.db, comps = [compShift(compAtual(), -1), compAtual(), compShift(compAtual(), 1)];
      function seguro(p) { return p.catch(function () { return []; }); }
      return Promise.all([
        seguro(f.getDocs(f.query(f.collection(db, 'atividades'), f.where('ativo', '==', true), f.limit(TETO.atividades))).then(mapDocs)),
        seguro(f.getDocs(f.query(f.collection(db, 'planejamentos'), f.where('competencia', 'in', comps), f.limit(TETO.planejamentos))).then(mapDocs)),
        seguro(f.getDocs(f.query(f.collection(db, 'reunioes'), f.limit(TETO.reunioes))).then(mapDocs)),
        seguro(f.getDocs(f.query(f.collection(db, 'eventos'), f.limit(TETO.eventos))).then(mapDocs)),
        seguro(f.getDocs(f.query(f.collection(db, 'usuarios'), f.where('ativo', '==', true), f.limit(TETO.usuarios))).then(mapDocs))
      ]).then(function (r) {
        var itens = [];
        /* atividades */
        (r[0] || []).forEach(function (a) {
          if (!a || a.ativo === false) { return; }
          var sig = a.setorSigla || '';
          if (!setorVisivel(sig) && !meuUid(a.responsavelUid)) { return; }
          itens.push({ t: 'Atividade', txt: a.titulo || '', sub: (sig ? sig + ' · ' : '') + (a.responsavelNome || 'sem dono'), url: 'atividades.html', chave: a.id });
        });
        /* itens do plano */
        (r[1] || []).forEach(function (p) {
          if (!p || p.ativo === false) { return; }
          var sig = p.setorSigla || '';
          ((p.itens) || []).forEach(function (it) {
            if (!it || it.removido) { return; }
            if (!setorVisivel(sig) && !meuUid(it.quemUid)) { return; }
            itens.push({
              t: 'Plano', txt: it.oque || '', sub: sig + ' · ' + (p.competencia || '') + (it.quemNome ? ' · ' + it.quemNome : ''),
              url: 'planejamento.html?setor=' + encodeURIComponent(sig) + '&comp=' + encodeURIComponent(p.competencia || '') + '&item=' + encodeURIComponent(it.id || ''), chave: it.id
            });
          });
        });
        /* reuniões */
        (r[2] || []).forEach(function (m) {
          if (!m || m.ativo === false) { return; }
          var convocado = ((m.convocadosUids) || []).indexOf(uid()) >= 0;
          if (!ehGestor() && !convocado && !setorVisivel(m.setorSigla || '')) { return; }
          itens.push({ t: 'Reunião', txt: m.titulo || 'Reunião', sub: (m.data || '') + (m.horaPrevista ? ' às ' + m.horaPrevista : '') + (m.setorSigla ? ' · ' + m.setorSigla : ''), url: 'projetos.html?r=' + encodeURIComponent(m.id), chave: m.id });
        });
        /* eventos da agenda */
        (r[3] || []).forEach(function (e) {
          if (!e || e.ativo === false) { return; }
          var convidado = ((e.convidadosUids) || (e.convocadosUids) || []).indexOf(uid()) >= 0;
          if (!ehGestor() && !convidado && !setorVisivel(e.siglaSetor || e.setorSigla || '')) { return; }
          itens.push({ t: 'Agenda', txt: e.titulo || '', sub: (e.data || '') + (e.hora ? ' às ' + e.hora : '') + (e.local ? ' · ' + e.local : ''), url: 'eventos.html', chave: e.id });
        });
        /* pessoas — gestor vê a unidade; líder vê a equipe DELE (ESTADO §9-b: o líder só vê o setor dele).
           O perfil comum não entra: ele não tem tela de pessoas. */
        if (ehGestor() || ehLider()) {
          (r[4] || []).forEach(function (u2) {
            if (!u2) { return; }
            if (!ehGestor() && !setorVisivel(u2.setor || '') && !((u2.setoresLiderados || []).some(function (sg) { return meusSetores()[sg]; }))) { return; }
            itens.push({ t: 'Pessoa', txt: u2.nome || '', sub: (u2.perfil || '') + (u2.setor ? ' · ' + u2.setor : ''), url: ehGestor() ? 'usuarios.html' : 'performance.html', chave: u2.id });
          });
        }
        itens.forEach(function (x) { x.k = norm(x.txt + ' ' + x.sub); });
        INDICE = itens; gravarCache(itens); CARREGANDO = false;
        return itens;
      });
    }).catch(function (e) {
      CARREGANDO = false; INDICE = [];
      erro((e && e.code === 'permission-denied') ? 'Sem permissão para ler tudo — a busca mostra só o que o seu perfil já vê.' : 'Não consegui montar a busca agora.');
      return [];
    });
    return CARREGANDO;
  }

  /* ---------- casamento ---------- */
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[áàâã]/g, 'a').replace(/[éê]/g, 'e').replace(/í/g, 'i')
      .replace(/[óôõ]/g, 'o').replace(/[úü]/g, 'u').replace(/ç/g, 'c');
  }
  function buscar(q) {
    var termos = norm(q).split(/\s+/).filter(Boolean);
    if (!termos.length) { return []; }
    var out = [];
    (INDICE || []).forEach(function (x) {
      var pontos = 0, i;
      for (i = 0; i < termos.length; i++) {
        var p = x.k.indexOf(termos[i]);
        if (p < 0) { return; }
        pontos += (p === 0 ? 3 : 1);
      }
      out.push({ x: x, p: pontos });
    });
    out.sort(function (a, b) { return b.p - a.p || a.x.txt.localeCompare(b.x.txt, 'pt-BR'); });
    return out.slice(0, 20).map(function (o) { return o.x; });
  }

  /* ---------- tela ---------- */
  function el(html) { var t = d.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function txt(tag, cls, s) { var e = d.createElement(tag); if (cls) { e.className = cls; } e.textContent = s == null ? '' : s; return e; }
  function erro(msg) { if (rodape) { rodape.textContent = msg; } }

  function montarTela() {
    if (caixa) { return; }
    var css = d.createElement('style');
    css.textContent = ''
      + '.bsc-ov{position:fixed;inset:0;z-index:9000;background:rgba(2,6,23,.55);display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 16px}'
      + '.bsc-ov[hidden]{display:none}'   /* display:flex anula o atributo hidden: sem esta linha a busca nasce aberta */
      + '.bsc{width:100%;max-width:620px;background:var(--s1);border:1px solid var(--border);border-radius:14px;box-shadow:var(--cardShadow,0 16px 50px rgba(2,6,23,.28));overflow:hidden;display:flex;flex-direction:column;max-height:70vh}'
      + '.bsc-in{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid var(--border)}'
      + '.bsc-in input{flex:1;min-width:0;font:inherit;font-size:16px;font-weight:600;background:transparent;border:0;color:var(--text);outline:none}'
      + '.bsc-in .lupa{font-size:15px;color:var(--muted)}'
      + '.bsc-in .esc{font-size:11px;font-weight:800;color:var(--muted2Text,var(--muted2));border:1px solid var(--border);border-radius:6px;padding:2px 6px}'
      + '.bsc-l{overflow:auto;padding:6px}'
      + '.bsc-r{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;cursor:pointer;border:0;background:transparent;width:100%;text-align:left;font-family:inherit}'
      + '.bsc-r.on,.bsc-r:hover{background:var(--activeBg)}'
      + '.bsc-r .tp{flex:none;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accentText);width:66px}'
      + '.bsc-r .tt{flex:1;min-width:0}'
      + '.bsc-r .t{font-size:14px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.bsc-r .s{font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.bsc-f{padding:8px 15px;border-top:1px solid var(--border);font-size:11.5px;color:var(--muted2Text,var(--muted2))}'
      + '.bsc-btn{display:inline-flex;align-items:center;gap:6px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--muted);background:var(--s1);border:1px solid var(--border);border-radius:9px;padding:7px 11px;cursor:pointer;white-space:nowrap}'
      + '.bsc-btn:hover{color:var(--text);border-color:var(--brand)}'
      + '.bsc-btn:focus-visible{outline:2px solid var(--brand);outline-offset:2px}'
      + '@media (max-width:760px){.bsc-ov{padding:8vh 10px 10px}.bsc-r .tp{width:54px}}';
    d.head.appendChild(css);

    caixa = el('<div class="bsc-ov" role="dialog" aria-modal="true" aria-label="Buscar no sistema" hidden></div>');
    var cx = el('<div class="bsc"></div>');
    var linha = el('<div class="bsc-in"></div>');
    linha.appendChild(txt('span', 'lupa', '🔎'));
    campo = el('<input type="text" placeholder="Buscar atividade, item do plano, reunião, agenda ou pessoa" aria-label="Buscar no sistema" autocomplete="off">');
    linha.appendChild(campo);
    linha.appendChild(txt('span', 'esc', 'Esc'));
    cx.appendChild(linha);
    lista = el('<div class="bsc-l"></div>');
    cx.appendChild(lista);
    rodape = txt('div', 'bsc-f', '↑ ↓ para escolher · Enter para abrir');
    cx.appendChild(rodape);
    caixa.appendChild(cx);
    d.body.appendChild(caixa);

    caixa.addEventListener('click', function (ev) { if (ev.target === caixa) { fechar(); } });
    campo.addEventListener('input', pintar);
    campo.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); fechar(); return; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); SEL = Math.min(SEL + 1, RESULTADOS.length - 1); marcar(); return; }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); SEL = Math.max(SEL - 1, 0); marcar(); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); abrir(RESULTADOS[SEL]); }
    });
  }

  function marcar() {
    var rs = lista.querySelectorAll('.bsc-r');
    for (var i = 0; i < rs.length; i++) { rs[i].className = 'bsc-r' + (i === SEL ? ' on' : ''); }
    if (rs[SEL] && rs[SEL].scrollIntoView) { rs[SEL].scrollIntoView({ block: 'nearest' }); }
  }
  function abrir(x) { if (!x) { return; } fechar(); w.location.href = x.url; }

  function pintar() {
    var q = campo.value || '';
    lista.innerHTML = ''; SEL = 0;
    if (!INDICE) { rodape.textContent = 'Montando a busca…'; return; }
    RESULTADOS = buscar(q);
    if (!q) { rodape.textContent = INDICE.length + ' itens no seu alcance · escreva para buscar'; return; }
    if (!RESULTADOS.length) { rodape.textContent = 'Nada com “' + q + '”. Tente uma palavra do título, o nome da pessoa ou a sigla do setor.'; return; }
    RESULTADOS.forEach(function (x, i) {
      var r = el('<button type="button" class="bsc-r' + (i === 0 ? ' on' : '') + '"></button>');
      r.appendChild(txt('span', 'tp', x.t));
      var tt = el('<span class="tt"></span>');
      tt.appendChild(txt('span', 't', x.txt || '(sem título)'));
      tt.appendChild(txt('span', 's', x.sub || ''));
      r.appendChild(tt);
      r.addEventListener('click', function () { abrir(x); });
      lista.appendChild(r);
    });
    rodape.textContent = RESULTADOS.length + ' resultado(s) · ↑ ↓ para escolher · Enter para abrir';
  }

  function abrirBusca() {
    montarTela();
    if (ABERTO) { campo.focus(); campo.select(); return; }
    ABERTO = true;
    caixa.hidden = false;
    campo.value = ''; lista.innerHTML = ''; RESULTADOS = []; SEL = 0;
    rodape.textContent = INDICE ? (INDICE.length + ' itens no seu alcance · escreva para buscar') : 'Montando a busca…';
    campo.focus();
    montarIndice().then(function () { if (ABERTO) { pintar(); } });
  }
  function fechar() { if (!ABERTO) { return; } ABERTO = false; caixa.hidden = true; }

  /* ---------- atalho e botão ---------- */
  function ligar() {
    d.addEventListener('keydown', function (ev) {
      var k = (ev.key || '').toLowerCase();
      if (k === 'k' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); if (ABERTO) { fechar(); } else { abrirBusca(); } }
    });
    /* O botão mora no TOPO DA LISTA DE NAVEGAÇÃO (convenção do Linear/Notion). Ele não pode
       morar na barra de ações da tela: várias telas fazem innerHTML='' na barra a cada redesenho
       e o botão sumiria. A navegação é montada uma vez por carga e não é limpa. */
    var nav = d.querySelector('.ui-side .ui-navlist');
    if (!nav) {
      if ((ligar.tentativas = (ligar.tentativas || 0) + 1) <= 20) { w.setTimeout(ligar, 200); }
      return;
    }
    if (d.querySelector('.bsc-btn')) { return; }
    var mac = /Mac|iPhone|iPad/.test(w.navigator.platform || w.navigator.userAgent || '');
    var b = el('<button type="button" class="bsc-btn"></button>');
    b.textContent = '🔎 Buscar';
    b.title = 'Buscar em tudo o que você enxerga: atividades, itens do plano, reuniões, agenda e pessoas (' + (mac ? '⌘K' : 'Ctrl+K') + ')';
    b.setAttribute('aria-label', 'Buscar no sistema');
    b.addEventListener('click', abrirBusca);
    b.style.cssText = 'width:calc(100% - 20px);margin:2px 10px 8px;justify-content:flex-start';
    nav.insertBefore(b, nav.firstChild);
  }

  w.GrautBusca = { abrir: abrirBusca, fechar: fechar, _indice: function () { return INDICE; } };

  if (w.Guard && w.Guard.onReady) { w.Guard.onReady(function () { montarTela(); ligar(); }); }
  else { d.addEventListener('DOMContentLoaded', function () { montarTela(); ligar(); }); }
}(window, document));
