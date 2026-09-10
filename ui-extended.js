/* ============================================================================
   ui-extended.js · Componentes novos: UI.num, UI.form, IndexedDB cache
   Sistema A · Grau Técnico FSA · Lote 3 (03/09/2026)
   
   CARREGAR DEPOIS de ui.js: <script src="ui.js"></script>
                              <script src="ui-extended.js"></script>
   
   Novos componentes unificados (reusáveis nas telas 3–6):
     UI.num({valor, rotulo, i:{formula,colunas}, drill:fn, tendencia})
     UI.form(spec) — montador de forms com defaults + validação mínima
     INDEXDB — cache de snapshots + onSnapshot seletivo (HOJE apenas)
   ============================================================================ */

(function () {
  'use strict';

  if (!window.UI) {
    console.warn('ui-extended.js: window.UI não encontrado. Carregar ui.js ANTES.');
    return;
  }

  /* ---- UI.num: número grande com "i" (fórmula) + drill + tendência ---- */
  window.UI.num = function (opts) {
    var val = opts.valor || 0;
    var rot = opts.rotulo || '—';
    var i = opts.i || {};
    var drill = opts.drill || function () {};
    var tend = opts.tendencia || null;     /* {valor, seta: 'up'/'down'/null} */

    var html = '<div class="ui-num-card">' +
      '<div class="ui-num-header">' +
        '<span class="ui-num-label">' + window.escapeHtml(rot) + '</span>' +
        (i.formula ? '<button class="ui-num-i" data-tooltip="' + window.escapeHtml(i.formula) + '">ℹ</button>' : '') +
      '</div>' +
      '<div class="ui-num-value">' +
        '<big>' + window.escapeHtml(String(val)) + '</big>' +
        (tend ? '<span class="ui-num-tendencia ' + tend.seta + '">' + tend.seta + '</span>' : '') +
      '</div>' +
      (i.colunas ? '<div class="ui-num-colunas">' + window.escapeHtml(i.colunas) + '</div>' : '') +
      '</div>';

    var el = document.createElement('div');
    el.innerHTML = html;
    el.addEventListener('click', drill);
    if (i.formula) {
      el.querySelector('.ui-num-i').addEventListener('click', function (e) {
        e.stopPropagation();
        window.UI.toast(i.formula, 'info', 5000);
      });
    }
    return el;
  };

  /* ---- UI.form: montador de formulários simples ---- */
  window.UI.form = function (spec) {
    /*
      spec: {
        title: 'string',
        fields: [
          { name:'campo', label:'Rótulo', type:'text'/'number'/'date'/'select', required:bool, options:[...] }
        ],
        onSubmit: function(dados) { ... },
        submitText: 'Salvar'
      }
    */
    var form = document.createElement('form');
    form.className = 'ui-form';

    if (spec.title) {
      var titleEl = document.createElement('h3');
      titleEl.textContent = spec.title;
      form.appendChild(titleEl);
    }

    (spec.fields || []).forEach(function (field) {
      var div = document.createElement('div');
      div.className = 'ui-form-field';

      if (field.label) {
        var label = document.createElement('label');
        label.textContent = field.label + (field.required ? ' *' : '');
        div.appendChild(label);
      }

      var input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.name = field.name;
        (field.options || []).forEach(function (opt) {
          var option = document.createElement('option');
          option.value = opt.value || opt;
          option.textContent = opt.label || opt;
          input.appendChild(option);
        });
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
        input.name = field.name;
        input.placeholder = field.placeholder || '';
        input.required = field.required || false;
      }

      div.appendChild(input);
      form.appendChild(div);
    });

    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = spec.submitText || 'Salvar';
    submit.className = 'ui-btn ui-btn-primary';
    form.appendChild(submit);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dados = {};
      var campos = form.querySelectorAll('[name]');
      for (var i = 0; i < campos.length; i++) {
        dados[campos[i].name] = campos[i].value;
      }
      if (spec.onSubmit) { spec.onSubmit(dados); }
    });

    return form;
  };

  /* ---- IndexedDB: cache de snapshots (abstração mínima) ---- */
  window.CACHE = {
    db: null,
    storeName: 'gera-cache-l3',

    init: function (callback) {
      if (!window.indexedDB) {
        console.warn('IndexedDB indisponível; cache desligado');
        callback(false);
        return;
      }

      var req = window.indexedDB.open('gera-db', 1);
      req.onerror = function () { callback(false); };
      req.onsuccess = function () {
        window.CACHE.db = req.result;
        callback(true);
      };
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(window.CACHE.storeName)) {
          db.createObjectStore(window.CACHE.storeName, { keyPath: 'key' });
        }
      };
    },

    set: function (key, value, ttlMs) {
      if (!window.CACHE.db) return;
      var tx = window.CACHE.db.transaction([window.CACHE.storeName], 'readwrite');
      var store = tx.objectStore(window.CACHE.storeName);
      var expiry = ttlMs ? (Date.now() + ttlMs) : null;
      store.put({ key: key, value: value, expiry: expiry });
    },

    get: function (key, callback) {
      if (!window.CACHE.db) {
        callback(null);
        return;
      }
      var tx = window.CACHE.db.transaction([window.CACHE.storeName], 'readonly');
      var store = tx.objectStore(window.CACHE.storeName);
      var req = store.get(key);
      req.onsuccess = function () {
        var item = req.result;
        if (!item) {
          callback(null);
          return;
        }
        if (item.expiry && Date.now() > item.expiry) {
          /* expirou; apagar */
          var txDel = window.CACHE.db.transaction([window.CACHE.storeName], 'readwrite');
          txDel.objectStore(window.CACHE.storeName).delete(key);
          callback(null);
        } else {
          callback(item.value);
        }
      };
    },

    clear: function () {
      if (!window.CACHE.db) return;
      var tx = window.CACHE.db.transaction([window.CACHE.storeName], 'readwrite');
      tx.objectStore(window.CACHE.storeName).clear();
    }
  };

  /* Inicializar IndexedDB na inicialização */
  document.addEventListener('DOMContentLoaded', function () {
    window.CACHE.init(function (ok) {
      if (ok) {
        console.log('✓ Cache IndexedDB inicializado');
      }
    });
  });

})();
