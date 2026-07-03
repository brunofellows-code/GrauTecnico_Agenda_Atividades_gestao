/* ============================================================
   Sistema A · Grau Técnico FSA — Componentes primitivos (v1)
   ------------------------------------------------------------
   Factory: cada função devolve um HTMLElement pronto para usar.
   As telas chamam window.UI.* com DADOS (objetos/listas) — nunca
   escrevem markup repetido. Cor 100% via tokens (components.css).
   Vanilla puro, sem build. Tipagem por JSDoc.
   ============================================================ */
(function () {
  'use strict';

  /** @typedef {'green'|'amber'|'red'|'orange'} Tone */

  /* ---------- util de DOM ---------- */
  /**
   * Cria um elemento. attrs: class|style (string), html (innerHTML),
   * onX (listener de evento) ou qualquer atributo. children: nó/string/array.
   * @param {string} tag
   * @param {Object<string,*>} [attrs]
   * @param {(Node|string|number|null|Array<Node|string|number|null>)} [children]
   * @returns {HTMLElement}
   */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) { return; }
        if (k === 'class') { el.className = v; }
        else if (k === 'style') { el.setAttribute('style', v); }
        else if (k === 'html') { el.innerHTML = v; }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else { el.setAttribute(k, v); }
      });
    }
    var list = Array.isArray(children) ? children : (children == null ? [] : [children]);
    list.forEach(function (c) {
      if (c == null || c === false) { return; }
      el.appendChild((typeof c === 'string' || typeof c === 'number')
        ? document.createTextNode(String(c)) : c);
    });
    return el;
  }

  /* ---------- ícones (SVG stroke, traço bate com Lucide/Feather) ---------- */
  var ICONS = {
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    repeat: '<polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>',
    upload: '<path d="M12 16V4"></path><path d="M7 9l5-5 5 5"></path><path d="M4 20h16"></path>',
    sparkle: '<path d="M12 3l1.9 4.8L18.7 9.5l-4.8 1.7L12 16l-1.9-4.8L5.3 9.5l4.8-1.7z"></path>',
    bars: '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"></path>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
    user: '<circle cx="9" cy="8" r="3.4"></circle><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"></path><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6"></path>',
    gear: '<circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"></path>',
    logout: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>',
    info: '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-5" stroke-linecap="round"></path><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"></circle>',
    check: '<path d="M5 12l4.5 4.5L19 6"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4-4"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    chevron: '<path d="M6 9l6 6 6-6"></path>'
  };

  /**
   * Ícone SVG (stroke=currentColor: a cor vem do elemento pai).
   * @param {string} name  chave em ICONS
   * @param {number} [size=18]
   * @returns {SVGElement}
   */
  function icon(name, size) {
    size = size || 18;
    var holder = document.createElement('span');
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || '') + '</svg>';
    return holder.firstChild;
  }

  /* ---------- helpers de cor (nomes de token) ---------- */
  /** @param {Tone} t @returns {string} */
  function toneVar(t) { return t === 'amber' ? 'amber' : t === 'red' ? 'red' : t === 'orange' ? 'orange' : 'green'; }
  /** @param {Tone} t @returns {string} */
  function haloVar(t) { return t === 'amber' ? 'haloAmber' : t === 'red' ? 'haloRed' : t === 'orange' ? 'haloOrange' : 'haloGreen'; }
  /** Faixa de % → token de cor. ≥67 verde · 34–66 âmbar · <34 vermelho. @param {number} p */
  function pctVar(p) { return p >= 67 ? 'green' : p >= 34 ? 'amber' : 'red'; }

  var UI = {};

  /* ---------- 1) Sidebar ---------- */
  /**
   * @param {{active?:string, user?:{name:string,profile:string,initials:string}}} [o]
   * @returns {HTMLElement}
   */
  UI.sidebar = function (o) {
    o = o || {};
    var active = o.active || 'Hoje';
    var u = o.user || { name: 'Mariana Souza', profile: 'Admin', initials: 'MS' };
    var groups = [
      ['PRINCIPAL', [['Hoje', 'clock'], ['Projetos', 'folder'], ['Atividades', 'repeat']]],
      ['GESTÃO', [['Importar', 'upload'], ['Inteligência', 'sparkle'], ['Performance', 'bars']]],
      ['CADASTRO', [['Setores', 'grid'], ['Usuários', 'user'], ['Configurações', 'gear']]]
    ];
    var items = [];
    groups.forEach(function (g) {
      items.push(h('div', { class: 'ui-navgroup' }, g[0]));
      g[1].forEach(function (it) {
        items.push(h('div', { class: 'ui-nav' + (it[0] === active ? ' active' : ''), 'data-nav': it[0] },
          [icon(it[1], 18), h('span', null, it[0])]));
      });
    });
    var brand = h('div', { class: 'ui-brand' }, [
      h('div', { class: 'ui-logo' }, 'G'),
      h('div', { style: 'line-height:1.1' }, [
        h('div', { class: 'ui-bt' }, 'GERA'),
        h('div', { class: 'ui-bs' }, 'GRAU TÉCNICO FSA')
      ])
    ]);
    var user = h('div', { class: 'ui-usercard' }, [
      UI.avatar({ initials: u.initials, size: 36 }),
      h('div', { style: 'flex:1;min-width:0;line-height:1.25' }, [
        h('div', { class: 'ui-un' }, u.name),
        h('div', { class: 'ui-up' }, u.profile)
      ]),
      icon('logout', 18)
    ]);
    return h('aside', { class: 'ui-side' }, [brand, h('nav', { class: 'ui-navlist' }, items), user]);
  };

  /* ---------- 2) KPICard ---------- */
  /**
   * @param {{label:string, value:string|number, sub?:string, tone?:Tone, compact?:boolean, info?:boolean}} o
   * @returns {HTMLElement}
   */
  UI.kpiCard = function (o) {
    var tone = o.tone || 'green';
    var compact = !!o.compact;
    var styleVars = '--tone:var(--' + toneVar(tone) + ');--halo:var(--' + haloVar(tone) + ')';
    var head = [h('span', { class: 'dot' })];
    if (compact) {
      if (o.sub != null) { head.push(h('span', { class: 'sub' }, o.sub)); }
    } else if (o.info !== false) {
      head.push(h('span', { class: 'info' }, icon('info', 14)));
    }
    var body = [
      h('span', { class: 'acc' }),
      h('div', { class: 'head' }, head),
      h('div', { class: 'val' }, o.value),
      h('div', { class: 'label' }, o.label)
    ];
    if (!compact && o.sub != null) { body.push(h('div', { class: 'sub' }, o.sub)); }
    return h('div', { class: 'ui-kpi' + (compact ? ' compact' : ''), style: styleVars }, body);
  };

  /* ---------- 3) ProgressBar ---------- */
  /**
   * @param {number} pct  0..100
   * @param {{height?:number}} [o]
   * @returns {HTMLElement}
   */
  UI.progressBar = function (pct, o) {
    o = o || {};
    var p = Math.max(0, Math.min(100, Math.round(pct)));
    var style = (o.height ? 'height:' + o.height + 'px;' : '') + '--pc:var(--' + pctVar(p) + ')';
    return h('div', { class: 'ui-bar', style: style }, h('span', { style: 'width:' + p + '%' }));
  };

  /* ---------- 4) StatusPill / Tag ---------- */
  /**
   * @param {string} label
   * @param {{tone?:Tone, shape?:'pill'|'tag'}} [o]
   * @returns {HTMLElement}
   */
  UI.statusPill = function (label, o) {
    o = o || {};
    var tone = o.tone || 'green';
    return h('span', {
      class: 'ui-pill' + (o.shape === 'tag' ? ' tag' : ''),
      style: '--tone:var(--' + toneVar(tone) + ')'
    }, label);
  };
  /** Mapeia status de projeto → tom. @param {string} status @returns {Tone} */
  UI.statusOf = function (status) {
    return status === 'Em risco' ? 'amber' : status === 'Atrasado' ? 'red' : 'green';
  };

  /* ---------- 5) Checkbox ---------- */
  /**
   * @param {{checked?:boolean, label?:string, onToggle?:(checked:boolean)=>void}} [o]
   * @returns {HTMLElement}
   */
  UI.checkbox = function (o) {
    o = o || {};
    var checked = !!o.checked;
    var box = h('span', { class: 'box' + (checked ? ' on' : '') }, checked ? icon('check', 12) : null);
    var label = o.label != null ? h('span', { class: 'label' + (checked ? ' done' : '') }, o.label) : null;
    var wrap = h('label', { class: 'ui-check' }, [box, label]);
    if (o.onToggle) {
      wrap.style.cursor = 'pointer';
      wrap.addEventListener('click', function () {
        checked = !checked;
        box.classList.toggle('on', checked);
        box.innerHTML = '';
        if (checked) { box.appendChild(icon('check', 12)); }
        if (label) { label.classList.toggle('done', checked); }
        o.onToggle(checked);
      });
    }
    return wrap;
  };

  /* ---------- 6) Botão ---------- */
  /**
   * @param {{label:string, icon?:string, variant?:'primary'|'ghost', onClick?:Function}} o
   * @returns {HTMLElement}
   */
  UI.button = function (o) {
    var ghost = o.variant === 'ghost';
    return h('button', { class: 'ui-btn' + (ghost ? ' ghost' : ''), type: 'button', onClick: o.onClick },
      [o.icon ? icon(o.icon, 16) : null, h('span', null, o.label)]);
  };

  /* ---------- 7) Avatar ---------- */
  /**
   * @param {{initials:string, size?:number, mini?:boolean}} o
   * @returns {HTMLElement}
   */
  UI.avatar = function (o) {
    var mini = !!o.mini;
    var s = o.size || (mini ? 18 : 36);
    return h('span', {
      class: 'ui-avatar' + (mini ? ' mini' : ''),
      style: 'width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s * 0.4) + 'px'
    }, o.initials);
  };

  /* ---------- extras úteis para as telas ---------- */
  UI.icon = icon;                 // ícone avulso
  /** token de cor de % (para anel/números). @param {number} p @returns {string} */
  UI.pctToken = function (p) { return pctVar(p); };


  /* ============================================================
     PRIMITIVOS DE FORMULÁRIO / MODAL  (v1.1 — append-only)
     ------------------------------------------------------------
     Adicionados na sessão "Build Setores". NÃO alteram nenhum dos
     7 primitivos acima nem o dicionário ICONS. Mesmas convenções:
     h()/icon()/tokens; cada função devolve HTMLElement (modal
     devolve um controlador { el, card, close }).
     ============================================================ */

  /* ---------- 8) Field (label + controle + linha de erro) ---------- */
  /**
   * @param {{label:string, control:Node, hint?:string, error?:string,
   *          required?:boolean, htmlFor?:string}} o
   * @returns {HTMLElement}
   */
  UI.field = function (o) {
    var ctrl = o.control;
    /* associa label↔controle: usa htmlFor, senão o id do controle, senão gera um */
    var fid = o.htmlFor || (ctrl && ctrl.id) || null;
    if (!fid && ctrl && ctrl.setAttribute) {
      UI.__uid = (UI.__uid || 0) + 1; fid = 'ui-fld-' + UI.__uid; ctrl.id = fid;
    }
    var lbl = h('label', { class: 'ui-flabel', for: fid || null },
      [o.label, o.required ? h('span', { class: 'req' }, ' *') : null]);
    var hint = o.hint ? h('div', { class: 'ui-fhint' }, o.hint) : null;
    var err = h('div', { class: 'ui-ferr' + (o.error ? ' on' : '') }, o.error || '');
    return h('div', { class: 'ui-field' }, [lbl, ctrl, hint, err]);
  };

  /* ---------- 9) Input de texto (máscara uppercase + filtro opcionais) ---------- */
  /**
   * @param {{value?:string, placeholder?:string, upper?:boolean, filter?:RegExp,
   *          maxlength?:number, id?:string, disabled?:boolean,
   *          onInput?:(value:string, ev:Event)=>void}} [o]
   * @returns {HTMLInputElement}
   */
  UI.input = function (o) {
    o = o || {};
    var inp = h('input', {
      class: 'ui-input', type: 'text', id: o.id || null,
      value: o.value != null ? o.value : '',
      placeholder: o.placeholder || '',
      maxlength: o.maxlength || null,
      disabled: o.disabled ? 'disabled' : null,
      autocomplete: 'off', spellcheck: 'false'
    });
    inp.addEventListener('input', function (ev) {
      var v = inp.value;
      if (o.upper) { v = v.toUpperCase(); }
      if (o.filter) { v = v.replace(o.filter, ''); }
      if (v !== inp.value) {
        var pos = inp.selectionStart;           /* preserva o cursor ao reescrever */
        inp.value = v;
        try { inp.setSelectionRange(pos, pos); } catch (e) {}
      }
      if (o.onInput) { o.onInput(inp.value, ev); }
    });
    return inp;
  };

  /* ---------- 10) Select (dropdown nativo; cor por color-scheme do tema) ---------- */
  /**
   * @param {{value?:string, options:Array<{value:string,label:string}>,
   *          placeholder?:string, id?:string, disabled?:boolean,
   *          onChange?:(value:string, ev:Event)=>void}} o
   * @returns {HTMLSelectElement}
   */
  UI.select = function (o) {
    var opts = [];
    if (o.placeholder != null) { opts.push(h('option', { value: '' }, o.placeholder)); }
    (o.options || []).forEach(function (op) {
      opts.push(h('option', { value: op.value }, op.label));
    });
    var sel = h('select', {
      class: 'ui-select', id: o.id || null,
      disabled: o.disabled ? 'disabled' : null
    }, opts);
    if (o.value != null) { sel.value = o.value; }
    if (o.onChange) { sel.addEventListener('change', function (ev) { o.onChange(sel.value, ev); }); }
    return sel;
  };

  /* ---------- 11) Modal central (ESC + clique no backdrop fecham) ---------- */
  /**
   * body/footer aceitam Node, array de Node, ou função (close)=>Node|Node[].
   * Auto-monta no <body>. Devolve o controlador { el, card, close }.
   * @param {{title?:string, body?:*, footer?:*, width?:number, onClose?:Function}} [o]
   * @returns {{el:HTMLElement, card:HTMLElement, close:Function}}
   */
  UI.modal = function (o) {
    o = o || {};
    var prevFocus = document.activeElement;
    var prevOverflow = document.body.style.overflow;
    var overlay = h('div', { class: 'ui-moverlay', role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });

    var SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    function focusables() {
      return Array.prototype.slice.call(card.querySelectorAll(SEL))
        .filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
    }
    function close() {
      document.removeEventListener('keydown', onKey, true);
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      document.body.style.overflow = prevOverflow;                 /* libera o scroll do fundo */
      try { if (prevFocus && prevFocus.focus) { prevFocus.focus(); } } catch (e) {} /* devolve o foco */
      if (o.onClose) { o.onClose(); }
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {                                       /* prende o Tab dentro do card */
        var f = focusables();
        if (!f.length) { e.preventDefault(); card.focus(); return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function resolve(slot) {
      var r = (typeof slot === 'function') ? slot(close) : slot;
      return Array.isArray(r) ? r : (r == null ? [] : [r]);
    }

    var closeBtn = h('button', {
      class: 'ui-mclose', type: 'button', 'aria-label': 'Fechar', onClick: close,
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>'
    });
    var header = h('div', { class: 'ui-mhead' }, [
      h('div', { class: 'ui-mtitle' }, o.title || ''), closeBtn
    ]);
    var card = h('div', { class: 'ui-modal', tabindex: '-1', style: o.width ? 'width:' + o.width + 'px' : null },
      [header, h('div', { class: 'ui-mbody' }, resolve(o.body))]);
    if (o.footer != null) {
      card.appendChild(h('div', { class: 'ui-mfoot' }, resolve(o.footer)));
    }

    overlay.appendChild(card);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) { close(); } });
    document.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);

    /* foco inicial: primeiro controle HABILITADO do corpo (pula o X do header) */
    setTimeout(function () {
      var body = card.querySelector('.ui-mbody');
      var f = body ? Array.prototype.slice.call(body.querySelectorAll(SEL)) : [];
      try { (f[0] || card).focus(); } catch (e) {}
    }, 0);

    return { el: overlay, card: card, close: close };
  };

  window.UI = UI;
})();
