/* ============================================================================
   anti-dup.js · Detecção de duplicatas por similaridade (Lote 3)
   
   Simil Levenshtein simplificada (distância de edição):
   - "reunião Q3" vs "reunião Q3" → 100% (DUPLICATA)
   - "reunião Q3" vs "reunião q3" → 99% (SIMILAR)
   - "reunião Q3" vs "pauta Q3" → 80% (POSSÍVEL)
   
   Busca últimos 30 dias; limiar: 85% → aviso; 95% → bloqueio
   ============================================================================ */

(function () {
  'use strict';

  if (!window.FLAGS || !window.FLAGS.quickAdd) {
    return;
  }

  var ANTIDUP = {
    /* Levenshtein simplificada (sem espaço, minúsculas) */
    similaridade: function (a, b) {
      a = a.toLowerCase().replace(/\s+/g, '');
      b = b.toLowerCase().replace(/\s+/g, '');

      if (a === b) return 100;
      if (a.length === 0 || b.length === 0) return 0;

      var max = Math.max(a.length, b.length);
      var dist = this.levenshtein(a, b);
      return Math.round((1 - dist / max) * 100);
    },

    levenshtein: function (a, b) {
      var m = a.length, n = b.length;
      var dp = [];
      for (var i = 0; i <= m; i++) {
        dp[i] = [];
        dp[i][0] = i;
      }
      for (var j = 0; j <= n; j++) {
        dp[0][j] = j;
      }

      for (i = 1; i <= m; i++) {
        for (j = 1; j <= n; j++) {
          if (a[i - 1] === b[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1];
          } else {
            dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
      }
      return dp[m][n];
    },

    /* Buscar possíveis duplicatas em um array de atividades */
    buscar: function (titulo, atividades, diasRetrocesso) {
      diasRetrocesso = diasRetrocesso || 30;
      var agora = new Date();
      var limiteData = new Date(agora.getTime() - diasRetrocesso * 86400000);

      var duplicatas = [];

      for (var i = 0; i < (atividades || []).length; i++) {
        var a = atividades[i];
        var dataCriacao = a.dtCriacao ? new Date(a.dtCriacao) : null;

        /* Ignorar atividades muito antigas */
        if (dataCriacao && dataCriacao < limiteData) {
          continue;
        }

        /* Ignorar atividades já concluídas */
        if (a.status === 'concluida' || a.status === 'cancelada') {
          continue;
        }

        var sim = ANTIDUP.similaridade(titulo, a.titulo);
        if (sim >= 85) {
          duplicatas.push({
            titulo: a.titulo,
            similaridade: sim,
            dtCriacao: a.dtCriacao,
            status: a.status,
            id: a.id
          });
        }
      }

      /* Ordenar por similaridade (descending) */
      duplicatas.sort(function (x, y) {
        return y.similaridade - x.similaridade;
      });

      return duplicatas;
    },

    /* Verificar e avisar/bloquear */
    verificarAntesDeAdicionar: function (titulo, atividades, callback) {
      var dups = ANTIDUP.buscar(titulo, atividades, 30);

      if (dups.length === 0) {
        callback({ ok: true });
        return;
      }

      var pior = dups[0];

      if (pior.similaridade >= 95) {
        /* BLOQUEIO */
        callback({
          ok: false,
          bloqueado: true,
          msg: 'Atividade muito similar já existe (' + pior.similaridade + '%): "' + pior.titulo + '"',
          similares: dups
        });
      } else if (pior.similaridade >= 85) {
        /* AVISO (deixa prosseguir) */
        callback({
          ok: true,
          aviso: true,
          msg: 'Atividade similar encontrada (' + pior.similaridade + '%): "' + pior.titulo + '"',
          similares: dups
        });
      } else {
        callback({ ok: true });
      }
    }
  };

  /* Expor globalmente */
  window.ANTI_DUP = ANTIDUP;

})();
