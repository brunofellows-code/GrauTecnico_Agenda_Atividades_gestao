/* ============================================================================
   gcal.js — Lembretes via Google Calendar (Bloco N5) — Sistema A · Grau Técnico FSA
   ----------------------------------------------------------------------------
   ESTADO: PREPARADO E DESLIGADO. Nada roda enquanto ATIVO === false.
   PROIBIDO ligar a flag antes de concluir o passo a passo do OAuth
   (N5_LEMBRETES_GOOGLE_PASSO_A_PASSO.md) e de decisão explícita do Bruno.
   ----------------------------------------------------------------------------
   Modelo: Google Identity Services (GIS) — token model / fluxo implícito.
   - 100% no navegador; sem backend; sem refresh token; token SÓ em memória.
   - Consentimento: 1ª vez por usuário; depois silencioso (mesmo Client ID).
   - Chamadas REST diretas ao Calendar API v3 com Bearer token (sem gapi.client).
   Fontes (jul/2026): developers.google.com/identity/oauth2/web/guides/use-token-model
                      developers.google.com/workspace/calendar/api/quickstart/js
   ============================================================================ */
(function () {
  'use strict';

  /* ------------------------- CONFIGURAÇÃO (N5) --------------------------- */
  var ATIVO = false; /* <<< FLAG MESTRA. Manter false nesta fase. */
  var CLIENT_ID = 'COLE_AQUI_O_CLIENT_ID.apps.googleusercontent.com';
  var ESCOPO = 'https://www.googleapis.com/auth/calendar.events';
  var GSI_SRC = 'https://accounts.google.com/gsi/client';
  var API_BASE = 'https://www.googleapis.com/calendar/v3';

  /* ------------------------- ESTADO EM MEMÓRIA --------------------------- */
  var token = null;      /* access_token vigente (nunca vai a localStorage) */
  var tokenExp = 0;      /* epoch ms de expiração (com folga de 60s)        */
  var tokenClient = null;
  var gsiCarregado = false;
  var gsiCarregando = false;
  var filaGsi = [];

  function log(msg) { try { console.log('[GCal]', msg); } catch (e) {} }

  function prontoParaUso() {
    return ATIVO === true && CLIENT_ID.indexOf('COLE_AQUI') === -1;
  }

  /* Carrega o script do GIS uma única vez, sob demanda (nunca no boot). */
  function carregarGsi(cb) {
    if (gsiCarregado) { cb(null); return; }
    filaGsi.push(cb);
    if (gsiCarregando) { return; }
    gsiCarregando = true;
    var s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = function () {
      gsiCarregado = true;
      var fila = filaGsi; filaGsi = [];
      for (var i = 0; i < fila.length; i++) { fila[i](null); }
    };
    s.onerror = function () {
      gsiCarregando = false;
      var fila = filaGsi; filaGsi = [];
      for (var i = 0; i < fila.length; i++) { fila[i]({ erro: 'gsi_falhou' }); }
    };
    document.head.appendChild(s);
  }

  /* Conectar — DEVE ser chamado a partir de um clique do usuário (regra GIS). */
  function conectar(cb) {
    if (!prontoParaUso()) { cb({ erro: 'gcal_desligado' }); return; }
    carregarGsi(function (e) {
      if (e) { cb(e); return; }
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: ESCOPO,
          callback: function (resp) {
            if (resp && resp.access_token) {
              token = resp.access_token;
              var vida = (resp.expires_in ? Number(resp.expires_in) : 3600) - 60;
              tokenExp = Date.now() + vida * 1000;
              cb(null);
            } else {
              cb({ erro: 'sem_token', detalhe: resp });
            }
          }
        });
      }
      tokenClient.requestAccessToken();
    });
  }

  function comToken(fn, cbErro) {
    if (token && Date.now() < tokenExp) { fn(token); return; }
    conectar(function (e) {
      if (e) { cbErro(e); return; }
      fn(token);
    });
  }

  /* ISO com offset local (funciona em Salvador UTC-3 e em qualquer fuso). */
  function isoLocal(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    var off = -d.getTimezoneOffset(); /* minutos a leste de UTC */
    var sinal = off >= 0 ? '+' : '-';
    var abs = Math.abs(off);
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) +
      sinal + p(Math.floor(abs / 60)) + ':' + p(abs % 60);
  }

  function reqJson(metodo, url, corpo, cb) {
    comToken(function (tk) {
      var opts = { method: metodo, headers: { 'Authorization': 'Bearer ' + tk } };
      if (corpo) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(corpo);
      }
      fetch(url, opts).then(function (r) {
        if (!r.ok) { cb({ erro: 'http_' + r.status }); return null; }
        return r.json();
      }).then(function (j) {
        if (j) { cb(null, j); }
      })['catch'](function (e) {
        cb({ erro: 'rede', detalhe: String(e) });
      });
    }, cb);
  }

  /* Lista os eventos de HOJE (dia civil local) do calendário primário. */
  function listarHoje(cb) {
    if (!prontoParaUso()) { cb({ erro: 'gcal_desligado' }); return; }
    var ini = new Date(); ini.setHours(0, 0, 0, 0);
    var fim = new Date(); fim.setHours(23, 59, 59, 0);
    var url = API_BASE + '/calendars/primary/events' +
      '?singleEvents=true&orderBy=startTime&maxResults=50' +
      '&timeMin=' + encodeURIComponent(isoLocal(ini)) +
      '&timeMax=' + encodeURIComponent(isoLocal(fim));
    reqJson('GET', url, null, function (e, j) {
      if (e) { cb(e); return; }
      cb(null, (j && j.items) ? j.items : []);
    });
  }

  /* Cria um lembrete (evento com alarme popup) no calendário primário. */
  function criarLembrete(titulo, inicioDate, duracaoMin, minutosAntes, cb) {
    if (!prontoParaUso()) { cb({ erro: 'gcal_desligado' }); return; }
    var fim = new Date(inicioDate.getTime() + (duracaoMin || 30) * 60000);
    var corpo = {
      summary: titulo,
      start: { dateTime: isoLocal(inicioDate) },
      end: { dateTime: isoLocal(fim) },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: (minutosAntes == null ? 10 : minutosAntes) }]
      }
    };
    reqJson('POST', API_BASE + '/calendars/primary/events', corpo, cb);
  }

  window.GrautGCal = {
    prontoParaUso: prontoParaUso,
    conectar: conectar,
    listarHoje: listarHoje,
    criarLembrete: criarLembrete,
    _isoLocal: isoLocal /* exposto para teste em harness */
  };
})();
