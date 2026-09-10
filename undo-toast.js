/* ============================================================================
   undo-toast.js · Toast com Undo em 7s (Lote 3)
   
   Padrão: Otimistic Update
   1. Renderizar mudança imediatamente
   2. Disparar gravação async
   3. Mostrar toast "Desfeito em 7s" com botão UNDO
   4. Se usuário clica UNDO, reverter rascunho (localStorage) + UI
   5. Se 7s passam sem undo, commit grava no Firestore
   
   ES5 · Sem modais nativos
   ============================================================================ */

(function () {
  'use strict';

  if (!window.FLAGS || !window.FLAGS.undoToast) {
    return;
  }

  var UNDO = {
    /* Histórico de ações com undo disponível */
    pendentes: {},  /* { id: { original, rascunho, timestamp, timeoutId } } */

    /* Iniciar ação com undo disponível */
    iniciar: function (id, original, toastMsg, callback) {
      var self = this;
      var agora = Date.now();

      /* Armazenar rascunho em localStorage */
      try {
        localStorage.setItem('undo-' + id, JSON.stringify({
          original: original,
          timestamp: agora
        }));
      } catch (e) {
        console.warn('localStorage indisponível para undo');
      }

      this.pendentes[id] = {
        original: original,
        timestamp: agora,
        callback: callback,
        timeoutId: null
      };

      /* Mostrar toast com botão UNDO */
      var timeLeft = 7;
      var toastEl = this.renderToast(toastMsg, timeLeft, id);

      /* Contar regressivo */
      var timer = setInterval(function () {
        timeLeft--;
        var timerEl = toastEl.querySelector('.undo-timer');
        if (timerEl) {
          timerEl.textContent = timeLeft;
        }
        if (timeLeft <= 0) {
          clearInterval(timer);
          self.commit(id);
        }
      }, 1000);

      this.pendentes[id].timeoutId = timer;
      this.pendentes[id].toastEl = toastEl;
    },

    /* Renderizar toast com botão UNDO */
    renderToast: function (msg, timeSec, id) {
      var div = document.createElement('div');
      div.className = 'undo-toast';
      div.innerHTML = '<span class="undo-msg">' + window.escapeHtml(msg) + '</span>' +
        '<span class="undo-timer">' + timeSec + '</span>s' +
        '<button class="undo-btn">Desfazer</button>';

      var self = this;
      div.querySelector('.undo-btn').addEventListener('click', function () {
        self.undo(id);
      });

      document.body.appendChild(div);
      return div;
    },

    /* Desfazer ação */
    undo: function (id) {
      var pend = this.pendentes[id];
      if (!pend) return;

      clearInterval(pend.timeoutId);

      /* Restaurar original */
      if (pend.callback && pend.callback.onUndo) {
        pend.callback.onUndo(pend.original);
      }

      /* Remover localStorage */
      try {
        localStorage.removeItem('undo-' + id);
      } catch (e) {}

      /* Remover toast */
      if (pend.toastEl && pend.toastEl.parentNode) {
        pend.toastEl.parentNode.removeChild(pend.toastEl);
      }

      delete this.pendentes[id];

      if (window.UI && window.UI.toast) {
        window.UI.toast('Desfeito', 'ok');
      }
    },

    /* Commitar mudança permanentemente */
    commit: function (id) {
      var pend = this.pendentes[id];
      if (!pend) return;

      clearInterval(pend.timeoutId);

      /* Chamar callback onCommit */
      if (pend.callback && pend.callback.onCommit) {
        pend.callback.onCommit(pend.timestamp);
      }

      /* Remover localStorage */
      try {
        localStorage.removeItem('undo-' + id);
      } catch (e) {}

      /* Remover toast */
      if (pend.toastEl && pend.toastEl.parentNode) {
        pend.toastEl.parentNode.removeChild(pend.toastEl);
      }

      delete this.pendentes[id];
    },

    /* Verificar e restaurar rascunhos ao carregar (para inatividade 30min) */
    restaurarRascunhos: function () {
      var agora = Date.now();
      for (var key in localStorage) {
        if (key.indexOf('undo-') === 0) {
          try {
            var data = JSON.parse(localStorage.getItem(key));
            var idade = agora - data.timestamp;
            var dias30 = 30 * 60 * 1000; /* 30 minutos */

            if (idade < dias30) {
              /* Rascunho ainda válido */
              if (window.UI && window.UI.toast) {
                window.UI.toast('Rascunho recuperado: ' + key.slice(5), 'ok');
              }
            } else {
              /* Rascunho expirado */
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  };

  /* Restaurar rascunhos ao carregar página */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      UNDO.restaurarRascunhos();
    });
  } else {
    UNDO.restaurarRascunhos();
  }

  /* Expor globalmente */
  window.UNDO = UNDO;

})();
