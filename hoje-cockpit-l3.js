/* ============================================================================
   hoje-cockpit-l3.js · Painel do Lote 3 · versão L3.5 (11/09/2026)
   Sistema A · Grau Técnico FSA

   Reescrito no Lote 3.5. A versão de 03/09 (Lote 3) não rodava em produção:
     - lia window.currentUser (o Guard publica window.GRAUT_USER);
     - dependia de window.ADAPTER, que dependia de window.firebase (compat) —
       o GERA usa o SDK modular, logo o adapter nunca subia;
     - chamava SCORES.cockpit(perfil, dados, …) com a assinatura invertida;
     - consumia ranking.topN/posicaoPropria (o scores.js devolve top3/posicao);
     - pintava DENTRO de #hj-scope (a barra Eu/Setor/Empresa) com innerHTML=''.
   Agora:
     - escuta o evento 'hoje:modelo' que hoje.html emite depois de CADA paint()
       com o MESMO MODELO (KPI.carregar) — régua única, zero leitura extra;
     - traduz via ADAPTER.fromContexto (enum real → contrato do scores.js);
     - renderiza em container PRÓPRIO (#hj-cockpit-l3), abaixo de #hj-kpis;
     - 7 seções: cabeçalho · agenda · ataque agora · onde trava (gestor/líder)
       · ranking (Top 3 + você) · indicadores (LINK para "Meu mês", nunca 2ª
       régua) · sino;
     - 4 estados: carregando · vazio · erro · sem permissão;
     - texto em linguagem simples (urgência, atenção, pontos) e escapeHtml em
       TODO dado vindo do banco.
   Carrega DEPOIS de: flags.js, ui.js, kpi.js, scores.js, firestore-adapter.js.
   Atrás de FLAGS.cockpit. ES5 puro.
   ============================================================================ */

(function () {
  'use strict';

  if (!window.FLAGS || !window.FLAGS.cockpit) { return; }
  if (!window.SCORES || !window.ADAPTER || typeof window.ADAPTER.fromContexto !== 'function') {
    if (window.console && console.warn) { console.warn('hoje-cockpit-l3.js: dependências faltam (scores.js / firestore-adapter.js)'); }
    return;
  }

  var esc = function (s) { return window.escapeHtml ? window.escapeHtml(s) : String(s == null ? '' : s); };

  function brData(iso) {
    if (!iso || String(iso).length < 10) { return '—'; }
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function diasEntre(a, b) { return window.SCORES._diasEntre ? window.SCORES._diasEntre(a, b) : 0; }

  var APP = {
    uid: null,
    perfil: 'usuario',           /* gestor | lider | usuario */
    setores: [],                 /* siglas que o líder lidera */
    user: null,
    ctx: null,                   /* MODELO cru (banda inteira) */
    dados: null,                 /* contrato scores.js (escopo do papel) */
    dadosEmpresa: null,          /* contrato scores.js (banda inteira, p/ ranking) */
    cockpit: null,
    hoje: null,
    estado: 'carregando',
    erro: null,

    /* ---------- container próprio (NUNCA #hj-scope) ---------- */
    container: function () {
      var c = document.getElementById('hj-cockpit-l3');
      if (c) { return c; }
      c = document.createElement('section');
      c.id = 'hj-cockpit-l3';
      c.className = 'ck-root';
      c.setAttribute('aria-label', 'Painel do dia');
      var ref = document.getElementById('hj-kpis') || document.getElementById('hj-prog');
      if (ref && ref.parentNode) {
        if (ref.nextSibling) { ref.parentNode.insertBefore(c, ref.nextSibling); } else { ref.parentNode.appendChild(c); }
      } else {
        (document.getElementById('app') || document.body).appendChild(c);
      }
      return c;
    },

    /* ---------- 4 estados ---------- */
    renderEstado: function (tipo, titulo, sub) {
      var c = APP.container();
      c.innerHTML = '<div class="ck-state ck-state-' + tipo + '">' +
        '<div class="ck-state-t">' + esc(titulo) + '</div>' +
        (sub ? '<div class="ck-state-s">' + esc(sub) + '</div>' : '') +
        '</div>';
    },

    /* ---------- entrada: MODELO vindo de hoje.html ---------- */
    receber: function (detail) {
      try {
        var user = (detail && detail.user) || window.GRAUT_USER || null;
        if (!user || !user.uid) { APP.estado = 'sem-permissao'; APP.renderEstado('sem-permissao', 'Entre no sistema para ver o painel do dia.'); return; }
        var perfil = user.perfil;
        if (perfil !== 'gestor' && perfil !== 'lider' && perfil !== 'usuario') {
          APP.estado = 'sem-permissao';
          APP.renderEstado('sem-permissao', 'Seu perfil ainda não tem acesso ao painel.', 'Confirme seu perfil com o gestor.');
          return;
        }
        APP.user = user;
        APP.uid = user.uid;
        APP.perfil = perfil;
        APP.setores = Array.isArray(user.setoresLiderados) ? user.setoresLiderados.slice() : [];
        var ctx = detail && detail.modelo;
        if (!ctx || !ctx.board) { APP.estado = 'carregando'; APP.renderEstado('carregando', 'Montando o painel do dia…'); return; }
        APP.ctx = ctx;
        APP.hoje = ctx.hoje;

        /* escopo do papel = o MESMO predicado de hoje.html (KPI.recortarContexto) */
        var recorte = (window.KPI && window.KPI.recortarContexto) ? window.KPI.recortarContexto(ctx, user) : ctx;
        APP.dados = window.ADAPTER.fromContexto(recorte, user);
        APP.dadosEmpresa = (perfil === 'gestor') ? APP.dados : window.ADAPTER.fromContexto(ctx, user);

        if (!APP.dados.atividades.length) {
          APP.estado = 'vazio';
          APP.renderEstado('vazio',
            perfil === 'usuario' ? 'Nada previsto para você nesta janela.' : 'Nada previsto no seu escopo nesta janela.',
            perfil === 'usuario' ? 'Quando o líder atribuir atividades a você, elas aparecem aqui.' : 'Crie atividades (Ctrl+N ou em Atividades) para o painel ganhar vida.');
          return;
        }

        /* PREMISSA: líder pode liderar VÁRIOS setores; o recorte já aplicou o
           escopo, então o scores.js recebe 'gestor' para não filtrar por 1 sigla.
           Usuário segue 'usuario' (RBAC por design: gargalos = null, só o dele). */
        var perfilScores = (perfil === 'usuario') ? 'usuario' : 'gestor';
        APP.cockpit = window.SCORES.cockpit(APP.dados, perfilScores, APP.uid, APP.setores[0] || '', APP.hoje);
        /* ranking é PÚBLICO (Top 3 + você) — base da banda inteira, mínimo 3 atividades */
        APP.cockpit.ranking = window.SCORES.ranking(APP.dadosEmpresa.pessoas || [], APP.uid);
        APP.estado = 'ok';
        APP.render();
      } catch (e) {
        APP.estado = 'erro';
        APP.erro = e;
        if (window.console && console.error) { console.error('[cockpit-l3]', e); }
        APP.renderEstado('erro', 'Não consegui montar o painel do dia.', (e && e.message) || 'Erro inesperado.');
      }
    },

    /* ---------- pintura (7 seções) ---------- */
    render: function () {
      var c = APP.container();
      c.innerHTML = '';
      c.appendChild(APP.renderGreeting());
      c.appendChild(APP.renderAgenda());
      c.appendChild(APP.renderAtaque());
      if (APP.perfil === 'gestor' || APP.perfil === 'lider') { c.appendChild(APP.renderGargalos()); }
      c.appendChild(APP.renderRanking());
      c.appendChild(APP.renderIndicadores());
      c.appendChild(APP.renderSino());

      if (window.APP_SHOW_WHATS_NEW && window.UI && typeof window.UI.modal === 'function') {
        window.APP_SHOW_WHATS_NEW = false;
        setTimeout(function () {
          window.UI.modal({
            title: 'O que mudou nesta versão' + (window.APP_VERSION ? ' (' + window.APP_VERSION + ')' : ''),
            width: 460,
            body: function () {
              var ul = document.createElement('ul');
              ul.setAttribute('style', 'margin:0;padding-left:18px;color:var(--muted);font-size:14px;line-height:1.6');
              var itens = (window.APP_INFO && window.APP_INFO.whatsNew) || [];
              for (var i = 0; i < itens.length; i++) { var li = document.createElement('li'); li.textContent = itens[i]; ul.appendChild(li); }
              return ul;
            },
            footer: function (close) {
              return [window.UI.button({ label: 'Entendi', onClick: close })];
            }
          });
        }, 500);
      }
    },

    /* 1. cabeçalho (hoje.html já cumprimenta; aqui só o recorte + data) */
    renderGreeting: function () {
      var div = document.createElement('div');
      div.className = 'ck-greeting';
      var visao = APP.perfil === 'gestor' ? 'Visão da empresa'
        : (APP.perfil === 'lider' ? 'Visão do líder' + (APP.setores.length ? ' · ' + APP.setores.join(', ') : '') : 'Sua visão');
      div.innerHTML = '<h1>Painel do dia</h1><p>' + esc(visao) + ' · ' + esc(brData(APP.hoje)) + '</p>';
      return div;
    },

    /* 2. agenda de hoje (o que vence hoje, com horário quando houver) */
    renderAgenda: function () {
      var div = document.createElement('div');
      div.className = 'ck-agenda-band';
      var hojeItens = [], i, a;
      for (i = 0; i < APP.dados.atividades.length; i++) {
        a = APP.dados.atividades[i];
        if (a.status !== 'feita' && a.dtPrevista === APP.hoje) { hojeItens.push(a); }
      }
      hojeItens.sort(function (x, y) { return String(x.horario || '99:99') < String(y.horario || '99:99') ? -1 : 1; });
      if (!hojeItens.length) {
        div.innerHTML = '<h3>Agenda de hoje</h3><p class="ck-helper">Nada vencendo hoje no seu escopo.</p>';
        return div;
      }
      var html = '<h3>Agenda de hoje</h3><div class="ck-agenda-items">';
      for (i = 0; i < Math.min(5, hojeItens.length); i++) {
        a = hojeItens[i];
        html += '<div class="ck-agenda-item">' +
          '<span class="ck-time">' + esc(a.horario || '—') + '</span>' +
          '<span class="ck-title">' + esc(a.titulo) + (a.setorSigla ? ' <small>' + esc(a.setorSigla) + '</small>' : '') + '</span>' +
          '</div>';
      }
      if (hojeItens.length > 5) { html += '<div class="ck-helper">+ ' + (hojeItens.length - 5) + ' outra(s) hoje.</div>'; }
      html += '</div>';
      div.innerHTML = html;
      return div;
    },

    /* 3. ataque agora (Top urgência — 3 p/ usuário, 5 p/ gestor/líder) */
    renderAtaque: function () {
      var div = document.createElement('div');
      div.className = 'ck-ataque-section';
      var pends = (APP.cockpit && APP.cockpit.pendencias) || [];
      if (!pends.length) {
        div.innerHTML = '<h3>Ataque agora</h3><p class="ck-helper">Nada urgente. Bom sinal.</p>';
        return div;
      }
      var html = '<h3>Ataque agora</h3>' +
        '<p class="ck-helper">As ' + pends.length + ' mais urgentes do seu escopo. Urgência = dias de atraso ×3, vence hoje +4, prioridade alta +2.</p>' +
        '<div class="ck-ataque-cards">';
      for (var i = 0; i < pends.length; i++) {
        var p = pends[i], a = p.ref || {};
        var nivel = p.score > 15 ? 'high' : (p.score > 8 ? 'med' : 'low');
        var atraso = (a.dtPrevista && diasEntre(a.dtPrevista, APP.hoje) > 0) ? diasEntre(a.dtPrevista, APP.hoje) : 0;
        var quando = atraso > 0 ? 'venceu ' + brData(a.dtPrevista) + ' (' + atraso + ' dia' + (atraso > 1 ? 's' : '') + ' de atraso)'
          : (a.dtPrevista === APP.hoje ? 'vence hoje' : 'para ' + brData(a.dtPrevista));
        html += '<div class="ck-card ' + nivel + '">' +
          '<div class="ck-card-num">' + (i + 1) + '</div>' +
          '<div class="ck-card-title">' + esc(a.titulo) + '</div>' +
          '<div class="ck-card-meta">' + esc(a.setorSigla || '') + (a.responsavelNome && APP.perfil !== 'usuario' ? ' · ' + esc(a.responsavelNome) : '') + ' · ' + esc(quando) + '</div>' +
          '<div class="ck-card-score">Urgência ' + Number(p.score || 0) + '</div>' +
          '</div>';
      }
      html += '</div>';
      div.innerHTML = html;
      return div;
    },

    /* 4. onde está travando (gestor/líder). Linguagem de resgate: quem
          precisa de ajuda — nunca "pessoas em risco". */
    renderGargalos: function () {
      var div = document.createElement('div');
      div.className = 'ck-gargalos-section';
      var g = (APP.cockpit && APP.cockpit.gargalos) || {};
      var pessoas = g.pessoas || [], setores = g.setores || [];
      var atrasPorUid = {}, atrasPorSetor = {}, i, p;
      for (i = 0; i < APP.dados.pessoas.length; i++) { p = APP.dados.pessoas[i]; atrasPorUid[p.uid] = p.atrasadas || 0; atrasPorSetor[p.setorSigla] = (atrasPorSetor[p.setorSigla] || 0) + (p.atrasadas || 0); }
      var html = '<h3>Onde está travando</h3>';
      var temAlgo = false;
      var comAtraso = [];
      for (i = 0; i < pessoas.length; i++) { if ((atrasPorUid[pessoas[i].uid] || 0) > 0) { comAtraso.push(pessoas[i]); } }
      if (comAtraso.length) {
        temAlgo = true;
        html += '<h4>Quem precisa de ajuda</h4><ul>';
        for (i = 0; i < Math.min(3, comAtraso.length); i++) {
          p = comAtraso[i];
          var n = atrasPorUid[p.uid] || 0;
          html += '<li>' + esc(p.nome) + ' — ' + n + ' atrasada' + (n > 1 ? 's' : '') + (p.setorSigla ? ' <small>' + esc(p.setorSigla) + '</small>' : '') + '</li>';
        }
        html += '</ul>';
      }
      if (APP.perfil === 'gestor') {
        var setComAtraso = [];
        for (i = 0; i < setores.length; i++) { if ((atrasPorSetor[setores[i].setorSigla] || 0) > 0) { setComAtraso.push(setores[i]); } }
        if (setComAtraso.length) {
          temAlgo = true;
          html += '<h4>Setores com mais atraso</h4><ul>';
          for (i = 0; i < Math.min(3, setComAtraso.length); i++) {
            var sg = setComAtraso[i].setorSigla, ns = atrasPorSetor[sg] || 0;
            html += '<li>' + esc(sg) + ' — ' + ns + ' atrasada' + (ns > 1 ? 's' : '') + '</li>';
          }
          html += '</ul>';
        }
      }
      if (!temAlgo) { html += '<p class="ck-helper">Ninguém travado no seu escopo agora.</p>'; }
      div.innerHTML = html;
      return div;
    },

    /* 5. ranking — Top 3 público + sua posição. Bottom NUNCA (scores.js
          nem devolve). Mínimo 3 atividades previstas para entrar. */
    renderRanking: function () {
      var div = document.createElement('div');
      div.className = 'ck-ranking-section';
      var r = (APP.cockpit && APP.cockpit.ranking) || { top3: [], posicao: 0, total: 0 };
      var top3 = r.top3 || [];
      var html = '<h3>Ranking da janela</h3>';
      if (!top3.length) {
        html += '<p class="ck-helper">Ainda ninguém com 3 atividades previstas na janela — o ranking começa a partir daí.</p>';
        div.innerHTML = html;
        return div;
      }
      html += '<div class="ck-ranking-cards">';
      for (var i = 0; i < Math.min(3, top3.length); i++) {
        var t = top3[i];
        var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉');
        html += '<div class="ck-ranking-card' + (t.uid === APP.uid ? ' me' : '') + '">' +
          '<span class="ck-medal">' + medal + '</span>' +
          '<span class="ck-rank-name">' + esc(t.nome) + '</span>' +
          '<span class="ck-rank-score">' + Number(t.score) + ' pts</span>' +
          '</div>';
      }
      html += '</div>';
      if (r.posicao > 0) {
        html += '<div class="ck-ranking-self">Você: <strong>' + r.posicao + 'º</strong> de ' + r.total + '</div>';
      } else {
        html += '<div class="ck-ranking-self">Você entra no ranking com 3 atividades previstas na janela.</div>';
      }
      html += '<p class="ck-helper">Pontos = feitas no prazo ×2 · adiantadas ×3 · atrasadas −2. Desempate: menos atrasadas.</p>';
      div.innerHTML = html;
      return div;
    },

    /* 6. indicadores — P3: LINK para a régua única "Meu mês" de hoje.html.
          Nunca uma 2ª régua com números próprios. */
    renderIndicadores: function () {
      var div = document.createElement('div');
      div.className = 'ck-kpis-section';
      var alvo = null;
      var titulos = document.querySelectorAll('.hj-xtitle');
      for (var i = 0; i < titulos.length; i++) {
        if (String(titulos[i].textContent || '').trim() === 'Meu mês') { alvo = titulos[i]; break; }
      }
      var html = '<h3>Seus números</h3>' +
        '<p class="ck-helper">Feitas, atrasadas e aderência do mês ficam na régua <strong>Meu mês</strong>, no topo desta tela — uma régua só, para não ter dois números diferentes.</p>';
      div.innerHTML = html;
      if (alvo) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ck-link-btn';
        btn.textContent = 'Ver Meu mês';
        btn.addEventListener('click', function () {
          var card = alvo;
          while (card && card.parentNode && !(card.className && String(card.className).indexOf('hj-xcard') !== -1)) { card = card.parentNode; }
          try { (card || alvo).scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { (card || alvo).scrollIntoView(); }
        });
        div.appendChild(btn);
      }
      return div;
    },

    /* 7. sino — quantidade de pendências urgentes; clique leva ao "Ataque agora" */
    renderSino: function () {
      var div = document.createElement('div');
      div.className = 'ck-sino';
      var total = ((APP.cockpit && APP.cockpit.pendencias) || []).length;
      div.innerHTML = '<button type="button" class="ck-sino-btn" title="Pendências urgentes">' +
        '<span class="ck-sino-icon">🔔</span>' +
        (total > 0 ? '<span class="ck-sino-badge">' + total + '</span>' : '') +
        '</button>';
      var b = div.querySelector('.ck-sino-btn');
      if (b) {
        b.addEventListener('click', function () {
          var sec = document.querySelector('#hj-cockpit-l3 .ck-ataque-section');
          if (sec) { try { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { sec.scrollIntoView(); } }
        });
      }
      return div;
    }
  };

  /* estado inicial: carregando (hoje.html emite 'hoje:modelo' após o 1º paint) */
  function boot() {
    if (!document.getElementById('hj-kpis') && !document.getElementById('hj-prog')) { return; } /* não é a tela Hoje */
    APP.renderEstado('carregando', 'Montando o painel do dia…', 'Lendo as mesmas atividades da sua agenda.');
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
  document.addEventListener('hoje:modelo', function (ev) { APP.receber(ev && ev.detail); });

  window.COCKPIT_APP = APP;
})();
