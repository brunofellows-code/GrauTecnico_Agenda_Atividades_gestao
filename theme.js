/* ============================================================
   Sistema A · Grau Técnico FSA — Theme provider (lógica)
   ------------------------------------------------------------
   - Lê o tema salvo (localStorage 'graut.theme'); default = dark.
   - Aplica data-theme no <html> ANTES da pintura (sem flash).
   - Liga qualquer elemento com [data-theme-toggle] ao toggle.
   - Expõe window.GrautTheme = { get, set, toggle }.
   - Dispara o evento 'themechange' (detail.mode) a cada troca.
   Vanilla puro, sem build. Tipagem por JSDoc.
   ============================================================ */
(function () {
  'use strict';

  /** @typedef {'dark'|'light'} ThemeMode */

  /** @type {string} */
  var STORAGE_KEY = 'graut.theme';
  /** @type {ThemeMode} */
  var DEFAULT_MODE = 'dark';

  /**
   * Lê o tema salvo; cai no default se ausente/ inválido ou se
   * o localStorage estiver bloqueado.
   * @returns {ThemeMode}
   */
  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return (v === 'dark' || v === 'light') ? v : DEFAULT_MODE;
    } catch (e) {
      return DEFAULT_MODE;
    }
  }

  /**
   * Escreve o atributo data-theme no <html>.
   * @param {ThemeMode} mode
   * @returns {void}
   */
  function apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
  }

  /**
   * Tema atual lido do DOM (default dark se ausente).
   * @returns {ThemeMode}
   */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark';
  }

  /**
   * Define o tema, persiste e notifica via evento 'themechange'.
   * Ignora valores fora de 'dark'|'light'.
   * @param {ThemeMode} mode
   * @returns {void}
   */
  function setTheme(mode) {
    if (mode !== 'dark' && mode !== 'light') { return; }
    apply(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) { /* sem persistência */ }
    document.dispatchEvent(new CustomEvent('themechange', { detail: { mode: mode } }));
  }

  /**
   * Alterna entre dark e light.
   * @returns {ThemeMode} o novo tema
   */
  function toggleTheme() {
    var next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  /**
   * Liga todos os elementos [data-theme-toggle] ao toggle.
   * @returns {void}
   */
  function wireToggles() {
    var nodes = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener('click', function () { toggleTheme(); });
    }
  }

  // 1) Aplica o tema imediatamente (script no <head>, antes do <body>) → sem flash.
  apply(readStored());

  // 2) Liga os botões quando o DOM estiver pronto.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggles);
  } else {
    wireToggles();
  }

  // 3) API pública.
  window.GrautTheme = { get: getTheme, set: setTheme, toggle: toggleTheme };
})();
