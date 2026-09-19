/* ============================================================
   desempenho-ui.js · Sistema A — Grau Técnico FSA
   ------------------------------------------------------------
   O DESENHO da régua de desempenho.js. Um lugar só, para a
   reunião e o planejamento mostrarem o mesmo número do mesmo
   jeito — se cada tela desenhasse o seu, viravam dois placares
   diferentes na mesma mesa.

   O que oferece:
     barra(placar)      → a faixa empilhada + o número grande + a meta
     porPeso(placar)    → uma faixa por classificação (vital · importante · rotina)
     motivos(placar)    → por que não saiu, do mais frequente para o menos
     serie(serie)       → uma coluna por reunião/mês + a linha do acumulado

   Regras seguidas (bruno-design / bruno-dashboard-kpi):
     - cor só com sentido: verde = no prazo, âmbar = com atraso,
       azul = em andamento, vermelho = vencida/não feita, cinza = a fazer;
     - título é a conclusão, não o assunto (a tese vem do motor);
     - data-ink: sem grade pesada, sem sombra decorativa, rótulo direto;
     - tudo por token, claro e escuro juntos;
     - o "i" é obrigatório e quem chama passa a explicação.

   ES5. Depende de window.GrautDesempenho. Carregar DEPOIS dele.
   ============================================================ */
(function (w, d) {
  'use strict';

  var D = w.GrautDesempenho;

  /* ---------- estilo (injetado uma vez) ---------- */
  var CSS = ''
    + '.dz{margin:0 0 var(--sp-4)}'
    + '.dz-tese{font-size:var(--fs-md);font-weight:800;line-height:1.35;margin:0 0 10px;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
    + '.dz-tese.ruim{color:var(--redText,var(--red))}.dz-tese.atencao{color:var(--amberText,var(--amber))}.dz-tese.bom{color:var(--greenText,var(--green))}'
    + '.dz-top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:7px}'
    + '.dz-num{font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}'
    + '.dz-num small{font-size:15px;font-weight:800;margin-left:2px}'
    + '.dz-meta{font-size:var(--fs-xs);font-weight:700;color:var(--muted2Text,var(--muted2))}'
    + '.dz-barra{position:relative;display:flex;height:16px;border-radius:9px;overflow:hidden;background:var(--track)}'
    + '.dz-barra>span{display:block;height:100%}'
    + '.dz-barra>i{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--text);opacity:.55;border-radius:2px}'
    + '.dz-leg{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px}'
    + '.dz-leg span{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-xs);font-weight:700;color:var(--muted)}'
    + '.dz-leg span b{color:var(--text);font-variant-numeric:tabular-nums}'
    + '.dz-leg i{width:9px;height:9px;border-radius:3px;flex:none}'
    + '.dz-pesos{display:flex;flex-direction:column;gap:9px;margin-top:14px}'
    + '.dz-pl{display:flex;align-items:center;gap:10px}'
    + '.dz-pl .rot{width:92px;flex:none;font-size:var(--fs-xs);font-weight:800;letter-spacing:.04em;text-transform:uppercase}'
    + '.dz-pl .rot.vital{color:var(--redText,var(--red))}.dz-pl .rot.importante{color:var(--amberText,var(--amber))}.dz-pl .rot.rotina{color:var(--muted2Text,var(--muted2))}'
    + '.dz-pl .tr{flex:1;min-width:0;height:10px;border-radius:6px;background:var(--track);overflow:hidden;display:flex}'
    + '.dz-pl .tr>span{display:block;height:100%}'
    + '.dz-pl .vv{flex:none;font-size:var(--fs-xs);font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums;min-width:86px;text-align:right}'
    + '.dz-pl .vv b{color:var(--text)}'
    + '.dz-aviso{margin-top:10px;font-size:var(--fs-xs);font-weight:700;color:var(--amberText,var(--amber));display:flex;align-items:center;gap:6px}'
    + '.dz-mot{margin-top:14px}'
    + '.dz-mot .t{font-size:var(--fs-xs);font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--accentText);margin-bottom:7px}'
    + '.dz-mot ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}'
    + '.dz-mot li{display:flex;align-items:center;gap:9px;font-size:var(--fs-sm)}'
    + '.dz-mot li .b{flex:1;min-width:0;height:8px;border-radius:5px;background:var(--track);overflow:hidden}'
    + '.dz-mot li .b>span{display:block;height:100%;background:var(--red);opacity:.75}'
    + '.dz-mot li .n{flex:none;font-weight:800;font-variant-numeric:tabular-nums;min-width:22px;text-align:right}'
    + '.dz-mot li .r{flex:none;width:190px;color:var(--muted);font-weight:600}'
    + '.dz-serie{margin-top:6px}'
    + '.dz-cols{display:flex;align-items:flex-end;gap:10px;height:132px;padding-top:6px;position:relative}'
    + '.dz-col{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%}'
    + '.dz-col .stk{width:100%;max-width:56px;display:flex;flex-direction:column-reverse;border-radius:6px 6px 0 0;overflow:hidden;background:var(--track)}'
    + '.dz-col .stk>span{display:block;width:100%}'
    + '.dz-col .cap{font-size:var(--fs-xs);font-weight:800;font-variant-numeric:tabular-nums}'
    + '.dz-col .lab{font-size:10.5px;font-weight:700;color:var(--muted2Text,var(--muted2));white-space:nowrap}'
    + '.dz-acum{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:11px;border-top:1px solid var(--border)}'
    + '.dz-acum .t{font-size:var(--fs-xs);font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}'
    + '.dz-acum .v{font-size:var(--fs-md);font-weight:800;font-variant-numeric:tabular-nums}'
    + '.dz-acum .sp{flex:1;display:flex;align-items:flex-end;gap:3px;height:26px}'
    + '.dz-acum .sp i{flex:1;min-width:2px;border-radius:2px 2px 0 0;background:var(--brand);opacity:.5}'
    + '.dz-acum .sp i.on{opacity:1}'
    + '@media(max-width:560px){.dz-pl .rot{width:74px}.dz-mot li .r{width:130px}.dz-num{font-size:26px}}';

  function estiloUmaVez() {
    if (d.getElementById('dz-css')) { return; }
    var s = d.createElement('style'); s.id = 'dz-css'; s.textContent = CSS;
    d.head.appendChild(s);
  }
  function el(html) { var t = d.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstChild; }
  function tx(tag, cls, texto) { var e = d.createElement(tag); if (cls) { e.className = cls; } if (texto != null) { e.textContent = texto; } return e; }

  /* cor de cada estado — semântica, nunca decorativa */
  var COR = {
    no_prazo: 'var(--green)',
    com_atraso: 'var(--amber)',
    entregue: 'var(--green)',
    andamento: 'var(--doing)',
    aberto: 'var(--muted2)',
    vencida: 'var(--red)',
    nao_feito: 'var(--red)'
  };
  var ROTULO = {
    no_prazo: 'no prazo', com_atraso: 'com atraso', entregue: 'entregue (sem data)', andamento: 'em andamento',
    aberto: 'a fazer', vencida: 'vencida', nao_feito: 'não feito'
  };
  var ORDEM = ['no_prazo', 'com_atraso', 'entregue', 'andamento', 'aberto', 'vencida', 'nao_feito'];

  function classeTese(p) {
    if (!p || !p.contam) { return ''; }
    if (p.vitalEmRisco > 0) { return 'ruim'; }
    if (p.pct == null || p.pct < p.meta) { return 'atencao'; }
    return 'bom';
  }

  /* ---------- a faixa principal ---------- */
  function barra(p, opts) {
    estiloUmaVez();
    var o = opts || {};
    var box = tx('div', 'dz');
    if (!p || !p.contam) {
      box.appendChild(tx('div', 'dz-tese', o.vazio || 'Nada previsto ainda.'));
      return box;
    }
    if (o.tese !== false) {
      var t = tx('div', 'dz-tese ' + classeTese(p), D.tese(p));
      if (o.info) { t.appendChild(o.info); }
      box.appendChild(t);
    }
    var top = tx('div', 'dz-top');
    var num = tx('div', 'dz-num', String(p.pct == null ? '—' : p.pct));
    num.appendChild(tx('small', '', '%'));
    num.style.color = p.bateuMeta ? 'var(--greenText,var(--green))' : 'var(--text)';
    top.appendChild(num);
    /* DOIS denominadores, ditos em voz alta. Sem isto a tela mostra 29% aqui e
       67% no cartão de cima (que só olha o que já fechou) e ninguém sabe em
       qual acreditar — o erro clássico de ter duas contas para a mesma pergunta. */
    var meta = 'cumprido do mês (' + p.cumpridos + ' de ' + p.contam + ') · meta ' + p.meta + '%';
    if (p.emAberto > 0 && p.pctFechado != null && p.pctFechado !== p.pct) {
      meta += ' · ' + p.pctFechado + '% do que já fechou (' + p.cumpridos + ' de ' + (p.cumpridos + p.falhou) + ')';
    }
    var mel = tx('div', 'dz-meta', meta);
    mel.title = 'O primeiro número conta TUDO que foi previsto, inclusive o que ainda está aberto — diz onde o mês está. O segundo conta só o que já terminou — diz como foi o que terminou.';
    top.appendChild(mel);
    if (o.tese === false && o.info) { top.appendChild(o.info); }
    box.appendChild(top);

    var b = tx('div', 'dz-barra');
    var i, k;
    for (i = 0; i < ORDEM.length; i++) {
      k = ORDEM[i];
      if (!p[k]) { continue; }
      var seg = tx('span');
      seg.style.width = (p[k] / p.contam * 100) + '%';
      seg.style.background = COR[k];
      if (k === 'nao_feito') { seg.style.backgroundImage = 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,.28) 3px,rgba(0,0,0,.28) 6px)'; }
      if (k === 'entregue') { seg.style.opacity = '.6'; }   /* cumprido, mas sem data: verde mais claro */
      seg.title = p[k] + ' ' + ROTULO[k];
      b.appendChild(seg);
    }
    var marca = tx('i'); marca.style.left = 'calc(' + p.meta + '% - 1px)'; marca.title = 'meta ' + p.meta + '%';
    b.appendChild(marca);
    box.appendChild(b);

    var leg = tx('div', 'dz-leg');
    for (i = 0; i < ORDEM.length; i++) {
      k = ORDEM[i];
      if (!p[k]) { continue; }
      var sp = tx('span');
      var ic = tx('i'); ic.style.background = COR[k];
      if (k === 'nao_feito') { ic.style.backgroundImage = 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(0,0,0,.3) 2px,rgba(0,0,0,.3) 4px)'; }
      sp.appendChild(ic);
      sp.appendChild(tx('b', '', String(p[k])));
      sp.appendChild(d.createTextNode(' ' + ROTULO[k]));
      leg.appendChild(sp);
    }
    if (p.indisponivel) {
      var sd = tx('span');
      sd.appendChild(tx('b', '', String(p.indisponivel)));
      sd.appendChild(d.createTextNode(' sem dado (fora da janela lida)'));
      leg.appendChild(sd);
    }
    box.appendChild(leg);
    return box;
  }

  /* ---------- uma faixa por classificação ---------- */
  function porPeso(p, opts) {
    estiloUmaVez();
    var o = opts || {};
    var box = tx('div', 'dz-pesos');
    if (!p || !p.contam) { return box; }
    for (var i = 0; i < D.PESO_ORDEM.length; i++) {
      var chave = D.PESO_ORDEM[i], c = p.porPeso[chave];
      if (!c.total) { continue; }
      var linha = tx('div', 'dz-pl');
      var rot = tx('span', 'rot ' + chave, D.PESO_DEF[chave].rotulo);
      rot.title = D.PESO_DEF[chave].ajuda;
      linha.appendChild(rot);
      var tr = tx('span', 'tr');
      for (var j = 0; j < ORDEM.length; j++) {
        var k = ORDEM[j];
        if (!c[k]) { continue; }
        var seg = tx('span');
        seg.style.width = (c[k] / c.contam * 100) + '%';
        seg.style.background = COR[k];
        seg.title = c[k] + ' ' + ROTULO[k];
        tr.appendChild(seg);
      }
      linha.appendChild(tr);
      var vv = tx('span', 'vv');
      vv.appendChild(tx('b', '', (c.pct == null ? '—' : c.pct + '%')));
      vv.appendChild(d.createTextNode(' · ' + c.cumpridos + '/' + c.contam));
      linha.appendChild(vv);
      box.appendChild(linha);
    }
    if (p.vitalDemais) {
      box.appendChild(tx('div', 'dz-aviso', '⚠ ' + p.vitalDemais + ' itens marcados como Vital. Acima de ' + D.TETO_VITAL + ', "vital" deixa de separar o que importa.'));
    }
    if (p.semClassificacao && o.avisarSemClasse !== false) {
      box.appendChild(tx('div', 'dz-aviso', '⚠ ' + p.semClassificacao + ' item(ns) sem classificação — entram na conta geral, mas não em nenhuma faixa.'));
    }
    return box;
  }

  /* ---------- por que não saiu ---------- */
  function motivos(p) {
    estiloUmaVez();
    var box = tx('div', 'dz-mot');
    if (!p || !p.motivos || !p.motivos.length) { return box; }
    box.appendChild(tx('div', 't', 'Por que não saiu'));
    var maior = p.motivos[0].n || 1;
    var ul = d.createElement('ul');
    for (var i = 0; i < p.motivos.length; i++) {
      var m = p.motivos[i];
      var li = d.createElement('li');
      li.appendChild(tx('span', 'r', m.rotulo));
      var b = tx('span', 'b');
      var f = tx('span'); f.style.width = (m.n / maior * 100) + '%';
      b.appendChild(f); li.appendChild(b);
      li.appendChild(tx('span', 'n', String(m.n)));
      ul.appendChild(li);
    }
    box.appendChild(ul);
    return box;
  }

  /* ---------- a série: uma coluna por reunião/mês ---------- */
  function serie(s, opts) {
    estiloUmaVez();
    var o = opts || {};
    var box = tx('div', 'dz-serie');
    if (!s || !s.length) {
      box.appendChild(tx('div', 'dz-tese', o.vazio || 'Ainda não há histórico — a segunda reunião já mostra a comparação.'));
      return box;
    }
    var cols = tx('div', 'dz-cols');
    /* a ALTURA diz quantas demandas aquela reunião gerou; a COR, em que estado
       ficaram. Altura fixa faria uma reunião de 1 decisão parecer igual a uma
       de 10 — e a leitura sairia errada sem ninguém perceber. */
    var maxN = 1;
    for (var q0 = 0; q0 < s.length; q0++) { if (s[q0].placar.contam > maxN) { maxN = s[q0].placar.contam; } }
    for (var i = 0; i < s.length; i++) {
      var g = s[i], p = g.placar;
      var col = tx('div', 'dz-col');
      var stk = tx('span', 'stk');
      stk.style.height = Math.max(14, Math.round(p.contam / maxN * 100)) + '%';
      if (p.contam) {
        for (var j = 0; j < ORDEM.length; j++) {
          var k = ORDEM[j];
          if (!p[k]) { continue; }
          var seg = tx('span');
          seg.style.height = (p[k] / p.contam * 100) + '%';
          seg.style.background = COR[k];
          seg.title = p[k] + ' ' + ROTULO[k];
          stk.appendChild(seg);
        }
      }
      var cap = tx('div', 'cap', p.pct == null ? '—' : p.pct + '%');
      cap.style.color = p.pct != null && p.pct >= p.meta ? 'var(--greenText,var(--green))' : 'var(--muted)';
      col.appendChild(cap);
      col.appendChild(stk);
      col.appendChild(tx('div', 'lab', g.rotulo));
      col.title = g.rotulo + ': ' + p.cumpridos + ' de ' + p.contam + ' cumpridos' + (g.titulo ? ' · ' + g.titulo : '');
      cols.appendChild(col);
    }
    box.appendChild(cols);

    var ult = s[s.length - 1].acumulado;
    var ac = tx('div', 'dz-acum');
    ac.appendChild(tx('span', 't', 'Acumulado'));
    var v = tx('span', 'v', (ult.pct == null ? '—' : ult.pct + '%'));
    v.style.color = ult.pct != null && ult.pct >= ult.meta ? 'var(--greenText,var(--green))' : 'var(--text)';
    ac.appendChild(v);
    ac.appendChild(tx('span', 't', ult.cumpridos + ' de ' + ult.contam + ' desde o início'));
    var sp = tx('span', 'sp');
    for (var q = 0; q < s.length; q++) {
      var a = s[q].acumulado, bar = tx('i');
      bar.style.height = Math.max(4, Math.round((a.pct || 0) / 100 * 26)) + 'px';
      if (q === s.length - 1) { bar.className = 'on'; }
      bar.title = s[q].rotulo + ': acumulado ' + (a.pct == null ? '—' : a.pct + '%');
      sp.appendChild(bar);
    }
    ac.appendChild(sp);
    box.appendChild(ac);
    return box;
  }

  w.GrautDesempenhoUI = {
    barra: barra,
    porPeso: porPeso,
    motivos: motivos,
    serie: serie,
    COR: COR,
    ROTULO: ROTULO
  };
}(window, document));
