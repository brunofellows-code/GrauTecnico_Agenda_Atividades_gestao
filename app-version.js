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

  window.APP_VERSION = '3.5.0-l35';       /* Formato semântico: major.minor.patch-lote */

  window.APP_INFO = {
    version: window.APP_VERSION,
    buildDate: '2026-09-11T00:00:00Z',
    environment: 'production',
    /* 'novidades' — mostrado no 1º login de uma versão nova */
    /* L3.5: linguagem simples (coordenador novo entende sem treinamento) */
    whatsNew: [
      'Painel do dia na tela Hoje: o que atacar agora, onde está travando e o ranking (Top 3 + sua posição).',
      'Ctrl+N cria uma atividade rápida escrevendo em uma linha (o que + setor + quando).',
      'O sistema avisa se já existe uma atividade parecida antes de criar outra.',
      'Toda criação rápida dá 7 segundos para desfazer — sem janela de confirmação.',
      'Números com o "i" ao lado: fórmula e base de cálculo a um clique.',
      'Prazos em dias úteis respeitam os feriados.'
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
