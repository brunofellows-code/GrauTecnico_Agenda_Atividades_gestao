/* ============================================================================
   fmt.js · Formatação única em português brasileiro
   Sistema A · Grau Técnico FSA
   
   Expõe window.FMT com funções puras para formatação Intl.
   Uso: FMT.moeda(1234.56) → "R$ 1.234,56"
        FMT.data('2026-09-04') → "4 de setembro de 2026"
        FMT.numero(1234.5) → "1.234,5"
   ============================================================================ */

(function () {
  'use strict';

  var fmt = {};

  /* Locale pt-BR para Intl */
  var locale = 'pt-BR';

  /* Moeda brasileira: R$ 1.234,56 */
  fmt.moeda = function (valor) {
    if (valor === null || valor === undefined) { return '—'; }
    var num = Number(valor);
    if (isNaN(num)) { return '—'; }
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return 'R$ ' + num.toFixed(2).replace('.', ',');
    }
  };

  /* Número com separadores: 1.234,56 (sem símbolo) */
  fmt.numero = function (valor, casas) {
    if (valor === null || valor === undefined) { return '—'; }
    var num = Number(valor);
    if (isNaN(num)) { return '—'; }
    casas = casas !== undefined ? casas : -1;
    try {
      var opts = {
        minimumFractionDigits: casas >= 0 ? casas : 0,
        maximumFractionDigits: casas >= 0 ? casas : 20
      };
      return new Intl.NumberFormat(locale, opts).format(num);
    } catch (e) {
      return num.toString();
    }
  };

  /* Percentual: 85,3% */
  fmt.percentual = function (valor, casas) {
    if (valor === null || valor === undefined) { return '—'; }
    var num = Number(valor);
    if (isNaN(num)) { return '—'; }
    casas = casas !== undefined ? casas : 1;
    return fmt.numero(num, casas) + '%';
  };

  /* Data ISO (YYYY-MM-DD) → "4 de setembro de 2026" */
  fmt.data = function (iso) {
    if (!iso || typeof iso !== 'string') { return '—'; }
    try {
      var partes = iso.split('-');
      if (partes.length !== 3) { return iso; }
      var d = new Date(
        parseInt(partes[0], 10),
        parseInt(partes[1], 10) - 1,
        parseInt(partes[2], 10)
      );
      if (isNaN(d.getTime())) { return iso; }
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(d);
    } catch (e) {
      return iso;
    }
  };

  /* Data curta: "04/09/2026" */
  fmt.dataCurta = function (iso) {
    if (!iso || typeof iso !== 'string') { return '—'; }
    try {
      var partes = iso.split('-');
      if (partes.length !== 3) { return iso; }
      var d = new Date(
        parseInt(partes[0], 10),
        parseInt(partes[1], 10) - 1,
        parseInt(partes[2], 10)
      );
      if (isNaN(d.getTime())) { return iso; }
      return new Intl.DateTimeFormat(locale, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      }).format(d);
    } catch (e) {
      return iso;
    }
  };

  /* Dia da semana: "sexta-feira" (ISO: 2026-09-04) */
  fmt.diaDaSemana = function (iso) {
    if (!iso || typeof iso !== 'string') { return '—'; }
    try {
      var partes = iso.split('-');
      if (partes.length !== 3) { return iso; }
      var d = new Date(
        parseInt(partes[0], 10),
        parseInt(partes[1], 10) - 1,
        parseInt(partes[2], 10)
      );
      if (isNaN(d.getTime())) { return iso; }
      return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d);
    } catch (e) {
      return iso;
    }
  };

  /* Mês inteiro: "setembro de 2026" (YYYY-MM ou YYYY-MM-DD) */
  fmt.mesAno = function (iso) {
    if (!iso || typeof iso !== 'string') { return '—'; }
    try {
      var partes = iso.split('-');
      if (partes.length < 2) { return iso; }
      var ano = parseInt(partes[0], 10);
      var mes = parseInt(partes[1], 10);
      var d = new Date(ano, mes - 1, 1);
      if (isNaN(d.getTime())) { return iso; }
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long'
      }).format(d);
    } catch (e) {
      return iso;
    }
  };

  /* Duração em horas: "3h 45min" (valor em minutos) */
  fmt.duracao = function (minutos) {
    if (minutos === null || minutos === undefined) { return '—'; }
    var m = Math.max(0, Math.round(Number(minutos) || 0));
    var h = Math.floor(m / 60);
    var min = m % 60;
    if (h === 0) { return min + 'min'; }
    if (min === 0) { return h + 'h'; }
    return h + 'h ' + min + 'min';
  };

  /* Dias entre duas datas ISO */
  fmt.diasEntre = function (de, ate) {
    if (!de || !ate) { return '—'; }
    try {
      var d1 = new Date(de.split('-').join('/'));
      var d2 = new Date(ate.split('-').join('/'));
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) { return '—'; }
      var diff = Math.round((d2 - d1) / 86400000);
      return diff;
    } catch (e) {
      return '—';
    }
  };

  /* Expor globalmente */
  if (typeof window !== 'undefined') { window.FMT = fmt; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = fmt; }

})();
