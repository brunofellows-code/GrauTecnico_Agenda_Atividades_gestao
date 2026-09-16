/* ============================================================
   planejamento-motor.js — a lógica do plano mensal, sem tela e sem banco.
   ------------------------------------------------------------
   Por que existe: o planejamento tem regras de calendário (a janela do
   dia 25, a semana do acompanhamento) e regras de validação que hoje
   moram dentro do planejamento.html (2.271 linhas). Regra de data
   errada só aparece na virada do mês — e aí já é tarde. Aqui elas são
   provadas no Node antes de subir.

   Regras de casa: ES5 puro, sem build; função pura (não toca DOM, não
   toca Firestore, nunca lê a data do sistema por conta própria: quem
   chama passa o "hoje"). Datas são strings 'AAAA-MM-DD', sem fuso.
   ============================================================ */
(function (root) {
  'use strict';

  var DIA_ABRE = 25;                /* janela do plano do mês seguinte */
  var DIA_FECHA = 28;
  var TETO_ITENS_SEM_AVISO = 7;     /* EOS: poucas prioridades (3 a 7) */
  var TETO_RESGATE_SETOR = 3;
  var MIN_RELATO = 60;              /* mesmo piso do GrautConclusao */
  var MAX_TEXTO = 280;

  var MOTIVOS_TRAVA = ['dependencia', 'informacao', 'prioridade', 'tempo', 'ferramenta', 'outro'];
  var FAROIS = ['verde', 'amarelo', 'vermelho'];
  var GATILHOS_RESGATE = ['vital_falhou_2x', 'vermelho_2_semanas', 'lider_pediu'];

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fromISO(iso) {
    var p = String(iso).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function diaDe(iso) { return parseInt(String(iso).slice(8, 10), 10); }
  function compDe(iso) { return String(iso).slice(0, 7); }
  function compShift(comp, delta) {
    var a = parseInt(String(comp).slice(0, 4), 10);
    var m = parseInt(String(comp).slice(5, 7), 10) + delta;
    while (m > 12) { m -= 12; a += 1; }
    while (m < 1) { m += 12; a -= 1; }
    return a + '-' + pad2(m);
  }

  /* ---------- janela 25–28 ----------
     Fora da janela a tela não some: ela diz QUANDO abre. Gestor passa por
     cima (o prompt permite), mas a tela tem de registrar que passou.     */
  function janela(hojeISO) {
    var dia = diaDe(hojeISO);
    var aberta = dia >= DIA_ABRE && dia <= DIA_FECHA;
    var comp = compShift(compDe(hojeISO), 1);
    return {
      aberta: aberta,
      competencia: comp,
      abre: DIA_ABRE,
      fecha: DIA_FECHA,
      /* Texto da tela vem do prompt, ao pé da letra (sem ponto final). */
      mensagem: aberta
        ? ('Planejamento de ' + comp + ' aberto até o dia ' + DIA_FECHA)
        : ('Planejamento do próximo mês abre dia ' + DIA_ABRE)
    };
  }
  /* Gestor fora da janela: libera, mas devolve o aviso que vai para o log. */
  function podeAbrir(hojeISO, ehGestor) {
    var j = janela(hojeISO);
    if (j.aberta) { return { pode: true, forcado: false, mensagem: j.mensagem }; }
    if (ehGestor) {
      return { pode: true, forcado: true, mensagem: 'Aberto fora da janela (dia ' + diaDe(hojeISO) + '). Fica registrado.' };
    }
    return { pode: false, forcado: false, mensagem: j.mensagem };
  }

  /* ---------- semana do acompanhamento ----------
     Semana ISO (segunda a domingo) no formato 'AAAA-Www', que é a chave do
     mapa `acompanhamentos` da Parte D5.                                   */
  function semanaDe(iso) {
    var d = fromISO(iso);
    var dow = (d.getDay() + 6) % 7;            /* 0 = segunda */
    d.setDate(d.getDate() - dow + 3);          /* quinta da mesma semana */
    var ano = d.getFullYear();
    var primeiraQuinta = new Date(ano, 0, 4);
    var dowPq = (primeiraQuinta.getDay() + 6) % 7;
    primeiraQuinta.setDate(primeiraQuinta.getDate() - dowPq + 3);
    var semana = 1 + Math.round((d.getTime() - primeiraQuinta.getTime()) / (7 * 86400000));
    return ano + '-W' + pad2(semana);
  }
  /* A janela de acompanhamento é de sexta a segunda: o líder fecha a semana
     na sexta e quem esqueceu ainda entrega na segunda. */
  function acompanhamentoAberto(hojeISO) {
    var dow = fromISO(hojeISO).getDay();       /* 0=Dom … 6=Sáb */
    return dow === 5 || dow === 6 || dow === 0 || dow === 1;
  }

  /* ---------- validações ---------- */
  function validarItem(item) {
    var it = item || {};
    var erros = [];
    if (!String(it.oque == null ? '' : it.oque).trim()) { erros.push('Diga o que vai ser feito.'); }
    if (!it.quemUid) { erros.push('Escolha 1 dono.'); }
    if (!it.quando) { erros.push('Escolha a data.'); }
    return { ok: erros.length === 0, erros: erros };
  }
  function avisoExcesso(n) {
    return n > TETO_ITENS_SEM_AVISO
      ? (n + ' itens no mês. Acima de ' + TETO_ITENS_SEM_AVISO + ' costuma virar lista de desejos — dá para priorizar?')
      : null;
  }
  function validarAcompanhamento(ac) {
    var a = ac || {};
    var erros = [];
    var fez = String(a.fez == null ? '' : a.fez).trim();
    if (!fez) { erros.push('Escreva o que foi feito nesta semana.'); }
    if (fez.length > MAX_TEXTO) { erros.push('O que foi feito passa de ' + MAX_TEXTO + ' caracteres.'); }
    if (FAROIS.indexOf(a.farol) === -1) { erros.push('Diga se vai cumprir.'); }
    if (a.farol === 'amarelo' || a.farol === 'vermelho') {
      if (MOTIVOS_TRAVA.indexOf(a.motivo) === -1) { erros.push('Escolha o que está travando.'); }
    }
    return { ok: erros.length === 0, erros: erros };
  }
  /* Farol amarelo ou vermelho não abre debate na tela: vira assunto da
     próxima reunião de líderes (EOS — o que está fora do rumo sai da
     rodada de status e entra na lista de assuntos). */
  function viraAssunto(ac) {
    var f = (ac || {}).farol;
    return f === 'amarelo' || f === 'vermelho';
  }
  function validarFechamento(item) {
    var it = item || {};
    var erros = [];
    if (it.status === 'concluido') {
      var rel = String(it.relato == null ? '' : it.relato).trim();
      if (rel.length < MIN_RELATO) { erros.push('O relato precisa de ' + MIN_RELATO + ' caracteres ou mais (faltam ' + Math.max(0, MIN_RELATO - rel.length) + ').'); }
      if (!String(it.evidencia == null ? '' : it.evidencia).trim()) { erros.push('Anexe a evidência (link).'); }
    } else if (it.status === 'nao_feito') {
      if (MOTIVOS_TRAVA.indexOf(it.motivo) === -1) { erros.push('Escolha o motivo de não ter sido feito.'); }
    }
    return { ok: erros.length === 0, erros: erros };
  }

  /* ---------- célula da grade mês × setor ----------
     % concluído = concluídos ÷ (concluídos + não feitos). O que ainda está
     em andamento NÃO entra na conta: senão o mês começa sempre em 0% e o
     número vira ansiedade em vez de informação.                          */
  function resumoCelula(itens) {
    var lista = (itens || []).filter(function (i) { return i && !i.removido; });
    var out = { n: lista.length, verde: 0, amarelo: 0, vermelho: 0, concluidos: 0, naoFeitos: 0, pct: null };
    lista.forEach(function (i) {
      if (i.status === 'concluido') { out.concluidos += 1; }
      else if (i.status === 'nao_feito') { out.naoFeitos += 1; }
      var ult = ultimoAcompanhamento(i);
      if (ult && FAROIS.indexOf(ult.farol) >= 0) { out[ult.farol] += 1; }
    });
    var fechados = out.concluidos + out.naoFeitos;
    out.pct = fechados ? Math.round((out.concluidos / fechados) * 100) : null;
    out.formula = 'Concluídos ÷ (concluídos + não feitos). Em andamento não entra na conta.';
    return out;
  }
  function ultimoAcompanhamento(item) {
    var mapa = (item || {}).acompanhamentos || {};
    var chaves = [];
    var k;
    for (k in mapa) { if (Object.prototype.hasOwnProperty.call(mapa, k)) { chaves.push(k); } }
    if (!chaves.length) { return null; }
    chaves.sort();
    return mapa[chaves[chaves.length - 1]];
  }

  /* ---------- plano de resgate ---------- */
  function gatilhosDe(sinais) {
    var s = sinais || {};
    var out = [];
    if (s.vitalFalhas >= 2) { out.push('vital_falhou_2x'); }
    if (s.semanasVermelho >= 2) { out.push('vermelho_2_semanas'); }
    if (s.pediuAjuda) { out.push('lider_pediu'); }
    return out;
  }
  function podeAbrirResgate(abertosNoSetor) {
    var n = Number(abertosNoSetor) || 0;
    return n < TETO_RESGATE_SETOR
      ? { pode: true, mensagem: null }
      : { pode: false, mensagem: 'Já são ' + TETO_RESGATE_SETOR + ' resgates abertos neste setor. Feche um antes de abrir outro.' };
  }
  /* Dispensa exige 2 olhos: quem dispensa não pode ser quem pediu. */
  function podeDispensar(resgate, uid) {
    var r = resgate || {};
    if (!uid) { return { pode: false, mensagem: 'Sem usuário.' }; }
    if (r.criadoPor === uid) { return { pode: false, mensagem: 'Quem abriu o resgate não pode dispensar. Peça a outra pessoa.' }; }
    return { pode: true, mensagem: null };
  }

  root.PlanejamentoMotor = {
    DIA_ABRE: DIA_ABRE,
    DIA_FECHA: DIA_FECHA,
    TETO_ITENS_SEM_AVISO: TETO_ITENS_SEM_AVISO,
    TETO_RESGATE_SETOR: TETO_RESGATE_SETOR,
    MOTIVOS_TRAVA: MOTIVOS_TRAVA,
    FAROIS: FAROIS,
    GATILHOS_RESGATE: GATILHOS_RESGATE,
    janela: janela,
    podeAbrir: podeAbrir,
    semanaDe: semanaDe,
    acompanhamentoAberto: acompanhamentoAberto,
    validarItem: validarItem,
    avisoExcesso: avisoExcesso,
    validarAcompanhamento: validarAcompanhamento,
    viraAssunto: viraAssunto,
    validarFechamento: validarFechamento,
    resumoCelula: resumoCelula,
    ultimoAcompanhamento: ultimoAcompanhamento,
    gatilhosDe: gatilhosDe,
    podeAbrirResgate: podeAbrirResgate,
    podeDispensar: podeDispensar,
    compShift: compShift
  };
}(typeof window !== 'undefined' ? window : this));
