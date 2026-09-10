/* ============================================================================
   app-version.js · Versionamento Central
   Sistema A · Grau Técnico FSA · Lote 3 (03/09/2026)
   
   Uso:
     - Adicione ?v={{APP_VERSION}} aos <script> e <link> no HTML
     - Verifique localStorage 'appVersion' para saber qual versão roda
     - Modal "novidades" aparece automaticamente na 1ª abertura de versão nova
   ============================================================================ */

(function () {
  'use strict';

  window.APP_VERSION = '3.0.0-l3-beta';       /* Formato semântico: major.minor.patch-lote */

  window.APP_INFO = {
    version: window.APP_VERSION,
    buildDate: '2026-09-04T00:00:00Z',
    environment: 'production',
    /* 'novidades' — mostrado no 1º login de uma versão nova */
    whatsNew: [
      '✓ Cockpit por hierarquia (Gestor/Líder/Usuário)',
      '✓ Cache instantâneo com IndexedDB',
      '✓ Quick-add com parsing PT-BR',
      '✓ Undo em vez de confirmação',
      '✓ UI.num com drill e tendência',
      '✓ Formatação única (fmt.js)',
      '✓ Dias úteis respeitando feriados',
      '⚙️ Preparado para Lotes 4–6'
    ]
  };

  /* Verificar versão anterior + mostrar modal de novidades */
  window.checkVersionAndShowNews = function () {
    var storedVersion = localStorage.getItem('appVersion');
    var isNewVersion = storedVersion !== window.APP_VERSION;

    if (isNewVersion) {
      /* Atualizar versão armazenada */
      localStorage.setItem('appVersion', window.APP_VERSION);
      
      /* Mostrar modal de "O que mudou" — sinal para telas dispararem modal */
      window.APP_SHOW_WHATS_NEW = true;
    }

    return {
      currentVersion: window.APP_VERSION,
      previousVersion: storedVersion || 'primeira execução',
      isNewVersion: isNewVersion
    };
  };

  /* DEBUG: log de versão no console (remoção em prod não é crítica) */
  if (typeof console !== 'undefined' && console.log) {
    console.log('GERA v' + window.APP_VERSION + ' · Buildado em ' + window.APP_INFO.buildDate);
  }

})();
