/* ============================================================================
   quick-add.js · Entrada N com parsing PT-BR (Lote 3 · 04/09/2026)
   
   Input: "reunião CRA amanhã 14h — pautar Q3"
   Parse: { titulo: "pautar Q3", setor: "CRA", dtPrevista: "2026-09-05 14:00", notaInterna: "reunião" }
   
   ES5 puro · Atrás de FLAGS.quickAdd
   ============================================================================ */

(function () {
  'use strict';

  if (!window.FLAGS || !window.FLAGS.quickAdd) {
    return;
  }

  var PARSER = {
    /* Mapeamentos de setor e dias */
    setores: {
      'cra': 'CRA',
      'ped': 'Pedagógico',
      'com-p': 'Comercial P',
      'com-t': 'Comercial T',
      'pos': 'Pós Venda',
      'eva': 'Evasão',
      'est': 'Estágio',
      'mark': 'Marketing',
      'adm': 'Administrativo',
      'fin': 'Financeiro',
      'rh': 'RH',
      'ag': 'Agência'
    },

    /* Parsejar string livre em contrato atividade */
    parse: function (input) {
      if (!input || input.trim().length === 0) {
        return null;
      }

      var partes = input.split(/\s+/);
      var resultado = {
        titulo: '',
        setor: null,
        dtPrevista: null,
        horaStr: null,
        notaInterna: []
      };

      var horaIdx = -1, dataIdx = -1;
      var horaMatch = null;

      /* Varrer tokens */
      for (var i = 0; i < partes.length; i++) {
        var p = partes[i].toLowerCase();
        var isSetor = false;

        /* Verificar se é setor */
        for (var s in PARSER.setores) {
          if (p === s || p.indexOf(s) === 0) {
            resultado.setor = PARSER.setores[s];
            isSetor = true;
            break;
          }
        }

        /* Verificar se é hora (14h, 14:30, 14) */
        if (!isSetor && /^\d{1,2}h$|^\d{1,2}:\d{2}$|^\d{1,2}$/.test(p)) {
          horaIdx = i;
          horaMatch = p.replace(/h$/, '');
        }

        /* Verificar se é dia relativo (amanhã, segunda, sexta, +1, +2...) */
        if (!isSetor && /amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo|\+\d+|-\d+/.test(p)) {
          dataIdx = i;
          resultado.dtPrevista = PARSER.parseData(p);
        }

        /* Nota: tudo que não for setor/hora/data é parte do título */
        if (!isSetor && horaIdx !== i && dataIdx !== i) {
          resultado.notaInterna.push(partes[i]);
        }
      }

      /* Montar título (últimas palavras antes de setor/hora/data) */
      if (resultado.notaInterna.length > 0) {
        resultado.titulo = resultado.notaInterna.join(' ');
      } else {
        resultado.titulo = input;
      }

      /* Se há hora mas não data, usar hoje */
      if (horaMatch && !resultado.dtPrevista) {
        resultado.dtPrevista = PARSER.hoje();
      }

      /* Combinar data + hora */
      if (resultado.dtPrevista && horaMatch) {
        var dateParte = resultado.dtPrevista.slice(0, 10);
        resultado.dtPrevista = dateParte + ' ' + horaMatch;
      }

      return resultado;
    },

    /* Parsejar data relativa (amanhã, segunda, +1, etc.) */
    parseData: function (str) {
      var hoje = new Date();
      var d = new Date(hoje);
      var dayName = str.toLowerCase();

      if (dayName === 'amanhã') {
        d.setDate(d.getDate() + 1);
      } else if (dayName === 'segunda') {
        while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
      } else if (dayName === 'terça') {
        while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
      } else if (dayName === 'quarta') {
        while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
      } else if (dayName === 'quinta') {
        while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
      } else if (dayName === 'sexta') {
        while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
      } else if (dayName === 'sábado') {
        while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
      } else if (dayName === 'domingo') {
        while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
      } else if (/^\+\d+$/.test(str)) {
        d.setDate(d.getDate() + parseInt(str.slice(1), 10));
      } else if (/^-\d+$/.test(str)) {
        d.setDate(d.getDate() - parseInt(str.slice(1), 10));
      }

      return d.toISOString();
    },

    hoje: function () {
      var d = new Date();
      var ano = d.getFullYear();
      var mes = String(d.getMonth() + 1).padStart(2, '0');
      var dia = String(d.getDate()).padStart(2, '0');
      return ano + '-' + mes + '-' + dia;
    }
  };

  /* UI: Montar modal/drawer de entrada */
  var UI_QUICKADD = {
    el: null,
    input: null,

    mount: function () {
      var html = '<div class="qa-modal">' +
        '<div class="qa-overlay"></div>' +
        '<div class="qa-dialog">' +
        '<h3>Adicionar atividade rápida</h3>' +
        '<input type="text" class="qa-input" placeholder="ex: reunião CRA amanhã 14h — pautar Q3" autocomplete="off">' +
        '<div class="qa-hint">Formatos: [título] [setor] [data] [hora] — [nota]</div>' +
        '<div class="qa-actions">' +
        '<button class="qa-cancel">Cancelar</button>' +
        '<button class="qa-submit">Adicionar</button>' +
        '</div>' +
        '</div>' +
        '</div>';

      var div = document.createElement('div');
      div.innerHTML = html;
      this.el = div.firstChild;
      this.input = this.el.querySelector('.qa-input');

      var self = this;
      this.el.querySelector('.qa-submit').addEventListener('click', function () {
        self.onSubmit();
      });
      this.el.querySelector('.qa-cancel').addEventListener('click', function () {
        self.close();
      });
      this.input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          self.onSubmit();
        }
      });

      document.body.appendChild(this.el);
      setTimeout(function () {
        self.input.focus();
      }, 100);
    },

    onSubmit: function () {
      var val = this.input.value.trim();
      if (!val) return;

      var parsed = PARSER.parse(val);
      if (!parsed || !parsed.titulo) {
        window.UI.toast('Título obrigatório', 'err');
        return;
      }

      /* Disparar evento para que hoje-cockpit-l3.js adicione a atividade */
      var evt = new CustomEvent('quickadd:submit', { detail: parsed });
      document.dispatchEvent(evt);

      this.close();
    },

    close: function () {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    },

    open: function () {
      this.mount();
    }
  };

  /* Expor globalmente */
  window.QUICK_ADD = {
    open: function () {
      UI_QUICKADD.open();
    },
    parse: function (str) {
      return PARSER.parse(str);
    }
  };

  /* Hotkey: Ctrl+N (ou Cmd+N) abre quick-add */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      window.QUICK_ADD.open();
    }
  });

})();
