/* ============================================================================
   psicologicos.js · Gatilhos psicológicos e textos dinâmicos (Lote 3)
   
   Fonte: AUDITORIA_UX_REPO.md §3 "Textos psicológicos por percentual"
   Renderiza mensagens conforme [feitas / total] do dia
   
   Padrão: "Você já fez X de Y hoje" / "Faltam Z para fechar o dia"
   ============================================================================ */

(function () {
  'use strict';

  var PSI = {
    /* Template de mensagem conforme % progresso */
    templates: {
      0: {
        title: 'Seu dia começa aqui',
        desc: 'Adicione a primeira atividade para começar',
        emoji: '🚀'
      },
      20: {
        title: 'Você já começou! 🎯',
        desc: 'Você fez a primeira de muitas. Continue!',
        emoji: '✨'
      },
      40: {
        title: 'Ritmo crescente! 📈',
        desc: 'Você está no caminho. Mais um pouco!',
        emoji: '⚡'
      },
      60: {
        title: 'Mais da metade! 💪',
        desc: 'Você está em alta. Não pare agora!',
        emoji: '🔥'
      },
      80: {
        title: 'Quase lá! 🎊',
        desc: 'Você pode fechar forte. Faltam poucos!',
        emoji: '🏁'
      },
      100: {
        title: 'Dia fechado! 🎉',
        desc: 'Parabéns! Você completou tudo que se propôs',
        emoji: '🏆'
      }
    },

    /* Calcular % completo */
    calcularProgresso: function (feitas, total) {
      if (total === 0) return 0;
      return Math.round((feitas / total) * 100);
    },

    /* Obter mensagem conforme % */
    obterMensagem: function (feitas, total) {
      var pct = PSI.calcularProgresso(feitas, total);
      var falta = total - feitas;

      /* Encontrar o template mais próximo */
      var templatePct = 0;
      for (var p in PSI.templates) {
        if (parseInt(p) <= pct && parseInt(p) > templatePct) {
          templatePct = parseInt(p);
        }
      }

      var template = PSI.templates[templatePct] || PSI.templates[0];

      return {
        title: template.title,
        desc: template.desc,
        emoji: template.emoji,
        progresso: pct,
        feitas: feitas,
        total: total,
        falta: falta,
        textoCompleto: 'Você já fez ' + feitas + ' de ' + total + ' hoje' +
          (falta > 0 ? '. Faltam ' + falta + ' para fechar.' : '!')
      };
    },

    /* Renderizar card de motivação */
    renderMotivacao: function (feitas, total) {
      var msg = PSI.obterMensagem(feitas, total);
      var div = document.createElement('div');
      div.className = 'psi-motivacao psi-pct-' + msg.progresso;
      div.innerHTML = '<div class="psi-emoji">' + msg.emoji + '</div>' +
        '<h3>' + msg.title + '</h3>' +
        '<p>' + msg.textoCompleto + '</p>' +
        '<div class="psi-bar">' +
        '<div class="psi-fill" style="width:' + msg.progresso + '%"></div>' +
        '</div>';

      return div;
    },

    /* Atualizar motivação em tempo real */
    atualizar: function (containerId, feitas, total) {
      var container = document.getElementById(containerId);
      if (!container) return;

      var novo = PSI.renderMotivacao(feitas, total);
      var antigo = container.querySelector('.psi-motivacao');

      if (antigo) {
        container.replaceChild(novo, antigo);
      } else {
        container.appendChild(novo);
      }
    }
  };

  /* Expor globalmente */
  window.PSI = PSI;

})();
