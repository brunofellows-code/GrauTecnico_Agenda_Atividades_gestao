/* ============================================================
   conclusao.js · Sistema A — GERA · Grau Técnico FSA
   ------------------------------------------------------------
   Item 1 (D2 · 15/09/2026) · RELATO MÍNIMO AO CONCLUIR.
   Toda conclusão pede "o que foi feito" com no mínimo 60
   caracteres (contador ao vivo). Compartilhado entre telas:
   Atividades usa agora (✓ e arrastar para FEITAS); o Hoje reusa
   no item 2 via GrautConclusao.validar().

   - validar(texto) é PURO (testável no Node): conta caracteres
     do texto sem espaços nas pontas.
   - pedir(opts) abre o modal (UI.modal) e devolve Promise:
     resolve com o texto (string) ao confirmar; resolve com null
     ao cancelar/fechar. Nunca rejeita.
   - A validação no SERVIDOR (regra do Firestore) vem no lote de
     regras (D4). Até lá, esta trava é só de tela.

   ES5 puro · zero hex · zero query · carregar após ui.js.
   ============================================================ */
(function () {
  'use strict';

  var MIN = 60;

  /** @param {*} texto @returns {{ok:boolean, len:number, faltam:number, min:number, texto:string}} */
  function validar(texto) {
    var t = (texto == null) ? '' : String(texto).replace(/^\s+|\s+$/g, '');
    var len = t.length;
    return { ok: len >= MIN, len: len, faltam: len >= MIN ? 0 : (MIN - len), min: MIN, texto: t };
  }

  /**
   * @param {{titulo?:string, subtitulo?:string, inicial?:string}} [opts]
   * @returns {Promise<string|null>}
   */
  function pedir(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      if (!window.UI || typeof UI.modal !== 'function') { resolve(null); return; }
      var entregue = false;
      function fim(v) { if (entregue) { return; } entregue = true; resolve(v); }

      var ta = document.createElement('textarea');
      ta.className = 'cz-ta';
      ta.rows = 4;
      ta.setAttribute('aria-label', 'O que foi feito');
      ta.placeholder = 'Ex.: Liguei para os 12 alunos faltosos da turma ENF-3, falei com 9; 3 sem resposta, reagendei para amanhã.';
      if (opts.inicial) { ta.value = opts.inicial; }

      var cont = document.createElement('div');
      cont.className = 'cz-count';
      var btnOk = null;

      function atualizar() {
        var v = validar(ta.value);
        cont.textContent = v.ok ? (v.len + ' caracteres · pronto') : (v.len + ' / ' + MIN + ' · faltam ' + v.faltam);
        cont.classList.toggle('ok', v.ok);
        if (btnOk) { btnOk.disabled = !v.ok; }
      }
      ta.addEventListener('input', atualizar);

      var ctl = UI.modal({
        title: opts.titulo || 'Concluir',
        width: 520,
        onClose: function () { fim(null); },
        body: function () {
          var w = document.createElement('div');
          w.className = 'ui-field';
          if (opts.subtitulo) {
            var s = document.createElement('div');
            s.className = 'cz-sub';
            s.textContent = opts.subtitulo;
            w.appendChild(s);
          }
          var lb = document.createElement('div');
          lb.className = 'ui-flabel';
          lb.textContent = 'O que foi feito';
          var req = document.createElement('span'); req.className = 'req'; req.textContent = ' *';
          lb.appendChild(req);
          w.appendChild(lb);
          w.appendChild(ta);
          w.appendChild(cont);
          var h = document.createElement('div');
          h.className = 'ui-fhint';
          h.textContent = 'Mínimo de ' + MIN + ' caracteres. Conte o que foi feito, com quem e o resultado — é isso que a reunião vai ler.';
          w.appendChild(h);
          return w;
        },
        footer: function (close) {
          var cancel = UI.button({ label: 'Cancelar', variant: 'ghost', onClick: function () { close(); } });
          btnOk = UI.button({ label: 'Concluir', icon: 'check', onClick: function () {
            var v = validar(ta.value);
            if (!v.ok) { atualizar(); ta.focus(); return; }
            fim(v.texto);
            close();
          } });
          return [cancel, btnOk];
        }
      });
      atualizar();
      setTimeout(function () { try { ta.focus(); } catch (e) {} }, 30);
      return ctl;
    });
  }

  window.GrautConclusao = { MIN: MIN, validar: validar, pedir: pedir };
})();
