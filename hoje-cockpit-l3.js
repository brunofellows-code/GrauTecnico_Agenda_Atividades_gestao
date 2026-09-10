/* ============================================================================
   hoje-cockpit-l3.js · Cockpit Lote 3 (03/09/2026)
   Sistema A · Grau Técnico FSA
   
   Renderiza HOJE.html como um cockpit diferente por hierarquia:
   - GESTOR: Top 5 Empresa + Gargalos + KPIs
   - LÍDER: Top 5 Setor + Gargalos setor + KPIs
   - USUÁRIO: Top 3 Pessoais + Posição Ranking + KPIs pessoais
   
   Carrega DEPOIS de: app-version.js, ui-extended.js, firestore-adapter.js,
   scores.js, fmt.js, kpi.js
   ============================================================================ */

(function () {
  'use strict';

  /* Verificar dependências */
  if (!window.FLAGS || !window.ADAPTER || !window.SCORES || !window.FMT) {
    console.error('hoje-cockpit-l3.js: dependências faltam');
    return;
  }

  var APP = {
    uid: null,
    perfil: 'usuario',           /* gestor | lider | usuario */
    setorSigla: null,
    dados: null,
    cockpit: null,
    hoje: null,

    /* Inicializar cockpit */
    init: function () {
      /* Obter uid + perfil do usuário (implementar com guard.js) */
      if (!window.currentUser) {
        console.warn('Usuário não logado; cockpit desativado');
        return;
      }

      APP.uid = window.currentUser.uid;
      APP.perfil = window.currentUser.perfil || 'usuario';
      APP.setorSigla = window.currentUser.setorSigla || '';
      APP.hoje = new Date().toISOString().slice(0, 10);

      console.log('🔄 Carregando cockpit para', APP.perfil, 'uid=' + APP.uid);

      /* Carregar dados do Firestore */
      window.ADAPTER.loadFromFirebase(APP.uid, APP.setorSigla, function (err, dados) {
        if (err) {
          console.error('Erro ao carregar Firestore:', err);
          return;
        }

        APP.dados = dados;

        /* Computar cockpit via SCORES */
        APP.cockpit = window.SCORES.cockpit(
          APP.perfil,
          dados,
          APP.uid,
          APP.hoje
        );

        console.log('✓ Cockpit computado:', APP.cockpit);

        /* Renderizar UI */
        APP.render();
      });
    },

    /* Renderizar cockpit na DOM */
    render: function () {
      var scopeEl = document.getElementById('hj-scope');
      if (!scopeEl) {
        console.error('Elemento #hj-scope não encontrado');
        return;
      }

      /* Limpar */
      scopeEl.innerHTML = '';

      /* 1. Saudação + data */
      var greeting = document.createElement('div');
      greeting.className = 'ck-greeting';
      greeting.innerHTML = '<h1>Olá, ' + (window.currentUser.nome || 'usuário') + '</h1>' +
        '<p>' + APP.hoje + '</p>';
      scopeEl.appendChild(greeting);

      /* 2. Faixa de agenda (reuniões + prazos + "agora") */
      if (APP.cockpit.atividades && APP.cockpit.atividades.length > 0) {
        var agendaEl = APP.renderAgenda();
        scopeEl.appendChild(agendaEl);
      }

      /* 3. Ataque Agora */
      if (APP.cockpit.pendencias && APP.cockpit.pendencias.length > 0) {
        var ataqueEl = APP.renderAtaque();
        scopeEl.appendChild(ataqueEl);
      }

      /* 4. Gargalos (só gestor/lider) */
      if ((APP.perfil === 'gestor' || APP.perfil === 'lider') && APP.cockpit.gargalos) {
        var gargaloEl = APP.renderGargalos();
        scopeEl.appendChild(gargaloEl);
      }

      /* 5. Ranking + Posição própria */
      if (APP.cockpit.ranking) {
        var rankingEl = APP.renderRanking();
        scopeEl.appendChild(rankingEl);
      }

      /* 6. KPIs (estáticos por agora) */
      var kpisEl = APP.renderKPIs();
      scopeEl.appendChild(kpisEl);

      /* 7. Sino (central de pendências) */
      var sinoEl = APP.renderSino();
      scopeEl.appendChild(sinoEl);

      /* Disparar modal de "novidades" se primeira vez desta versão */
      if (window.APP_SHOW_WHATS_NEW) {
        setTimeout(function () {
          window.UI.dialog({
            title: 'Bem-vindo à versão ' + window.APP_VERSION,
            body: '<p>' + (window.APP_INFO.whatsNew || []).join('</p><p>') + '</p>',
            actions: [{ text: 'Entendi', kind: 'primary' }]
          });
        }, 500);
      }
    },

    /* Faixa de agenda (reuniões + prazos de hoje) */
    renderAgenda: function () {
      var div = document.createElement('div');
      div.className = 'ck-agenda-band';

      var atvs = APP.cockpit.atividades || [];
      if (atvs.length === 0) {
        div.textContent = 'Sem atividades agendadas para hoje';
        return div;
      }

      var html = '<h3>Agenda de hoje</h3><div class="ck-agenda-items">';
      for (var i = 0; i < Math.min(5, atvs.length); i++) {
        var a = atvs[i];
        var horaStr = a.dtPrevista ? a.dtPrevista.slice(11, 16) : '—';
        html += '<div class="ck-agenda-item">' +
          '<span class="ck-time">' + horaStr + '</span>' +
          '<span class="ck-title">' + window.escapeHtml(a.titulo) + '</span>' +
          '</div>';
      }
      html += '</div>';

      div.innerHTML = html;
      return div;
    },

    /* Seção "Ataque Agora" */
    renderAtaque: function () {
      var div = document.createElement('div');
      div.className = 'ck-ataque-section';

      var pends = APP.cockpit.pendencias || [];
      if (pends.length === 0) {
        div.innerHTML = '<h3>Ataque Agora</h3><p>Sem prioridades urgentes!</p>';
        return div;
      }

      var html = '<h3>Ataque Agora</h3>';
      html += '<p class="ck-helper">As ' + pends.length + ' tarefas mais urgentes para você agora:</p>';
      html += '<div class="ck-ataque-cards">';

      for (var i = 0; i < Math.min(5, pends.length); i++) {
        var p = pends[i];
        var scoreClass = p.score > 15 ? 'high' : (p.score > 8 ? 'med' : 'low');
        html += '<div class="ck-card ' + scoreClass + '">' +
          '<div class="ck-card-num">' + (i + 1) + '</div>' +
          '<div class="ck-card-title">' + window.escapeHtml(p.titulo) + '</div>' +
          '<div class="ck-card-score">Score: ' + p.score + '</div>' +
          '</div>';
      }

      html += '</div>';
      div.innerHTML = html;
      return div;
    },

    /* Seção "Gargalos" (apenas gestor/lider) */
    renderGargalos: function () {
      var div = document.createElement('div');
      div.className = 'ck-gargalos-section';

      var gargs = APP.cockpit.gargalos || {};
      var pessoas = gargs.pessoas || [];
      var setores = gargs.setores || [];

      var html = '<h3>Gargalos Detectados</h3>';

      if (pessoas.length > 0) {
        html += '<h4>Pessoas em risco:</h4><ul>';
        for (var i = 0; i < Math.min(3, pessoas.length); i++) {
          html += '<li>' + window.escapeHtml(pessoas[i].nome) + ' (score: ' + pessoas[i].score + ')</li>';
        }
        html += '</ul>';
      }

      if (setores.length > 0 && APP.perfil === 'gestor') {
        html += '<h4>Setores em risco:</h4><ul>';
        for (var j = 0; j < Math.min(3, setores.length); j++) {
          html += '<li>' + window.escapeHtml(setores[j].setorSigla) + ' (score: ' + setores[j].score + ')</li>';
        }
        html += '</ul>';
      }

      div.innerHTML = html;
      return div;
    },

    /* Seção "Ranking" */
    renderRanking: function () {
      var div = document.createElement('div');
      div.className = 'ck-ranking-section';

      var ranking = APP.cockpit.ranking || {};
      var topN = ranking.topN || [];
      var posicaoPropria = ranking.posicaoPropria || null;

      var html = '<h3>Ranking da Semana</h3>';
      html += '<div class="ck-ranking-cards">';

      for (var i = 0; i < Math.min(3, topN.length); i++) {
        var r = topN[i];
        var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉');
        html += '<div class="ck-ranking-card">' +
          '<span class="ck-medal">' + medal + '</span>' +
          '<span class="ck-rank-name">' + window.escapeHtml(r.nome) + '</span>' +
          '<span class="ck-rank-score">' + r.score + '</span>' +
          '</div>';
      }

      if (posicaoPropria) {
        html += '<div class="ck-ranking-self">' +
          'Você: <strong>#' + posicaoPropria.posicao + '</strong> (' + posicaoPropria.score + ' pontos)' +
          '</div>';
      }

      html += '</div>';
      div.innerHTML = html;
      return div;
    },

    /* Seção "KPIs" (estáticos por agora) */
    renderKPIs: function () {
      var div = document.createElement('div');
      div.className = 'ck-kpis-section';

      var html = '<h3>KPIs</h3>' +
        '<div class="ck-kpi-grid">' +
        '<div class="ck-kpi-card">' +
        '<div class="ck-kpi-label">Atividades Abertas</div>' +
        '<div class="ck-kpi-value">' + (APP.cockpit.atividades ? APP.cockpit.atividades.length : 0) + '</div>' +
        '</div>' +
        '<div class="ck-kpi-card">' +
        '<div class="ck-kpi-label">Atrasadas</div>' +
        '<div class="ck-kpi-value" style="color:var(--red)">' + (APP.cockpit.pendencias ? APP.cockpit.pendencias.filter(function (p) { return p.diasAtraso > 0; }).length : 0) + '</div>' +
        '</div>' +
        '</div>';

      div.innerHTML = html;
      return div;
    },

    /* Sino (central de pendências) */
    renderSino: function () {
      var div = document.createElement('div');
      div.className = 'ck-sino';

      var totalPending = (APP.cockpit.pendencias || []).length;
      div.innerHTML = '<button class="ck-sino-btn" title="Central de pendências">' +
        '<span class="ck-sino-icon">🔔</span>' +
        (totalPending > 0 ? '<span class="ck-sino-badge">' + totalPending + '</span>' : '') +
        '</button>';

      return div;
    }
  };

  /* Inicializar quando DOM pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.FLAGS && window.FLAGS.cockpit) {
        APP.init();
      }
    });
  } else {
    if (window.FLAGS && window.FLAGS.cockpit) {
      APP.init();
    }
  }

  /* Expor APP globalmente para debug */
  window.COCKPIT_APP = APP;

})();
